'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import EpicCard from '@/app/components/EpicCard';
import CreateEpicModal from '@/app/components/CreateEpicModal';

interface Repository {
  id: string;
  name: string;
  localPath: string;
  repoUrl: string | null;
  createdAt: string;
  updatedAt: string;
}

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

export default function RepoDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const [id, setId] = useState<string>('');
  const [repo, setRepo] = useState<Repository | null>(null);
  const [epics, setEpics] = useState<Epic[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreateEpicModalOpen, setIsCreateEpicModalOpen] = useState(false);

  useEffect(() => {
    params.then((p) => setId(p.id));
  }, [params]);

  const fetchData = async () => {
    if (!id) return;

    try {
      const [repoRes, epicsRes] = await Promise.all([
        fetch(`/api/repos/${id}`, { cache: 'no-store' }),
        fetch('/api/epics', { cache: 'no-store' }),
      ]);

      if (!repoRes.ok || !epicsRes.ok) {
        throw new Error('Failed to fetch data');
      }

      const repoData = await repoRes.json();
      const allEpics = await epicsRes.json();

      setRepo(repoData);
      setEpics(allEpics.filter((epic: Epic) => epic.repoId === id));
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [id]);

  const handleEpicUpdate = () => {
    fetchData();
  };

  if (isLoading || !repo) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-gray-500">Loading...</div>
      </div>
    );
  }

  const formattedCreated = new Date(repo.createdAt).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  const formattedUpdated = new Date(repo.updatedAt).toLocaleDateString('en-US', {
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
        Back to Repositories
      </Link>

      {/* Repository details */}
      <div className="bg-white rounded-lg shadow p-6 mb-6 border border-gray-200">
        <div className="flex items-start justify-between mb-4">
          <h1 className="text-3xl font-bold text-gray-900 flex-1">{repo.name}</h1>
        </div>

        <div className="space-y-2 text-sm text-gray-600">
          <div className="flex items-center">
            <svg
              className="w-4 h-4 mr-2 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"
              />
            </svg>
            <span className="font-medium mr-2">Local Path:</span> {repo.localPath}
          </div>

          {repo.repoUrl && (
            <div className="flex items-center">
              <svg
                className="w-4 h-4 mr-2 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                />
              </svg>
              <span className="font-medium mr-2">Repository URL:</span>
              <a
                href={repo.repoUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:underline"
              >
                {repo.repoUrl}
              </a>
            </div>
          )}
        </div>

        <div className="grid grid-cols-2 gap-4 text-sm text-gray-600 mt-4 pt-4 border-t border-gray-100">
          <div>
            <span className="font-medium">Created:</span> {formattedCreated}
          </div>
          <div>
            <span className="font-medium">Updated:</span> {formattedUpdated}
          </div>
        </div>
      </div>

      {/* Epics list */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold text-gray-900">Epics</h2>
          <button
            onClick={() => setIsCreateEpicModalOpen(true)}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 flex items-center"
          >
            <svg
              className="w-5 h-5 mr-2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 4v16m8-8H4"
              />
            </svg>
            New Epic
          </button>
        </div>

        {epics.length === 0 ? (
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
            <h3 className="mt-2 text-sm font-medium text-gray-900">No epics</h3>
            <p className="mt-1 text-sm text-gray-500">
              This repository doesn't have any epics yet
            </p>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {epics.map((epic) => (
              <EpicCard
                key={epic.id}
                id={epic.id}
                title={epic.title}
                description={epic.description}
                status={epic.status}
                priority={epic.priority}
                createdAt={epic.createdAt}
                onUpdate={handleEpicUpdate}
              />
            ))}
          </div>
        )}
      </div>

      <CreateEpicModal
        repoId={id}
        isOpen={isCreateEpicModalOpen}
        onClose={() => setIsCreateEpicModalOpen(false)}
        onSave={handleEpicUpdate}
      />
    </div>
  );
}
