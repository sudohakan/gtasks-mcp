<div align="center">

# 📋 Google Tasks MCP Server

**Manage Google Tasks directly from Claude and other MCP clients.**

[![Version](https://img.shields.io/badge/version-1.0.0-blue?style=flat-square)](CHANGELOG.md)
[![Node.js](https://img.shields.io/badge/node.js-18%2B-brightgreen?style=flat-square)](https://nodejs.org)
[![License](https://img.shields.io/badge/license-MIT-green?style=flat-square)](LICENSE)
[![CI](https://img.shields.io/github/actions/workflow/status/sudohakan/gtasks-mcp/ci.yml?style=flat-square&label=CI)](https://github.com/sudohakan/gtasks-mcp/actions)
[![Stars](https://img.shields.io/github/stars/sudohakan/gtasks-mcp?style=flat-square)](https://github.com/sudohakan/gtasks-mcp/stargazers)

[Quick Start](#-quick-start) · [Features](#-features) · [Tools](#-available-tools) · [Configuration](#-configuration) · [Contributing](#-contributing)

</div>

---

## What is this?

Seamless MCP integration for Google Tasks — create, search, update, and delete tasks directly from Claude or other MCP clients. OAuth 2.0 authenticated, with full CRUD operations and resource URI support.

## ✨ Features

| Feature | Details |
|---------|---------|
| **Create Tasks** | Add new tasks with title, notes, and due dates |
| **Search & Filter** | Full-text search across all tasks |
| **List Management** | View all tasks with cursor-based pagination |
| **Update Tasks** | Modify title, notes, status, and due dates |
| **Task Deletion** | Remove individual tasks or clear completed items |
| **List Operations** | List task lists to get IDs for task operations |
| **OAuth 2.0** | Secure Google account authentication |
| **Resource API** | Access tasks via `gtasks:///<task_id>` URIs |

## 🚀 Quick Start

1. **Create a Google Cloud project** and enable the Google Tasks API
2. **Set up OAuth credentials** (Desktop App type)
3. **Place credentials** in your local config dir (`%APPDATA%\\gtasks-mcp\\gcp-oauth.keys.json` on Windows, `~/.config/gtasks-mcp/gcp-oauth.keys.json` on Linux/macOS)
4. **Run authentication**: `npm run start auth`
5. **Build and configure**: `npm run build`, then add to your MCP config

<details>
<summary><b>Detailed Setup Instructions</b></summary>

### Step-by-Step Google Cloud Setup

1. [Create a new Google Cloud project](https://console.cloud.google.com/projectcreate)
2. [Enable the Google Tasks API](https://console.cloud.google.com/workspace-api/products)
3. [Configure an OAuth consent screen](https://console.cloud.google.com/apis/credentials/consent) ("internal" is fine for testing)
4. Add scopes: `https://www.googleapis.com/auth/tasks`
5. [Create an OAuth Client ID](https://console.cloud.google.com/apis/credentials/oauthclient) for application type "Desktop App"
6. Download the JSON file of your OAuth keys
7. Rename to `gcp-oauth.keys.json` and place it in your local `gtasks-mcp` config directory

</details>

## 📦 Installation

### Via Smithery (Recommended)

```bash
npx -y @smithery/cli install @sudohakan/gtasks-mcp --client claude
```

### Manual Setup

```bash
git clone https://github.com/sudohakan/gtasks-mcp.git
cd gtasks-mcp
npm install
npm run build
```

## 🔧 Configuration

Add to your MCP client configuration (e.g., Claude Desktop):

```json
{
  "mcpServers": {
    "gtasks": {
      "command": "node",
      "args": ["/path/to/gtasks-mcp/dist/index.js"]
    }
  }
}
```

## 🔐 Authentication

Run the authentication flow once to save your Google credentials:

```bash
npm run start auth
```

This will:
1. Open your default browser to Google's OAuth login
2. Request permission to access Google Tasks
3. Save credentials to your local config directory, outside the repository

Subsequent server runs will use the saved credentials.

### Credential storage

- Windows default: `%APPDATA%\\gtasks-mcp\\`
- Linux/macOS default: `~/.config/gtasks-mcp/`
- Override the directory with `GTASKS_MCP_CONFIG_DIR`
- Override individual files with `GTASKS_MCP_OAUTH_KEYS_PATH` and `GTASKS_MCP_CREDENTIALS_PATH`

If legacy secret files are still present in the repository root, the server will automatically move them into the external config directory on first run.

## 🛠️ Development

| Command | Purpose |
|---------|---------|
| `npm run build` | Build for production (TypeScript → JavaScript) |
| `npm run dev` | Watch mode for development |
| `npm run start` | Run the server |
| `npm run start auth` | Run authentication flow |
| `npm test` | Run test suite |

## 📚 Available Tools (12)

### Task Tools

| Tool | Description | Required Params |
|------|-------------|-----------------|
| `search` | Search for tasks using a query string | `query` |
| `list` | List all tasks across all task lists | -- |
| `create` | Create a new task | `title` |
| `update` | Update an existing task | `id`, `uri` |
| `delete` | Delete a task | `id`, `taskListId` |
| `clear` | Clear completed tasks from a task list | `taskListId` |
| `batch-create` | Create multiple tasks in parallel | `items[]` (each: `title`) |
| `batch-update` | Update multiple tasks in parallel | `items[]` (each: `id`) |

### Task List Tools

| Tool | Description | Required Params |
|------|-------------|-----------------|
| `list-tasklists` | List all task lists | -- |
| `create-tasklist` | Create a new task list | `title` |
| `delete-tasklist` | Delete a task list | `taskListId` |
| `rename-tasklist` | Rename a task list | `taskListId`, `title` |

## 🏗️ Architecture

This MCP server implements the Model Context Protocol to expose Google Tasks as a resource and tool interface:

- **Resources**: Tasks accessible via `gtasks:///<task_id>` URIs
- **Tools**: CRUD operations, search, and list management
- **Auth**: OAuth 2.0 with local credential storage
- **Transport**: HTTP-based MCP protocol

## 📁 Project Structure

```
gtasks-mcp/
├── src/
│   ├── index.ts           # Main server implementation
│   ├── config.ts          # Configuration and credential paths
│   └── Tasks.ts           # Task action helpers (batch ops)
├── dist/                  # Compiled output
├── package.json           # Dependencies and scripts
├── tsconfig.json          # TypeScript configuration
├── README.md              # This file
├── LICENSE                # MIT License
├── CHANGELOG.md           # Version history
├── SECURITY.md            # Security policy
├── CONTRIBUTING.md        # Development guidelines
└── CODE_OF_CONDUCT.md     # Community standards
```

## 🤝 Contributing

Contributions are welcome! See [CONTRIBUTING.md](CONTRIBUTING.md) for setup instructions, code standards, and the pull request process.

## 📄 License

[MIT](LICENSE) — Copyright © 2026 Hakan Topçu
