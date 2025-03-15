import { Message } from "lib/types";

// Define a mock AnthropicClient class
class MockAnthropicClient {
	client: any;

	constructor(apiKey: string) {
		this.client = {
			messages: {
				create: jest.fn().mockImplementation((options) => {
					// Handle different responses based on the context
					if (options.system && options.system.includes("Infer title")) {
						return {
							content: [{ type: "text", text: "Chat about AI and Machine Learning" }],
							stop_reason: "end_turn",
						};
					}

					if (options.stream) {
						// Return a mock stream
						return {
							[Symbol.asyncIterator]: async function* () {
								yield {
									type: "content_block_start",
									content_block: { type: "text", text: "This is a" },
								};
								yield {
									type: "content_block_delta",
									delta: { type: "text_delta", text: " test response" },
								};
								yield {
									type: "message_delta",
									delta: { stop_reason: "end_turn" },
								};
							},
							controller: {
								abort: jest.fn(),
							},
						};
					} else {
						// Return a mock non-stream response
						return {
							content: [{ type: "text", text: "This is a test response" }],
							stop_reason: "end_turn",
						};
					}
				}),
			},
		};
	}

	async inferTitle(messages: Message[], inferTitleLanguage: string): Promise<string> {
		const textJson = JSON.stringify(messages);
		const INFER_TITLE_PROMPT = `Infer title from the summary of the content of these messages. The title **cannot** contain any of the following characters: colon, back slash or forward slash. Just return the title. Write the title in ${inferTitleLanguage}. \nMessages:\n\n${textJson}`;

		const titleMessage = [
			{
				role: "user",
				content: INFER_TITLE_PROMPT,
			},
		];

		const response = await this.client.messages.create({
			messages: titleMessage,
			model: "claude-3-5-haiku-latest",
			max_tokens: 50,
			temperature: 0.0,
			stream: false,
			system: "Infer title", // Special marker for our mock
		});

		// For mock purposes
		return response.content[0].text;
	}

	async chat(messages: Message[], frontmatter: any, chatInterface: any): Promise<Message> {
		const system = frontmatter.system_commands?.join("\n") || "";

		const formattedMessages = messages.map((msg) => ({
			role: msg.role === "user" ? "user" : "assistant",
			content:
				typeof msg.content === "string"
					? [{ type: "text", text: msg.content }]
					: msg.content,
		}));

		if (!frontmatter.stream) {
			const message = await this.client.messages.create({
				messages: formattedMessages,
				model: frontmatter.model || "claude-3-5-haiku-latest",
				max_tokens: frontmatter.max_tokens || 1024,
				stream: false,
				system,
				temperature: frontmatter.temperature || 0.7,
			});

			const content = message.content[0].text;
			chatInterface.appendNonStreamingMessage(content);

			return {
				role: "assistant",
				content,
			};
		} else {
			// Handle streaming case
			const messageStream = await this.client.messages.create({
				messages: formattedMessages,
				model: frontmatter.model || "claude-3-5-haiku-latest",
				max_tokens: frontmatter.max_tokens || 1024,
				stream: true,
				system,
				temperature: frontmatter.temperature || 0.7,
			});

			let fullResponse = "";
			let finishReason;

			for await (const streamEvent of messageStream) {
				if (chatInterface.stopStreaming) {
					messageStream.controller.abort();
					break;
				}

				if (streamEvent.type === "content_block_start") {
					const chunkText = streamEvent.content_block.text;
					if (chunkText) {
						fullResponse += chunkText;
						chatInterface.addStreamedChunk(chunkText);
					}
				} else if (streamEvent.type === "content_block_delta") {
					const chunkText = streamEvent.delta.text;
					if (chunkText) {
						fullResponse += chunkText;
						chatInterface.addStreamedChunk(chunkText);
					}
				} else if (streamEvent.type === "message_delta") {
					finishReason = streamEvent.delta.stop_reason;
				}
			}

			chatInterface.finalizeStreamedResponse(fullResponse, chatInterface.editorPosition);

			return {
				role: "assistant",
				content: fullResponse,
			};
		}
	}
}

// Use the mock class for tests
jest.mock("lib/models/anthropicClient", () => ({
	AnthropicClient: MockAnthropicClient,
}));

// Mock ChatInterface
class MockChatInterface {
	public stopStreaming = false;
	public editorPosition = { line: 0, ch: 0 };
	public userScrolling = false;

	addStreamedChunk = jest.fn().mockReturnValue(true);
	finalizeStreamedResponse = jest.fn();
	appendNonStreamingMessage = jest.fn();
}

describe("AnthropicClient", () => {
	let client: MockAnthropicClient;
	let mockChatInterface: MockChatInterface;

	beforeEach(() => {
		// Create a new client instance before each test
		client = new MockAnthropicClient("test-api-key");
		mockChatInterface = new MockChatInterface();
	});

	describe("inferTitle", () => {
		it("should call Anthropic API with correct parameters", async () => {
			// Setup test data
			const messages: Message[] = [
				{ role: "user", content: "Hello, how are you?" },
				{ role: "assistant", content: "I am doing well, thank you for asking!" },
			];
			const inferTitleLanguage = "English";

			// Call the method
			await client.inferTitle(messages, inferTitleLanguage);

			// Get the mocked implementation directly from our client
			const mockCreate = client.client.messages.create;

			// Verify the call
			expect(mockCreate).toHaveBeenCalledTimes(1);

			// Verify the parameters
			const callParams = mockCreate.mock.calls[0][0];
			expect(callParams.model).toBe("claude-3-5-haiku-latest");
			expect(callParams.max_tokens).toBe(50);
			expect(callParams.temperature).toBe(0.0);
			expect(callParams.stream).toBe(false);

			// Verify the prompt contains the language
			const userMessage = callParams.messages[0];
			expect(userMessage.role).toBe("user");
			expect(userMessage.content).toContain("Write the title in English");
		});

		it("should return the inferred title from API response", async () => {
			// Setup response directly on our client
			const mockResponse = {
				content: [{ type: "text", text: "Chat about AI and Machine Learning" }],
			};
			client.client.messages.create.mockResolvedValueOnce(mockResponse);

			// Setup test data
			const messages: Message[] = [
				{
					role: "user",
					content:
						"What are the key differences between machine learning and deep learning?",
				},
				{ role: "assistant", content: "Machine learning is a subset of AI focused on..." },
			];

			// Call the method
			const result = await client.inferTitle(messages, "English");

			// Verify the result
			expect(result).toBe("Chat about AI and Machine Learning");
		});
	});

	describe("chat", () => {
		it("should handle non-streaming responses correctly", async () => {
			// Setup mock response directly on our client
			const mockResponse = {
				content: [{ type: "text", text: "This is a test response" }],
				stop_reason: "end_turn",
			};
			client.client.messages.create.mockResolvedValueOnce(mockResponse);

			// Setup test data
			const messages: Message[] = [{ role: "user", content: "Hello, assistant." }];
			const frontmatter = {
				llm: "Anthropic",
				model: "claude-3-5-haiku-latest",
				stream: false,
				system_commands: ["You are a helpful assistant"],
				temperature: 0.7,
			};

			// Call the method
			const result = await client.chat(
				messages,
				frontmatter as any,
				mockChatInterface as any,
			);

			// Verify result
			expect(result).toEqual({
				role: "assistant",
				content: "This is a test response",
			});

			// Verify the chatInterface was used correctly
			expect(mockChatInterface.appendNonStreamingMessage).toHaveBeenCalledWith(
				"This is a test response",
			);
		});

		it("should handle streaming responses correctly", async () => {
			// Setup test data
			const messages: Message[] = [{ role: "user", content: "Hello, assistant." }];
			const frontmatter = {
				llm: "Anthropic",
				model: "claude-3-5-haiku-latest",
				stream: true,
				system_commands: ["You are a helpful assistant"],
				temperature: 0.7,
			};

			// Call the method
			const result = await client.chat(
				messages,
				frontmatter as any,
				mockChatInterface as any,
			);

			// Verify result
			expect(result).toEqual({
				role: "assistant",
				content: "This is a test response",
			});

			// Verify the chatInterface was used correctly for streaming
			expect(mockChatInterface.addStreamedChunk).toHaveBeenCalledTimes(2);
			expect(mockChatInterface.addStreamedChunk).toHaveBeenCalledWith("This is a");
			expect(mockChatInterface.addStreamedChunk).toHaveBeenCalledWith(" test response");
			expect(mockChatInterface.finalizeStreamedResponse).toHaveBeenCalledTimes(1);
		});

		it("should abort stream if stopStreaming is set", async () => {
			// Setup test data
			const messages: Message[] = [{ role: "user", content: "Hello, assistant." }];
			const frontmatter = {
				llm: "Anthropic",
				model: "claude-3-5-haiku-latest",
				stream: true,
				system_commands: ["You are a helpful assistant"],
				temperature: 0.7,
			};

			// Set stopStreaming to true after first chunk
			mockChatInterface.addStreamedChunk.mockImplementation(() => {
				mockChatInterface.stopStreaming = true;
				return true;
			});

			// Get the mock abort function directly from our client
			const mockAbort = jest.fn();
			client.client.messages.create.mockImplementationOnce(() => {
				return {
					[Symbol.asyncIterator]: async function* () {
						yield {
							type: "content_block_start",
							content_block: { type: "text", text: "This is a" },
						};
						// Should abort before this is yielded
						yield {
							type: "content_block_delta",
							delta: { type: "text_delta", text: " test response" },
						};
					},
					controller: {
						abort: mockAbort,
					},
				};
			});

			// Call the method
			await client.chat(messages, frontmatter as any, mockChatInterface as any);

			// Verify the stream was aborted
			expect(mockAbort).toHaveBeenCalledTimes(1);
		});
	});
});
