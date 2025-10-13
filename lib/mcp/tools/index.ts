import type { ToolDefinition } from "../types/tool.ts";
import { readReposTool } from "./read-repos.ts";
import { readEpicsTool } from "./read-epics.ts";
import { upsertEpicTool } from "./upsert-epic.ts";
import { readStoriesTool } from "./read-stories.ts";
import { upsertStoryTool } from "./upsert-story.ts";
import { readPlannedFileChangesTool } from "./read-planned-file-changes.ts";
import { upsertPlannedFileChangeTool } from "./upsert-planned-file-change.ts";
import { echoTool } from "./echo.ts";

export const allTools: ToolDefinition[] = [
  echoTool,
  readReposTool,
  readEpicsTool,
  upsertEpicTool,
  readStoriesTool,
  upsertStoryTool,
  readPlannedFileChangesTool,
  upsertPlannedFileChangeTool,
];

export * from "./echo.ts";
export * from "./read-repos.ts";
export * from "./read-epics.ts";
export * from "./upsert-epic.ts";
export * from "./read-stories.ts";
export * from "./upsert-story.ts";
export * from "./read-planned-file-changes.ts";
export * from "./upsert-planned-file-change.ts";
