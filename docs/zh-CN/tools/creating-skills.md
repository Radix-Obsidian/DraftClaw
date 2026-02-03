---
title: 创建 Skills
x-i18n:
  generated_at: "2026-02-01T21:42:12Z"
  model: claude-opus-4-5
  provider: pi
  source_hash: ad801da34fe361ffa584ded47f775d1c104a471a3f7b7f930652255e98945c3a
  source_path: tools/creating-skills.md
  workflow: 15
---

# 创建自定义 Skills 🛠

DraftClaw 的设计易于扩展。"Skills"是为你的助手添加新功能的主要方式。

## 什么是 Skills？

Skills 是一个包含 `SKILL.md` 文件（为 LLM 提供指令和工具定义）的目录，还可以选择性地包含一些脚本或资源。

## 分步指南：你的第一个 Skills

### 1. 创建目录

Skills 存放在你的工作区中，通常位于 `~/.draftclaw/workspace/skills/`。为你的 Skills 创建一个新文件夹：

```bash
mkdir -p ~/.draftclaw/workspace/skills/hello-world
```

### 2. 定义 `SKILL.md`

在该目录中创建一个 `SKILL.md` 文件。该文件使用 YAML frontmatter 存放元数据，使用 Markdown 编写指令。

```markdown
---
name: hello_world
description: A simple skill that says hello.
---

# Hello World Skill

When the user asks for a greeting, use the `echo` tool to say "Hello from your custom skill!".
```

### 3. 添加工具（可选）

你可以在 frontmatter 中定义自定义工具，或指示智能体使用现有的系统工具（如 `bash` 或 `browser`）。

### 4. 刷新 DraftClaw

让你的智能体"刷新 Skills"或重启 Gateway网关。DraftClaw 将发现新目录并索引 `SKILL.md`。

## 最佳实践

- **保持简洁**：指示模型应该做*什么*，而不是如何成为一个 AI。
- **安全第一**：如果你的 Skills 使用 `bash`，请确保提示不会允许来自不受信任用户输入的任意命令注入。
- **本地测试**：使用 `draftclaw agent --message "use my new skill"` 进行测试。

## 共享 Skills

你还可以在 [ClawHub](https://clawhub.com) 上浏览和贡献 Skills。
