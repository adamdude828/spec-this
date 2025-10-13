import { FileNodeData } from '@/app/components/graph/FileNode';

// Change type enum
export type ChangeType = 'create' | 'modify' | 'delete';

// Change status enum
export type ChangeStatus = 'planned' | 'in_progress' | 'completed' | 'failed';

// Planned change information
export interface PlannedChangeInfo {
  id: string;
  storyId: string;
  storyTitle?: string;
  changeType: ChangeType;
  status: ChangeStatus;
  description: string | null;
  expectedChanges: string | null;
  beforeSnapshot: string | null;
  afterSnapshot: string | null;
}

// Extended node data that includes planned changes
export interface PlannedChangeNodeData extends FileNodeData {
  plannedChanges?: PlannedChangeInfo[];
}
