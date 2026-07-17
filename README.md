# Cline MCP Server

An MCP (Model Context Protocol) server that adds web search, image search, image downloading, webpage reading, command execution, and PDF parsing — all without needing API keys.

## Tools

| Tool | Description |
|------|-------------|
| `web_search` | Search the web via DuckDuckGo (no API key needed) |
| `image_search` | Search for images with pagination and pixel size filtering |
| `fetch_webpage` | Fetch and extract readable text from any URL |
| `download_image` | Download images from URLs to local files (absolute path required) |
| `execute_command` | Run shell commands with safety checks |
| `read_pdf` | Extract text from local or remote PDF files |

## Setup

### 1. Build the server

```bash
npm install
npm run build
```

### 2. Configure as MCP server

Add this entry to your MCP settings (adjust the path to where you cloned this repo):

```json
{
  "mcpServers": {
    "cline-tools": {
      "command": "node",
      "args": ["<path-to-repo>/dist/index.js"],
      "disabled": false
    }
  }
}
```

### 3. Restart your IDE/client

After saving the config, restart the extension or reload the window. The tools should appear in the MCP tools list.

## Usage Examples

**Search the web:**
> "Search for the latest React 19 features"

**Search for images (with pagination):**
> "Find images of Pirelli tyres, page 2, minimum 1920px wide"

**Read a webpage:**
> "Fetch the content from https://docs.python.org/3/tutorial/"

**Download images:**
> "Download the image at https://example.com/photo.jpg to /Users/you/project/downloads/photo.jpg"

**Run commands:**
> "Run `ls -la` in my home directory"

**Read PDFs:**
> "Extract the text from /Users/you/documents/paper.pdf"

## Development

```bash
# Run in development mode (no build needed)
npm run dev

# Build for production
npm run build

# Run the built server
npm start
```

## How It Works

- **Web search** scrapes DuckDuckGo's HTML results page (no API key required)
- **Image search** uses DuckDuckGo's image API with pagination and client-side pixel filtering
- **Webpage fetching** uses Cheerio to extract clean text, stripping ads/nav/scripts
- **Image download** streams the file to disk with content-type validation (requires absolute paths)
- **Command execution** has a blocklist for dangerous patterns (rm -rf /, fork bombs, etc.)
- **PDF reading** works with both local files and URLs

## Requirements

- Node.js 20+
- No API keys needed — everything works out of the box
