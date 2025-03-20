# End-to-End Tests for Cerebro

This directory contains end-to-end tests for the Cerebro Obsidian plugin using Playwright.

## Structure

- `specs/`: Test specifications
- `helpers/`: Utility functions for test setup and teardown
- `fixtures/`: Test data and fixtures

## Running Tests

```bash
# Run all E2E tests
npm run test:e2e

# Run with UI for debugging
npm run test:e2e:ui
```

## Test Approach

These E2E tests use Playwright to test key user flows in Cerebro. In a full implementation, they would:

1. Launch Obsidian with a test vault
2. Interact with the Obsidian UI to create notes, open menus, etc.
3. Send test queries to the plugin
4. Verify the responses and UI updates

The current implementation simulates these interactions for demonstration purposes.

## Key Components

- `global-setup.ts`: Prepares the test environment
- `global-teardown.ts`: Cleans up after tests
- `prepare-vault.ts`: Creates a test vault with necessary configuration
- Basic test flow: Create note → Ask question → Verify response

## Extending the Tests

When adding new E2E tests:

1. Focus on key user flows
2. Add new test files in the `specs/` directory
3. Mock API responses to make tests deterministic
4. Add helper functions for common operations

## GitHub Actions Integration

Tests run automatically on push and pull requests through GitHub Actions, ensuring that any changes maintain functionality.

## Note on Obsidian API

Since Obsidian is a desktop application, fully automated testing requires:

1. A headless Electron environment
2. Special configuration for launching Obsidian
3. Mock responses for API calls

For full integration, additional setup would be needed to launch and control the actual Obsidian application.
