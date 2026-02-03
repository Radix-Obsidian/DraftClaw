---
read_when:
  - 你需要调试会话 ID、对话记录 JSONL 或 sessions.json 字段
  - 你正在修改自动压缩行为或添加"压缩前"清理逻辑
  - 你想要实现记忆刷写或静默系统轮次
summary: 深入解析：会话存储 + 对话记录、生命周期及（自动）压缩内部机制
title: 会话管理深入解析
x-i18n:
  generated_at: "2026-02-01T21:37:55Z"
  model: claude-opus-4-5
  provider: pi
  source_hash: bf3715770ba634363933f6038117b6a91af11c62f5191aaaf97e6bce099bc120
  source_path: reference/session-management-compaction.md
  workflow: 15
---

# 会话管理与压缩（深入解析）

本文档解释 DraftClaw 如何端到端管理会话：

- **会话路由**（入站消息如何映射到 `sessionKey`）
- **会话存储**（`sessions.json`）及其跟踪的内容
- **对话记录持久化**（`*.jsonl`）及其结构
- **对话记录清理**（运行前的提供商特定修复）
- **上下文限制**（上下文窗口 vs 跟踪的 token 数）
- **压缩**（手动 + 自动压缩）以及压缩前工作的挂钩位置
- **静默清理**（例如不应产生用户可见输出的记忆写入）

如果你想先了解更高层级的概览，请从以下内容开始：

- [/concepts/session](/concepts/session)
- [/concepts/compaction](/concepts/compaction)
- [/concepts/session-pruning](/concepts/session-pruning)
- [/reference/transcript-hygiene](/reference/transcript-hygiene)

---

## 数据源：Gateway网关

DraftClaw 围绕单个 **Gateway网关进程**设计，该进程拥有会话状态。

- UI（macOS 应用、Web 控制界面、TUI）应向 Gateway网关查询会话列表和 token 计数。
- 在远程模式下，会话文件位于远程主机上；"检查本地 Mac 文件"不会反映 Gateway网关正在使用的内容。

---

## 两个持久化层

DraftClaw 通过两个层持久化会话：

1. **会话存储（`sessions.json`）**
   - 键值映射：`sessionKey -> SessionEntry`
   - 体积小、可变、可安全编辑（或删除条目）
   - 跟踪会话元数据（当前会话 ID、最后活动时间、开关、token 计数器等）

2. **对话记录（`<sessionId>.jsonl`）**
   - 具有树结构的追加写入对话记录（条目包含 `id` + `parentId`）
   - 存储实际对话 + 工具调用 + 压缩摘要
   - 用于重建未来轮次的模型上下文

---

## 磁盘位置

每个智能体，在 Gateway网关主机上：

- 存储：`~/.draftclaw/agents/<agentId>/sessions/sessions.json`
- 对话记录：`~/.draftclaw/agents/<agentId>/sessions/<sessionId>.jsonl`
  - Telegram 话题会话：`.../<sessionId>-topic-<threadId>.jsonl`

DraftClaw 通过 `src/config/sessions.ts` 解析这些路径。

---

## 会话键（`sessionKey`）

`sessionKey` 标识*你所在的对话桶*（路由 + 隔离）。

常见模式：

- 主/直接聊天（每个智能体）：`agent:<agentId>:<mainKey>`（默认 `main`）
- 群组：`agent:<agentId>:<channel>:group:<id>`
- 房间/频道（Discord/Slack）：`agent:<agentId>:<channel>:channel:<id>` 或 `...:room:<id>`
- 定时任务：`cron:<job.id>`
- Webhook：`hook:<uuid>`（除非被覆盖）

规范规则详见 [/concepts/session](/concepts/session)。

---

## 会话 ID（`sessionId`）

每个 `sessionKey` 指向一个当前的 `sessionId`（继续对话的对话记录文件）。

经验法则：

- **重置**（`/new`、`/reset`）为该 `sessionKey` 创建新的 `sessionId`。
- **每日重置**（默认为 Gateway网关主机本地时间凌晨 4:00）在重置边界后的下一条消息时创建新的 `sessionId`。
- **空闲过期**（`session.reset.idleMinutes` 或旧版 `session.idleMinutes`）在空闲窗口后收到消息时创建新的 `sessionId`。当每日重置和空闲过期同时配置时，先到期的优先。

实现细节：决策发生在 `src/auto-reply/reply/session.ts` 中的 `initSessionState()` 函数。

---

## 会话存储结构（`sessions.json`）

存储的值类型是 `src/config/sessions.ts` 中的 `SessionEntry`。

关键字段（非完整列表）：

- `sessionId`：当前对话记录 ID（文件名由此派生，除非设置了 `sessionFile`）
- `updatedAt`：最后活动时间戳
- `sessionFile`：可选的显式对话记录路径覆盖
- `chatType`：`direct | group | room`（帮助 UI 和发送策略）
- `provider`、`subject`、`room`、`space`、`displayName`：群组/频道标签的元数据
- 开关：
  - `thinkingLevel`、`verboseLevel`、`reasoningLevel`、`elevatedLevel`
  - `sendPolicy`（每会话覆盖）
- 模型选择：
  - `providerOverride`、`modelOverride`、`authProfileOverride`
- Token 计数器（尽力而为 / 依赖提供商）：
  - `inputTokens`、`outputTokens`、`totalTokens`、`contextTokens`
- `compactionCount`：该会话键的自动压缩完成次数
- `memoryFlushAt`：上次压缩前记忆刷写的时间戳
- `memoryFlushCompactionCount`：上次刷写运行时的压缩计数

存储可安全编辑，但 Gateway网关是权威来源：随着会话运行，它可能重写或重新注入条目。

---

## 对话记录结构（`*.jsonl`）

对话记录由 `@mariozechner/pi-coding-agent` 的 `SessionManager` 管理。

文件格式为 JSONL：

- 第一行：会话头（`type: "session"`，包含 `id`、`cwd`、`timestamp`、可选 `parentSession`）
- 之后：带 `id` + `parentId` 的会话条目（树结构）

主要条目类型：

- `message`：用户/助手/工具结果消息
- `custom_message`：扩展注入的消息，*会*进入模型上下文（可从 UI 隐藏）
- `custom`：扩展状态，*不会*进入模型上下文
- `compaction`：持久化的压缩摘要，包含 `firstKeptEntryId` 和 `tokensBefore`
- `branch_summary`：导航树分支时的持久化摘要

DraftClaw 有意**不**"修复"对话记录；Gateway网关使用 `SessionManager` 来读写它们。

---

## 上下文窗口 vs 跟踪的 token

两个不同的概念很重要：

1. **模型上下文窗口**：每个模型的硬上限（模型可见的 token 数）
2. **会话存储计数器**：写入 `sessions.json` 的滚动统计（用于 /status 和仪表板）

如果你正在调整限制：

- 上下文窗口来自模型目录（可通过配置覆盖）。
- 存储中的 `contextTokens` 是运行时估算/报告值；不要将其视为严格保证。

更多信息请参阅 [/token-use](/token-use)。

---

## 压缩：什么是压缩

压缩将较旧的对话总结为对话记录中的持久化 `compaction` 条目，并保持最近的消息不变。

压缩后，后续轮次会看到：

- 压缩摘要
- `firstKeptEntryId` 之后的消息

压缩是**持久化的**（不同于会话修剪）。参阅 [/concepts/session-pruning](/concepts/session-pruning)。

---

## 自动压缩何时触发（Pi 运行时）

在嵌入式 Pi 智能体中，自动压缩在两种情况下触发：

1. **溢出恢复**：模型返回上下文溢出错误 → 压缩 → 重试。
2. **阈值维护**：在成功的轮次之后，当：

`contextTokens > contextWindow - reserveTokens`

其中：

- `contextWindow` 是模型的上下文窗口
- `reserveTokens` 是为提示词 + 下一次模型输出预留的余量

这些是 Pi 运行时语义（DraftClaw 消费事件，但由 Pi 决定何时压缩）。

---

## 压缩设置（`reserveTokens`、`keepRecentTokens`）

Pi 的压缩设置位于 Pi 设置中：

```json5
{
  compaction: {
    enabled: true,
    reserveTokens: 16384,
    keepRecentTokens: 20000,
  },
}
```

DraftClaw 还为嵌入式运行强制执行安全下限：

- 如果 `compaction.reserveTokens < reserveTokensFloor`，DraftClaw 会将其提升。
- 默认下限为 `20000` token。
- 设置 `agents.defaults.compaction.reserveTokensFloor: 0` 可禁用下限。
- 如果已经更高，DraftClaw 不做修改。

原因：为压缩不可避免之前的多轮"清理"（如记忆写入）留出足够余量。

实现：`src/agents/pi-settings.ts` 中的 `ensurePiCompactionReserveTokens()`
（从 `src/agents/pi-embedded-runner.ts` 调用）。

---

## 用户可见界面

你可以通过以下方式观察压缩和会话状态：

- `/status`（在任何聊天会话中）
- `draftclaw status`（CLI）
- `draftclaw sessions` / `sessions --json`
- 详细模式：`🧹 Auto-compaction complete` + 压缩计数

---

## 静默清理（`NO_REPLY`）

DraftClaw 支持用于后台任务的"静默"轮次，用户不应看到中间输出。

约定：

- 助手以 `NO_REPLY` 开始其输出，表示"不要向用户传递回复"。
- DraftClaw 在传递层中剥离/抑制此标记。

自 `2026.1.10` 起，当部分块以 `NO_REPLY` 开头时，DraftClaw 还会抑制**草稿/输入中的流式传输**，因此静默操作不会在轮次中途泄露部分输出。

---

## 压缩前"记忆刷写"（已实现）

目标：在自动压缩发生之前，运行一个静默的智能体轮次，将持久状态写入磁盘（例如智能体工作区中的 `memory/YYYY-MM-DD.md`），以防压缩擦除关键上下文。

DraftClaw 使用**预阈值刷写**方法：

1. 监控会话上下文使用量。
2. 当超过"软阈值"（低于 Pi 的压缩阈值）时，向智能体运行静默的"立即写入记忆"指令。
3. 使用 `NO_REPLY` 使用户看不到任何内容。

配置（`agents.defaults.compaction.memoryFlush`）：

- `enabled`（默认：`true`）
- `softThresholdTokens`（默认：`4000`）
- `prompt`（刷写轮次的用户消息）
- `systemPrompt`（刷写轮次追加的额外系统提示词）

备注：

- 默认的 prompt/systemPrompt 包含 `NO_REPLY` 提示以抑制传递。
- 每个压缩周期刷写运行一次（在 `sessions.json` 中跟踪）。
- 刷写仅在嵌入式 Pi 会话中运行（CLI 后端跳过）。
- 当会话工作区为只读（`workspaceAccess: "ro"` 或 `"none"`）时跳过刷写。
- 工作区文件布局和写入模式参阅[记忆](/concepts/memory)。

Pi 也在扩展 API 中暴露了 `session_before_compact` 钩子，但 DraftClaw 的刷写逻辑目前在 Gateway网关侧。

---

## 故障排除清单

- 会话键错误？从 [/concepts/session](/concepts/session) 开始，确认 `/status` 中的 `sessionKey`。
- 存储与对话记录不匹配？确认 Gateway网关主机以及 `draftclaw status` 中的存储路径。
- 压缩过于频繁？检查：
  - 模型上下文窗口（太小）
  - 压缩设置（`reserveTokens` 相对于模型窗口过高可能导致更早触发压缩）
  - 工具结果膨胀：启用/调整会话修剪
- 静默轮次泄露？确认回复以 `NO_REPLY`（精确 token）开头，且你使用的构建版本包含流式传输抑制修复。
