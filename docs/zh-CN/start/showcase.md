---
description: Real-world DraftClaw projects from the community
summary: 由 DraftClaw 驱动的社区项目和集成展示
title: 项目展示
x-i18n:
  generated_at: "2026-02-01T21:40:20Z"
  model: claude-opus-4-5
  provider: pi
  source_hash: b3460f6a7b9948799a6082fee90fa8e5ac1d43e34872aea51ba431813dcead7a
  source_path: start/showcase.md
  workflow: 15
---

# 项目展示

来自社区的真实项目。看看大家正在用 DraftClaw 构建什么。

<Info>
**想要展示你的项目？** 在 [Discord 的 #showcase 频道](https://discord.gg/clawd) 分享你的项目，或在 [X 上 @draftclaw](https://x.com/draftclaw)。
</Info>

## 🎥 DraftClaw 实战演示

VelvetShark 的完整设置教程（28 分钟）。

<div
  style={{
    position: "relative",
    paddingBottom: "56.25%",
    height: 0,
    overflow: "hidden",
    borderRadius: 16,
  }}
>
  <iframe
    src="https://www.youtube-nocookie.com/embed/SaWSPZoPX34"
    title="DraftClaw: The self-hosted AI that Siri should have been (Full setup)"
    style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%" }}
    frameBorder="0"
    loading="lazy"
    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
    allowFullScreen
  />
</div>

[在 YouTube 上观看](https://www.youtube.com/watch?v=SaWSPZoPX34)

<div
  style={{
    position: "relative",
    paddingBottom: "56.25%",
    height: 0,
    overflow: "hidden",
    borderRadius: 16,
  }}
>
  <iframe
    src="https://www.youtube-nocookie.com/embed/mMSKQvlmFuQ"
    title="DraftClaw showcase video"
    style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%" }}
    frameBorder="0"
    loading="lazy"
    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
    allowFullScreen
  />
</div>

[在 YouTube 上观看](https://www.youtube.com/watch?v=mMSKQvlmFuQ)

<div
  style={{
    position: "relative",
    paddingBottom: "56.25%",
    height: 0,
    overflow: "hidden",
    borderRadius: 16,
  }}
>
  <iframe
    src="https://www.youtube-nocookie.com/embed/5kkIJNUGFho"
    title="DraftClaw community showcase"
    style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%" }}
    frameBorder="0"
    loading="lazy"
    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
    allowFullScreen
  />
</div>

[在 YouTube 上观看](https://www.youtube.com/watch?v=5kkIJNUGFho)

## 🆕 Discord 最新动态

<CardGroup cols={2}>

<Card title="PR 审查 → Telegram 反馈" icon="code-pull-request" href="https://x.com/i/status/2010878524543131691">
  **@bangnokia** • `review` `github` `telegram`

OpenCode 完成修改 → 提交 PR → DraftClaw 审查差异并在 Telegram 中回复"小建议"以及明确的合并意见（包括需要优先应用的关键修复）。

  <img src="/assets/showcase/pr-review-telegram.jpg" alt="DraftClaw PR 审查反馈通过 Telegram 发送" />
</Card>

<Card title="几分钟内创建酒窖 Skills" icon="wine-glass" href="https://x.com/i/status/2010916352454791216">
  **@prades_maxime** • `skills` `local` `csv`

让"Robby"（@draftclaw）创建一个本地酒窖 Skills。它请求一个 CSV 导出样本和存储位置，然后快速构建并测试 Skills（示例中有 962 瓶酒）。

  <img src="/assets/showcase/wine-cellar-skill.jpg" alt="DraftClaw 从 CSV 构建本地酒窖 Skills" />
</Card>

<Card title="Tesco 购物自动化" icon="cart-shopping" href="https://x.com/i/status/2009724862470689131">
  **@marchattonhere** • `automation` `browser` `shopping`

每周膳食计划 → 常购商品 → 预订配送时段 → 确认订单。无需 API，仅通过浏览器控制。

  <img src="/assets/showcase/tesco-shop.jpg" alt="通过聊天实现 Tesco 购物自动化" />
</Card>

<Card title="SNAG 截图转 Markdown" icon="scissors" href="https://github.com/am-will/snag">
  **@am-will** • `devtools` `screenshots` `markdown`

快捷键选取屏幕区域 → Gemini 视觉识别 → 即时 Markdown 复制到剪贴板。

  <img src="/assets/showcase/snag.png" alt="SNAG 截图转 Markdown 工具" />
</Card>

<Card title="Agents UI" icon="window-maximize" href="https://releaseflow.net/kitze/agents-ui">
  **@kitze** • `ui` `skills` `sync`

桌面应用，用于跨 Agents、Claude、Codex 和 DraftClaw 管理 Skills/命令。

  <img src="/assets/showcase/agents-ui.jpg" alt="Agents UI 应用" />
</Card>

<Card title="Telegram 语音消息 (papla.media)" icon="microphone" href="https://papla.media/docs">
  **社区** • `voice` `tts` `telegram`

封装 papla.media TTS 并以 Telegram 语音消息形式发送结果（无烦人的自动播放）。

  <img src="/assets/showcase/papla-tts.jpg" alt="TTS 输出的 Telegram 语音消息" />
</Card>

<Card title="CodexMonitor" icon="eye" href="https://clawhub.com/odrobnik/codexmonitor">
  **@odrobnik** • `devtools` `codex` `brew`

通过 Homebrew 安装的辅助工具，用于列出/检查/监控本地 OpenAI Codex 会话（CLI + VS Code）。

  <img src="/assets/showcase/codexmonitor.png" alt="ClawHub 上的 CodexMonitor" />
</Card>

<Card title="Bambu 3D 打印机控制" icon="print" href="https://clawhub.com/tobiasbischoff/bambu-cli">
  **@tobiasbischoff** • `hardware` `3d-printing` `skill`

控制和排查 BambuLab 打印机：状态、任务、摄像头、AMS、校准等。

  <img src="/assets/showcase/bambu-cli.png" alt="ClawHub 上的 Bambu CLI Skills" />
</Card>

<Card title="维也纳公共交通（Wiener Linien）" icon="train" href="https://clawhub.com/hjanuschka/wienerlinien">
  **@hjanuschka** • `travel` `transport` `skill`

维也纳公共交通的实时出发信息、中断情况、电梯状态和路线规划。

  <img src="/assets/showcase/wienerlinien.png" alt="ClawHub 上的 Wiener Linien Skills" />
</Card>

<Card title="ParentPay 学校餐食" icon="utensils" href="#">
  **@George5562** • `automation` `browser` `parenting`

通过 ParentPay 自动预订英国学校餐食。使用鼠标坐标实现可靠的表格单元格点击。
</Card>

<Card title="R2 上传（发送我的文件）" icon="cloud-arrow-up" href="https://clawhub.com/skills/r2-upload">
  **@julianengel** • `files` `r2` `presigned-urls`

上传到 Cloudflare R2/S3 并生成安全的预签名下载链接。非常适合远程 DraftClaw 实例。
</Card>

<Card title="通过 Telegram 开发 iOS 应用" icon="mobile" href="#">
  **@coard** • `ios` `xcode` `testflight`

完整构建了一个包含地图和语音录制功能的 iOS 应用，完全通过 Telegram 聊天部署到 TestFlight。

  <img src="/assets/showcase/ios-testflight.jpg" alt="TestFlight 上的 iOS 应用" />
</Card>

<Card title="Oura 戒指健康助手" icon="heart-pulse" href="#">
  **@AS** • `health` `oura` `calendar`

个人 AI 健康助手，将 Oura 戒指数据与日历、预约和健身计划整合。

  <img src="/assets/showcase/oura-health.png" alt="Oura 戒指健康助手" />
</Card>
<Card title="Kev 的梦之队（14+ 智能体）" icon="robot" href="https://github.com/adam91holt/orchestrated-ai-articles">
  **@adam91holt** • `multi-agent` `orchestration` `architecture` `manifesto`

一个 Gateway网关下管理 14+ 智能体，由 Opus 4.5 编排器将任务委派给 Codex 工作节点。包含详尽的[技术文档](https://github.com/adam91holt/orchestrated-ai-articles)，涵盖梦之队成员、模型选择、沙箱、Webhook、心跳检测和委派流程。用于智能体沙箱隔离的 [Clawdspace](https://github.com/adam91holt/clawdspace)。[博客文章](https://adams-ai-journey.ghost.io/2026-the-year-of-the-orchestrator/)。
</Card>

<Card title="Linear CLI" icon="terminal" href="https://github.com/Finesssee/linear-cli">
  **@NessZerra** • `devtools` `linear` `cli` `issues`

集成智能体工作流（Claude Code、DraftClaw）的 Linear CLI。从终端管理 issue、项目和工作流。首个外部 PR 已合并！
</Card>

<Card title="Beeper CLI" icon="message" href="https://github.com/blqke/beepcli">
  **@jules** • `messaging` `beeper` `cli` `automation`

通过 Beeper Desktop 读取、发送和归档消息。使用 Beeper 本地 MCP API，让智能体在一个地方管理你的所有聊天（iMessage、WhatsApp 等）。
</Card>

</CardGroup>

## 🤖 自动化与工作流

<CardGroup cols={2}>

<Card title="Winix 空气净化器控制" icon="wind" href="https://x.com/antonplex/status/2010518442471006253">
  **@antonplex** • `automation` `hardware` `air-quality`

Claude Code 发现并确认了净化器控制方式，然后 DraftClaw 接管并管理室内空气质量。

  <img src="/assets/showcase/winix-air-purifier.jpg" alt="通过 DraftClaw 控制 Winix 空气净化器" />
</Card>

<Card title="美丽天空相机抓拍" icon="camera" href="https://x.com/signalgaining/status/2010523120604746151">
  **@signalgaining** • `automation` `camera` `skill` `images`

由屋顶摄像头触发：当天空看起来很美时，让 DraftClaw 拍一张天空照片——它设计了一个 Skills 并完成了拍摄。

  <img src="/assets/showcase/roof-camera-sky.jpg" alt="DraftClaw 捕获的屋顶摄像头天空快照" />
</Card>

<Card title="可视化早间简报场景" icon="robot" href="https://x.com/buddyhadry/status/2010005331925954739">
  **@buddyhadry** • `automation` `briefing` `images` `telegram`

定时提示每天早上通过 DraftClaw 角色生成一张"场景"图片（天气、任务、日期、喜欢的帖子/名言）。
</Card>

<Card title="板式网球场预订" icon="calendar-check" href="https://github.com/joshp123/padel-cli">
  **@joshp123** • `automation` `booking` `cli`
  
  Playtomic 可用性检查 + 预订 CLI。再也不会错过空闲球场。
  
  <img src="/assets/showcase/padel-screenshot.jpg" alt="padel-cli 截图" />
</Card>

<Card title="会计收件处理" icon="file-invoice-dollar">
  **社区** • `automation` `email` `pdf`
  
  从邮件中收集 PDF，为税务顾问准备文件。每月记账全自动化。
</Card>

<Card title="沙发土豆开发模式" icon="couch" href="https://davekiss.com">
  **@davekiss** • `telegram` `website` `migration` `astro`

一边看 Netflix 一边通过 Telegram 重建了整个个人网站——从 Notion 迁移到 Astro，迁移了 18 篇文章，DNS 转到 Cloudflare。全程没打开笔记本电脑。
</Card>

<Card title="求职智能体" icon="briefcase">
  **@attol8** • `automation` `api` `skill`

搜索职位列表，与简历关键词匹配，返回相关机会和链接。使用 JSearch API 在 30 分钟内构建完成。
</Card>

<Card title="Jira Skills 构建器" icon="diagram-project" href="https://x.com/jdrhyne/status/2008336434827002232">
  **@jdrhyne** • `automation` `jira` `skill` `devtools`

DraftClaw 连接到 Jira，然后即时生成了一个新 Skills（在 ClawHub 上还不存在时）。
</Card>

<Card title="通过 Telegram 创建 Todoist Skills" icon="list-check" href="https://x.com/iamsubhrajyoti/status/2009949389884920153">
  **@iamsubhrajyoti** • `automation` `todoist` `skill` `telegram`

自动化 Todoist 任务，并让 DraftClaw 直接在 Telegram 聊天中生成 Skills。
</Card>

<Card title="TradingView 分析" icon="chart-line">
  **@bheem1798** • `finance` `browser` `automation`

通过浏览器自动化登录 TradingView，截取图表，按需进行技术分析。无需 API——仅通过浏览器控制。
</Card>

<Card title="Slack 自动支持" icon="slack">
  **@henrymascot** • `slack` `automation` `support`

监控公司 Slack 频道，提供有用的回复，并将通知转发到 Telegram。在未被要求的情况下自主修复了一个已部署应用的生产 bug。
</Card>

</CardGroup>

## 🧠 知识与记忆

<CardGroup cols={2}>

<Card title="xuezh 中文学习" icon="language" href="https://github.com/joshp123/xuezh">
  **@joshp123** • `learning` `voice` `skill`
  
  通过 DraftClaw 实现的中文学习引擎，具备发音反馈和学习流程。
  
  <img src="/assets/showcase/xuezh-pronunciation.jpeg" alt="xuezh 发音反馈" />
</Card>

<Card title="WhatsApp 记忆库" icon="vault">
  **社区** • `memory` `transcription` `indexing`
  
  导入完整的 WhatsApp 导出数据，转录 1000+ 条语音消息，与 git 日志交叉核对，输出关联的 Markdown 报告。
</Card>

<Card title="Karakeep 语义搜索" icon="magnifying-glass" href="https://github.com/jamesbrooksco/karakeep-semantic-search">
  **@jamesbrooksco** • `search` `vector` `bookmarks`
  
  使用 Qdrant + OpenAI/Ollama 嵌入为 Karakeep 书签添加向量搜索。
</Card>

<Card title="头脑特工队 2 式记忆" icon="brain">
  **社区** • `memory` `beliefs` `self-model`
  
  独立的记忆管理器，将会话文件转化为记忆 → 信念 → 不断演化的自我模型。
</Card>

</CardGroup>

## 🎙️ 语音与电话

<CardGroup cols={2}>

<Card title="Clawdia 电话桥接" icon="phone" href="https://github.com/alejandroOPI/clawdia-bridge">
  **@alejandroOPI** • `voice` `vapi` `bridge`
  
  Vapi 语音助手 ↔ DraftClaw HTTP 桥接。与你的智能体进行近实时电话通话。
</Card>

<Card title="OpenRouter 转录" icon="microphone" href="https://clawhub.com/obviyus/openrouter-transcribe">
  **@obviyus** • `transcription` `multilingual` `skill`

通过 OpenRouter（Gemini 等）实现多语言音频转录。已在 ClawHub 上架。
</Card>

</CardGroup>

## 🏗️ 基础设施与部署

<CardGroup cols={2}>

<Card title="Home Assistant 插件" icon="home" href="https://github.com/ngutman/draftclaw-ha-addon">
  **@ngutman** • `homeassistant` `docker` `raspberry-pi`
  
  在 Home Assistant OS 上运行 DraftClaw Gateway网关，支持 SSH 隧道和持久化状态。
</Card>

<Card title="Home Assistant Skills" icon="toggle-on" href="https://clawhub.com/skills/homeassistant">
  **ClawHub** • `homeassistant` `skill` `automation`
  
  通过自然语言控制和自动化 Home Assistant 设备。
</Card>

<Card title="Nix 打包" icon="snowflake" href="https://github.com/draftclaw/nix-draftclaw">
  **@draftclaw** • `nix` `packaging` `deployment`
  
  开箱即用的 Nix 化 DraftClaw 配置，实现可复现部署。
</Card>

<Card title="CalDAV 日历" icon="calendar" href="https://clawhub.com/skills/caldav-calendar">
  **ClawHub** • `calendar` `caldav` `skill`
  
  使用 khal/vdirsyncer 的日历 Skills。自托管日历集成。
</Card>

</CardGroup>

## 🏠 家居与硬件

<CardGroup cols={2}>

<Card title="GoHome 自动化" icon="house-signal" href="https://github.com/joshp123/gohome">
  **@joshp123** • `home` `nix` `grafana`
  
  以 Nix 为基础的家居自动化，DraftClaw 作为交互界面，并配有精美的 Grafana 仪表盘。
  
  <img src="/assets/showcase/gohome-grafana.png" alt="GoHome Grafana 仪表盘" />
</Card>

<Card title="Roborock 扫地机器人" icon="robot" href="https://github.com/joshp123/gohome/tree/main/plugins/roborock">
  **@joshp123** • `vacuum` `iot` `plugin`
  
  通过自然对话控制你的 Roborock 扫地机器人。
  
  <img src="/assets/showcase/roborock-screenshot.jpg" alt="Roborock 状态" />
</Card>

</CardGroup>

## 🌟 社区项目

<CardGroup cols={2}>

<Card title="StarSwap 交易市场" icon="star" href="https://star-swap.com/">
  **社区** • `marketplace` `astronomy` `webapp`
  
  完整的天文设备交易市场。基于 DraftClaw 生态系统构建。
</Card>

</CardGroup>

---

## 提交你的项目

有想要分享的内容？我们很乐意展示它！

<Steps>
  <Step title="分享它">
    发布到 [Discord 的 #showcase 频道](https://discord.gg/clawd) 或 [在推特上 @draftclaw](https://x.com/draftclaw)
  </Step>
  <Step title="提供详细信息">
    告诉我们它的功能，附上仓库/演示链接，如果有的话分享一张截图
  </Step>
  <Step title="获得展示">
    我们会将优秀项目添加到本页面
  </Step>
</Steps>
