# Cerebro Development Guide

## Build Commands

- `pnpm run dev`: Run development build in watch mode
- `pnpm run build`: Production build with TypeScript checks
- `pnpm run lint`: ESLint check (zero warnings allowed)
- `pnpm run lint:fix`: Auto-fix ESLint issues
- `pnpm run format`: Check formatting with Prettier
- `pnpm run format:fix`: Fix formatting with Prettier
- `pnpm run fix-all`: Run both Prettier and ESLint fixes
- `pnpm run svelte-check`: Check Svelte component typing

## Test Commands

- `pnpm test`: Run unit tests with Jest
- `pnpm run test:watch`: Run tests in watch mode during development
- `pnpm run test:coverage`: Generate coverage report
- `pnpm run test:e2e`: Run end-to-end tests with Playwright
- `pnpm run test:e2e:ui`: Run E2E tests with Playwright UI
- `pnpm run test:all`: Run both unit and E2E tests

## Code Style Guidelines

- **Formatting**: 100 char line width, 4 spaces, double quotes
- **Imports**: Sorted with simple-import-sort plugin (no blank lines between groups)
- **TypeScript**: Strict null checks, no implicit any, explicit types
- **Functions**: Explicit return types required (except in command files)
- **Variables**: camelCase, UPPER_CASE for constants
- **Types/Interfaces**: PascalCase naming convention
- **Error Handling**: Unused vars with underscore prefix, strict equality (===)
- **Commands**: Files in commands/ folder have relaxed typing rules

## Technologies

### Svelte 5

- Using Svelte 5's runes for reactive state management
- `$state()` for local component state
- `$derived()` for computed values
- `$props()` for component props
- Documentation: [Svelte 5 Docs](https://svelte.dev/docs/runes)
- LLM Info: [svelte.dev/docs/llms](https://svelte.dev/docs/llms.txt)

### AI SDK

- Using Vercel's AI SDK for LLM streaming
- Supports OpenAI, Anthropic, Google, and other providers
- Simplifies streaming and error handling
- Documentation: [AI SDK](https://sdk.vercel.ai/)
- LLM Info: [sdk.vercel.ai/llms.txt](https://sdk.vercel.ai/llms.txt)

## Project Architecture

- Main plugin code in `src/` directory
- Components in `src/components/`
- Commands in `src/commands/`
- Views in `src/views/`
- LLM clients in `lib/models/`
- Tests in `tests/` directory
    - Unit tests in `tests/*.test.ts`
    - Model tests in `tests/models/`
    - E2E tests using Playwright

## Svelte 5 Best Practices

### LLM Message Streaming

- Use conditional rendering based on `isStreaming` flag rather than content length
- Clear streaming message content after it's added to the message store
- Use distinct objects for streaming message and final response
- Disable user input during streaming to prevent duplicate messages
- Pass streaming state to all components that need it
- Use the `$state()` and `$derived()` for reactive state management

### State Management

- Create stores using factory functions that return an object with state and methods
- Use getters for read-only access to state
- Use explicit update methods for modifying state
- Pass store objects down through props, not individual pieces of state
- Use `$derived()` to create computed values from store state

## TypeScript Best Practices

### Factory Functions and Type Safety

- Use factory functions to create stores with encapsulated state
- Export types using `ReturnType<typeof factoryFunction>` for automatic type syncing
- Define interfaces explicitly when you want a stable contract
- Use `ReturnType` when you want types to automatically update with implementation

### Method Binding and Callbacks

- Use arrow functions for callbacks to preserve `this` context
- When passing object methods as callbacks, use `() => this.method()` to preserve context
- Alternative: Use `.bind(this)` on methods to explicitly bind context
- For async callbacks, ensure you maintain the Promise chain

### Typing Best Practices

- Use `!` (definite assignment assertion) when you know a property will be initialized
- Use getters to control access to internal state
- Add explicit return types to functions for better documentation
- Use type inference where appropriate to reduce redundancy
- Use `readonly` properties to prevent accidental mutation

### Svelte Component Patterns

- Props are read-only, never modify them directly
- Use stores for shared state that needs to be modified
- Pass store objects, not just individual properties
- Use callbacks for communication up the component tree
- Use `$derived()` for computed values to avoid redundant calculations

## UI Changes

- Don't run the dev command, alert the user to verify the changes

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
