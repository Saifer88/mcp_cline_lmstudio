#!/usr/bin/env node
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { webSearch } from "./tools/web-search.js";
import { fetchWebpage } from "./tools/fetch-webpage.js";
import { downloadImage } from "./tools/download-image.js";
import { executeCommand } from "./tools/execute-command.js";
import { readPdf } from "./tools/read-pdf.js";
import { imageSearch } from "./tools/image-search.js";
const server = new McpServer({
    name: "cline-mcp-server",
    version: "1.0.0",
});
// Web Search
server.registerTool("web_search", {
    title: "Web Search",
    description: "Search the web using DuckDuckGo. Returns titles, URLs, and snippets for search results.",
    inputSchema: {
        query: z.string().describe("The search query"),
        maxResults: z
            .number()
            .int()
            .min(1)
            .max(50)
            .default(10)
            .describe("Maximum number of results to return (default: 10)"),
    },
    annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: true,
    },
}, async ({ query, maxResults }) => {
    try {
        const results = await webSearch(query, maxResults);
        return {
            content: [{ type: "text", text: JSON.stringify(results, null, 2) }],
        };
    }
    catch (error) {
        return {
            content: [{ type: "text", text: `Search failed: ${error.message}` }],
            isError: true,
        };
    }
});
// Fetch Webpage
server.registerTool("fetch_webpage", {
    title: "Fetch Webpage",
    description: "Fetch a webpage and extract its text content. Useful for reading articles, documentation, or any web page.",
    inputSchema: {
        url: z.string().url().describe("The URL to fetch"),
        selector: z
            .string()
            .optional()
            .describe("Optional CSS selector to extract specific content (e.g. 'article', '.main-content')"),
    },
    annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: true,
    },
}, async ({ url, selector }) => {
    try {
        const content = await fetchWebpage(url, selector);
        return {
            content: [{ type: "text", text: content }],
        };
    }
    catch (error) {
        return {
            content: [
                { type: "text", text: `Failed to fetch webpage: ${error.message}` },
            ],
            isError: true,
        };
    }
});
// Download Image
server.registerTool("download_image", {
    title: "Download Image",
    description: "Download an image from a URL and save it to a local file path. The save path MUST be absolute.",
    inputSchema: {
        url: z.string().url().describe("The image URL to download"),
        savePath: z
            .string()
            .startsWith("/", { message: "savePath must be an absolute path starting with /" })
            .describe("Absolute file path where the image should be saved (e.g. /Users/you/project/images/photo.png)"),
    },
    annotations: {
        readOnlyHint: false,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: true,
    },
}, async ({ url, savePath }) => {
    try {
        const result = await downloadImage(url, savePath);
        return {
            content: [{ type: "text", text: result }],
        };
    }
    catch (error) {
        return {
            content: [
                {
                    type: "text",
                    text: `Failed to download image: ${error.message}`,
                },
            ],
            isError: true,
        };
    }
});
// Execute Command
server.registerTool("execute_command", {
    title: "Execute Command",
    description: "Execute a shell command and return stdout/stderr. Use with caution. Blocked commands: rm -rf /, format, mkfs, dd if=.",
    inputSchema: {
        command: z.string().describe("The shell command to execute"),
        cwd: z
            .string()
            .optional()
            .describe("Working directory for the command (defaults to home directory)"),
        timeout: z
            .number()
            .int()
            .min(1000)
            .max(120000)
            .default(30000)
            .describe("Timeout in milliseconds (default: 30000)"),
    },
    annotations: {
        readOnlyHint: false,
        destructiveHint: true,
        idempotentHint: false,
        openWorldHint: false,
    },
}, async ({ command, cwd, timeout }) => {
    try {
        const result = await executeCommand(command, cwd, timeout);
        return {
            content: [{ type: "text", text: result }],
        };
    }
    catch (error) {
        return {
            content: [
                {
                    type: "text",
                    text: `Command execution failed: ${error.message}`,
                },
            ],
            isError: true,
        };
    }
});
// Read PDF
server.registerTool("read_pdf", {
    title: "Read PDF",
    description: "Extract text content from a PDF file (local path or URL).",
    inputSchema: {
        source: z
            .string()
            .describe("Local file path or URL of the PDF to read"),
    },
    annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: true,
    },
}, async ({ source }) => {
    try {
        const text = await readPdf(source);
        return {
            content: [{ type: "text", text }],
        };
    }
    catch (error) {
        return {
            content: [
                { type: "text", text: `Failed to read PDF: ${error.message}` },
            ],
            isError: true,
        };
    }
});
// Image Search with pagination
server.registerTool("image_search", {
    title: "Image Search",
    description: `Search for images using DuckDuckGo. Returns image URLs, thumbnails, titles, and source pages. Supports pagination to browse results page by page.

Args:
  - query (string): The image search query (e.g. "Pirelli P Zero tyre")
  - page (number): Page number for pagination, 1-based (default: 1)
  - maxResults (number): Maximum results per page, 1-20 (default: 10)

Returns:
  {
    "results": [{ "title", "imageUrl", "thumbnailUrl", "sourceUrl", "width", "height" }],
    "page": number,
    "totalResults": number,
    "hasNextPage": boolean
  }

Examples:
  - Page 1: { query: "Pirelli tyres", page: 1 }
  - Page 2: { query: "Pirelli tyres", page: 2 }`,
    inputSchema: {
        query: z.string().min(1).describe("The image search query"),
        page: z
            .number()
            .int()
            .min(1)
            .default(1)
            .describe("Page number for pagination (1-based, default: 1)"),
        maxResults: z
            .number()
            .int()
            .min(1)
            .max(20)
            .default(10)
            .describe("Maximum number of results per page (default: 10, max: 20)"),
    },
    annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: true,
    },
}, async ({ query, page, maxResults }) => {
    try {
        const results = await imageSearch(query, page, maxResults);
        return {
            content: [{ type: "text", text: JSON.stringify(results, null, 2) }],
        };
    }
    catch (error) {
        return {
            content: [
                { type: "text", text: `Image search failed: ${error.message}` },
            ],
            isError: true,
        };
    }
});
// Start the server
async function main() {
    const transport = new StdioServerTransport();
    await server.connect(transport);
    console.error("Cline MCP Server running on stdio");
}
main().catch((error) => {
    console.error("Fatal error:", error);
    process.exit(1);
});
//# sourceMappingURL=index.js.map