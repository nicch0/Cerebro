/**
 * Global test setup for Cerebro tests
 */

// The obsidian mock is handled by moduleNameMapper in jest.config.js
// We don't need to mock it directly here which causes circular dependency

// Mock the logger to prevent logs during tests
jest.mock("lib/logger", () => ({
	logger: {
		debug: jest.fn(),
		info: jest.fn(),
		warn: jest.fn(),
		error: jest.fn(),
	},
}));

// Mock APIs and SDK clients
jest.mock("@anthropic-ai/sdk", () => {
	return {
		default: jest.fn().mockImplementation(() => ({
			messages: {
				create: jest.fn().mockResolvedValue({
					content: [{ type: "text", text: "Test response" }],
					stop_reason: "end_turn",
				}),
			},
		})),
	};
});

jest.mock("openai", () => {
	return {
		OpenAI: jest.fn().mockImplementation(() => ({
			chat: {
				completions: {
					create: jest.fn().mockResolvedValue({
						choices: [
							{
								message: { content: "Test response" },
								finish_reason: "stop",
							},
						],
					}),
				},
			},
		})),
	};
});

// Make this module not a test
test("skip", () => {
	expect(true).toBe(true);
});

// Export empty object
export {};
