# Contributing

Contributions, ideas, bug reports, and discussions are welcome.

## Development Setup

1. Fork and clone the repository
2. Run `npm install`
3. Copy `.env.example` to `.env` and fill in your Discord credentials
4. Run `npm run dev` to start in development mode

## Code Style

- TypeScript strict mode is enforced
- ESLint and Prettier configurations are provided
- Run `npm run lint` and `npm run format` before committing
- Use named exports; avoid default exports
- Follow the existing module structure

## Testing

- All new features should include tests
- Run `npm test` to execute the test suite
- Run `npm run test:coverage` for coverage reports

## Pull Requests

1. Open an issue before submitting large changes
2. Keep PRs focused — one feature or fix per PR
3. Ensure CI passes (lint, typecheck, test, build)
4. Update documentation for any new features

## Commit Messages

Use conventional commit format:

```
feat: add new AI provider
fix: resolve channel creation order bug
docs: update schema documentation
refactor: simplify validator rule registration
test: add diff engine edge case tests
```

## Project Structure

See [docs/ARCHITECTURE.md](./ARCHITECTURE.md) for the full architecture overview.

## License

By contributing, you agree that your contributions will be licensed under the MIT License.
