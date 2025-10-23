'use client';

import { useState, useRef, useEffect } from 'react';
import type { Node } from '@xyflow/react';

interface GraphToolbarProps {
  onSearch: (query: string) => void;
  onFilterByType: (types: string[]) => void;
  availableTypes: string[];
  onFitView: () => void;
  onExport: () => void;
  onToggleFullscreen: () => void;
  isFullscreen: boolean;
  allNodes: Node[];
  onFocusNode: (nodeId: string) => void;
}

export default function GraphToolbar({
  onSearch,
  onFilterByType,
  availableTypes,
  onFitView,
  onExport,
  onToggleFullscreen,
  isFullscreen,
  allNodes,
  onFocusNode,
}: GraphToolbarProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
  const [showFilters, setShowFilters] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedSuggestionIndex, setSelectedSuggestionIndex] = useState(0);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);

  // Filter nodes based on search query
  const searchSuggestions = searchQuery
    ? allNodes.filter((node) => {
        const label = (node.data as { label?: string })?.label || '';
        return label.toLowerCase().includes(searchQuery.toLowerCase());
      })
    : [];

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    setSearchQuery(query);
    onSearch(query);
    setShowSuggestions(true);
    setSelectedSuggestionIndex(0);
  };

  const handleSuggestionClick = (node: Node) => {
    const label = (node.data as { label?: string })?.label || '';
    setSearchQuery(label);
    setShowSuggestions(false);
    onFocusNode(node.id);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!showSuggestions || searchSuggestions.length === 0) {
      if (e.key === 'ArrowDown' && searchQuery) {
        setShowSuggestions(true);
      }
      return;
    }

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedSuggestionIndex((prev) =>
          prev < searchSuggestions.length - 1 ? prev + 1 : prev
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedSuggestionIndex((prev) => (prev > 0 ? prev - 1 : prev));
        break;
      case 'Enter':
        e.preventDefault();
        if (searchSuggestions[selectedSuggestionIndex]) {
          handleSuggestionClick(searchSuggestions[selectedSuggestionIndex]);
        }
        break;
      case 'Escape':
        e.preventDefault();
        setShowSuggestions(false);
        break;
    }
  };

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        suggestionsRef.current &&
        !suggestionsRef.current.contains(event.target as HTMLElement) &&
        searchInputRef.current &&
        !searchInputRef.current.contains(event.target as HTMLElement)
      ) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Scroll selected suggestion into view
  useEffect(() => {
    if (showSuggestions && suggestionsRef.current) {
      const selectedElement = suggestionsRef.current.children[selectedSuggestionIndex] as HTMLElement;
      if (selectedElement) {
        selectedElement.scrollIntoView({ block: 'nearest' });
      }
    }
  }, [selectedSuggestionIndex, showSuggestions]);

  const handleTypeToggle = (type: string) => {
    const newTypes = selectedTypes.includes(type)
      ? selectedTypes.filter((t) => t !== type)
      : [...selectedTypes, type];
    setSelectedTypes(newTypes);
    onFilterByType(newTypes);
  };

  const clearFilters = () => {
    setSelectedTypes([]);
    setSearchQuery('');
    onFilterByType([]);
    onSearch('');
    setShowSuggestions(false);
  };

  return (
    <div className="bg-white border-b border-gray-200 px-6 py-3">
      <div className="flex items-center gap-4">
        {/* Search */}
        <div className="flex-1 max-w-md relative">
          <div className="relative">
            <input
              ref={searchInputRef}
              type="text"
              value={searchQuery}
              onChange={handleSearchChange}
              onKeyDown={handleKeyDown}
              onFocus={() => searchQuery && setShowSuggestions(true)}
              placeholder="Search files..."
              className="w-full px-4 py-2 pl-10 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              autoComplete="off"
            />
            <svg
              className="absolute left-3 top-2.5 w-4 h-4 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
          </div>

          {/* Search Suggestions Dropdown */}
          {showSuggestions && searchSuggestions.length > 0 && (
            <div
              ref={suggestionsRef}
              className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-96 overflow-y-auto"
            >
              {searchSuggestions.map((node, index) => {
                const label = (node.data as { label?: string })?.label || '';
                const language = (node.data as { language?: string })?.language || '';
                return (
                  <button
                    key={node.id}
                    onClick={() => handleSuggestionClick(node)}
                    className={`w-full px-4 py-2 text-left text-sm hover:bg-blue-50 flex items-center justify-between ${
                      index === selectedSuggestionIndex ? 'bg-blue-100' : ''
                    }`}
                  >
                    <span className="truncate flex-1">{label}</span>
                    {language && (
                      <span className="ml-2 px-2 py-0.5 text-xs bg-gray-100 text-gray-600 rounded">
                        {language}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          )}

          {/* No results message */}
          {showSuggestions && searchQuery && searchSuggestions.length === 0 && (
            <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg p-4">
              <p className="text-sm text-gray-500">No files found matching "{searchQuery}"</p>
            </div>
          )}
        </div>

        {/* Filters Toggle */}
        <button
          onClick={() => setShowFilters(!showFilters)}
          className={`px-4 py-2 text-sm font-medium rounded-md flex items-center gap-2 ${
            showFilters
              ? 'bg-blue-100 text-blue-700'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"
            />
          </svg>
          Filters
          {selectedTypes.length > 0 && (
            <span className="px-2 py-0.5 text-xs bg-blue-600 text-white rounded-full">
              {selectedTypes.length}
            </span>
          )}
        </button>

        {/* Actions */}
        <button
          onClick={onFitView}
          className="px-4 py-2 text-sm font-medium bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 flex items-center gap-2"
          title="Fit to view (F)"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4"
            />
          </svg>
          Fit View
        </button>

        <button
          onClick={onExport}
          className="px-4 py-2 text-sm font-medium bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 flex items-center gap-2"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
            />
          </svg>
          Export
        </button>

        <button
          onClick={onToggleFullscreen}
          className="px-4 py-2 text-sm font-medium bg-indigo-100 text-indigo-700 rounded-md hover:bg-indigo-200 flex items-center gap-2"
          title="Toggle fullscreen (F11)"
        >
          {isFullscreen ? (
            <>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
              Exit Fullscreen
            </>
          ) : (
            <>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4"
                />
              </svg>
              Fullscreen
            </>
          )}
        </button>

        {(selectedTypes.length > 0 || searchQuery) && (
          <button
            onClick={clearFilters}
            className="px-4 py-2 text-sm font-medium bg-red-100 text-red-700 rounded-md hover:bg-red-200"
          >
            Clear
          </button>
        )}
      </div>

      {/* Filter Dropdown */}
      {showFilters && (
        <div className="mt-3 p-4 bg-gray-50 rounded-md border border-gray-200">
          <h4 className="text-sm font-semibold text-gray-900 mb-2">Filter by File Type</h4>
          <div className="flex flex-wrap gap-2">
            {availableTypes.map((type) => (
              <button
                key={type}
                onClick={() => handleTypeToggle(type)}
                className={`px-3 py-1 text-xs font-medium rounded-md ${
                  selectedTypes.includes(type)
                    ? 'bg-blue-600 text-white'
                    : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-100'
                }`}
              >
                {type}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
