import { memo } from 'react';
import { Handle, Position, type NodeProps } from '@xyflow/react';

export interface FileNodeData {
  label: string;
  language: string;
  extension: string;
  filePath: string;
  sourceUrl?: string | null;
}

function FileNode({ data, selected }: NodeProps) {
  const nodeData = data as unknown as FileNodeData;

  const handleClick = (e: React.MouseEvent) => {
    if (nodeData.sourceUrl) {
      e.stopPropagation();
      window.open(nodeData.sourceUrl, '_blank', 'noopener,noreferrer');
    }
  };

  return (
    <div
      className={`px-4 py-3 rounded-lg border-2 bg-white shadow-md transition-all ${
        selected
          ? 'border-blue-500 shadow-lg ring-2 ring-blue-200'
          : 'border-gray-300 hover:border-gray-400'
      } ${nodeData.sourceUrl ? 'cursor-pointer hover:shadow-lg' : ''}`}
      onClick={handleClick}
      title={nodeData.sourceUrl ? `Click to view ${nodeData.label} in source` : nodeData.label}
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
            {nodeData.sourceUrl && (
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

      <Handle type="source" position={Position.Bottom} className="w-3 h-3" />
    </div>
  );
}

export default memo(FileNode);
