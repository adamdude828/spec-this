'use client';

import { useEffect, useState } from 'react';
import RepositoryCard from './components/RepositoryCard';
import CreateRepositoryModal from './components/CreateRepositoryModal';

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
}

export default function Home() {
  const [repos, setRepos] = useState<Repository[]>([]);
  const [epics, setEpics] = useState<Epic[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  const fetchData = async () => {
    try {
      const [reposRes, epicsRes] = await Promise.all([
        fetch('/api/repos', { cache: 'no-store' }),
        fetch('/api/epics', { cache: 'no-store' }),
      ]);

      if (!reposRes.ok || !epicsRes.ok) {
        throw new Error('Failed to fetch data');
      }

      const reposData = await reposRes.json();
      const epicsData = await epicsRes.json();

      setRepos(reposData);
      setEpics(epicsData);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const getEpicCount = (repoId: string) => {
    return epics.filter((epic) => epic.repoId === repoId).length;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-gray-500">Loading...</div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Repositories</h1>
          <p className="mt-2 text-sm text-gray-600">
            Manage your project repositories and their epics
          </p>
        </div>
        <button
          onClick={() => setIsCreateModalOpen(true)}
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
          New Repository
        </button>
      </div>

      {repos.length === 0 ? (
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
              d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"
            />
          </svg>
          <h3 className="mt-2 text-sm font-medium text-gray-900">No repositories</h3>
          <p className="mt-1 text-sm text-gray-500">
            Get started by creating your first repository
          </p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {repos.map((repo) => (
            <RepositoryCard
              key={repo.id}
              id={repo.id}
              name={repo.name}
              localPath={repo.localPath}
              repoUrl={repo.repoUrl}
              createdAt={repo.createdAt}
              epicCount={getEpicCount(repo.id)}
            />
          ))}
        </div>
      )}

      <CreateRepositoryModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSave={fetchData}
      />
    </div>
  );
}
