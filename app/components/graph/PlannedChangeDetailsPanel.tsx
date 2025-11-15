'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import type { PlannedChangeInfo } from '@/lib/types/planned-change-node';

interface PlannedChangeDetailsPanelProps {
  plannedChanges: PlannedChangeInfo[];
  fileName: string;
  onClose: () => void;
}

function getChangeTypeBadgeColor(changeType: string): string {
  switch (changeType) {
    case 'create':
      return 'bg-green-100 text-green-700 border-green-300';
    case 'modify':
      return 'bg-blue-100 text-blue-700 border-blue-300';
    case 'delete':
      return 'bg-red-100 text-red-700 border-red-300';
    default:
      return 'bg-gray-100 text-gray-700 border-gray-300';
  }
}

function getStatusBadgeColor(status: string): string {
  switch (status) {
    case 'planned':
      return 'bg-gray-100 text-gray-700 border-gray-300';
    case 'in_progress':
      return 'bg-yellow-100 text-yellow-700 border-yellow-300';
    case 'completed':
      return 'bg-green-100 text-green-700 border-green-300';
    case 'failed':
      return 'bg-red-100 text-red-700 border-red-300';
    default:
      return 'bg-gray-100 text-gray-700 border-gray-300';
  }
}

export default function PlannedChangeDetailsPanel({
  plannedChanges,
  fileName,
  onClose,
}: PlannedChangeDetailsPanelProps) {
  // Handle ESC key press
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [onClose]);

  // Group changes by story
  const changesByStory = plannedChanges.reduce((acc, change) => {
    const storyKey = change.storyId;
    if (!acc[storyKey]) {
      acc[storyKey] = {
        storyId: change.storyId,
        storyTitle: change.storyTitle || 'Untitled Story',
        changes: [],
      };
    }
    acc[storyKey].changes.push(change);
    return acc;
  }, {} as Record<string, { storyId: string; storyTitle: string; changes: PlannedChangeInfo[] }>);

  return (
    <>
      {/* Backdrop for mobile */}
      <div
        className="fixed inset-0 bg-black bg-opacity-30 z-40 md:hidden"
        onClick={onClose}
      />

      {/* Panel */}
      <div className="fixed right-0 top-0 bottom-0 w-full md:w-[500px] bg-white shadow-2xl z-50 flex flex-col animate-slide-in">
        {/* Header */}
        <div className="bg-gray-50 border-b border-gray-200 px-6 py-4 flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <h2 className="text-lg font-semibold text-gray-900 mb-1">Planned Changes</h2>
            <p className="text-sm text-gray-600 truncate" title={fileName}>
              {fileName}
            </p>
          </div>
          <button
            onClick={onClose}
            className="flex-shrink-0 ml-4 text-gray-400 hover:text-gray-600 transition-colors"
            aria-label="Close panel"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          {Object.values(changesByStory).map((group) => (
            <div key={group.storyId} className="mb-6 last:mb-0">
              {/* Story header */}
              <div className="flex items-start justify-between mb-3">
                <Link
                  href={`/stories/${group.storyId}`}
                  className="flex-1 text-base font-semibold text-blue-600 hover:text-blue-800 hover:underline"
                >
                  {group.storyTitle}
                </Link>
                <svg className="w-4 h-4 text-blue-600 flex-shrink-0 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
              </div>

              {/* Changes for this story */}
              <div className="space-y-4">
                {group.changes.map((change) => (
                  <div
                    key={change.id}
                    className="bg-gray-50 rounded-lg p-4 border border-gray-200"
                  >
                    {/* Badges */}
                    <div className="flex gap-2 mb-3">
                      <span className={`inline-block px-2 py-1 text-xs font-medium rounded border ${getChangeTypeBadgeColor(change.changeType)}`}>
                        {change.changeType}
                      </span>
                      <span className={`inline-block px-2 py-1 text-xs font-medium rounded border ${getStatusBadgeColor(change.status)}`}>
                        {change.status}
                      </span>
                    </div>

                    {/* Description */}
                    {change.description && (
                      <div className="mb-3">
                        <h4 className="text-xs font-semibold text-gray-700 uppercase mb-1">Description</h4>
                        <p className="text-sm text-gray-800 whitespace-pre-wrap">{change.description}</p>
                      </div>
                    )}

                    {/* Expected Changes */}
                    {change.expectedChanges && (
                      <div className="mb-3">
                        <h4 className="text-xs font-semibold text-gray-700 uppercase mb-1">Expected Changes</h4>
                        <pre className="text-xs text-gray-800 bg-white p-3 rounded border border-gray-200 overflow-x-auto whitespace-pre-wrap">
                          {change.expectedChanges}
                        </pre>
                      </div>
                    )}

                    {/* Before Snapshot */}
                    {change.beforeSnapshot && (
                      <details className="mb-3">
                        <summary className="text-xs font-semibold text-gray-700 uppercase cursor-pointer hover:text-gray-900">
                          Before Snapshot
                        </summary>
                        <pre className="mt-2 text-xs text-gray-800 bg-white p-3 rounded border border-gray-200 overflow-x-auto whitespace-pre-wrap">
                          {change.beforeSnapshot}
                        </pre>
                      </details>
                    )}

                    {/* After Snapshot */}
                    {change.afterSnapshot && (
                      <details className="mb-3">
                        <summary className="text-xs font-semibold text-gray-700 uppercase cursor-pointer hover:text-gray-900">
                          After Snapshot
                        </summary>
                        <pre className="mt-2 text-xs text-gray-800 bg-white p-3 rounded border border-gray-200 overflow-x-auto whitespace-pre-wrap">
                          {change.afterSnapshot}
                        </pre>
                      </details>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="bg-gray-50 border-t border-gray-200 px-6 py-4">
          <button
            onClick={onClose}
            className="w-full px-4 py-2 bg-gray-800 text-white rounded-md hover:bg-gray-700 transition-colors"
          >
            Close
          </button>
        </div>
      </div>

      <style jsx>{`
        @keyframes slide-in {
          from {
            transform: translateX(100%);
          }
          to {
            transform: translateX(0);
          }
        }
        .animate-slide-in {
          animation: slide-in 0.3s ease-out;
        }
      `}</style>
    </>
  );
}
