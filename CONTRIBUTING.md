# Contributing to Google Tasks MCP Server

Thank you for your interest in contributing! This document outlines the development process, code standards, and submission guidelines.

## Development Setup

### Prerequisites

- **Node.js** 18+ or **Bun** (preferred)
- **npm** or **bun** package manager
- A Google Cloud project with Tasks API enabled (see [README.md](README.md))

### Local Development

1. **Fork the repository** and clone your fork:
   ```bash
   git clone https://github.com/YOUR_USERNAME/gtasks-mcp.git
   cd gtasks-mcp
   ```

2. **Install dependencies**:
   ```bash
   npm install
   # or with Bun:
   bun install
   ```

3. **Set up OAuth credentials** (see [README.md](README.md) for details):
   - Create `gcp-oauth.keys.json` in the project root

4. **Run in development mode**:
   ```bash
   npm run dev
   # or with Bun:
   bun --watch src/index.ts
   ```

5. **Build for testing**:
   ```bash
   npm run build
   ```

## Code Standards

### Style Guide

- **Language**: TypeScript (strict mode)
- **Formatting**: 2-space indentation
- **Naming**: camelCase for variables/functions, PascalCase for classes
- **Imports**: Use ES modules (`import`/`export`)
- **Async**: Always use `async`/`await` instead of `.then()` chains

### File Organization

- Keep files focused and under 300 lines
- Group related functions together
- Export only public interfaces
- Use clear, descriptive function names

### Error Handling

- Always handle errors explicitly
- Provide meaningful error messages for debugging
- Use try/catch for async operations
- Never silently fail—log or throw

### TypeScript Best Practices

- Enable strict mode (already configured)
- Avoid `any` types; use explicit types
- Use interfaces for data structures
- Annotate function parameters and return types

## Testing

- Write tests for new functionality
- Tests should be in the `src/` directory with `.test.ts` extension
- Use Bun's built-in test runner: `npm test`
- Aim for high coverage of critical paths

## Making Changes

### For Bug Fixes

1. **Create a branch** from `main`:
   ```bash
   git checkout -b fix/issue-description
   ```

2. **Write a test** that reproduces the bug
3. **Implement the fix**
4. **Verify the test passes**
5. **Commit** with a clear message:
   ```
   fix: brief description of the fix
   ```

### For Features

1. **Create a branch** from `main`:
   ```bash
   git checkout -b feat/feature-name
   ```

2. **Write tests first** (TDD approach)
3. **Implement the feature**
4. **Update README.md** if applicable
5. **Update CHANGELOG.md** under the "Unreleased" section
6. **Commit** with a descriptive message:
   ```
   feat: add new feature description
   ```

### Commit Message Format

Follow Conventional Commits format:

```
<type>: <description>

<optional body explaining why and how>
```

**Types:**
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation update
- `refactor`: Code restructuring (no behavior change)
- `test`: Adding or updating tests
- `chore`: Dependency or tooling updates
- `perf`: Performance improvements

### Examples

```
feat: add bulk task creation endpoint

Allows creating multiple tasks in a single API call.
This reduces round-trip overhead when importing tasks.

fix: preserve task fields during partial updates

Use PATCH instead of PUT to avoid overwriting unmodified fields.
Fixes issue #42 where updating the title cleared the notes field.
```

## Pull Request Process

1. **Update your fork** with the latest `main` branch
2. **Push your branch** to your fork:
   ```bash
   git push origin feat/feature-name
   ```

3. **Open a pull request** on the main repository with:
   - Clear title and description
   - Reference to related issues (e.g., "Fixes #42")
   - Summary of changes
   - Rationale for the approach

4. **Respond to review feedback** promptly

5. **Ensure tests pass** (CI/CD will verify)

6. Once approved, the maintainer will merge your PR

## Review Criteria

Pull requests will be reviewed for:

- **Code Quality**: Clear, readable, well-tested
- **Completeness**: Tests, documentation, changelog entries
- **Compatibility**: No breaking changes to public APIs
- **Security**: No credentials hardcoded, proper error handling
- **Standards**: Follows code style and conventions

## Reporting Issues

- Use GitHub Issues for bugs and feature requests
- Include reproduction steps for bugs
- Provide context: version, platform, error messages
- Search existing issues first to avoid duplicates

## Documentation

- Update README.md for user-facing changes
- Add JSDoc comments for public functions
- Update CHANGELOG.md for all significant changes
- Include examples for new features

## Resources

- [Model Context Protocol](https://modelcontextprotocol.io) — MCP specification
- [Google Tasks API](https://developers.google.com/tasks/reference/rest) — API documentation
- [TypeScript Handbook](https://www.typescriptlang.org/docs/) — TypeScript guide
- [Conventional Commits](https://www.conventionalcommits.org/) — Commit format spec

## Questions?

If you have questions about contributing, feel free to:
- Open a GitHub Discussion
- Reach out to the maintainer (@sudohakan)
- Check existing issues and PRs for similar questions

Happy contributing!
