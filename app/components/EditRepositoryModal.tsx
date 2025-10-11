'use client';

import { useState, useEffect } from 'react';

interface Provider {
  id: string;
  name: string;
  code: string;
}

interface Repository {
  id: string;
  name: string;
  localPath: string;
  repoUrl: string | null;
  providerId: string | null;
  provider?: Provider | null;
}

interface EditRepositoryModalProps {
  repository: Repository;
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
}

export default function EditRepositoryModal({
  repository,
  isOpen,
  onClose,
  onSave,
}: EditRepositoryModalProps) {
  const [name, setName] = useState(repository.name);
  const [localPath, setLocalPath] = useState(repository.localPath);
  const [repoUrl, setRepoUrl] = useState(repository.repoUrl || '');
  const [providerId, setProviderId] = useState(repository.providerId || '');
  const [providers, setProviders] = useState<Provider[]>([]);
  const [detectedProvider, setDetectedProvider] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Update form when repository prop changes
  useEffect(() => {
    setName(repository.name);
    setLocalPath(repository.localPath);
    setRepoUrl(repository.repoUrl || '');
    setProviderId(repository.providerId || '');
  }, [repository]);

  // Fetch providers on mount
  useEffect(() => {
    const fetchProviders = async () => {
      try {
        const response = await fetch('/api/providers');
        if (response.ok) {
          const data = await response.json();
          setProviders(data);
        }
      } catch (error) {
        console.error('Error fetching providers:', error);
      }
    };
    if (isOpen) {
      fetchProviders();
    }
  }, [isOpen]);

  // Auto-detect provider from URL
  useEffect(() => {
    if (!repoUrl) {
      setDetectedProvider('');
      return;
    }

    const url = repoUrl.toLowerCase();
    let detected = '';

    if (url.includes('github.com')) {
      detected = 'github';
    } else if (url.includes('dev.azure.com') || url.includes('visualstudio.com')) {
      detected = 'azure_devops';
    } else if (url.includes('gitlab.com') || url.includes('gitlab.')) {
      detected = 'gitlab';
    } else if (url.includes('bitbucket.org') || url.includes('bitbucket.')) {
      detected = 'bitbucket';
    }

    setDetectedProvider(detected);
  }, [repoUrl]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const response = await fetch(`/api/repos/${repository.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name,
          localPath,
          repoUrl: repoUrl || null,
          providerId: providerId || null,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to update repository');
      }

      onSave();
      onClose();
    } catch (error) {
      console.error('Error updating repository:', error);
      alert('Failed to update repository');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Edit Repository</h2>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                Name *
              </label>
              <input
                type="text"
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            <div>
              <label htmlFor="localPath" className="block text-sm font-medium text-gray-700 mb-1">
                Local Path *
              </label>
              <input
                type="text"
                id="localPath"
                value={localPath}
                onChange={(e) => setLocalPath(e.target.value)}
                placeholder="/path/to/your/project"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            <div>
              <label htmlFor="repoUrl" className="block text-sm font-medium text-gray-700 mb-1">
                Repository URL
              </label>
              <input
                type="url"
                id="repoUrl"
                value={repoUrl}
                onChange={(e) => setRepoUrl(e.target.value)}
                placeholder="https://github.com/username/repo"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              {detectedProvider && (
                <p className="mt-1 text-xs text-green-600">
                  ✓ Detected {providers.find(p => p.code === detectedProvider)?.name}
                </p>
              )}
            </div>

            <div>
              <label htmlFor="providerId" className="block text-sm font-medium text-gray-700 mb-1">
                Source Code Provider
              </label>
              <select
                id="providerId"
                value={providerId}
                onChange={(e) => setProviderId(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">None (auto-detect from URL)</option>
                {providers.map((provider) => (
                  <option key={provider.id} value={provider.id}>
                    {provider.name}
                  </option>
                ))}
              </select>
              <p className="mt-1 text-xs text-gray-500">
                Provider enables clickable source code links
              </p>
            </div>
          </div>

          <div className="flex justify-end gap-3 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
