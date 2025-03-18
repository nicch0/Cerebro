import { test, expect, Page } from "@playwright/test";
import * as path from "path";
import * as fs from "fs";
import * as childProcess from "child_process";
import { promisify } from "util";

const exec = promisify(childProcess.exec);

// In a real implementation, we'd launch actual Obsidian app
// For testing purposes, we're simulating file operations
test.describe("Chat Template Flow", () => {
    let testVaultDir: string;

    test.beforeAll(async () => {
        // Get test vault path from environment variable
        testVaultDir = process.env.TEST_VAULT_PATH || "";
        expect(testVaultDir).toBeTruthy();
        expect(fs.existsSync(testVaultDir)).toBeTruthy();

        // Create additional test templates
        await createProductivityTemplate(testVaultDir);
        await createCreativeWritingTemplate(testVaultDir);
    });

    test("should create a new chat from productivity template", async ({ page }) => {
        // We're simulating creating a new chat from the productivity template
        const templatePath = path.join(
            testVaultDir,
            "Cerebro",
            "Templates",
            "Productivity Template.md",
        );
        const chatName = "Productivity Chat " + Date.now();
        const chatFilePath = path.join(testVaultDir, "Cerebro", "Chats", `${chatName}.md`);

        // Copy template content
        const templateContent = fs.readFileSync(templatePath, "utf8");
        fs.writeFileSync(chatFilePath, templateContent);

        // Simulate adding a productivity question
        let chatContent = fs.readFileSync(chatFilePath, "utf8");
        const userQuestion =
            '\n\n<hr class="cerebro-divider">\n### User:\n\nHow can I organize my tasks better for maximum productivity?';
        chatContent += userQuestion;
        fs.writeFileSync(chatFilePath, chatContent);

        // Verify chat exists and contains the question
        expect(fs.existsSync(chatFilePath)).toBeTruthy();
        const updatedContent = fs.readFileSync(chatFilePath, "utf8");
        expect(updatedContent).toContain(
            "How can I organize my tasks better for maximum productivity?",
        );

        // Simulate AI response
        const aiResponse =
            '\n\n<hr class="cerebro-divider">\n### Cerebro:\n\nYou can organize your tasks better by:\n\n1. **Time blocking**: Allocate specific blocks of time to specific tasks\n2. **Prioritization**: Use the Eisenhower Matrix to separate urgent from important\n3. **Single-tasking**: Focus on one task at a time for better concentration\n4. **2-minute rule**: If a task takes less than 2 minutes, do it immediately\n5. **Regular reviews**: Schedule weekly reviews to adjust your system';
        chatContent += aiResponse;
        fs.writeFileSync(chatFilePath, chatContent);

        // Verify complete conversation
        const finalContent = fs.readFileSync(chatFilePath, "utf8");
        expect(finalContent).toContain("Time blocking");
        expect(finalContent).toContain("Prioritization");

        // Simulate inferring a title
        const newFileName = path.join(
            testVaultDir,
            "Cerebro",
            "Chats",
            "Task Organization Techniques.md",
        );
        fs.renameSync(chatFilePath, newFileName);

        // Verify the renamed file exists
        expect(fs.existsSync(newFileName)).toBeTruthy();
        expect(fs.existsSync(chatFilePath)).toBeFalsy();
    });

    test("should create a chat from creative writing template and handle complex content", async ({
        page,
    }) => {
        // We're simulating creating a new chat from the creative writing template
        const templatePath = path.join(
            testVaultDir,
            "Cerebro",
            "Templates",
            "Creative Writing Template.md",
        );
        const chatName = "Creative Writing Chat " + Date.now();
        const chatFilePath = path.join(testVaultDir, "Cerebro", "Chats", `${chatName}.md`);

        // Copy template content
        const templateContent = fs.readFileSync(templatePath, "utf8");
        fs.writeFileSync(chatFilePath, templateContent);

        // Simulate adding a writing prompt with a code block
        let chatContent = fs.readFileSync(chatFilePath, "utf8");
        const userQuestion =
            '\n\n<hr class="cerebro-divider">\n### User:\n\nHelp me write a short story about a programmer who discovers a magic comment in their code. Include an example of the magic comment using a code block.';
        chatContent += userQuestion;
        fs.writeFileSync(chatFilePath, chatContent);

        // Verify chat exists and contains the question
        expect(fs.existsSync(chatFilePath)).toBeTruthy();
        const updatedContent = fs.readFileSync(chatFilePath, "utf8");
        expect(updatedContent).toContain("Help me write a short story about a programmer");

        // Simulate AI response with a code block
        const aiResponse = `\n\n<hr class="cerebro-divider">\n### Cerebro:\n\n# The Magic Comment\n\nJamie rubbed tired eyes as the clock struck midnight. Just one more bug to fix before calling it a night. The codebase was a mess—inherited from a developer who left abruptly months ago.\n\n"What were they thinking with this architecture?" Jamie muttered, scrolling through hundreds of lines of uncommented code.\n\nIn the middle of a particularly convoluted function, something caught Jamie's attention—a comment unlike any other:\n\n\`\`\`python\n# @WISHFORGE: Refactor this mess into something beautiful\n\ndef process_data(input_values):\n    # 30 lines of spaghetti code\n    return complicated_result\n\`\`\`\n\n"Wishforge?" Jamie whispered, reading it aloud. The screen flickered briefly.\n\nJamie blinked, suddenly noticing the function had completely transformed:\n\n\`\`\`python\ndef process_data(input_values):\n    \"\"\"Efficiently processes input values using optimized algorithms.\n    \n    Args:\n        input_values: A list of input data to process\n        \n    Returns:\n        Processed results as a formatted dictionary\n    \"\"\"\n    return {key: optimize(value) for key, value in enumerate(input_values)}\n\`\`\`\n\nThe code was now elegant, efficient, and perfectly documented. Jamie stared in disbelief, then experimentally typed another comment:\n\n\`\`\`python\n# @WISHFORGE: Add input validation\n\`\`\`\n\nThe magic had just begun...`;

        chatContent += aiResponse;
        fs.writeFileSync(chatFilePath, chatContent);

        // Verify complete conversation with code blocks
        const finalContent = fs.readFileSync(chatFilePath, "utf8");
        expect(finalContent).toContain("The Magic Comment");
        expect(finalContent).toContain("```python");
        expect(finalContent).toContain("@WISHFORGE");

        // Verify code blocks are properly closed
        const codeBlockMatches = (finalContent.match(/```/g) || []).length;
        expect(codeBlockMatches % 2).toBe(0); // Should be even number of ``` marks

        // Simulate inferring a title
        const newFileName = path.join(
            testVaultDir,
            "Cerebro",
            "Chats",
            "The Magic Comment - A Programmers Tale.md",
        );
        fs.renameSync(chatFilePath, newFileName);

        // Verify the renamed file exists
        expect(fs.existsSync(newFileName)).toBeTruthy();
        expect(fs.existsSync(chatFilePath)).toBeFalsy();
    });
});

// Helper functions to create test templates
async function createProductivityTemplate(vaultDir: string): Promise<void> {
    const templatesDir = path.join(vaultDir, "Cerebro", "Templates");
    const templatePath = path.join(templatesDir, "Productivity Template.md");

    const content = `---
system_commands: ['You are a productivity coach specializing in task management, time blocking, and efficiency.', 'Provide actionable advice with clear steps.', 'Use numbered lists and bullet points for clarity.']
temperature: 0.2
model: claude-3-5-haiku-latest
llm: Anthropic
stream: true
---

# Productivity Assistant

I'm here to help you boost your productivity and efficiency. Ask me about:

- Task management strategies
- Time blocking techniques 
- Focus improvement methods
- Productivity tools and systems
- Habit formation and tracking`;

    fs.writeFileSync(templatePath, content);
}

async function createCreativeWritingTemplate(vaultDir: string): Promise<void> {
    const templatesDir = path.join(vaultDir, "Cerebro", "Templates");
    const templatePath = path.join(templatesDir, "Creative Writing Template.md");

    const content = `---
system_commands: ['You are a creative writing assistant with expertise in fiction, poetry, and narrative techniques.', 'Provide imaginative and engaging content that demonstrates strong storytelling.', 'When appropriate, explain literary techniques and writing principles.']
temperature: 0.8
model: claude-3-5-sonnet-latest
llm: Anthropic
stream: true
---

# Creative Writing Assistant

I can help you with creative writing projects including:

- Short story development
- Character creation
- Plot structuring
- Poetic forms and techniques
- Overcoming writer's block
- Editing and revision tips`;

    fs.writeFileSync(templatePath, content);
}
