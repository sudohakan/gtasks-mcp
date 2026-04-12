import { describe, expect, it } from "bun:test";
import { tasks_v1 } from "googleapis";
import { TaskActions } from "../src/Tasks";

describe("TaskActions", () => {
  it("search reports the filtered task count", async () => {
    const tasks = {
      tasklists: {
        list: async () => ({
          data: {
            items: [{ id: "list-1" }],
          },
        }),
      },
      tasks: {
        list: async () => ({
          data: {
            items: [
              { title: "Alpha task", notes: "match me" },
              { title: "Beta task", notes: "no match" },
            ],
          },
        }),
      },
    } as unknown as tasks_v1.Tasks;

    const result = await TaskActions.search(
      {
        params: {
          arguments: {
            query: "alpha",
          },
        },
      } as any,
      tasks,
    );

    expect(result.content[0]?.type).toBe("text");
    expect((result.content[0] as { text: string }).text).toContain("Found 1 tasks:");
    expect((result.content[0] as { text: string }).text).toContain("Alpha task");
  });

  it("delete validates task id with the correct error message", async () => {
    const tasks = {
      tasks: {
        delete: async () => undefined,
      },
    } as unknown as tasks_v1.Tasks;

    await expect(
      TaskActions.delete(
        {
          params: {
            arguments: {
              taskListId: "@default",
            },
          },
        } as any,
        tasks,
      ),
    ).rejects.toThrow("Task ID is required");
  });
});
