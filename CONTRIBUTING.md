# Contributing to CrossBridge

First off, thank you for considering contributing to CrossBridge! It's people like you that make CrossBridge such a great tool.

## Code of Conduct

This project and everyone participating in it is governed by our Code of Conduct. By participating, you are expected to uphold this code.

## How Can I Contribute?

### Reporting Bugs

Before creating bug reports, please check existing issues as you might find out that you don't need to create one. When you are creating a bug report, please include as many details as possible:

* Use a clear and descriptive title
* Describe the exact steps which reproduce the problem
* Provide specific examples to demonstrate the steps
* Describe the behavior you observed after following the steps
* Explain which behavior you expected to see instead and why
* Include screenshots if possible

### Suggesting Enhancements

* Use a clear and descriptive title
* Provide a step-by-step description of the suggested enhancement
* Provide specific examples to demonstrate the steps
* Describe the current behavior and explain which behavior you expected to see instead
* Explain why this enhancement would be useful

### Pull Requests

1. Fork the repo and create your branch from `main`
2. If you've added code that should be tested, add tests
3. Ensure the test suite passes
4. Make sure your code follows the existing style (run `npm run lint`)
5. Issue that pull request!

## Development Process

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/crossbridge.git
   cd crossbridge
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start development:
   ```bash
   npm run dev
   ```

### Project Structure

```
crossbridge/
├── apps/           # Applications (desktop, web, server)
├── packages/       # Shared packages
│   ├── shared/     # Types and utilities
│   ├── protocol/   # Communication protocol
│   ├── security/   # Encryption and auth
│   └── ui/         # Shared UI components
└── turbo.json      # Build configuration
```

### Coding Standards

* Use TypeScript for all new code
* Follow the ESLint configuration
* Write meaningful commit messages
* Add JSDoc comments for public APIs
* Keep functions small and focused
* Write tests for new features

### Commit Messages

* Use the present tense ("Add feature" not "Added feature")
* Use the imperative mood ("Move cursor to..." not "Moves cursor to...")
* Limit the first line to 72 characters or less
* Reference issues and pull requests liberally after the first line

### Testing

```bash
npm run test        # Run all tests
npm run typecheck   # Type checking
npm run lint        # Lint code
```

## Any Questions?

Feel free to open an issue with your question or reach out to the maintainers directly.

Thank you for contributing! 🎉
