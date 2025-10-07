'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import StoryCard from '@/app/components/StoryCard';
import EditEpicModal from '@/app/components/EditEpicModal';

interface Epic {
  id: string;
  repoId: string;
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

export default function EpicDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const [id, setId] = useState<string>('');
  const [epic, setEpic] = useState<Epic | null>(null);
  const [stories, setStories] = useState<Story[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    params.then((p) => setId(p.id));
  }, [params]);

  const fetchData = async () => {
    if (!id) return;

    try {
      const [epicRes, storiesRes] = await Promise.all([
        fetch(`/api/epics/${id}`, { cache: 'no-store' }),
        fetch(`/api/stories?epicId=${id}`, { cache: 'no-store' }),
      ]);

      if (!epicRes.ok || !storiesRes.ok) {
        throw new Error('Failed to fetch data');
      }

      const epicData = await epicRes.json();
      const storiesData = await storiesRes.json();

      setEpic(epicData);
      setStories(storiesData);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [id]);

  const handleStoryUpdate = () => {
    fetchData();
  };

  const [isEditEpicModalOpen, setIsEditEpicModalOpen] = useState(false);

  const handleEpicUpdate = () => {
    fetchData();
  };

  if (isLoading || !epic) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-gray-500">Loading...</div>
      </div>
    );
  }

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
        href={`/repos/${epic.repoId}`}
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
        Back to Repository
      </Link>

      {/* Epic details */}
      <div className="bg-white rounded-lg shadow p-6 mb-6 border border-gray-200">
        <div className="flex items-start justify-between mb-4">
          <h1 className="text-3xl font-bold text-gray-900 flex-1">{epic.title}</h1>
          <div className="flex gap-2 ml-4 items-center">
            <button
              onClick={() => setIsEditEpicModalOpen(true)}
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded"
              title="Edit epic"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
            </button>
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
                  acceptanceCriteria={story.acceptanceCriteria}
                  status={story.status}
                  priority={story.priority}
                  onUpdate={handleStoryUpdate}
                />
              ))}
          </div>
        )}
      </div>

      <EditEpicModal
        epic={{ id: epic.id, title: epic.title, description: epic.description, status: epic.status, priority: epic.priority }}
        isOpen={isEditEpicModalOpen}
        onClose={() => setIsEditEpicModalOpen(false)}
        onSave={handleEpicUpdate}
      />
    </div>
  );
}
