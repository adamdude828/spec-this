interface TaskCardProps {
  title: string;
  description: string | null;
  status: string;
  estimatedHours: string | null;
  actualHours: string | null;
}

const statusColors: Record<string, string> = {
  todo: 'bg-gray-100 text-gray-800',
  in_progress: 'bg-blue-100 text-blue-800',
  blocked: 'bg-red-100 text-red-800',
  completed: 'bg-green-100 text-green-800',
};

export default function TaskCard({
  title,
  description,
  status,
  estimatedHours,
  actualHours,
}: TaskCardProps) {
  return (
    <div className="bg-white rounded-lg shadow p-4 border border-gray-200">
      <div className="flex items-start justify-between mb-2">
        <h5 className="text-sm font-semibold text-gray-900 flex-1">{title}</h5>
        <span
          className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
            statusColors[status] || statusColors.todo
          }`}
        >
          {status.replace('_', ' ')}
        </span>
      </div>
      {description && (
        <p className="text-gray-600 text-xs mb-2">{description}</p>
      )}
      <div className="flex gap-4 text-xs text-gray-500">
        {estimatedHours && (
          <div>
            <span className="font-medium">Est:</span> {estimatedHours}h
          </div>
        )}
        {actualHours && (
          <div>
            <span className="font-medium">Actual:</span> {actualHours}h
          </div>
        )}
      </div>
    </div>
  );
}
