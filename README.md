# 📋 Google Tasks MCP Server

[![Version](https://img.shields.io/badge/version-0.0.1-blue?style=flat-square)](CHANGELOG.md)
[![Language](https://img.shields.io/badge/node.js-18%2B-brightgreen?style=flat-square)](https://nodejs.org)
[![License](https://img.shields.io/badge/license-MIT-green?style=flat-square)](LICENSE)
[![smithery badge](https://smithery.ai/badge/@zcaceres/gtasks)](https://smithery.ai/server/@zcaceres/gtasks)

Seamless MCP integration for Google Tasks — manage your task lists, create, search, update, and delete tasks directly from Claude or other MCP clients.

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
3. **Place credentials** in `gcp-oauth.keys.json`
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
7. Rename to `gcp-oauth.keys.json` and place in the project root

</details>

## 📦 Installation

### Via Smithery (Recommended)

```bash
npx -y @smithery/cli install @zcaceres/gtasks --client claude
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
3. Save credentials to `.gtasks-server-credentials.json`

Subsequent server runs will use the saved credentials.

## 🛠️ Development

| Command | Purpose |
|---------|---------|
| `npm run build` | Build for production (TypeScript → JavaScript) |
| `npm run dev` | Watch mode for development |
| `npm run start` | Run the server |
| `npm run start auth` | Run authentication flow |
| `npm test` | Run test suite |

## 📚 Available Tools

### search
Search for tasks using a query string.

**Input:**
- `query` (string, required): Search terms

**Output:** Matching tasks with full details

### list
List all tasks across all task lists.

**Input:**
- `cursor` (string, optional): Pagination cursor

**Output:** Array of tasks with metadata

### list-tasklists
List all task lists in your Google Tasks account.

**Output:** Array of task list IDs and names

### create
Create a new task.

**Input:**
- `taskListId` (string, optional): Target task list (uses default if omitted)
- `title` (string, required): Task title
- `notes` (string, optional): Task description
- `due` (string, optional): Due date (ISO 8601 format)

**Output:** Created task with ID and metadata

### update
Update an existing task.

**Input:**
- `taskListId` (string, optional): Task list containing the task
- `id` (string, required): Task ID to update
- `uri` (string, required): Task URI
- `title` (string, optional): New title
- `notes` (string, optional): New notes
- `status` (string, optional): New status (`needsAction` or `completed`)
- `due` (string, optional): New due date

**Output:** Updated task details

### delete
Delete a task.

**Input:**
- `taskListId` (string, required): Task list containing the task
- `id` (string, required): Task ID to delete

**Output:** Confirmation of deletion

### clear
Clear all completed tasks from a task list.

**Input:**
- `taskListId` (string, required): Target task list

**Output:** Confirmation of cleared tasks

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
│   └── index.ts           # Main server implementation
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
