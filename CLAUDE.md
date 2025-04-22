# Cerebro Development Guide

## Build Commands

- `npm run dev`: Development build with esbuild
- `npm run build`: Production build with TypeScript checks
- `npm run lint`: ESLint check (zero warnings allowed)
- `npm run lint:fix`: Auto-fix ESLint issues
- `npm run format`: Check formatting with Prettier
- `npm run format:fix`: Fix formatting with Prettier
- `npm run fix-all`: Run both Prettier and ESLint fixes

## Test Commands

- `npm test`: Run unit tests with Jest
- `npm run test:watch`: Run tests in watch mode during development
- `npm run test:coverage`: Generate coverage report
- `npm run test:e2e`: Run end-to-end tests with Playwright
- `npm run test:e2e:ui`: Run E2E tests with Playwright UI
- `npm run test:all`: Run both unit and E2E tests

## Code Style Guidelines

- **Formatting**: 100 char line width, 4 spaces, double quotes
- **Imports**: Sorted with simple-import-sort plugin (no blank lines between groups)
- **TypeScript**: Strict null checks, no implicit any, explicit types
- **Functions**: Explicit return types required (except in command files)
- **Variables**: camelCase, UPPER_CASE for constants
- **Types/Interfaces**: PascalCase naming convention
- **Error Handling**: Unused vars with underscore prefix, strict equality (===)
- **Commands**: Files in commands/ folder have relaxed typing rules

## Project Architecture

- Main plugin code in `src/` directory
- Commands in `src/commands/`
- Views in `src/views/`
- LLM clients in `src/models/`
- Tests in `tests/` directory
    - Unit tests in `tests/*.test.ts`
    - Obsidian API mocks in `tests/mocks/`
    - E2E tests in `tests/e2e/`

## Testing Strategy

### Unit Tests

- Focus on pure functions and utilities
- Use mocks for Obsidian API and external dependencies
- Group related tests with descriptive describe blocks
- Test business logic independent of UI

### E2E Tests

- Test key user flows (create note, chat, etc.)
- Create test vault with known configuration
- Mock API responses to ensure predictable behavior
- Verify file contents and UI interactions

### CI Integration

- GitHub Actions workflow runs all tests on push/PR
- Tests must pass before merging
- Coverage reports generated for tracking
