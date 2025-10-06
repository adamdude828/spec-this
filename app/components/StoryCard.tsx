import Link from 'next/link';

interface StoryCardProps {
  id: string;
  title: string;
  description: string | null;
  status: string;
  priority: string;
  storyPoints: number | null;
}

const statusColors: Record<string, string> = {
  draft: 'bg-gray-100 text-gray-800',
  ready: 'bg-blue-100 text-blue-800',
  in_progress: 'bg-purple-100 text-purple-800',
  review: 'bg-yellow-100 text-yellow-800',
  completed: 'bg-green-100 text-green-800',
};

const priorityColors: Record<string, string> = {
  low: 'bg-gray-100 text-gray-600',
  medium: 'bg-orange-100 text-orange-700',
  high: 'bg-red-100 text-red-700',
  critical: 'bg-purple-100 text-purple-800',
};

export default function StoryCard({
  id,
  title,
  description,
  status,
  priority,
  storyPoints,
}: StoryCardProps) {
  return (
    <Link
      href={`/stories/${id}`}
      className="block bg-white rounded-lg shadow hover:shadow-md transition-shadow p-5 border border-gray-200"
    >
      <div className="flex items-start justify-between mb-2">
        <h4 className="text-base font-semibold text-gray-900 flex-1">{title}</h4>
        <div className="flex gap-2 ml-3">
          <span
            className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
              statusColors[status] || statusColors.draft
            }`}
          >
            {status.replace('_', ' ')}
          </span>
          <span
            className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
              priorityColors[priority] || priorityColors.low
            }`}
          >
            {priority}
          </span>
        </div>
      </div>
      {description && (
        <p className="text-gray-600 text-sm mb-2 line-clamp-2">{description}</p>
      )}
      {storyPoints !== null && (
        <div className="text-xs text-gray-500">
          Story Points: {storyPoints}
        </div>
      )}
    </Link>
  );
}
