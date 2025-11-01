'use client';

import { useState } from 'react';

interface QuickTaskCardProps {
  id: string;
  title: string;
  description: string | null;
  status: string;
  priority: string;
  createdAt: string;
  onUpdate: () => void;
  onDelete: () => void;
}

export default function QuickTaskCard({
  id,
  title,
  description,
  status,
  priority,
  createdAt,
  onUpdate,
  onDelete,
}: QuickTaskCardProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  const statusColors = {
    planned: 'bg-gray-100 text-gray-800',
    in_progress: 'bg-blue-100 text-blue-800',
    completed: 'bg-green-100 text-green-800',
    cancelled: 'bg-red-100 text-red-800',
  };

  const priorityColors = {
    low: 'bg-blue-100 text-blue-800',
    medium: 'bg-yellow-100 text-yellow-800',
    high: 'bg-orange-100 text-orange-800',
    critical: 'bg-red-100 text-red-800',
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this quick task?')) {
      return;
    }

    setIsDeleting(true);
    try {
      const response = await fetch(`/api/quick-tasks?id=${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete quick task');
      }

      onDelete();
    } catch (error) {
      console.error('Error deleting quick task:', error);
      alert('Failed to delete quick task');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleToggleStatus = async () => {
    setIsUpdating(true);
    const newStatus = status === 'completed' ? 'planned' : 'completed';

    try {
      const response = await fetch('/api/quick-tasks', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ id, status: newStatus }),
      });

      if (!response.ok) {
        throw new Error('Failed to update quick task');
      }

      onUpdate();
    } catch (error) {
      console.error('Error updating quick task:', error);
      alert('Failed to update quick task');
    } finally {
      setIsUpdating(false);
    }
  };

  const formattedDate = new Date(createdAt).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-2">
        <h3 className="text-lg font-semibold text-gray-900 flex-1">{title}</h3>
        <div className="flex items-center gap-2 ml-2">
          <button
            onClick={handleToggleStatus}
            disabled={isUpdating}
            className={`p-1.5 rounded transition-colors ${
              status === 'completed'
                ? 'text-green-600 hover:bg-green-50'
                : 'text-gray-400 hover:bg-gray-100'
            } disabled:opacity-50`}
            title={status === 'completed' ? 'Mark as incomplete' : 'Mark as complete'}
          >
            <svg
              className="w-5 h-5"
              fill={status === 'completed' ? 'currentColor' : 'none'}
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
          </button>
          <button
            onClick={handleDelete}
            disabled={isDeleting}
            className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors disabled:opacity-50"
            title="Delete quick task"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
              />
            </svg>
          </button>
        </div>
      </div>

      {description && (
        <p className="text-sm text-gray-600 mb-3 line-clamp-2">{description}</p>
      )}

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span
            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
              statusColors[status as keyof typeof statusColors] || statusColors.planned
            }`}
          >
            {status.replace('_', ' ')}
          </span>
          <span
            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
              priorityColors[priority as keyof typeof priorityColors] || priorityColors.medium
            }`}
          >
            {priority}
          </span>
        </div>
        <span className="text-xs text-gray-500">{formattedDate}</span>
      </div>
    </div>
  );
}
