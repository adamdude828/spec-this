import Link from 'next/link';
import StoryCard from '@/app/components/StoryCard';

interface Epic {
  id: string;
  title: string;
  description: string | null;
  status: string;
  priority: string;
  createdAt: string;
  updatedAt: string;
  createdBy: string | null;
}

interface Story {
  id: string;
  epicId: string;
  title: string;
  description: string | null;
  acceptanceCriteria: string | null;
  status: string;
  priority: string;
  storyPoints: number | null;
  orderIndex: number;
  createdAt: string;
  updatedAt: string;
}

const statusColors: Record<string, string> = {
  draft: 'bg-gray-100 text-gray-800',
  active: 'bg-blue-100 text-blue-800',
  completed: 'bg-green-100 text-green-800',
  archived: 'bg-yellow-100 text-yellow-800',
};

const priorityColors: Record<string, string> = {
  low: 'bg-gray-100 text-gray-600',
  medium: 'bg-orange-100 text-orange-700',
  high: 'bg-red-100 text-red-700',
  critical: 'bg-purple-100 text-purple-800',
};

async function getEpic(id: string): Promise<Epic> {
  const res = await fetch(
    `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/epics/${id}`,
    { cache: 'no-store' }
  );

  if (!res.ok) {
    throw new Error('Failed to fetch epic');
  }

  return res.json();
}

async function getStories(epicId: string): Promise<Story[]> {
  const res = await fetch(
    `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/stories?epicId=${epicId}`,
    { cache: 'no-store' }
  );

  if (!res.ok) {
    throw new Error('Failed to fetch stories');
  }

  return res.json();
}

export default async function EpicDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [epic, stories] = await Promise.all([getEpic(id), getStories(id)]);

  const formattedCreated = new Date(epic.createdAt).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  const formattedUpdated = new Date(epic.updatedAt).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <div>
      {/* Back navigation */}
      <Link
        href="/"
        className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900 mb-6"
      >
        <svg
          className="w-4 h-4 mr-1"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M15 19l-7-7 7-7"
          />
        </svg>
        Back to Epics
      </Link>

      {/* Epic details */}
      <div className="bg-white rounded-lg shadow p-6 mb-6 border border-gray-200">
        <div className="flex items-start justify-between mb-4">
          <h1 className="text-3xl font-bold text-gray-900 flex-1">{epic.title}</h1>
          <div className="flex gap-2 ml-4">
            <span
              className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                statusColors[epic.status] || statusColors.draft
              }`}
            >
              {epic.status}
            </span>
            <span
              className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                priorityColors[epic.priority] || priorityColors.low
              }`}
            >
              {epic.priority}
            </span>
          </div>
        </div>

        {epic.description && (
          <p className="text-gray-700 mb-4 whitespace-pre-wrap">{epic.description}</p>
        )}

        <div className="grid grid-cols-2 gap-4 text-sm text-gray-600">
          <div>
            <span className="font-medium">Created:</span> {formattedCreated}
          </div>
          <div>
            <span className="font-medium">Updated:</span> {formattedUpdated}
          </div>
          {epic.createdBy && (
            <div>
              <span className="font-medium">Created By:</span> {epic.createdBy}
            </div>
          )}
        </div>
      </div>

      {/* Stories list */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Stories</h2>

        {stories.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg border-2 border-dashed border-gray-300">
            <svg
              className="mx-auto h-12 w-12 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900">No stories</h3>
            <p className="mt-1 text-sm text-gray-500">
              This epic doesn't have any stories yet
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {stories
              .sort((a, b) => a.orderIndex - b.orderIndex)
              .map((story) => (
                <StoryCard
                  key={story.id}
                  id={story.id}
                  title={story.title}
                  description={story.description}
                  status={story.status}
                  priority={story.priority}
                  storyPoints={story.storyPoints}
                />
              ))}
          </div>
        )}
      </div>
    </div>
  );
}
