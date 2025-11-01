import type { ToolDefinition } from "../types/tool.ts";
import { readReposTool } from "./read-repos.ts";
import { readEpicsTool } from "./read-epics.ts";
import { upsertEpicTool } from "./upsert-epic.ts";
import { readStoriesTool } from "./read-stories.ts";
import { upsertStoryTool } from "./upsert-story.ts";
import { deleteStoryTool } from "./delete-story.ts";
import { readQuickTasksTool } from "./read-quick-tasks.ts";
import { upsertQuickTaskTool } from "./upsert-quick-task.ts";
import { deleteQuickTaskTool } from "./delete-quick-task.ts";
import { readPlannedFileChangesTool } from "./read-planned-file-changes.ts";
import { upsertPlannedFileChangeTool } from "./upsert-planned-file-change.ts";
import { deletePlannedFileChangeTool } from "./delete-planned-file-change.ts";
import { echoTool } from "./echo.ts";

export const allTools: ToolDefinition[] = [
  echoTool,
  readReposTool,
  readEpicsTool,
  upsertEpicTool,
  readStoriesTool,
  upsertStoryTool,
  deleteStoryTool,
  readQuickTasksTool,
  upsertQuickTaskTool,
  deleteQuickTaskTool,
  readPlannedFileChangesTool,
  upsertPlannedFileChangeTool,
  deletePlannedFileChangeTool,
];

export * from "./echo.ts";
export * from "./read-repos.ts";
export * from "./read-epics.ts";
export * from "./upsert-epic.ts";
export * from "./read-stories.ts";
export * from "./upsert-story.ts";
export * from "./delete-story.ts";
export * from "./read-quick-tasks.ts";
export * from "./upsert-quick-task.ts";
export * from "./delete-quick-task.ts";
export * from "./read-planned-file-changes.ts";
export * from "./upsert-planned-file-change.ts";
export * from "./delete-planned-file-change.ts";
