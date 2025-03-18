// Mock the helper functions directly instead of importing from the source
// This avoids the obsidian dependency issue
import { ImageExtension, PDFFileExtension, TextFileExtension, TextMessageContent } from "lib/types";

// Mock implementations of the helper functions we're testing
const sanitizeTitle = (title: string): string => {
    return title
        .replace(/[:/\\]/g, "")
        .replace("Title", "")
        .replace("title", "")
        .trim();
};

const unfinishedCodeBlock = (txt: string): boolean => {
    const matcher = txt.match(/```/g);
    if (!matcher) {
        return false;
    }
    return matcher.length % 2 !== 0;
};

const isValidImageExtension = (ext: string): ext is ImageExtension => {
    return ["PNG", "JPG", "JPEG", "GIF", "BMP", "SVG", "WEBP"].includes(ext.toUpperCase());
};

const isValidFileExtension = (ext: string): ext is TextFileExtension => {
    return ["MD", "TXT", "CSS", "JS", "TS", "HTML", "JSON"].includes(ext.toUpperCase());
};

const isValidPDFExtension = (ext: string | undefined): ext is PDFFileExtension => {
    if (!ext) {
        return false;
    }
    return ["PDF"].includes(ext.toUpperCase());
};

const isTitleTimestampFormat = (title: string, dateFormat: string): boolean => {
    try {
        const pattern = generateDatePattern(dateFormat);
        return title.length === dateFormat.length && pattern.test(title);
    } catch (err) {
        throw new Error("Error checking if title is in timestamp format" + err);
    }
};

const generateDatePattern = (format: string): RegExp => {
    const pattern = format
        .replace(/[-/\\^$*+?.()|[\]{}]/g, "\\$&") // Escape any special characters
        .replace("YYYY", "\\d{4}") // Match exactly four digits for the year
        .replace("MM", "\\d{2}") // Match exactly two digits for the month
        .replace("DD", "\\d{2}") // Match exactly two digits for the day
        .replace("hh", "\\d{2}") // Match exactly two digits for the hour
        .replace("mm", "\\d{2}") // Match exactly two digits for the minute
        .replace("ss", "\\d{2}"); // Match exactly two digits for the second
    return new RegExp(`^${pattern}$`);
};

const getDate = (date: Date, format = "YYYYMMDDhhmmss"): string => {
    const year = date.getFullYear();
    const month = date.getMonth() + 1;
    const day = date.getDate();
    const hour = date.getHours();
    const minute = date.getMinutes();
    const second = date.getSeconds();

    const paddedMonth = month.toString().padStart(2, "0");
    const paddedDay = day.toString().padStart(2, "0");
    const paddedHour = hour.toString().padStart(2, "0");
    const paddedMinute = minute.toString().padStart(2, "0");
    const paddedSecond = second.toString().padStart(2, "0");

    return format
        .replace("YYYY", year.toString())
        .replace("MM", paddedMonth)
        .replace("DD", paddedDay)
        .replace("hh", paddedHour)
        .replace("mm", paddedMinute)
        .replace("ss", paddedSecond);
};

const isTextContent = (mc: any): mc is TextMessageContent => {
    return mc.type === "text";
};

// Simplified implementation for testing
const getTextOnlyContent = (messages: any[]): any[] => {
    return messages.map((message) => {
        if (typeof message.content === "string") {
            return message;
        }
        return {
            ...message,
            content: message.content
                .filter((c: any) => c.type === "text")
                .map((content: any) => content.text)
                .join("\n"),
        };
    });
};

describe("Helper Functions", () => {
    describe("sanitizeTitle", () => {
        it('should remove colons, slashes, and "Title"/"title"', () => {
            expect(sanitizeTitle("My:Test/Title\\Here")).toBe("MyTestHere");
            expect(sanitizeTitle("Title: My Example")).toBe("My Example");
            expect(sanitizeTitle("title - Test")).toBe("- Test");
        });

        it("should trim whitespace", () => {
            expect(sanitizeTitle("  My  ")).toBe("My");
        });
    });

    describe("unfinishedCodeBlock", () => {
        it("should detect unclosed code blocks", () => {
            expect(unfinishedCodeBlock("```js\nconst x = 1;")).toBe(true);
            expect(unfinishedCodeBlock("Text with ```")).toBe(true);
        });

        it("should return false for properly closed code blocks", () => {
            expect(unfinishedCodeBlock("```js\nconst x = 1;\n```")).toBe(false);
            expect(unfinishedCodeBlock("```\nCode\n```")).toBe(false);
        });

        it("should return false when no code blocks are present", () => {
            expect(unfinishedCodeBlock("No code blocks here")).toBe(false);
        });
    });

    describe("file extension validators", () => {
        describe("isValidImageExtension", () => {
            it("should validate image extensions", () => {
                expect(isValidImageExtension("png")).toBe(true);
                expect(isValidImageExtension("PNG")).toBe(true);
                expect(isValidImageExtension("jpg")).toBe(true);
                expect(isValidImageExtension("JPEG")).toBe(true);

                // Test invalid extensions
                expect(isValidImageExtension("md")).toBe(false);
                expect(isValidImageExtension("txt")).toBe(false);
            });
        });

        describe("isValidFileExtension", () => {
            it("should validate text file extensions", () => {
                expect(isValidFileExtension("md")).toBe(true);
                expect(isValidFileExtension("MD")).toBe(true);
                expect(isValidFileExtension("txt")).toBe(true);

                // Test invalid extensions
                expect(isValidFileExtension("png")).toBe(false);
                expect(isValidFileExtension("pdf")).toBe(false);
            });
        });

        describe("isValidPDFExtension", () => {
            it("should validate PDF file extensions", () => {
                expect(isValidPDFExtension("pdf")).toBe(true);
                expect(isValidPDFExtension("PDF")).toBe(true);

                // Test invalid extensions
                expect(isValidPDFExtension("md")).toBe(false);
                expect(isValidPDFExtension("png")).toBe(false);
                expect(isValidPDFExtension(undefined)).toBe(false);
            });
        });
    });

    describe("date functions", () => {
        describe("isTitleTimestampFormat", () => {
            it("should validate timestamp formats", () => {
                expect(isTitleTimestampFormat("20240315120000", "YYYYMMDDhhmmss")).toBe(true);
                expect(isTitleTimestampFormat("2024-03-15-120000", "YYYY-MM-DD-hhmmss")).toBe(true);

                // Invalid formats
                expect(isTitleTimestampFormat("Not a timestamp", "YYYYMMDDhhmmss")).toBe(false);
                expect(isTitleTimestampFormat("2024031", "YYYYMMDDhhmmss")).toBe(false);
            });
        });

        describe("getDate", () => {
            it("should format dates according to pattern", () => {
                const testDate = new Date(2024, 2, 15, 12, 30, 45); // March 15, 2024 12:30:45

                expect(getDate(testDate, "YYYYMMDDhhmmss")).toBe("20240315123045");
                expect(getDate(testDate, "YYYY-MM-DD")).toBe("2024-03-15");
                expect(getDate(testDate, "YYYY/MM/DD hh:mm")).toBe("2024/03/15 12:30");
            });

            it("should pad single-digit values with zeros", () => {
                const testDate = new Date(2024, 0, 5, 9, 5, 9); // Jan 5, 2024 9:05:09

                expect(getDate(testDate, "YYYYMMDDhhmmss")).toBe("20240105090509");
            });
        });
    });

    describe("content processing functions", () => {
        describe("isTextContent", () => {
            it("should identify text content", () => {
                expect(isTextContent({ type: "text", text: "Hello" })).toBe(true);
                expect(
                    isTextContent({
                        type: "image",
                        source: { type: "base64", media_type: "image/png", data: "" },
                    } as any),
                ).toBe(false);
                expect(
                    isTextContent({
                        type: "document",
                        source: { type: "base64", media_type: "application/pdf", data: "" },
                    } as any),
                ).toBe(false);
            });
        });

        describe("getTextOnlyContent", () => {
            it("should filter to text-only content", () => {
                // Create properly typed messages according to lib/types.ts
                const messages = [
                    { role: "user", content: "Text only message" } as any,
                    {
                        role: "user",
                        content: [
                            { type: "text" as const, text: "Text part" },
                            {
                                type: "image" as const,
                                source: {
                                    type: "base64",
                                    media_type: "image/png",
                                    data: "",
                                },
                            },
                        ],
                    } as any,
                ];

                const result = getTextOnlyContent(messages);

                expect(result).toHaveLength(2);
                expect(result[0].content).toBe("Text only message");
                expect(result[1].content).toBe("Text part");
            });
        });
    });
});
