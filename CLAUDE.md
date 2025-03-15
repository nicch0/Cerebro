# Cerebro Development Guide

## Build Commands

-   `npm run dev`: Development build with esbuild
-   `npm run build`: Production build with TypeScript checks
-   `npm run lint`: ESLint check (zero warnings allowed)
-   `npm run lint:fix`: Auto-fix ESLint issues
-   `npm run format`: Check formatting with Prettier
-   `npm run format:fix`: Fix formatting with Prettier
-   `npm run fix-all`: Run both Prettier and ESLint fixes

## Test Commands

-   `npm test`: Run all tests with Jest
-   `npm run test:watch`: Run tests in watch mode during development
-   `npm run test:coverage`: Generate coverage report

## Code Style Guidelines

-   **Formatting**: 100 char line width, 4 spaces, double quotes
-   **Imports**: Sorted with simple-import-sort plugin (no blank lines between groups)
-   **TypeScript**: Strict null checks, no implicit any, explicit types
-   **Functions**: Explicit return types required (except in command files)
-   **Variables**: camelCase, UPPER_CASE for constants
-   **Types/Interfaces**: PascalCase naming convention
-   **Error Handling**: Unused vars with underscore prefix, strict equality (===)
-   **Commands**: Files in commands/ folder have relaxed typing rules

## Project Architecture

-   Main plugin code in `lib/` directory
-   Commands in `lib/commands/`
-   Views in `lib/views/`
-   LLM clients in `lib/models/`
-   Tests in `tests/` directory
-   Obsidian API mocks in `tests/mocks/`

## Testing Strategy

-   Focus on testing pure functions and utilities first
-   Use mocks for Obsidian API and external dependencies
-   Group related tests with descriptive describe blocks
-   Test business logic independent of UI
