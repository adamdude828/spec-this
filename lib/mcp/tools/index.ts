import type { ToolDefinition } from "../types/tool.ts";
import { readReposTool } from "./read-repos.ts";
import { readEpicsTool } from "./read-epics.ts";
import { upsertEpicTool } from "./upsert-epic.ts";
import { readStoriesTool } from "./read-stories.ts";
import { upsertStoryTool } from "./upsert-story.ts";
import { readTasksTool } from "./read-tasks.ts";
import { upsertTaskTool } from "./upsert-task.ts";

export const allTools: ToolDefinition[] = [
  readReposTool,
  readEpicsTool,
  upsertEpicTool,
  readStoriesTool,
  upsertStoryTool,
  readTasksTool,
  upsertTaskTool,
];

export * from "./read-repos.ts";
export * from "./read-epics.ts";
export * from "./upsert-epic.ts";
export * from "./read-stories.ts";
export * from "./upsert-story.ts";
export * from "./read-tasks.ts";
export * from "./upsert-task.ts";
