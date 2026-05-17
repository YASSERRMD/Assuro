# Contributing

## Branch Naming

- Feature branches: `phase-NN-short-slug` (e.g., `phase-01-scaffold`)
- Fix branches: `fix/short-description`
- Never branch directly from another feature branch; always branch from `main`.

## Commits

- One commit per logical unit of work (3-15 minutes).
- Every commit must build and pass tests.
- Use conventional commit prefixes: `feat:`, `fix:`, `chore:`, `docs:`, `test:`, `refactor:`, `ci:`.
- Imperative mood, lowercase after prefix, no trailing period, max 72 characters.
- Never bundle unrelated changes in one commit.

## Pull Requests

- Open a PR from your phase branch to `main`.
- Self-review the diff before merging.
- Delete the branch after merge.

## Code Style

- Go: gofmt clean, golangci-lint clean, no naked returns, wrap errors with context.
- TypeScript: strict mode, no `any`, explicit return types on exported functions.
- Every exported symbol gets a doc comment.
- No em dashes anywhere in code, comments, or docs.
