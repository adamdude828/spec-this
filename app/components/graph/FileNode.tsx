import { memo } from 'react';
import { Handle, Position, type NodeProps } from '@xyflow/react';
import type { PlannedChangeNodeData, ChangeType } from '@/lib/types/planned-change-node';

export interface FileNodeData {
  label: string;
  language: string;
  extension: string;
  filePath: string;
  sourceUrl?: string | null;
}

// Helper to get most severe change type
function getMostSevereChangeType(changeTypes: ChangeType[]): ChangeType | null {
  if (changeTypes.includes('delete')) return 'delete';
  if (changeTypes.includes('create')) return 'create';
  if (changeTypes.includes('modify')) return 'modify';
  return null;
}

// Helper to get border color based on change type
function getBorderColorClass(changeType: ChangeType): string {
  switch (changeType) {
    case 'create':
      return 'border-green-500';
    case 'modify':
      return 'border-blue-500';
    case 'delete':
      return 'border-red-500';
  }
}

// Helper to get status badge color
function getStatusBadgeColor(status: string): string {
  switch (status) {
    case 'planned':
      return 'bg-gray-100 text-gray-700';
    case 'in_progress':
      return 'bg-yellow-100 text-yellow-700';
    case 'completed':
      return 'bg-green-100 text-green-700';
    case 'failed':
      return 'bg-red-100 text-red-700';
    default:
      return 'bg-gray-100 text-gray-700';
  }
}

function FileNode({ data, selected }: NodeProps) {
  const nodeData = data as unknown as PlannedChangeNodeData;
  const plannedChanges = nodeData.plannedChanges || [];
  const hasPlannedChanges = plannedChanges.length > 0;

  // Determine border color based on change types
  let borderColorClass = selected ? 'border-blue-500' : 'border-gray-300';
  if (hasPlannedChanges) {
    const changeTypes = plannedChanges.map((c) => c.changeType);
    const severeType = getMostSevereChangeType(changeTypes);
    if (severeType) {
      borderColorClass = getBorderColorClass(severeType);
    }
  }

  // Get status summary for tooltip
  const getStatusSummary = () => {
    if (!hasPlannedChanges) return null;
    const statusCounts = plannedChanges.reduce((acc, change) => {
      acc[change.status] = (acc[change.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    return Object.entries(statusCounts)
      .map(([status, count]) => `${count} ${status}`)
      .join(', ');
  };

  const handleClick = (e: React.MouseEvent) => {
    if (nodeData.sourceUrl && !hasPlannedChanges) {
      e.stopPropagation();
      window.open(nodeData.sourceUrl, '_blank', 'noopener,noreferrer');
    }
    // If has planned changes, let the parent handle the click to show details
  };

  const tooltipText = hasPlannedChanges
    ? `${nodeData.label}\n${plannedChanges.length} planned change${plannedChanges.length > 1 ? 's' : ''}: ${getStatusSummary()}`
    : nodeData.sourceUrl
    ? `Click to view ${nodeData.label} in source`
    : nodeData.label;

  return (
    <div
      className={`px-4 py-3 rounded-lg border-2 bg-white shadow-md transition-all relative ${borderColorClass} ${
        selected ? 'shadow-lg ring-2 ring-blue-200' : 'hover:border-opacity-70'
      } ${nodeData.sourceUrl && !hasPlannedChanges ? 'cursor-pointer hover:shadow-lg' : ''} ${
        hasPlannedChanges ? 'cursor-pointer hover:shadow-lg' : ''
      }`}
      onClick={handleClick}
      title={tooltipText}
    >
      <Handle type="target" position={Position.Top} className="w-3 h-3" />

      <div className="flex items-start gap-2 min-w-[150px] max-w-[250px]">
        {/* Language badge */}
        <div className="flex-shrink-0">
          <span className="inline-block px-2 py-1 text-xs font-medium rounded bg-gray-100 text-gray-700">
            {nodeData.language || nodeData.extension}
          </span>
        </div>

        {/* File name */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1">
            <div className="text-sm font-semibold text-gray-900 truncate" title={nodeData.label}>
              {nodeData.label.split('/').pop()}
            </div>
            {nodeData.sourceUrl && !hasPlannedChanges && (
              <svg className="w-3 h-3 text-blue-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
            )}
          </div>
          <div className="text-xs text-gray-500 truncate" title={nodeData.label}>
            {nodeData.label.split('/').slice(0, -1).join('/')}
          </div>
        </div>
      </div>

      {/* Planned changes badges */}
      {hasPlannedChanges && (
        <div className="absolute top-1 right-1 flex gap-1">
          {/* Count badge */}
          {plannedChanges.length > 1 && (
            <span className="inline-flex items-center justify-center w-5 h-5 text-xs font-bold text-white bg-blue-600 rounded-full">
              {plannedChanges.length}
            </span>
          )}
          {/* Status badge */}
          <span className={`inline-block px-2 py-0.5 text-xs font-medium rounded ${getStatusBadgeColor(plannedChanges[0].status)}`}>
            {plannedChanges[0].status}
          </span>
        </div>
      )}

      <Handle type="source" position={Position.Bottom} className="w-3 h-3" />
    </div>
  );
}

export default memo(FileNode);
