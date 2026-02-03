# Contributing to DraftClaw

Welcome to the analytics desk! 🦞

We're excited that you're interested in contributing to DraftClaw. This document provides guidelines and information about contributing to this sports intelligence platform.

## Quick Links

- **GitHub:** https://github.com/Radix-Obsidian/DraftClaw
- **Discord:** [Join our community](https://discord.gg/draftclaw)
- **Documentation:** [DraftClaw Docs](docs/README.md)

## Code of Conduct

By participating in this project, you agree to abide by our [Code of Conduct](CODE_OF_CONDUCT.md). Please read it before contributing.

## How to Contribute

### 1. Set Up Your Development Environment

```bash
# Fork and clone the repository
git clone https://github.com/your-username/DraftClaw.git
cd DraftClaw

# Install dependencies
pnpm install

# Build the project
pnpm build

# Run tests
pnpm test
```

### 2. Find Something to Work On

- Look for issues labeled `good-first-issue` for newcomers
- Check the [Project Board](https://github.com/Radix-Obsidian/DraftClaw/projects) for planned features
- Review open issues for bugs that need fixing
- Read our [documentation](docs/README.md) to understand the project better

### 3. Make Your Changes

1. Create a new branch:
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. Make your changes following our coding standards:
   - Use TypeScript for type safety
   - Follow ESLint and Prettier configurations
   - Write tests for new features
   - Update documentation as needed

3. Commit your changes:
   ```bash
   git commit -m "feat: add amazing feature"
   ```
   We follow [Conventional Commits](https://www.conventionalcommits.org/).

4. Push to your fork:
   ```bash
   git push origin feature/your-feature-name
   ```

### 4. Submit a Pull Request

1. Go to the [DraftClaw repository](https://github.com/Radix-Obsidian/DraftClaw)
2. Click "New Pull Request"
3. Select your fork and branch
4. Fill out the PR template
5. Submit your PR

## Development Guidelines

### Code Style

- Use TypeScript for all new code
- Follow existing patterns in the codebase
- Use meaningful variable and function names
- Comment complex logic
- Keep functions focused and small

### Testing

- Write unit tests for new features
- Update existing tests when modifying features
- Ensure all tests pass before submitting PR
- Aim for good test coverage

### Documentation

- Update README.md if adding new features
- Add JSDoc comments to public APIs
- Update API documentation if changing interfaces
- Include examples for new functionality

### Commit Messages

Follow [Conventional Commits](https://www.conventionalcommits.org/):

```
type(scope): description

[optional body]

[optional footer]
```

Types:
- feat: New feature
- fix: Bug fix
- docs: Documentation only
- style: Code style changes
- refactor: Code changes that neither fix bugs nor add features
- perf: Performance improvements
- test: Adding or updating tests
- chore: Maintenance tasks

### Pull Request Process

1. Update documentation
2. Add/update tests
3. Ensure CI passes
4. Get review from maintainers
5. Address feedback
6. Maintain clean commit history

## Project Structure

```
DraftClaw/
├── src/                # Source code
│   ├── agents/        # AI agent system
│   ├── analytics/     # Sports analytics core
│   ├── moneyball/    # Market analysis engine
│   └── user-portal/  # Web dashboard
├── tests/             # Test files
├── docs/              # Documentation
└── scripts/           # Build and maintenance scripts
```

## Need Help?

- Join our [Discord](https://discord.gg/draftclaw)
- Check the [documentation](docs/README.md)
- Ask in GitHub Discussions
- Tag maintainers in issues/PRs

## Recognition

Contributors are recognized in:
- README.md contributors section
- Release notes
- Documentation acknowledgments

## License

By contributing, you agree that your contributions will be licensed under the MIT License.
