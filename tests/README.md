# Cerebro Test Suite

This directory contains tests for the Cerebro Obsidian plugin. The test suite uses Jest with TypeScript support.

## Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode (for development)
npm run test:watch

# Run tests with coverage report
npm run test:coverage
```

## Test Structure

The tests are organized to focus on testing pure functions and business logic that can be isolated from Obsidian's API:

1. **Unit Tests**: Testing individual functions with clear inputs and outputs

    - Helper functions (`helpers.test.ts`)
    - Settings module (`settings.test.ts`)
    - ChatInterface utility methods (`chatInterface.test.ts`)

2. **Mocks**: Obsidian API mock implementations
    - `mocks/obsidian.ts` - Contains mock implementations of Obsidian objects and APIs

## Testing Strategy

Our testing approach focuses on:

1. **Pure Functions**: Testing utility functions with clear inputs/outputs
2. **Mocking Dependencies**: Using Jest mocks for Obsidian APIs and external services
3. **Component Isolation**: Testing business logic separately from UI interactions
4. **Coverage Tracking**: Measuring code coverage to identify untested code paths

## Writing New Tests

When adding tests, follow these guidelines:

1. Group related tests with `describe` blocks that match the function or component being tested
2. Use meaningful test names that describe the expected behavior
3. For component tests, use the provided mocks to simulate Obsidian's environment
4. Focus on testing business logic rather than implementation details
5. Keep tests isolated and independent of each other

## Mock Usage

The `mocks/obsidian.ts` file provides mock implementations of Obsidian's APIs. Use these mocks to test code that depends on Obsidian functionality.

Example:

```typescript
import { App, Editor, MarkdownView } from "../mocks/obsidian";

describe("MyComponent", () => {
	let app: App;
	let editor: Editor;

	beforeEach(() => {
		app = new App();
		editor = new Editor();
		// Configure mocks for specific tests
	});

	it("should perform a specific action", () => {
		// Test implementation
	});
});
```
