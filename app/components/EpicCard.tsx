'use client';

import Link from 'next/link';
import { useState } from 'react';
import EditEpicModal from './EditEpicModal';

interface EpicCardProps {
  id: string;
  title: string;
  description: string | null;
  status: string;
  priority: string;
  createdAt: string;
  onUpdate?: () => void;
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

export default function EpicCard({
  id,
  title,
  description,
  status,
  priority,
  createdAt,
  onUpdate,
}: EpicCardProps) {
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  const formattedDate = new Date(createdAt).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });

  const handleEdit = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsEditModalOpen(true);
  };

  const handleSave = () => {
    if (onUpdate) {
      onUpdate();
    }
  };

  return (
    <>
      <Link
        href={`/epics/${id}`}
        className="block bg-white rounded-lg shadow hover:shadow-md transition-shadow p-6 border border-gray-200 relative"
      >
        <div className="flex items-start justify-between mb-3">
          <h3 className="text-lg font-semibold text-gray-900 flex-1 pr-8">{title}</h3>
          <div className="flex gap-2 ml-4">
            <button
              onClick={handleEdit}
              className="absolute top-4 right-4 p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded"
              title="Edit epic"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
            </button>
            <span
              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                statusColors[status] || statusColors.draft
              }`}
            >
              {status}
            </span>
            <span
              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                priorityColors[priority] || priorityColors.low
              }`}
            >
              {priority}
            </span>
          </div>
        </div>
        {description && (
          <p className="text-gray-600 text-sm mb-3 line-clamp-2">{description}</p>
        )}
        <div className="text-xs text-gray-500">Created {formattedDate}</div>
      </Link>

      <EditEpicModal
        epic={{ id, title, description, status, priority }}
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        onSave={handleSave}
      />
    </>
  );
}
