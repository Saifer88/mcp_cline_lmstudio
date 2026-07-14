#!/usr/bin/env node

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { webSearch } from "./tools/web-search.js";
import { fetchWebpage } from "./tools/fetch-webpage.js";
import { downloadImage } from "./tools/download-image.js";
import { executeCommand } from "./tools/execute-command.js";
import { readPdf } from "./tools/read-pdf.js";

const server = new McpServer({
  name: "cline-mcp-server",
  version: "1.0.0",
});

// Web Search - uses DuckDuckGo HTML (no API key needed)
server.tool(
  "web_search",
  "Search the web using DuckDuckGo. Returns titles, URLs, and snippets for search results.",
  {
    query: z.string().describe("The search query"),
    maxResults: z
      .number()
      .optional()
      .default(10)
      .describe("Maximum number of results to return (default: 10)"),
  },
  async ({ query, maxResults }) => {
    try {
      const results = await webSearch(query, maxResults);
      return {
        content: [{ type: "text", text: JSON.stringify(results, null, 2) }],
      };
    } catch (error: any) {
      return {
        content: [{ type: "text", text: `Search failed: ${error.message}` }],
        isError: true,
      };
    }
  }
);

// Fetch Webpage - extracts readable text from a URL
server.tool(
  "fetch_webpage",
  "Fetch a webpage and extract its text content. Useful for reading articles, documentation, or any web page.",
  {
    url: z.string().url().describe("The URL to fetch"),
    selector: z
      .string()
      .optional()
      .describe(
        "Optional CSS selector to extract specific content (e.g. 'article', '.main-content')"
      ),
  },
  async ({ url, selector }) => {
    try {
      const content = await fetchWebpage(url, selector);
      return {
        content: [{ type: "text", text: content }],
      };
    } catch (error: any) {
      return {
        content: [
          { type: "text", text: `Failed to fetch webpage: ${error.message}` },
        ],
        isError: true,
      };
    }
  }
);

// Download Image - downloads an image from a URL to a local path
server.tool(
  "download_image",
  "Download an image from a URL and save it to a local file path.",
  {
    url: z.string().url().describe("The image URL to download"),
    savePath: z
      .string()
      .describe(
        "Local file path where the image should be saved (e.g. ./images/photo.png)"
      ),
  },
  async ({ url, savePath }) => {
    try {
      const result = await downloadImage(url, savePath);
      return {
        content: [{ type: "text", text: result }],
      };
    } catch (error: any) {
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
  }
);

// Execute Command - runs a shell command and returns output
server.tool(
  "execute_command",
  "Execute a shell command and return stdout/stderr. Use with caution. Blocked commands: rm -rf /, format, mkfs, dd if=.",
  {
    command: z.string().describe("The shell command to execute"),
    cwd: z
      .string()
      .optional()
      .describe("Working directory for the command (defaults to home directory)"),
    timeout: z
      .number()
      .optional()
      .default(30000)
      .describe("Timeout in milliseconds (default: 30000)"),
  },
  async ({ command, cwd, timeout }) => {
    try {
      const result = await executeCommand(command, cwd, timeout);
      return {
        content: [{ type: "text", text: result }],
      };
    } catch (error: any) {
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
  }
);

// Read PDF - extracts text from a PDF file
server.tool(
  "read_pdf",
  "Extract text content from a PDF file (local path or URL).",
  {
    source: z
      .string()
      .describe("Local file path or URL of the PDF to read"),
  },
  async ({ source }) => {
    try {
      const text = await readPdf(source);
      return {
        content: [{ type: "text", text }],
      };
    } catch (error: any) {
      return {
        content: [
          { type: "text", text: `Failed to read PDF: ${error.message}` },
        ],
        isError: true,
      };
    }
  }
);

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
