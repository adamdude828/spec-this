'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import EpicCard from './components/EpicCard';

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

export default function Home() {
  const router = useRouter();
  const [epics, setEpics] = useState<Epic[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchEpics = async () => {
    try {
      const res = await fetch('/api/epics', {
        cache: 'no-store',
      });

      if (!res.ok) {
        throw new Error('Failed to fetch epics');
      }

      const data = await res.json();
      setEpics(data);
    } catch (error) {
      console.error('Error fetching epics:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchEpics();
  }, []);

  const handleEpicUpdate = () => {
    fetchEpics();
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
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Epics</h1>
        <p className="mt-2 text-sm text-gray-600">
          Manage your project epics and track progress
        </p>
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
            Get started by creating your first epic
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
  );
}
