'use client';

interface PlannedFileChangeCardProps {
  id: string;
  filePath: string;
  changeType: 'create' | 'modify' | 'delete';
  description: string | null;
  expectedChanges: string | null;
  status: 'planned' | 'in_progress' | 'completed' | 'failed';
}

const changeTypeColors: Record<string, string> = {
  create: 'bg-green-100 text-green-800 border-green-200',
  modify: 'bg-blue-100 text-blue-800 border-blue-200',
  delete: 'bg-red-100 text-red-800 border-red-200',
};

const changeTypeIcons: Record<string, string> = {
  create: '+',
  modify: '~',
  delete: '-',
};

const statusColors: Record<string, string> = {
  planned: 'bg-gray-100 text-gray-700',
  in_progress: 'bg-purple-100 text-purple-700',
  completed: 'bg-green-100 text-green-700',
  failed: 'bg-red-100 text-red-700',
};

export default function PlannedFileChangeCard({
  filePath,
  changeType,
  description,
  expectedChanges,
  status,
}: PlannedFileChangeCardProps) {
  return (
    <div className="bg-white rounded-lg border-2 border-gray-200 p-4 hover:border-gray-300 transition-colors">
      <div className="flex items-start justify-between gap-4 mb-3">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <span
            className={`inline-flex items-center justify-center w-8 h-8 rounded font-mono text-lg font-bold border-2 ${
              changeTypeColors[changeType] || changeTypeColors.modify
            }`}
          >
            {changeTypeIcons[changeType]}
          </span>
          <div className="flex-1 min-w-0">
            <code className="text-sm font-mono text-gray-900 break-all">
              {filePath}
            </code>
            <div className="flex gap-2 mt-1">
              <span
                className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                  changeTypeColors[changeType] || changeTypeColors.modify
                }`}
              >
                {changeType}
              </span>
              <span
                className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                  statusColors[status] || statusColors.planned
                }`}
              >
                {status.replace('_', ' ')}
              </span>
            </div>
          </div>
        </div>
      </div>

      {description && (
        <div className="mb-3">
          <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
            Description
          </h4>
          <p className="text-sm text-gray-700 whitespace-pre-wrap">{description}</p>
        </div>
      )}

      {expectedChanges && (
        <div>
          <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
            Expected Changes
          </h4>
          <pre className="text-xs bg-gray-50 p-3 rounded border border-gray-200 overflow-x-auto">
            <code className="text-gray-800">{expectedChanges}</code>
          </pre>
        </div>
      )}
    </div>
  );
}
