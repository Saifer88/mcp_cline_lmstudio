# Cline MCP Server

An MCP (Model Context Protocol) server that gives Cline + LM Studio superpowers: web search, image downloading, webpage reading, command execution, and PDF parsing — all without needing API keys.

## Tools

| Tool | Description |
|------|-------------|
| `web_search` | Search the web via DuckDuckGo (no API key needed) |
| `fetch_webpage` | Fetch and extract readable text from any URL |
| `download_image` | Download images from URLs to local files |
| `execute_command` | Run shell commands with safety checks |
| `read_pdf` | Extract text from local or remote PDF files |

## Setup

### 1. Build the server

```bash
cd ~/cline-mcp-server
npm install
npm run build
```

### 2. Configure Cline to use this MCP server

Open your Cline MCP settings file. Depending on your setup, this is typically at:

- **VS Code**: `~/Library/Application Support/Code/User/globalStorage/saoudrizwan.claude-dev/settings/cline_mcp_settings.json`
- **Cursor**: `~/Library/Application Support/Cursor/User/globalStorage/saoudrizwan.claude-dev/settings/cline_mcp_settings.json`

Add this entry to the `mcpServers` object:

```json
{
  "mcpServers": {
    "cline-tools": {
      "command": "node",
      "args": ["/Users/pirrima001/cline-mcp-server/dist/index.js"],
      "disabled": false
    }
  }
}
```

### 3. Restart Cline

After saving the config, restart the Cline extension (or reload the VS Code window). You should see the new tools available in Cline's MCP tools list.

## Usage Examples

Once connected, Cline (even with LM Studio) can:

**Search the web:**
> "Search for the latest React 19 features"

**Read a webpage:**
> "Fetch the content from https://docs.python.org/3/tutorial/"

**Download images:**
> "Download the image at https://example.com/photo.jpg to ./downloads/photo.jpg"

**Run commands:**
> "Run `ls -la` in my home directory"

**Read PDFs:**
> "Extract the text from ./documents/paper.pdf"

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
- **Webpage fetching** uses Cheerio to extract clean text, stripping ads/nav/scripts
- **Image download** streams the file to disk with content-type validation
- **Command execution** has a blocklist for dangerous patterns (rm -rf /, fork bombs, etc.)
- **PDF reading** works with both local files and URLs

## Requirements

- Node.js 18+ (tested with 18.19.1)
- No API keys needed — everything works out of the box
