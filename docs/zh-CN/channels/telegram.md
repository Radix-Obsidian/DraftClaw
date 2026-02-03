---
read_when:
  - 开发 Telegram 功能或 webhook 时
summary: Telegram 机器人支持状态、功能与配置
title: Telegram
x-i18n:
  generated_at: "2026-02-01T19:54:11Z"
  model: claude-opus-4-5
  provider: pi
  source_hash: 63198fce8c29a1020590d6a3ca142314b30c35d50317b878bf1fb1bfd8d54747
  source_path: channels/telegram.md
  workflow: 14
---

# Telegram (Bot API)

状态：通过 grammY 实现的机器人私聊 + 群组功能已可用于生产环境。默认使用长轮询；webhook 可选。

## 快速设置（新手）

1. 通过 **@BotFather**（[直达链接](https://t.me/BotFather)）创建机器人。确认用户名确实是 `@BotFather`，然后复制令牌。
2. 设置令牌：
   - 环境变量：`TELEGRAM_BOT_TOKEN=...`
   - 或配置：`channels.telegram.botToken: "..."`。
   - 如果两者都设置了，配置优先（环境变量回退仅适用于默认账户）。
3. 启动 Gateway网关。
4. 私聊访问默认为配对模式；首次联系时需批准配对码。

最小配置：

```json5
{
  channels: {
    telegram: {
      enabled: true,
      botToken: "123:abc",
      dmPolicy: "pairing",
    },
  },
}
```

## 简介

- 由 Gateway网关管理的 Telegram Bot API 渠道。
- 确定性路由：回复始终发回 Telegram；模型不会选择渠道。
- 私聊共享智能体的主会话；群组保持隔离（`agent:<agentId>:telegram:group:<chatId>`）。

## 设置（快速路径）

### 1）创建机器人令牌（BotFather）

1. 打开 Telegram，与 **@BotFather**（[直达链接](https://t.me/BotFather)）对话。确认用户名确实是 `@BotFather`。
2. 运行 `/newbot`，然后按提示操作（名称 + 以 `bot` 结尾的用户名）。
3. 复制令牌并安全保存。

可选的 BotFather 设置：

- `/setjoingroups` — 允许/禁止将机器人添加到群组。
- `/setprivacy` — 控制机器人是否能看到所有群组消息。

### 2）配置令牌（环境变量或配置）

示例：

```json5
{
  channels: {
    telegram: {
      enabled: true,
      botToken: "123:abc",
      dmPolicy: "pairing",
      groups: { "*": { requireMention: true } },
    },
  },
}
```

环境变量选项：`TELEGRAM_BOT_TOKEN=...`（适用于默认账户）。
如果环境变量和配置都设置了，配置优先。

多账户支持：使用 `channels.telegram.accounts`，为每个账户设置令牌和可选的 `name`。请参阅 [`gateway/configuration`](/gateway/configuration#telegramaccounts--discordaccounts--slackaccounts--signalaccounts--imessageaccounts) 了解通用模式。

3. 启动 Gateway网关。当令牌被解析后（配置优先，环境变量回退），Telegram 即启动。
4. 私聊访问默认为配对模式。机器人首次被联系时需批准配对码。
5. 对于群组：添加机器人，决定隐私/管理员行为（见下文），然后设置 `channels.telegram.groups` 来控制提及门控 + 白名单。

## 令牌 + 隐私 + 权限（Telegram 端）

### 令牌创建（BotFather）

- `/newbot` 创建机器人并返回令牌（请保密）。
- 如果令牌泄露，通过 @BotFather 撤销/重新生成令牌并更新配置。

### 群组消息可见性（隐私模式）

Telegram 机器人默认启用**隐私模式**，这会限制它们能接收到的群组消息。
如果你的机器人必须看到*所有*群组消息，有两种选择：

- 使用 `/setprivacy` 禁用隐私模式，**或者**
- 将机器人设为群组**管理员**（管理员机器人可以接收所有消息）。

**注意：** 切换隐私模式后，Telegram 要求将机器人从每个群组中移除并重新添加，
更改才能生效。

### 群组权限（管理员权限）

管理员状态在群组内设置（Telegram 界面）。管理员机器人始终能接收所有
群组消息，因此如果需要完全可见性，请使用管理员身份。

## 工作原理（行为）

- 入站消息被规范化为共享渠道信封，包含回复上下文和媒体占位符。
- 群组回复默认需要提及（原生 @提及或 `agents.list[].groupChat.mentionPatterns` / `messages.groupChat.mentionPatterns`）。
- 多智能体覆盖：在 `agents.list[].groupChat.mentionPatterns` 上设置每个智能体的模式。
- 回复始终路由回同一个 Telegram 聊天。
- 长轮询使用 grammY runner，按聊天排序；总体并发受 `agents.defaults.maxConcurrent` 限制。
- Telegram Bot API 不支持已读回执；没有 `sendReadReceipts` 选项。

## 草稿流式传输

DraftClaw 可以使用 `sendMessageDraft` 在 Telegram 私聊中流式传输部分回复。

要求：

- 在 @BotFather 中为机器人启用话题模式（论坛话题模式）。
- 仅限私聊话题（Telegram 在入站消息中包含 `message_thread_id`）。
- `channels.telegram.streamMode` 未设为 `"off"`（默认：`"partial"`，`"block"` 启用分块草稿更新）。

草稿流式传输仅适用于私聊；Telegram 在群组或频道中不支持此功能。

## 格式化（Telegram HTML）

- 出站 Telegram 文本使用 `parse_mode: "HTML"`（Telegram 支持的标签子集）。
- 类 Markdown 输入被渲染为 **Telegram 安全的 HTML**（粗体/斜体/删除线/代码/链接）；块级元素被扁平化为带换行符/项目符号的文本。
- 来自模型的原始 HTML 会被转义，以避免 Telegram 解析错误。
- 如果 Telegram 拒绝 HTML 负载，DraftClaw 会以纯文本重试同一条消息。

## 命令（原生 + 自定义）

DraftClaw 在启动时将原生命令（如 `/status`、`/reset`、`/model`）注册到 Telegram 的机器人菜单。
你可以通过配置向菜单添加自定义命令：

```json5
{
  channels: {
    telegram: {
      customCommands: [
        { command: "backup", description: "Git backup" },
        { command: "generate", description: "Create an image" },
      ],
    },
  },
}
```

## 故障排除

- 日志中出现 `setMyCommands failed` 通常意味着到 `api.telegram.org` 的出站 HTTPS/DNS 被阻止。
- 如果看到 `sendMessage` 或 `sendChatAction` 失败，请检查 IPv6 路由和 DNS。

更多帮助：[渠道故障排除](/channels/troubleshooting)。

注意：

- 自定义命令**仅为菜单条目**；除非你在其他地方处理它们，否则 DraftClaw 不会实现它们。
- 命令名称会被规范化（去除前导 `/`，转为小写），且必须匹配 `a-z`、`0-9`、`_`（1–32 个字符）。
- 自定义命令**不能覆盖原生命令**。冲突会被忽略并记录到日志。
- 如果 `commands.native` 被禁用，则只注册自定义命令（如果没有自定义命令则清空）。

## 限制

- 出站文本按 `channels.telegram.textChunkLimit` 分块（默认 4000）。
- 可选的换行分块：设置 `channels.telegram.chunkMode="newline"` 以在空行（段落边界）处拆分，然后再按长度分块。
- 媒体下载/上传受 `channels.telegram.mediaMaxMb` 限制（默认 5）。
- Telegram Bot API 请求在 `channels.telegram.timeoutSeconds` 后超时（通过 grammY 默认 500）。设置更低的值以避免长时间挂起。
- 群组历史上下文使用 `channels.telegram.historyLimit`（或 `channels.telegram.accounts.*.historyLimit`），回退到 `messages.groupChat.historyLimit`。设为 `0` 以禁用（默认 50）。
- 私聊历史可通过 `channels.telegram.dmHistoryLimit`（用户轮次）限制。按用户覆盖：`channels.telegram.dms["<user_id>"].historyLimit`。

## 群组激活模式

默认情况下，机器人在群组中只响应提及（`@botname` 或 `agents.list[].groupChat.mentionPatterns` 中的模式）。要更改此行为：

### 通过配置（推荐）

```json5
{
  channels: {
    telegram: {
      groups: {
        "-1001234567890": { requireMention: false }, // 在此群组中始终回复
      },
    },
  },
}
```

**重要：** 设置 `channels.telegram.groups` 会创建一个**白名单** - 只有列出的群组（或 `"*"`）会被接受。
论坛话题继承其父群组配置（allowFrom、requireMention、skills、prompts），除非你在 `channels.telegram.groups.<groupId>.topics.<topicId>` 下添加每个话题的覆盖。

允许所有群组且始终回复：

```json5
{
  channels: {
    telegram: {
      groups: {
        "*": { requireMention: false }, // 所有群组，始终回复
      },
    },
  },
}
```

保持所有群组仅提及时回复（默认行为）：

```json5
{
  channels: {
    telegram: {
      groups: {
        "*": { requireMention: true }, // 或完全省略 groups
      },
    },
  },
}
```

### 通过命令（会话级别）

在群组中发送：

- `/activation always` - 回复所有消息
- `/activation mention` - 需要提及（默认）

**注意：** 命令仅更新会话状态。要在重启后保持行为，请使用配置。

### 获取群组聊天 ID

将群组中的任意消息转发给 Telegram 上的 `@userinfobot` 或 `@getidsbot`，即可看到聊天 ID（负数，如 `-1001234567890`）。

**提示：** 要获取你自己的用户 ID，私聊机器人，它会回复你的用户 ID（配对消息），或者在命令启用后使用 `/whoami`。

**隐私提示：** `@userinfobot` 是第三方机器人。如果你更注重隐私，可以将机器人添加到群组，发送一条消息，然后使用 `draftclaw logs --follow` 读取 `chat.id`，或使用 Bot API 的 `getUpdates`。

## 配置写入

默认情况下，Telegram 允许写入由渠道事件或 `/config set|unset` 触发的配置更新。

以下情况会发生配置写入：

- 群组升级为超级群组时，Telegram 发出 `migrate_to_chat_id`（聊天 ID 变更）。DraftClaw 可以自动迁移 `channels.telegram.groups`。
- 你在 Telegram 聊天中运行 `/config set` 或 `/config unset`（需要 `commands.config: true`）。

禁用方式：

```json5
{
  channels: { telegram: { configWrites: false } },
}
```

## 话题（论坛超级群组）

Telegram 论坛话题在每条消息中包含 `message_thread_id`。DraftClaw：

- 将 `:topic:<threadId>` 追加到 Telegram 群组会话键，使每个话题相互隔离。
- 发送输入指示器和回复时携带 `message_thread_id`，确保回复留在话题内。
- 通用话题（thread id `1`）比较特殊：消息发送时省略 `message_thread_id`（Telegram 会拒绝），但输入指示器仍包含它。
- 在模板上下文中暴露 `MessageThreadId` + `IsForum`，用于路由/模板。
- 话题级配置可在 `channels.telegram.groups.<chatId>.topics.<threadId>` 下设置（skills、白名单、自动回复、系统提示词、禁用）。
- 话题配置继承群组设置（requireMention、白名单、skills、提示词、enabled），除非按话题覆盖。

私聊在某些边缘情况下可能包含 `message_thread_id`。DraftClaw 保持私聊会话键不变，但在存在 thread id 时仍将其用于回复/草稿流式传输。

## 内联按钮

Telegram 支持带回调按钮的内联键盘。

```json5
{
  channels: {
    telegram: {
      capabilities: {
        inlineButtons: "allowlist",
      },
    },
  },
}
```

按账户配置：

```json5
{
  channels: {
    telegram: {
      accounts: {
        main: {
          capabilities: {
            inlineButtons: "allowlist",
          },
        },
      },
    },
  },
}
```

作用域：

- `off` — 禁用内联按钮
- `dm` — 仅私聊（群组目标被阻止）
- `group` — 仅群组（私聊目标被阻止）
- `all` — 私聊 + 群组
- `allowlist` — 私聊 + 群组，但仅限 `allowFrom`/`groupAllowFrom` 允许的发送者（与控制命令规则相同）

默认值：`allowlist`。
旧版：`capabilities: ["inlineButtons"]` = `inlineButtons: "all"`。

### 发送按钮

使用消息工具的 `buttons` 参数：

```json5
{
  action: "send",
  channel: "telegram",
  to: "123456789",
  message: "Choose an option:",
  buttons: [
    [
      { text: "Yes", callback_data: "yes" },
      { text: "No", callback_data: "no" },
    ],
    [{ text: "Cancel", callback_data: "cancel" }],
  ],
}
```

当用户点击按钮时，回调数据会以以下格式作为消息发送回智能体：
`callback_data: value`

### 配置选项

Telegram 功能可在两个层级配置（上面展示了对象形式；旧版字符串数组仍受支持）：

- `channels.telegram.capabilities`：全局默认功能配置，应用于所有 Telegram 账户，除非被覆盖。
- `channels.telegram.accounts.<account>.capabilities`：按账户的功能配置，覆盖该账户的全局默认值。

当所有 Telegram 机器人/账户应具有相同行为时，使用全局设置。当不同机器人需要不同行为时，使用按账户配置（例如，一个账户只处理私聊，另一个允许在群组中使用）。

## 访问控制（私聊 + 群组）

### 私聊访问

- 默认：`channels.telegram.dmPolicy = "pairing"`。未知发送者会收到配对码；消息在批准前被忽略（配对码 1 小时后过期）。
- 批准方式：
  - `draftclaw pairing list telegram`
  - `draftclaw pairing approve telegram <CODE>`
- 配对是 Telegram 私聊使用的默认令牌交换方式。详情：[配对](/start/pairing)
- `channels.telegram.allowFrom` 接受数字用户 ID（推荐）或 `@username` 条目。这**不是**机器人用户名；请使用人类发送者的 ID。向导接受 `@username` 并在可能时将其解析为数字 ID。

#### 查找你的 Telegram 用户 ID

更安全的方式（无需第三方机器人）：

1. 启动 Gateway网关并私聊你的机器人。
2. 运行 `draftclaw logs --follow` 并查找 `from.id`。

替代方式（官方 Bot API）：

1. 私聊你的机器人。
2. 使用你的机器人令牌获取更新，并读取 `message.from.id`：
   ```bash
   curl "https://api.telegram.org/bot<bot_token>/getUpdates"
   ```

第三方方式（隐私性较低）：

- 私聊 `@userinfobot` 或 `@getidsbot` 并使用返回的用户 ID。

### 群组访问

两个独立的控制：

**1. 允许哪些群组**（通过 `channels.telegram.groups` 的群组白名单）：

- 没有 `groups` 配置 = 允许所有群组
- 有 `groups` 配置 = 只允许列出的群组或 `"*"`
- 示例：`"groups": { "-1001234567890": {}, "*": {} }` 允许所有群组

**2. 允许哪些发送者**（通过 `channels.telegram.groupPolicy` 的发送者过滤）：

- `"open"` = 允许的群组中所有发送者都可以发消息
- `"allowlist"` = 只有 `channels.telegram.groupAllowFrom` 中的发送者可以发消息
- `"disabled"` = 完全不接受群组消息
  默认为 `groupPolicy: "allowlist"`（除非添加 `groupAllowFrom`，否则被阻止）。

大多数用户需要：`groupPolicy: "allowlist"` + `groupAllowFrom` + 在 `channels.telegram.groups` 中列出特定群组

## 长轮询 vs webhook

- 默认：长轮询（不需要公网 URL）。
- Webhook 模式：设置 `channels.telegram.webhookUrl` 和 `channels.telegram.webhookSecret`（可选 `channels.telegram.webhookPath`）。
  - 本地监听器绑定到 `0.0.0.0:8787`，默认服务 `POST /telegram-webhook`。
  - 如果你的公网 URL 不同，请使用反向代理并将 `channels.telegram.webhookUrl` 指向公网端点。

## 回复线程

Telegram 通过标签支持可选的线程回复：

- `[[reply_to_current]]` -- 回复触发消息。
- `[[reply_to:<id>]]` -- 回复特定消息 ID。

通过 `channels.telegram.replyToMode` 控制：

- `first`（默认）、`all`、`off`。

## 音频消息（语音 vs 文件）

Telegram 区分**语音消息**（圆形气泡）和**音频文件**（元数据卡片）。
DraftClaw 默认使用音频文件以保持向后兼容。

要在智能体回复中强制使用语音消息气泡，在回复中的任意位置包含此标签：

- `[[audio_as_voice]]` — 以语音消息而非文件形式发送音频。

该标签会从发送的文本中移除。其他渠道会忽略此标签。

对于消息工具发送，设置 `asVoice: true` 并附带兼容语音的音频 `media` URL
（当有 media 时 `message` 为可选）：

```json5
{
  action: "send",
  channel: "telegram",
  to: "123456789",
  media: "https://example.com/voice.ogg",
  asVoice: true,
}
```

## 贴纸

DraftClaw 支持接收和发送 Telegram 贴纸，并带有智能缓存。

### 接收贴纸

当用户发送贴纸时，DraftClaw 根据贴纸类型进行处理：

- **静态贴纸（WEBP）：** 下载并通过视觉能力处理。贴纸在消息内容中显示为 `<media:sticker>` 占位符。
- **动态贴纸（TGS）：** 跳过（不支持 Lottie 格式处理）。
- **视频贴纸（WEBM）：** 跳过（不支持视频格式处理）。

接收贴纸时可用的模板上下文字段：

- `Sticker` — 包含以下属性的对象：
  - `emoji` — 与贴纸关联的表情
  - `setName` — 贴纸集名称
  - `fileId` — Telegram 文件 ID（可用于发回同一贴纸）
  - `fileUniqueId` — 用于缓存查找的稳定 ID
  - `cachedDescription` — 可用时的缓存视觉描述

### 贴纸缓存

贴纸通过 AI 的视觉能力处理以生成描述。由于相同的贴纸经常被重复发送，DraftClaw 会缓存这些描述以避免冗余的 API 调用。

**工作原理：**

1. **首次遇到：** 贴纸图像被发送给 AI 进行视觉分析。AI 生成描述（例如"一只卡通猫热情地挥手"）。
2. **缓存存储：** 描述与贴纸的文件 ID、表情和集合名称一起保存。
3. **后续遇到：** 再次看到同一贴纸时，直接使用缓存的描述，不再将图像发送给 AI。

**缓存位置：** `~/.draftclaw/telegram/sticker-cache.json`

**缓存条目格式：**

```json
{
  "fileId": "CAACAgIAAxkBAAI...",
  "fileUniqueId": "AgADBAADb6cxG2Y",
  "emoji": "👋",
  "setName": "CoolCats",
  "description": "A cartoon cat waving enthusiastically",
  "cachedAt": "2026-01-15T10:30:00.000Z"
}
```

**优势：**

- 通过避免对同一贴纸重复调用视觉能力来降低 API 成本
- 缓存贴纸的响应速度更快（无视觉处理延迟）
- 支持基于缓存描述的贴纸搜索功能

缓存在接收贴纸时自动填充，无需手动管理。

### 发送贴纸

智能体可以使用 `sticker` 和 `sticker-search` 动作发送和搜索贴纸。这些功能默认禁用，必须在配置中启用：

```json5
{
  channels: {
    telegram: {
      actions: {
        sticker: true,
      },
    },
  },
}
```

**发送贴纸：**

```json5
{
  action: "sticker",
  channel: "telegram",
  to: "123456789",
  fileId: "CAACAgIAAxkBAAI...",
}
```

参数：

- `fileId`（必填）— 贴纸的 Telegram 文件 ID。可从接收贴纸时的 `Sticker.fileId` 获取，或从 `sticker-search` 结果获取。
- `replyTo`（可选）— 要回复的消息 ID。
- `threadId`（可选）— 论坛话题的消息线程 ID。

**搜索贴纸：**

智能体可以通过描述、表情或集合名称搜索缓存的贴纸：

```json5
{
  action: "sticker-search",
  channel: "telegram",
  query: "cat waving",
  limit: 5,
}
```

从缓存返回匹配的贴纸：

```json5
{
  ok: true,
  count: 2,
  stickers: [
    {
      fileId: "CAACAgIAAxkBAAI...",
      emoji: "👋",
      description: "A cartoon cat waving enthusiastically",
      setName: "CoolCats",
    },
  ],
}
```

搜索使用跨描述文本、表情字符和集合名称的模糊匹配。

**带线程的示例：**

```json5
{
  action: "sticker",
  channel: "telegram",
  to: "-1001234567890",
  fileId: "CAACAgIAAxkBAAI...",
  replyTo: 42,
  threadId: 123,
}
```

## 流式传输（草稿）

Telegram 可以在智能体生成回复时流式传输**草稿气泡**。
DraftClaw 使用 Bot API 的 `sendMessageDraft`（非真实消息），然后将
最终回复作为普通消息发送。

要求（Telegram Bot API 9.3+）：

- **启用话题的私聊**（机器人的论坛话题模式）。
- 入站消息必须包含 `message_thread_id`（私聊话题线程）。
- 群组/超级群组/频道中的流式传输会被忽略。

配置：

- `channels.telegram.streamMode: "off" | "partial" | "block"`（默认：`partial`）
  - `partial`：用最新的流式文本更新草稿气泡。
  - `block`：以更大的块更新草稿气泡（分块）。
  - `off`：禁用草稿流式传输。
- 可选（仅适用于 `streamMode: "block"`）：
  - `channels.telegram.draftChunk: { minChars?, maxChars?, breakPreference? }`
    - 默认值：`minChars: 200`、`maxChars: 800`、`breakPreference: "paragraph"`（受 `channels.telegram.textChunkLimit` 限制）。

注意：草稿流式传输与**分块流式传输**（渠道消息）不同。
分块流式传输默认关闭，如果你想要提前的 Telegram 消息而非草稿更新，需要设置 `channels.telegram.blockStreaming: true`。

推理流式传输（仅 Telegram）：

- `/reasoning stream` 在回复生成时将推理过程流式传输到草稿气泡中，然后发送不包含推理过程的最终答案。
- 如果 `channels.telegram.streamMode` 为 `off`，推理流式传输将被禁用。
  更多上下文：[流式传输 + 分块](/concepts/streaming)。

## 重试策略

出站 Telegram API 调用在遇到瞬态网络/429 错误时会以指数退避和抖动进行重试。通过 `channels.telegram.retry` 配置。参见[重试策略](/concepts/retry)。

## 智能体工具（消息 + 表情回应）

- 工具：`telegram`，`sendMessage` 动作（`to`、`content`，可选 `mediaUrl`、`replyToMessageId`、`messageThreadId`）。
- 工具：`telegram`，`react` 动作（`chatId`、`messageId`、`emoji`）。
- 工具：`telegram`，`deleteMessage` 动作（`chatId`、`messageId`）。
- 表情回应移除语义：参见 [/tools/reactions](/tools/reactions)。
- 工具门控：`channels.telegram.actions.reactions`、`channels.telegram.actions.sendMessage`、`channels.telegram.actions.deleteMessage`（默认：启用），以及 `channels.telegram.actions.sticker`（默认：禁用）。

## 表情回应通知

**表情回应的工作原理：**
Telegram 表情回应作为**独立的 `message_reaction` 事件**到达，而非消息负载中的属性。当用户添加表情回应时，DraftClaw：

1. 从 Telegram API 接收 `message_reaction` 更新
2. 将其转换为**系统事件**，格式为：`"Telegram reaction added: {emoji} by {user} on msg {id}"`
3. 使用与常规消息**相同的会话键**将系统事件入队
4. 当该对话中的下一条消息到达时，系统事件被排出并添加到智能体上下文的前面

智能体将表情回应视为对话历史中的**系统通知**，而非消息元数据。

**配置：**

- `channels.telegram.reactionNotifications`：控制哪些表情回应触发通知
  - `"off"` — 忽略所有表情回应
  - `"own"` — 当用户对机器人消息做出表情回应时通知（尽力而为；内存中）（默认）
  - `"all"` — 对所有表情回应进行通知

- `channels.telegram.reactionLevel`：控制智能体的表情回应能力
  - `"off"` — 智能体不能对消息做表情回应
  - `"ack"` — 机器人发送确认表情回应（处理时显示 👀）（默认）
  - `"minimal"` — 智能体可以少量使用表情回应（指导原则：每 5-10 次交流 1 次）
  - `"extensive"` — 智能体可以在适当时大量使用表情回应

**论坛群组：** 论坛群组中的表情回应包含 `message_thread_id`，使用如 `agent:main:telegram:group:{chatId}:topic:{threadId}` 的会话键。这确保同一话题中的表情回应和消息保持在一起。

**示例配置：**

```json5
{
  channels: {
    telegram: {
      reactionNotifications: "all", // 查看所有表情回应
      reactionLevel: "minimal", // 智能体可以少量使用表情回应
    },
  },
}
```

**要求：**

- Telegram 机器人必须在 `allowed_updates` 中显式请求 `message_reaction`（由 DraftClaw 自动配置）
- 对于 webhook 模式，表情回应包含在 webhook 的 `allowed_updates` 中
- 对于轮询模式，表情回应包含在 `getUpdates` 的 `allowed_updates` 中

## 投递目标（CLI/定时任务）

- 使用聊天 ID（`123456789`）或用户名（`@name`）作为目标。
- 示例：`draftclaw message send --channel telegram --target 123456789 --message "hi"`。

## 故障排除

**机器人在群组中不响应非提及消息：**

- 如果你设置了 `channels.telegram.groups.*.requireMention=false`，Telegram 的 Bot API **隐私模式**必须被禁用。
  - BotFather：`/setprivacy` → **Disable**（然后从群组中移除并重新添加机器人）
- `draftclaw channels status` 在配置期望接收非提及群组消息时会显示警告。
- `draftclaw channels status --probe` 可以额外检查显式数字群组 ID 的成员资格（无法审计通配符 `"*"` 规则）。
- 快速测试：`/activation always`（仅会话级别；持久化请使用配置）

**机器人完全看不到群组消息：**

- 如果设置了 `channels.telegram.groups`，群组必须被列出或使用 `"*"`
- 在 @BotFather 中检查隐私设置 → "Group Privacy" 应为 **OFF**
- 确认机器人确实是成员（而非只是没有读取权限的管理员）
- 检查 Gateway网关日志：`draftclaw logs --follow`（查找 "skipping group message"）

**机器人响应提及但不响应 `/activation always`：**

- `/activation` 命令更新会话状态但不会持久化到配置
- 要持久化行为，将群组添加到 `channels.telegram.groups` 并设置 `requireMention: false`

**`/status` 等命令不工作：**

- 确保你的 Telegram 用户 ID 已授权（通过配对或 `channels.telegram.allowFrom`）
- 即使在 `groupPolicy: "open"` 的群组中，命令也需要授权

**长轮询在 Node 22+ 上立即中止（通常涉及代理/自定义 fetch）：**

- Node 22+ 对 `AbortSignal` 实例更严格；外部信号可能会立即中止 `fetch` 调用。
- 升级到规范化 abort 信号的 DraftClaw 版本，或在 Node 20 上运行 Gateway网关直到可以升级。

**机器人启动后静默停止响应（或日志中出现 `HttpError: Network request ... failed`）：**

- 某些主机优先将 `api.telegram.org` 解析为 IPv6。如果你的服务器没有可用的 IPv6 出口，grammY 可能会卡在仅 IPv6 的请求上。
- 修复方法：启用 IPv6 出口**或者**强制 `api.telegram.org` 使用 IPv4 解析（例如，使用 IPv4 A 记录添加 `/etc/hosts` 条目，或在操作系统 DNS 栈中优先使用 IPv4），然后重启 Gateway网关。
- 快速检查：`dig +short api.telegram.org A` 和 `dig +short api.telegram.org AAAA` 确认 DNS 返回的内容。

## 配置参考（Telegram）

完整配置：[配置](/gateway/configuration)

提供商选项：

- `channels.telegram.enabled`：启用/禁用渠道启动。
- `channels.telegram.botToken`：机器人令牌（BotFather）。
- `channels.telegram.tokenFile`：从文件路径读取令牌。
- `channels.telegram.dmPolicy`：`pairing | allowlist | open | disabled`（默认：pairing）。
- `channels.telegram.allowFrom`：私聊白名单（ID/用户名）。`open` 需要 `"*"`。
- `channels.telegram.groupPolicy`：`open | allowlist | disabled`（默认：allowlist）。
- `channels.telegram.groupAllowFrom`：群组发送者白名单（ID/用户名）。
- `channels.telegram.groups`：按群组的默认设置 + 白名单（使用 `"*"` 作为全局默认）。
  - `channels.telegram.groups.<id>.requireMention`：提及门控默认值。
  - `channels.telegram.groups.<id>.skills`：Skills 过滤（省略 = 所有 Skills，空 = 无 Skills）。
  - `channels.telegram.groups.<id>.allowFrom`：按群组的发送者白名单覆盖。
  - `channels.telegram.groups.<id>.systemPrompt`：群组的额外系统提示词。
  - `channels.telegram.groups.<id>.enabled`：设为 `false` 时禁用该群组。
  - `channels.telegram.groups.<id>.topics.<threadId>.*`：按话题覆盖（与群组字段相同）。
  - `channels.telegram.groups.<id>.topics.<threadId>.requireMention`：按话题的提及门控覆盖。
- `channels.telegram.capabilities.inlineButtons`：`off | dm | group | all | allowlist`（默认：allowlist）。
- `channels.telegram.accounts.<account>.capabilities.inlineButtons`：按账户覆盖。
- `channels.telegram.replyToMode`：`off | first | all`（默认：`first`）。
- `channels.telegram.textChunkLimit`：出站分块大小（字符数）。
- `channels.telegram.chunkMode`：`length`（默认）或 `newline`，在空行（段落边界）处拆分后再按长度分块。
- `channels.telegram.linkPreview`：切换出站消息的链接预览（默认：true）。
- `channels.telegram.streamMode`：`off | partial | block`（草稿流式传输）。
- `channels.telegram.mediaMaxMb`：入站/出站媒体上限（MB）。
- `channels.telegram.retry`：出站 Telegram API 调用的重试策略（attempts、minDelayMs、maxDelayMs、jitter）。
- `channels.telegram.network.autoSelectFamily`：覆盖 Node 的 autoSelectFamily（true=启用，false=禁用）。在 Node 22 上默认禁用以避免 Happy Eyeballs 超时。
- `channels.telegram.proxy`：Bot API 调用的代理 URL（SOCKS/HTTP）。
- `channels.telegram.webhookUrl`：启用 webhook 模式（需要 `channels.telegram.webhookSecret`）。
- `channels.telegram.webhookSecret`：webhook 密钥（设置 webhookUrl 时必填）。
- `channels.telegram.webhookPath`：本地 webhook 路径（默认 `/telegram-webhook`）。
- `channels.telegram.actions.reactions`：Telegram 工具表情回应门控。
- `channels.telegram.actions.sendMessage`：Telegram 工具消息发送门控。
- `channels.telegram.actions.deleteMessage`：Telegram 工具消息删除门控。
- `channels.telegram.actions.sticker`：Telegram 贴纸动作门控 — 发送和搜索（默认：false）。
- `channels.telegram.reactionNotifications`：`off | own | all` — 控制哪些表情回应触发系统事件（未设置时默认：`own`）。
- `channels.telegram.reactionLevel`：`off | ack | minimal | extensive` — 控制智能体的表情回应能力（未设置时默认：`minimal`）。

相关全局选项：

- `agents.list[].groupChat.mentionPatterns`（提及门控模式）。
- `messages.groupChat.mentionPatterns`（全局回退）。
- `commands.native`（默认为 `"auto"` → Telegram/Discord 启用，Slack 禁用）、`commands.text`、`commands.useAccessGroups`（命令行为）。通过 `channels.telegram.commands.native` 覆盖。
- `messages.responsePrefix`、`messages.ackReaction`、`messages.ackReactionScope`、`messages.removeAckAfterReply`。
