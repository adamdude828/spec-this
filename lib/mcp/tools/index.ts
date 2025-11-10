import type { ToolDefinition } from "../types/tool.ts";
import { readReposTool } from "./read-repos.ts";
import { readEpicsTool } from "./read-epics.ts";
import { upsertEpicTool } from "./upsert-epic.ts";
import { readStoriesTool } from "./read-stories.ts";
import { upsertStoryTool } from "./upsert-story.ts";
import { deleteStoryTool } from "./delete-story.ts";
import { readPlannedFileChangesTool } from "./read-planned-file-changes.ts";
import { upsertPlannedFileChangeTool } from "./upsert-planned-file-change.ts";
import { deletePlannedFileChangeTool } from "./delete-planned-file-change.ts";
import { readUrlsTool } from "./read-urls.ts";
import { upsertUrlTool } from "./upsert-url.ts";
import { searchUrlsTool } from "./search-urls.ts";
import { deleteUrlTool } from "./delete-url.ts";
import { echoTool } from "./echo.ts";

export const allTools: ToolDefinition[] = [
  echoTool,
  readReposTool,
  readEpicsTool,
  upsertEpicTool,
  readStoriesTool,
  upsertStoryTool,
  deleteStoryTool,
  readPlannedFileChangesTool,
  upsertPlannedFileChangeTool,
  deletePlannedFileChangeTool,
  readUrlsTool,
  upsertUrlTool,
  searchUrlsTool,
  deleteUrlTool,
];

export * from "./echo.ts";
export * from "./read-repos.ts";
export * from "./read-epics.ts";
export * from "./upsert-epic.ts";
export * from "./read-stories.ts";
export * from "./upsert-story.ts";
export * from "./delete-story.ts";
export * from "./read-planned-file-changes.ts";
export * from "./upsert-planned-file-change.ts";
export * from "./delete-planned-file-change.ts";
export * from "./read-urls.ts";
export * from "./upsert-url.ts";
export * from "./search-urls.ts";
export * from "./delete-url.ts";
