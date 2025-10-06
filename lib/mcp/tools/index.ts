import type { ToolDefinition } from "../types/tool";
import { readEpicsTool } from "./read-epics";
import { upsertEpicTool } from "./upsert-epic";
import { readStoriesTool } from "./read-stories";
import { upsertStoryTool } from "./upsert-story";
import { readTasksTool } from "./read-tasks";
import { upsertTaskTool } from "./upsert-task";

export const allTools: ToolDefinition[] = [
  readEpicsTool,
  upsertEpicTool,
  readStoriesTool,
  upsertStoryTool,
  readTasksTool,
  upsertTaskTool,
];

export * from "./read-epics";
export * from "./upsert-epic";
export * from "./read-stories";
export * from "./upsert-story";
export * from "./read-tasks";
export * from "./upsert-task";
