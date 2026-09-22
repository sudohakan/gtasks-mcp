#!/usr/bin/env bun

import { authenticate } from "@google-cloud/local-auth";
import { Server } from "@modelcontextprotocol/sdk/server/index.js";

import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListResourcesRequestSchema,
  ListToolsRequestSchema,
  ReadResourceRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import fs from "fs";
import { google, tasks_v1 } from "googleapis";
import path from "path";
import { fileURLToPath } from "url";
import { ensureConfigDir, getConfigPaths, migrateLegacySecrets } from "./config.js";
import { TaskActions, TaskResources } from "./Tasks.js";

const tasks = google.tasks("v1");

const server = new Server(
  {
    name: "example-servers/gtasks",
    version: "0.1.0",
  },
  {
    capabilities: {
      resources: {},
      tools: {},
    },
  },
);

server.setRequestHandler(ListResourcesRequestSchema, async (request) => {
  const [allTasks, nextPageToken] = await TaskResources.list(request, tasks);
  return {
    resources: allTasks.map((task) => ({
      uri: `gtasks:///${task.id}`,
      mimeType: "text/plain",
      name: task.title,
    })),
    nextCursor: nextPageToken,
  };
});

server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
  const task = await TaskResources.read(request, tasks);

  const taskDetails = [
    `Title: ${task.title || "No title"}`,
    `Status: ${task.status || "Unknown"}`,
    `Due: ${task.due || "Not set"}`,
    `Notes: ${task.notes || "No notes"}`,
    `Hidden: ${task.hidden || "Unknown"}`,
    `Parent: ${task.parent || "Unknown"}`,
    `Deleted?: ${task.deleted || "Unknown"}`,
    `Completed Date: ${task.completed || "Unknown"}`,
    `Position: ${task.position || "Unknown"}`,
    `ETag: ${task.etag || "Unknown"}`,
    `Links: ${task.links || "Unknown"}`,
    `Kind: ${task.kind || "Unknown"}`,
    `Status: ${task.status || "Unknown"}`,
    `Created: ${task.updated || "Unknown"}`,
    `Updated: ${task.updated || "Unknown"}`,
  ].join("\n");

  return {
    contents: [
      {
        uri: request.params.uri,
        mimeType: "text/plain",
        text: taskDetails,
      },
    ],
  };
});

server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: "search",
        description: "Search for a task in Google Tasks",
        inputSchema: {
          type: "object",
          properties: {
            query: {
              type: "string",
              description: "Search query",
            },
          },
          required: ["query"],
        },
      },
      {
        name: "list",
        description: "List tasks in Google Tasks (all lists, or one list when taskListId is given)",
        inputSchema: {
          type: "object",
          properties: {
            taskListId: {
              type: "string",
              description: "Only list tasks from this task list",
            },
            cursor: {
              type: "string",
              description: "Cursor for pagination",
            },
          },
        },
      },
      {
        name: "create",
        description: "Create a new task in Google Tasks",
        inputSchema: {
          type: "object",
          properties: {
            taskListId: {
              type: "string",
              description: "Task list ID",
            },
            title: {
              type: "string",
              description: "Task title",
            },
            notes: {
              type: "string",
              description: "Task notes",
            },
            due: {
              type: "string",
              description: "Due date (YYYY-MM-DD or ISO 8601 format, e.g. 2025-03-19)",
            },
            parent: {
              type: "string",
              description: "Parent task ID — creates this task as a subtask (parent must be in the same list)",
            },
          },
          required: ["title"],
        },
      },
      {
        name: "clear",
        description: "Clear completed tasks from a Google Tasks task list",
        inputSchema: {
          type: "object",
          properties: {
            taskListId: {
              type: "string",
              description: "Task list ID",
            },
          },
          required: ["taskListId"],
        },
      },
      {
        name: "delete",
        description: "Delete a task in Google Tasks",
        inputSchema: {
          type: "object",
          properties: {
            taskListId: {
              type: "string",
              description: "Task list ID",
            },
            id: {
              type: "string",
              description: "Task id",
            },
          },
          required: ["id", "taskListId"],
        },
      },
      {
        name: "list-tasklists",
        description: "List all task lists in Google Tasks",
        inputSchema: {
          type: "object",
          properties: {},
        },
      },
      {
        name: "create-tasklist",
        description: "Create a new task list in Google Tasks",
        inputSchema: {
          type: "object",
          properties: {
            title: {
              type: "string",
              description: "Task list title",
            },
          },
          required: ["title"],
        },
      },
      {
        name: "delete-tasklist",
        description: "Delete a task list in Google Tasks",
        inputSchema: {
          type: "object",
          properties: {
            taskListId: {
              type: "string",
              description: "Task list ID to delete",
            },
          },
          required: ["taskListId"],
        },
      },
      {
        name: "rename-tasklist",
        description: "Rename a task list in Google Tasks",
        inputSchema: {
          type: "object",
          properties: {
            taskListId: {
              type: "string",
              description: "Task list ID to rename",
            },
            title: {
              type: "string",
              description: "New title for the task list",
            },
          },
          required: ["taskListId", "title"],
        },
      },
      {
        name: "batch-create",
        description: "Create multiple tasks in Google Tasks in a single call (parallel)",
        inputSchema: {
          type: "object",
          properties: {
            items: {
              type: "array",
              description: "Array of tasks to create",
              items: {
                type: "object",
                properties: {
                  taskListId: { type: "string", description: "Task list ID (defaults to @default)" },
                  title: { type: "string", description: "Task title" },
                  notes: { type: "string", description: "Task notes" },
                  due: { type: "string", description: "Due date (YYYY-MM-DD)" },
                  parent: { type: "string", description: "Parent task ID (subtask; same list). Subtasks keep the given order." },
                },
                required: ["title"],
              },
            },
          },
          required: ["items"],
        },
      },
      {
        name: "move",
        description: "Move a task: under a parent (make subtask), back to top level, reorder, or to another task list",
        inputSchema: {
          type: "object",
          properties: {
            taskListId: { type: "string", description: "Current task list ID" },
            id: { type: "string", description: "Task ID to move" },
            parent: { type: "string", description: "New parent task ID; omit to move to top level" },
            previous: { type: "string", description: "Sibling task ID to place this task after; omit for first position" },
            destinationTaskListId: { type: "string", description: "Target task list ID when moving between lists (subtasks move with their parent)" },
          },
          required: ["id"],
        },
      },
      {
        name: "batch-update",
        description: "Update multiple tasks in Google Tasks in a single call (parallel)",
        inputSchema: {
          type: "object",
          properties: {
            items: {
              type: "array",
              description: "Array of tasks to update",
              items: {
                type: "object",
                properties: {
                  taskListId: { type: "string", description: "Task list ID (defaults to @default)" },
                  id: { type: "string", description: "Task ID" },
                  title: { type: "string", description: "New title" },
                  notes: { type: "string", description: "New notes" },
                  status: { type: "string", enum: ["needsAction", "completed"], description: "New status" },
                  due: { type: "string", description: "New due date (YYYY-MM-DD)" },
                },
                required: ["id"],
              },
            },
          },
          required: ["items"],
        },
      },
      {
        name: "update",
        description: "Update a task in Google Tasks",
        inputSchema: {
          type: "object",
          properties: {
            taskListId: {
              type: "string",
              description: "Task list ID",
            },
            id: {
              type: "string",
              description: "Task ID",
            },
            uri: {
              type: "string",
              description: "Task URI",
            },
            title: {
              type: "string",
              description: "Task title",
            },
            notes: {
              type: "string",
              description: "Task notes",
            },
            status: {
              type: "string",
              enum: ["needsAction", "completed"],
              description: "Task status (needsAction or completed)",
            },
            due: {
              type: "string",
              description: "Due date (YYYY-MM-DD or ISO 8601 format, e.g. 2025-03-19)",
            },
          },
          required: ["id", "uri"],
        },
      },
    ],
  };
});

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  if (request.params.name === "search") {
    const taskResult = await TaskActions.search(request, tasks);
    return taskResult;
  }
  if (request.params.name === "list") {
    const taskResult = await TaskActions.list(request, tasks);
    return taskResult;
  }
  if (request.params.name === "list-tasklists") {
    const response = await tasks.tasklists.list();
    const taskLists = response.data.items || [];
    const formatted = taskLists
      .map((list) => `${list.title} (ID: ${list.id})`)
      .join("\n");
    return {
      content: [
        {
          type: "text",
          text:
            taskLists.length > 0
              ? `Found ${taskLists.length} task lists:\n${formatted}`
              : "No task lists found",
        },
      ],
    };
  }
  if (request.params.name === "create") {
    const taskResult = await TaskActions.create(request, tasks);
    return taskResult;
  }
  if (request.params.name === "move") {
    return await TaskActions.move(request, tasks);
  }
  if (request.params.name === "batch-create") {
    const taskResult = await TaskActions.batchCreate(request, tasks);
    return taskResult;
  }
  if (request.params.name === "batch-update") {
    const taskResult = await TaskActions.batchUpdate(request, tasks);
    return taskResult;
  }
  if (request.params.name === "update") {
    const taskResult = await TaskActions.update(request, tasks);
    return taskResult;
  }
  if (request.params.name === "delete") {
    const taskResult = await TaskActions.delete(request, tasks);
    return taskResult;
  }
  if (request.params.name === "create-tasklist") {
    const title = request.params.arguments?.title as string;
    if (!title) throw new Error("Task list title is required");
    const response = await tasks.tasklists.insert({ requestBody: { title } });
    return {
      content: [{ type: "text", text: `Task list created: ${response.data.title} (ID: ${response.data.id})` }],
    };
  }
  if (request.params.name === "delete-tasklist") {
    const taskListId = request.params.arguments?.taskListId as string;
    if (!taskListId) throw new Error("Task list ID is required");
    await tasks.tasklists.delete({ tasklist: taskListId });
    return {
      content: [{ type: "text", text: `Task list ${taskListId} deleted` }],
    };
  }
  if (request.params.name === "rename-tasklist") {
    const taskListId = request.params.arguments?.taskListId as string;
    const title = request.params.arguments?.title as string;
    if (!taskListId || !title) throw new Error("Task list ID and title are required");
    const response = await tasks.tasklists.patch({ tasklist: taskListId, requestBody: { title } });
    return {
      content: [{ type: "text", text: `Task list renamed to: ${response.data.title}` }],
    };
  }
  if (request.params.name === "clear") {
    const taskResult = await TaskActions.clear(request, tasks);
    return taskResult;
  }
  throw new Error("Tool not found");
});

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const configPaths = getConfigPaths({ repoRoot });

function relocateLegacySecrets() {
  const moved = migrateLegacySecrets(configPaths);
  if (moved.length > 0) {
    console.error(
      `Moved legacy secret file(s) out of the repository and into ${configPaths.configDir}: ${moved.join(", ")}`
    );
  }
}

async function authenticateAndSaveCredentials() {
  relocateLegacySecrets();
  ensureConfigDir(configPaths.configDir);
  console.error("Launching auth flow…");
  if (!fs.existsSync(configPaths.oauthKeysPath)) {
    throw new Error(
      `OAuth keys not found at ${configPaths.oauthKeysPath}. Place your Google OAuth desktop-app JSON there, or set GTASKS_MCP_OAUTH_KEYS_PATH.`
    );
  }

  const auth = await authenticate({
    keyfilePath: configPaths.oauthKeysPath,
    scopes: ["https://www.googleapis.com/auth/tasks"],
  });
  fs.writeFileSync(configPaths.credentialsPath, JSON.stringify(auth.credentials));
  console.error(`Credentials saved to ${configPaths.credentialsPath}. You can now run the server.`);
}

async function loadCredentialsAndRunServer() {
  relocateLegacySecrets();
  ensureConfigDir(configPaths.configDir);

  if (!fs.existsSync(configPaths.credentialsPath)) {
    console.error(
      `Credentials not found at ${configPaths.credentialsPath}. Run with 'auth' first, or set GTASKS_MCP_CREDENTIALS_PATH.`,
    );
    process.exit(1);
  }

  if (!fs.existsSync(configPaths.oauthKeysPath)) {
    console.error(
      `OAuth keys not found at ${configPaths.oauthKeysPath}. Place your Google OAuth desktop-app JSON there, or set GTASKS_MCP_OAUTH_KEYS_PATH.`,
    );
    process.exit(1);
  }

  const credentials = JSON.parse(fs.readFileSync(configPaths.credentialsPath, "utf-8"));

  // Load OAuth keys to get client_id and client_secret for token refresh
  const oauthKeys = JSON.parse(fs.readFileSync(configPaths.oauthKeysPath, "utf-8"));
  const key = oauthKeys.installed || oauthKeys.web;

  const auth = new google.auth.OAuth2(
    key.client_id,
    key.client_secret,
    key.redirect_uris?.[0] || "http://localhost"
  );
  auth.setCredentials(credentials);

  // Auto-refresh: save new tokens when refreshed
  auth.on("tokens", (tokens) => {
    const existing = JSON.parse(fs.readFileSync(configPaths.credentialsPath, "utf-8"));
    const updated = { ...existing, ...tokens };
    fs.writeFileSync(configPaths.credentialsPath, JSON.stringify(updated));
  });

  google.options({ auth });

  const transport = new StdioServerTransport();
  await server.connect(transport);
}

if (process.argv[2] === "auth") {
  authenticateAndSaveCredentials().catch(console.error);
} else {
  loadCredentialsAndRunServer().catch(console.error);
}
