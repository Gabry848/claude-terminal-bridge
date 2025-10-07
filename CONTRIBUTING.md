# Contributing to Claude Terminal Bridge

First off, thank you for considering contributing to Claude Terminal Bridge! 🎉

## 📋 Table of Contents

- [Code of Conduct](#code-of-conduct)
- [How Can I Contribute?](#how-can-i-contribute)
- [Development Setup](#development-setup)
- [Pull Request Process](#pull-request-process)
- [Coding Standards](#coding-standards)
- [Testing](#testing)

## Code of Conduct

This project adheres to a code of conduct that fosters an open and welcoming environment. By participating, you are expected to uphold this code.

## How Can I Contribute?

### Reporting Bugs

Before creating bug reports, please check existing issues. When creating a bug report, include:

- **Clear title and description**
- **Steps to reproduce** the issue
- **Expected vs actual behavior**
- **VSCode version** and OS
- **Extension version**
- **Relevant logs** from Output Channel

### Suggesting Enhancements

Enhancement suggestions are tracked as GitHub issues. When creating an enhancement suggestion:

- **Use a clear title**
- **Provide detailed description** of the enhancement
- **Explain why** this enhancement would be useful
- **Provide examples** if applicable

### Pull Requests

1. Fork the repo and create your branch from `main`
2. If you've added code, add tests
3. Ensure the test suite passes
4. Make sure your code lints
5. Issue the pull request!

## Development Setup

### Prerequisites

- Node.js 18+
- VSCode 1.104.0+
- Git

### Setup Steps

```bash
# Clone your fork
git clone https://github.com/YOUR_USERNAME/claude-terminal-bridge.git
cd claude-terminal-bridge

# Install dependencies
npm install

# Build the extension
npm run compile

# Run tests
npm test
```

### Running in Development

1. Open the project in VSCode
2. Press `F5` to launch Extension Development Host
3. Make changes to code
4. Reload the extension window to test changes

## Pull Request Process

1. **Update documentation** for any changed functionality
2. **Add tests** for new features
3. **Update CHANGELOG.md** with your changes
4. **Ensure all tests pass**: `npm test`
5. **Run linter**: `npm run lint`
6. **Create pull request** with clear description

### PR Title Format

Use conventional commit format:

- `feat: Add new feature`
- `fix: Fix bug in terminal creation`
- `docs: Update README`
- `test: Add tests for execute command`
- `refactor: Improve error handling`
- `chore: Update dependencies`

## Coding Standards

### TypeScript

- Use TypeScript strict mode
- Follow existing code style
- Use meaningful variable names
- Add JSDoc comments for public APIs
- Avoid `any` types when possible

### Example

```typescript
/**
 * Creates a new terminal with the given name
 * @param name - The name for the new terminal
 * @returns The terminal ID
 */
async function createTerminal(name: string): Promise<string> {
  // Implementation
}
```

### Naming Conventions

- **Classes**: `PascalCase`
- **Functions/Methods**: `camelCase`
- **Constants**: `UPPER_SNAKE_CASE`
- **Interfaces**: `PascalCase` with `I` prefix (e.g., `IMCPRequest`)

### Error Handling

- Always catch and handle errors appropriately
- Log errors to Output Channel
- Provide user-friendly error messages
- Don't swallow errors silently

## Testing

### Running Tests

```bash
# Run all tests
npm test

# Run linter
npm run lint

# Watch mode
npm run watch
```

### Writing Tests

- Place tests in `src/test/`
- Use descriptive test names
- Test both success and error cases
- Mock external dependencies

Example:

```typescript
suite('Terminal Creation Tests', () => {
  test('Should create terminal with custom name', async () => {
    // Test implementation
  });

  test('Should handle errors when terminal creation fails', async () => {
    // Test implementation
  });
});
```

## Documentation

When adding features:

1. Update README.md if needed
2. Add JSDoc comments to code
3. Update protocol documentation (mcp_requirements.md)
4. Add examples if applicable

## Questions?

Feel free to open an issue with the `question` label or reach out to the maintainers.

---

Thank you for contributing! 🚀
