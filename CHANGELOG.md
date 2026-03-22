# Changelog

All notable changes to this project are documented here.

Format: [Keep a Changelog](https://keepachangelog.com)

## [0.0.1] - 2026-03-22

### Added
- Initial release of Google Tasks MCP server
- Full task CRUD operations (create, read, update, delete)
- Task search functionality with full-text query support
- List all tasks with cursor-based pagination
- List task lists to retrieve task list IDs
- Clear completed tasks from a specific list
- OAuth 2.0 authentication with Google Cloud
- Task resources accessible via `gtasks:///<task_id>` URIs
- Support for task properties: title, notes, status, due date
- Local credential storage for authenticated users
- MCP resource and tool interfaces
- Smithery package registry integration
- Docker support for containerized deployment

### Features
- **Tools**: search, list, list-tasklists, create, update, delete, clear
- **Resources**: Read-only task resources with full metadata
- **Auth**: Browser-based OAuth flow with local credential caching
- **Config**: Desktop app integration via MCP server configuration
