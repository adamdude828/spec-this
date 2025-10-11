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

interface GraphStats {
  basicStats: {
    fileCount: number;
    dependencyCount: number;
    languageBreakdown: Record<string, number>;
  };
  mostImported: Array<{ relativePath: string; count: number }>;
  mostDependencies: Array<{ relativePath: string; count: number }>;
  circularDeps: Array<{ cycle: string[] }>;
  orphanedFiles: Array<{ relativePath: string }>;
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
  const [isIndexing, setIsIndexing] = useState(false);
  const [indexMessage, setIndexMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [graphStats, setGraphStats] = useState<GraphStats | null>(null);
  const [isLoadingStats, setIsLoadingStats] = useState(false);
  const [isGraphExpanded, setIsGraphExpanded] = useState(false);

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
    fetchGraphStats();
  }, [id]);

  const fetchGraphStats = async () => {
    if (!id) return;

    setIsLoadingStats(true);
    try {
      const response = await fetch(`/api/graph-stats?repoId=${id}`);
      if (response.ok) {
        const data = await response.json();
        setGraphStats(data);
      }
    } catch (error) {
      console.error('Error fetching graph stats:', error);
    } finally {
      setIsLoadingStats(false);
    }
  };

  const handleEpicUpdate = () => {
    fetchData();
  };

  const handleIndexCodebase = async () => {
    setIsIndexing(true);
    setIndexMessage(null);

    try {
      const response = await fetch(`/api/index-codebase`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ repoId: id }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to index codebase');
      }

      setIndexMessage({
        type: 'success',
        text: data.message || 'Codebase indexed successfully!',
      });

      // Refresh graph stats after indexing
      await fetchGraphStats();
    } catch (error) {
      setIndexMessage({
        type: 'error',
        text: error instanceof Error ? error.message : 'Failed to index codebase',
      });
    } finally {
      setIsIndexing(false);
    }
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
          <button
            onClick={handleIndexCodebase}
            disabled={isIndexing}
            className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center"
          >
            {isIndexing ? (
              <>
                <svg
                  className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
                Indexing...
              </>
            ) : (
              <>
                <svg
                  className="w-4 h-4 mr-2"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4"
                  />
                </svg>
                Index Codebase
              </>
            )}
          </button>
        </div>

        {/* Success/Error message */}
        {indexMessage && (
          <div
            className={`mb-4 p-3 rounded-md text-sm ${
              indexMessage.type === 'success'
                ? 'bg-green-50 text-green-800 border border-green-200'
                : 'bg-red-50 text-red-800 border border-red-200'
            }`}
          >
            {indexMessage.text}
          </div>
        )}

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

      {/* Graph Statistics */}
      {graphStats && (
        <div className="bg-white rounded-lg shadow mb-6 border border-gray-200">
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold text-gray-900">Codebase Graph</h2>
              <div className="flex items-center gap-3">
                <Link
                  href={`/repos/${id}/graph`}
                  className="px-4 py-2 text-sm font-medium text-white bg-purple-600 rounded-md hover:bg-purple-700 flex items-center"
                >
                  <svg
                    className="w-4 h-4 mr-2"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7"
                    />
                  </svg>
                  View Graph
                </Link>
                <button
                  onClick={() => setIsGraphExpanded(!isGraphExpanded)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <svg
                    className={`w-6 h-6 transition-transform ${
                      isGraphExpanded ? 'rotate-180' : ''
                    }`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                </button>
              </div>
            </div>
          </div>

          {/* Basic Stats - Always Visible */}
          <div className="px-6 pb-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-blue-50 rounded-lg p-4 border border-blue-100">
              <div className="text-sm text-blue-600 font-medium mb-1">Total Files</div>
              <div className="text-3xl font-bold text-blue-900">
                {graphStats.basicStats.fileCount}
              </div>
            </div>
            <div className="bg-green-50 rounded-lg p-4 border border-green-100">
              <div className="text-sm text-green-600 font-medium mb-1">Dependencies</div>
              <div className="text-3xl font-bold text-green-900">
                {graphStats.basicStats.dependencyCount}
              </div>
            </div>
            <div className="bg-yellow-50 rounded-lg p-4 border border-yellow-100">
              <div className="text-sm text-yellow-600 font-medium mb-1">Circular Deps</div>
              <div className="text-3xl font-bold text-yellow-900">
                {graphStats.circularDeps.length}
              </div>
            </div>
            <div className="bg-purple-50 rounded-lg p-4 border border-purple-100">
              <div className="text-sm text-purple-600 font-medium mb-1">Orphaned Files</div>
              <div className="text-3xl font-bold text-purple-900">
                {graphStats.orphanedFiles.length}
              </div>
            </div>
          </div>
          </div>

          {/* Expandable Details */}
          {isGraphExpanded && (
            <div className="px-6 pb-6 border-t border-gray-100 pt-6">
              {/* Language Breakdown */}
              {Object.keys(graphStats.basicStats.languageBreakdown).length > 0 && (
                <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Language Breakdown</h3>
              <div className="flex gap-3">
                {Object.entries(graphStats.basicStats.languageBreakdown).map(([lang, count]) => (
                  <div key={lang} className="bg-gray-50 rounded-md px-3 py-2 text-sm border border-gray-200">
                    <span className="font-medium text-gray-900 capitalize">{lang}:</span>{' '}
                    <span className="text-gray-600">{count}</span>
                  </div>
                ))}
              </div>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Most Imported Files */}
                <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Most Imported Files</h3>
              {graphStats.mostImported.length > 0 ? (
                <div className="space-y-2">
                  {graphStats.mostImported.slice(0, 5).map((file, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between p-2 bg-gray-50 rounded border border-gray-200 text-sm"
                    >
                      <code className="text-gray-700 truncate flex-1 mr-2">
                        {file.relativePath}
                      </code>
                      <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs font-medium whitespace-nowrap">
                        {file.count} imports
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-500 italic">No data available</p>
              )}
                </div>

                {/* Files with Most Dependencies */}
                <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Most Dependencies</h3>
              {graphStats.mostDependencies.length > 0 ? (
                <div className="space-y-2">
                  {graphStats.mostDependencies.slice(0, 5).map((file, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between p-2 bg-gray-50 rounded border border-gray-200 text-sm"
                    >
                      <code className="text-gray-700 truncate flex-1 mr-2">
                        {file.relativePath}
                      </code>
                      <span className="bg-green-100 text-green-800 px-2 py-1 rounded text-xs font-medium whitespace-nowrap">
                        {file.count} deps
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-500 italic">No data available</p>
              )}
                </div>

                {/* Circular Dependencies */}
                {graphStats.circularDeps.length > 0 && (
                  <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
                  <svg
                    className="w-5 h-5 mr-2 text-yellow-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                    />
                  </svg>
                  Circular Dependencies
                </h3>
                <div className="space-y-2">
                  {graphStats.circularDeps.slice(0, 3).map((dep, idx) => (
                    <div
                      key={idx}
                      className="p-3 bg-yellow-50 rounded border border-yellow-200"
                    >
                      <div className="text-xs text-yellow-800 space-y-1">
                        {dep.cycle.map((file, fileIdx) => (
                          <div key={fileIdx} className="flex items-center">
                            {fileIdx > 0 && (
                              <svg
                                className="w-3 h-3 mr-1 text-yellow-600"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M19 9l-7 7-7-7"
                                />
                              </svg>
                            )}
                            <code className="text-yellow-900">{file}</code>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
                  </div>
                )}

                {/* Orphaned Files */}
                {graphStats.orphanedFiles.length > 0 && (
                  <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Orphaned Files</h3>
                <div className="space-y-1 max-h-48 overflow-y-auto">
                  {graphStats.orphanedFiles.slice(0, 10).map((file, idx) => (
                    <div
                      key={idx}
                      className="p-2 bg-gray-50 rounded border border-gray-200 text-sm"
                    >
                      <code className="text-gray-600">{file.relativePath}</code>
                    </div>
                  ))}
                  {graphStats.orphanedFiles.length > 10 && (
                    <p className="text-xs text-gray-500 italic pt-2">
                      ...and {graphStats.orphanedFiles.length - 10} more
                    </p>
                  )}
                </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {isLoadingStats && !graphStats && (
        <div className="bg-white rounded-lg shadow p-6 mb-6 border border-gray-200">
          <div className="flex items-center justify-center py-8">
            <div className="text-gray-500">Loading graph statistics...</div>
          </div>
        </div>
      )}

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
              This repository doesn&apos;t have any epics yet
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
