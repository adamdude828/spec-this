'use client';

import { useState } from 'react';
import EditTaskModal from './EditTaskModal';

interface TaskCardProps {
  id: string;
  title: string;
  description: string | null;
  status: string;
  onUpdate?: () => void;
}

const statusColors: Record<string, string> = {
  todo: 'bg-gray-100 text-gray-800',
  in_progress: 'bg-blue-100 text-blue-800',
  blocked: 'bg-red-100 text-red-800',
  completed: 'bg-green-100 text-green-800',
};

export default function TaskCard({
  id,
  title,
  description,
  status,
  onUpdate,
}: TaskCardProps) {
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

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
      <div className="bg-white rounded-lg shadow p-4 border border-gray-200 relative">
        <div className="flex items-start justify-between mb-2">
          <h5 className="text-sm font-semibold text-gray-900 flex-1 pr-6">{title}</h5>
          <div className="flex gap-2 items-center">
            <button
              onClick={handleEdit}
              className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded"
              title="Edit task"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
            </button>
            <span
              className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                statusColors[status] || statusColors.todo
              }`}
            >
              {status.replace('_', ' ')}
            </span>
          </div>
        </div>
        {description && (
          <p className="text-gray-600 text-xs mb-2">{description}</p>
        )}
      </div>

      <EditTaskModal
        task={{ id, title, description, status }}
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        onSave={handleSave}
      />
    </>
  );
}
