'use client';

import { useEffect, useState } from 'react';
import Breadcrumb from '@/app/components/Breadcrumb';
import TaskCard from '@/app/components/TaskCard';
import EditStoryModal from '@/app/components/EditStoryModal';

interface Story {
  id: string;
  epicId: string;
  title: string;
  description: string | null;
  acceptanceCriteria: string | null;
  status: string;
  priority: string;
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

export default function StoryDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const [id, setId] = useState<string>('');
  const [story, setStory] = useState<Story | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [epic, setEpic] = useState<Epic | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    params.then((p) => setId(p.id));
  }, [params]);

  const fetchData = async () => {
    if (!id) return;

    try {
      const storyRes = await fetch(`/api/stories/${id}`, { cache: 'no-store' });
      if (!storyRes.ok) throw new Error('Failed to fetch story');
      const storyData = await storyRes.json();

      const [tasksRes, epicRes] = await Promise.all([
        fetch(`/api/tasks?storyId=${id}`, { cache: 'no-store' }),
        fetch(`/api/epics/${storyData.epicId}`, { cache: 'no-store' }),
      ]);

      if (!tasksRes.ok || !epicRes.ok) {
        throw new Error('Failed to fetch data');
      }

      const tasksData = await tasksRes.json();
      const epicData = await epicRes.json();

      setStory(storyData);
      setTasks(tasksData);
      setEpic(epicData);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [id]);

  const handleTaskUpdate = () => {
    fetchData();
  };

  const [isEditStoryModalOpen, setIsEditStoryModalOpen] = useState(false);

  const handleStoryUpdate = () => {
    fetchData();
  };

  if (isLoading || !story || !epic) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-gray-500">Loading...</div>
      </div>
    );
  }

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
          <div className="flex gap-2 ml-4 items-center">
            <button
              onClick={() => setIsEditStoryModalOpen(true)}
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded"
              title="Edit story"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
            </button>
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
              This story doesn&apos;t have any tasks yet
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {tasks
              .sort((a, b) => a.orderIndex - b.orderIndex)
              .map((task) => (
                <TaskCard
                  key={task.id}
                  id={task.id}
                  title={task.title}
                  description={task.description}
                  status={task.status}
                  onUpdate={handleTaskUpdate}
                />
              ))}
          </div>
        )}
      </div>

      <EditStoryModal
        story={{ id: story.id, title: story.title, description: story.description, acceptanceCriteria: story.acceptanceCriteria, status: story.status, priority: story.priority }}
        isOpen={isEditStoryModalOpen}
        onClose={() => setIsEditStoryModalOpen(false)}
        onSave={handleStoryUpdate}
      />
    </div>
  );
}
