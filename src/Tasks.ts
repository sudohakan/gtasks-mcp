import {
  CallToolRequest,
  CallToolResult,
  ListResourcesRequest,
  ReadResourceRequest,
} from "@modelcontextprotocol/sdk/types.js";
import { GaxiosResponse } from "gaxios";
import { tasks_v1 } from "googleapis";

const MAX_TASK_RESULTS = 100;

/**
 * Normalize a due date string to RFC 3339 format expected by Google Tasks API.
 * Google Tasks only stores the date portion, so time is set to midnight UTC.
 * Accepts: "2025-03-19", "2025-03-19T21:00:00", "2025-03-19T21:00:00Z", etc.
 */
export function normalizeDueDate(due: string | undefined): string | undefined {
  if (!due) return undefined;
  const parsed = new Date(due);
  if (isNaN(parsed.getTime())) {
    throw new Error(`Invalid due date format: "${due}". Use YYYY-MM-DD or ISO 8601 format.`);
  }
  // Google Tasks only uses the date portion, so normalize to midnight UTC
  const year = parsed.getUTCFullYear();
  const month = String(parsed.getUTCMonth() + 1).padStart(2, "0");
  const day = String(parsed.getUTCDate()).padStart(2, "0");
  return `${year}-${month}-${day}T00:00:00.000Z`;
}

export class TaskResources {
  static async read(request: ReadResourceRequest, tasks: tasks_v1.Tasks) {
    const taskId = request.params.uri.replace("gtasks:///", "");

    const taskListsResponse: GaxiosResponse<tasks_v1.Schema$TaskLists> =
      await tasks.tasklists.list({
        maxResults: MAX_TASK_RESULTS,
      });

    const taskLists = taskListsResponse.data.items || [];
    let task: tasks_v1.Schema$Task | null = null;

    for (const taskList of taskLists) {
      if (taskList.id) {
        try {
          const taskResponse: GaxiosResponse<tasks_v1.Schema$Task> =
            await tasks.tasks.get({
              tasklist: taskList.id,
              task: taskId,
            });
          task = taskResponse.data;
          break;
        } catch (error) {
          console.error('Task lookup failed:', error instanceof Error ? error.message : String(error));
        }
      }
    }

    if (!task) {
      throw new Error("Task not found");
    }

    return task;
  }

  static async list(
    request: ListResourcesRequest,
    tasks: tasks_v1.Tasks,
  ): Promise<[tasks_v1.Schema$Task[], string | null]> {
    const pageSize = 10;
    const params: any = {
      maxResults: pageSize,
    };

    if (request.params?.cursor) {
      params.pageToken = request.params.cursor;
    }

    const taskListsResponse = await tasks.tasklists.list({
      maxResults: MAX_TASK_RESULTS,
    });

    const taskLists = taskListsResponse.data.items || [];

    let allTasks: tasks_v1.Schema$Task[] = [];
    let nextPageToken = null;

    for (const taskList of taskLists) {
      const tasksResponse = await tasks.tasks.list({
        tasklist: taskList.id,
        ...params,
      });

      const taskItems = tasksResponse.data.items || [];
      allTasks = allTasks.concat(taskItems);

      if (tasksResponse.data.nextPageToken) {
        nextPageToken = tasksResponse.data.nextPageToken;
      }
    }

    return [allTasks, nextPageToken];
  }
}

export class TaskActions {
  private static formatTask(task: tasks_v1.Schema$Task) {
    return `${task.title}\n (Due: ${task.due || "Not set"}) - Notes: ${task.notes} - ID: ${task.id} - Status: ${task.status} - URI: ${task.selfLink} - Hidden: ${task.hidden} - Parent: ${task.parent} - Deleted?: ${task.deleted} - Completed Date: ${task.completed} - Position: ${task.position} - Updated Date: ${task.updated} - ETag: ${task.etag} - Links: ${task.links} - Kind: ${task.kind}}`;
  }

  private static formatTaskList(taskList: tasks_v1.Schema$Task[]) {
    return taskList.map((task) => this.formatTask(task)).join("\n");
  }

  private static async _list(request: CallToolRequest, tasks: tasks_v1.Tasks) {
    const taskListsResponse = await tasks.tasklists.list({
      maxResults: MAX_TASK_RESULTS,
    });

    const onlyListId = request.params.arguments?.taskListId as string | undefined;
    const taskLists = (taskListsResponse.data.items || []).filter(
      (l) => !onlyListId || l.id === onlyListId
    );
    let allTasks: tasks_v1.Schema$Task[] = [];

    for (const taskList of taskLists) {
      if (taskList.id) {
        try {
          const tasksResponse = await tasks.tasks.list({
            tasklist: taskList.id,
            maxResults: MAX_TASK_RESULTS,
            showCompleted: true,
            showHidden: true,
          });

          const items = tasksResponse.data.items || [];
          allTasks = allTasks.concat(items);
        } catch (error) {
          console.error(`Error fetching tasks for list ${taskList.id}:`, error);
        }
      }
    }
    return allTasks;
  }

  static async create(request: CallToolRequest, tasks: tasks_v1.Tasks) {
    const taskListId =
      (request.params.arguments?.taskListId as string) || "@default";
    const taskTitle = request.params.arguments?.title as string;
    const taskNotes = request.params.arguments?.notes as string;
    const taskDue = request.params.arguments?.due as string;
    const parent = request.params.arguments?.parent as string | undefined;

    if (!taskTitle) {
      throw new Error("Task title is required");
    }

    const task: Record<string, string> = {
      title: taskTitle,
    };
    if (taskNotes) task.notes = taskNotes;
    if (taskDue) task.due = normalizeDueDate(taskDue)!;

    const taskResponse = await tasks.tasks.insert({
      tasklist: taskListId,
      requestBody: task,
      ...(parent ? { parent } : {}),
    });

    return {
      content: [
        {
          type: "text",
          text: `Task created: ${taskResponse.data.title} (ID: ${taskResponse.data.id})`,
        },
      ],
      isError: false,
    };
  }

  static async update(request: CallToolRequest, tasks: tasks_v1.Tasks) {
    const taskListId =
      (request.params.arguments?.taskListId as string) || "@default";
    const taskUri = request.params.arguments?.uri as string;
    const taskId = request.params.arguments?.id as string;
    const taskTitle = request.params.arguments?.title as string;
    const taskNotes = request.params.arguments?.notes as string;
    const taskStatus = request.params.arguments?.status as string;
    const taskDue = request.params.arguments?.due as string;

    if (!taskUri) {
      throw new Error("Task URI is required");
    }

    if (!taskId) {
      throw new Error("Task ID is required");
    }

    const task: Record<string, string> = {
      id: taskId,
    };
    if (taskTitle) task.title = taskTitle;
    if (taskNotes) task.notes = taskNotes;
    if (taskStatus) task.status = taskStatus;
    if (taskDue) task.due = normalizeDueDate(taskDue)!;

    const taskResponse = await tasks.tasks.patch({
      tasklist: taskListId,
      task: taskId,
      requestBody: task,
    });

    return {
      content: [
        {
          type: "text",
          text: `Task updated: ${taskResponse.data.title}`,
        },
      ],
      isError: false,
    };
  }

  static async list(request: CallToolRequest, tasks: tasks_v1.Tasks) {
    const allTasks = await this._list(request, tasks);
    const taskList = this.formatTaskList(allTasks);

    return {
      content: [
        {
          type: "text",
          text: `Found ${allTasks.length} tasks:\n${taskList}`,
        },
      ],
      isError: false,
    };
  }

  static async delete(request: CallToolRequest, tasks: tasks_v1.Tasks) {
    const taskListId =
      (request.params.arguments?.taskListId as string) || "@default";
    const taskId = request.params.arguments?.id as string;

    if (!taskId) {
      throw new Error("Task ID is required");
    }

    await tasks.tasks.delete({
      tasklist: taskListId,
      task: taskId,
    });

    return {
      content: [
        {
          type: "text",
          text: `Task ${taskId} deleted`,
        },
      ],
      isError: false,
    };
  }

  static async search(request: CallToolRequest, tasks: tasks_v1.Tasks) {
    const userQuery = request.params.arguments?.query as string;

    const allTasks = await this._list(request, tasks);
    const filteredItems = allTasks.filter(
      (task) =>
        task.title?.toLowerCase().includes(userQuery.toLowerCase()) ||
        task.notes?.toLowerCase().includes(userQuery.toLowerCase()),
    );

    const taskList = this.formatTaskList(filteredItems);

    return {
      content: [
        {
          type: "text",
          text: `Found ${filteredItems.length} tasks:\n${taskList}`,
        },
      ],
      isError: false,
    };
  }

  static async move(request: CallToolRequest, tasks: tasks_v1.Tasks) {
    const args = request.params.arguments || {};
    const taskListId = (args.taskListId as string) || "@default";
    const id = args.id as string;
    if (!id) throw new Error("Task id is required");
    const parent = args.parent as string | undefined;
    const previous = args.previous as string | undefined;
    const destination = args.destinationTaskListId as string | undefined;

    const response = await tasks.tasks.move({
      tasklist: taskListId,
      task: id,
      ...(parent ? { parent } : {}),
      ...(previous ? { previous } : {}),
      ...(destination && destination !== taskListId ? { destinationTasklist: destination } : {}),
    });

    return {
      content: [
        {
          type: "text",
          text: `Task moved: ${response.data.title} (ID: ${response.data.id}, parent: ${response.data.parent || "none"}, list: ${destination || taskListId})`,
        },
      ],
      isError: false,
    };
  }

  static async batchCreate(request: CallToolRequest, tasks: tasks_v1.Tasks) {
    const items = request.params.arguments?.items as Array<{
      taskListId?: string;
      title: string;
      notes?: string;
      due?: string;
      parent?: string;
    }>;

    if (!items || !Array.isArray(items) || items.length === 0) {
      throw new Error("items array is required and must not be empty");
    }

    // Sequential, not parallel: Google Tasks positions a subtask relative to the
    // moment it is inserted, so parallel inserts under one parent land in random order.
    const results: Array<{ index: number; success: boolean; id?: string | null; title?: string | null; error?: string }> = [];
    const lastChild: Record<string, string> = {};
    for (const [index, item] of items.entries()) {
      try {
        const taskListId = item.taskListId || "@default";
        const requestBody: Record<string, string> = { title: item.title };
        if (item.notes) requestBody.notes = item.notes;
        if (item.due) requestBody.due = normalizeDueDate(item.due)!;

        const response = await tasks.tasks.insert({
          tasklist: taskListId,
          requestBody,
          ...(item.parent ? { parent: item.parent, previous: lastChild[item.parent] } : {}),
        });
        if (item.parent && response.data.id) lastChild[item.parent] = response.data.id;
        results.push({ index, success: true, id: response.data.id, title: response.data.title });
      } catch (error) {
        results.push({ index, success: false, title: item.title, error: error instanceof Error ? error.message : String(error) });
      }
    }

    const successCount = results.filter((r) => r.success).length;
    return {
      content: [
        {
          type: "text",
          text: JSON.stringify({ total: items.length, success: successCount, results }, null, 2),
        },
      ],
      isError: false,
    };
  }

  static async batchUpdate(request: CallToolRequest, tasks: tasks_v1.Tasks) {
    const items = request.params.arguments?.items as Array<{
      taskListId?: string;
      id: string;
      title?: string;
      notes?: string;
      status?: string;
      due?: string;
    }>;

    if (!items || !Array.isArray(items) || items.length === 0) {
      throw new Error("items array is required and must not be empty");
    }

    const results = await Promise.all(
      items.map(async (item, index) => {
        try {
          const taskListId = item.taskListId || "@default";
          const requestBody: Record<string, string> = { id: item.id };
          if (item.title) requestBody.title = item.title;
          if (item.notes) requestBody.notes = item.notes;
          if (item.status) requestBody.status = item.status;
          if (item.due) requestBody.due = normalizeDueDate(item.due)!;

          const response = await tasks.tasks.patch({
            tasklist: taskListId,
            task: item.id,
            requestBody,
          });
          return { index, success: true, id: response.data.id, title: response.data.title };
        } catch (error) {
          return { index, success: false, id: item.id, error: error instanceof Error ? error.message : String(error) };
        }
      })
    );

    const successCount = results.filter((r) => r.success).length;
    return {
      content: [
        {
          type: "text",
          text: JSON.stringify({ total: items.length, success: successCount, results }, null, 2),
        },
      ],
      isError: false,
    };
  }

  static async clear(request: CallToolRequest, tasks: tasks_v1.Tasks) {
    const taskListId =
      (request.params.arguments?.taskListId as string) || "@default";

    await tasks.tasks.clear({
      tasklist: taskListId,
    });

    return {
      content: [
        {
          type: "text",
          text: `Tasks from tasklist ${taskListId} cleared`,
        },
      ],
      isError: false,
    };
  }
}
