# 🦞 DraftClaw

**The Autonomous Sports Intelligence Engine**

<p align="center">
  <strong>MONEYBALL PROTOCOL: ACTIVE</strong>
</p>

<p align="center">
  <a href="LICENSE"><img src="https://img.shields.io/badge/License-MIT-blue.svg?style=for-the-badge" alt="MIT License"></a>
  <img src="https://img.shields.io/badge/Status-BETA-00E092?style=for-the-badge" alt="Beta">
  <a href="CONTRIBUTING.md"><img src="https://img.shields.io/badge/PRs-welcome-brightgreen.svg?style=for-the-badge" alt="PRs Welcome"></a>
</p>

---

**DraftClaw** is not a betting platform. It is a **Sports Intelligence Operating System** that runs on your local machine. Powered by advanced AI, it analyzes sports data, tracks line movements, and identifies market inefficiencies through mathematical modeling.

> *"Sharp money moves first. Track it."*

---

## 🎯 Core Features

DraftClaw's autonomous intelligence engine, **The Anchor**, provides:

1. **Market Analysis**: Real-time line movement tracking across major markets
2. **Pattern Recognition**: Statistical analysis of historical trends and correlations
3. **Inefficiency Detection**: Mathematical modeling to identify market discrepancies
4. **Narrative Generation**: AI-powered analysis in the style of top sports commentators

---

## ⚡ Quick Start

Runtime: **Node ≥22**.

```bash
# Install the engine
npm install -g draftclaw

# Enter the analytics desk
draftclaw start

# Or use the shorthand
dc start
```

### First Run

```bash
# Run the onboarding wizard
draftclaw onboard --install-daemon

# Start the gateway
draftclaw gateway --port 18789 --verbose

# Talk to The Anchor
draftclaw agent --message "What's the key matchup in tonight's game?" --thinking high
```

---

## 🧮 Core Capabilities

| Feature | Description |
|---------|-------------|
| **Moneyball Protocol** | Advanced statistical modeling and analysis |
| **Market Intelligence** | Real-time tracking of line movements |
| **Pattern Analysis** | Historical trend analysis and correlation detection |
| **The Anchor** | AI-powered sports intelligence personality |
| **Multi-Channel** | WhatsApp, Telegram, Discord integration |
| **Local-First** | Your data stays on your machine |

---

## 📊 The Moneyball Protocol

DraftClaw's market analysis engine:

```
Market Efficiency = (Implied Probability × True Probability) - 1

If Efficiency < 0 → Market Inefficiency → THE ANCHOR ALERTS
If Efficiency < -10% → Significant Divergence → MAXIMUM CONVICTION
```

Sharp markets set baseline probabilities. DraftClaw's mathematical models identify divergences through statistical analysis.

---

## 🔧 Configuration

Create `draftclaw.config.json` in your workspace:

```json
{
  "oddsApi": {
    "key": "YOUR_ODDS_API_KEY",
    "sports": ["basketball_nba", "americanfootball_nfl"]
  },
  "markets": ["pinnacle", "circa"],
  "retail": ["fanduel", "draftkings", "betmgm"],
  "thresholds": {
    "inefficiency": 0.03,
    "significance": 0.10
  },
  "alerts": {
    "discord": true,
    "telegram": true
  }
}
```

---

## 🛠️ Development

### Prerequisites

- Node.js ≥22
- pnpm
- TypeScript

### Setup

```bash
git clone https://github.com/Radix-Obsidian/DraftClaw.git
cd draftclaw

pnpm install
pnpm build

pnpm draftclaw onboard --install-daemon
```

### Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -am 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Code Style

- TypeScript for type safety
- ESLint + Prettier for formatting
- Vitest for testing
- Conventional Commits

---

## ⚠️ Disclaimer

**DraftClaw is for informational and educational purposes only.**

- This software provides data-driven analysis, not financial advice
- Past performance does not guarantee future results
- Sports analysis involves inherent uncertainty
- **21+ only** — Know your local laws and regulations
- Use responsibly and ethically

---

## 📚 Technical Foundation

DraftClaw is built on a powerful AI-native runtime with:

- **Local-first Gateway** — Single control plane for sessions, channels, tools, and events
- **Multi-channel Integration** — WhatsApp, Telegram, Slack, Discord, and more
- **Pi Agent Runtime** — RPC mode with tool streaming and block streaming
- **Media Pipeline** — Advanced data processing and visualization

---

## 🦞 The Philosophy

> *"Data tells the story. Math reveals the truth."*
> 
> *"Every trend has a pattern. Find the signal in the noise."*
> 
> *"Analysis without bias. Intelligence with integrity."*

---

## 🤝 Community

- [Contributing Guidelines](CONTRIBUTING.md)
- [Code of Conduct](CODE_OF_CONDUCT.md)
- [Security Policy](SECURITY.md)
- [Documentation](docs/README.md)

Join our community:
- [GitHub Discussions](https://github.com/Radix-Obsidian/DraftClaw/discussions)
- [Discord](https://discord.gg/draftclaw)

---

## 📄 License

DraftClaw is open-source software licensed under the MIT license. See the [LICENSE](LICENSE) file for details.

---

## 🙏 Acknowledgments

Built with ❤️ by Sakamoto Ops and the amazing DraftClaw community.

Special thanks to all our [contributors](https://github.com/Radix-Obsidian/DraftClaw/graphs/contributors) who help make DraftClaw better every day.
