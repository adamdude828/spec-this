import Breadcrumb from '@/app/components/Breadcrumb';
import TaskCard from '@/app/components/TaskCard';

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

interface Task {
  id: string;
  storyId: string;
  title: string;
  description: string | null;
  status: string;
  estimatedHours: string | null;
  actualHours: string | null;
  orderIndex: number;
  createdAt: string;
  updatedAt: string;
  completedAt: string | null;
}

interface Epic {
  id: string;
  title: string;
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

async function getStory(id: string): Promise<Story> {
  const res = await fetch(
    `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/stories/${id}`,
    { cache: 'no-store' }
  );

  if (!res.ok) {
    throw new Error('Failed to fetch story');
  }

  return res.json();
}

async function getTasks(storyId: string): Promise<Task[]> {
  const res = await fetch(
    `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/tasks?storyId=${storyId}`,
    { cache: 'no-store' }
  );

  if (!res.ok) {
    throw new Error('Failed to fetch tasks');
  }

  return res.json();
}

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

export default async function StoryDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const story = await getStory(id);
  const [tasks, epic] = await Promise.all([
    getTasks(id),
    getEpic(story.epicId),
  ]);

  return (
    <div>
      {/* Breadcrumb navigation */}
      <Breadcrumb
        items={[
          { label: 'Epics', href: '/' },
          { label: epic.title, href: `/epics/${epic.id}` },
          { label: story.title },
        ]}
      />

      {/* Story details */}
      <div className="bg-white rounded-lg shadow p-6 mb-6 border border-gray-200">
        <div className="flex items-start justify-between mb-4">
          <h1 className="text-3xl font-bold text-gray-900 flex-1">{story.title}</h1>
          <div className="flex gap-2 ml-4">
            <span
              className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                statusColors[story.status] || statusColors.draft
              }`}
            >
              {story.status.replace('_', ' ')}
            </span>
            <span
              className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                priorityColors[story.priority] || priorityColors.low
              }`}
            >
              {story.priority}
            </span>
          </div>
        </div>

        {story.description && (
          <div className="mb-4">
            <h2 className="text-sm font-semibold text-gray-700 mb-1">Description</h2>
            <p className="text-gray-700 whitespace-pre-wrap">{story.description}</p>
          </div>
        )}

        {story.acceptanceCriteria && (
          <div className="mb-4">
            <h2 className="text-sm font-semibold text-gray-700 mb-1">
              Acceptance Criteria
            </h2>
            <p className="text-gray-700 whitespace-pre-wrap">
              {story.acceptanceCriteria}
            </p>
          </div>
        )}

        <div className="flex gap-4 text-sm text-gray-600">
          {story.storyPoints !== null && (
            <div>
              <span className="font-medium">Story Points:</span> {story.storyPoints}
            </div>
          )}
        </div>
      </div>

      {/* Tasks list */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Tasks</h2>

        {tasks.length === 0 ? (
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
                d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
              />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900">No tasks</h3>
            <p className="mt-1 text-sm text-gray-500">
              This story doesn't have any tasks yet
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {tasks
              .sort((a, b) => a.orderIndex - b.orderIndex)
              .map((task) => (
                <TaskCard
                  key={task.id}
                  title={task.title}
                  description={task.description}
                  status={task.status}
                  estimatedHours={task.estimatedHours}
                  actualHours={task.actualHours}
                />
              ))}
          </div>
        )}
      </div>
    </div>
  );
}
