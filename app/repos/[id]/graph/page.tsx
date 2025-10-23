'use client';

import Link from 'next/link';
import { useEffect, useState, useCallback, useMemo } from 'react';
import {
  ReactFlow,
  ReactFlowProvider,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  Panel,
  type Node,
  type Edge,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import FileNode from '@/app/components/graph/FileNode';
import GraphToolbar from '@/app/components/graph/GraphToolbar';
import { getLayoutedElements } from '@/app/components/graph/GraphLayout';
import { useReactFlow } from '@xyflow/react';

interface Repository {
  id: string;
  name: string;
}

const nodeTypes = {
  fileNode: FileNode,
};

function GraphContent({
  repo,
  initialNodes,
  initialEdges,
  isFullscreen,
  onToggleFullscreen,
}: {
  _id: string;
  repo: Repository | null;
  initialNodes: Node[];
  initialEdges: Edge[];
  _layoutDirection: 'TB' | 'LR';
  isFullscreen: boolean;
  onToggleFullscreen: () => void;
}) {
  const { fitView } = useReactFlow();
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);
  const [filteredNodes, setFilteredNodes] = useState<Node[]>(initialNodes);
  const [filteredEdges, setFilteredEdges] = useState<Edge[]>(initialEdges);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);

  // Update nodes when initial data changes
  useEffect(() => {
    setNodes(initialNodes);
    setFilteredNodes(initialNodes);
  }, [initialNodes, setNodes]);

  useEffect(() => {
    setEdges(initialEdges);
    setFilteredEdges(initialEdges);
  }, [initialEdges, setEdges]);

  // Get available file types
  const availableTypes = useMemo(() => {
    const types = new Set<string>();
    initialNodes.forEach((node) => {
      const nodeData = node.data as { language?: string };
      if (nodeData?.language) types.add(nodeData.language);
    });
    return Array.from(types).sort();
  }, [initialNodes]);

  // Apply filters
  useEffect(() => {
    let filtered = initialNodes;

    // Apply search filter
    if (searchQuery) {
      filtered = filtered.filter((node) => {
        const nodeData = node.data as { label?: string };
        return nodeData?.label?.toLowerCase().includes(searchQuery.toLowerCase());
      });
    }

    // Apply type filter
    if (selectedTypes.length > 0) {
      filtered = filtered.filter((node) => {
        const nodeData = node.data as { language?: string };
        return nodeData?.language && selectedTypes.includes(nodeData.language);
      });
    }

    setFilteredNodes(filtered);

    // Filter edges to only show connections between visible nodes
    const visibleNodeIds = new Set(filtered.map((n) => n.id));
    const filteredEdgesList = initialEdges.filter(
      (edge) => visibleNodeIds.has(edge.source) && visibleNodeIds.has(edge.target)
    );
    setFilteredEdges(filteredEdgesList);
  }, [searchQuery, selectedTypes, initialNodes, initialEdges]);

  // Update visible nodes in React Flow
  useEffect(() => {
    setNodes(filteredNodes);
    setEdges(filteredEdges);
  }, [filteredNodes, filteredEdges, setNodes, setEdges]);

  const onNodeClick = useCallback((event: React.MouseEvent, node: Node) => {
    setSelectedNode(node);
  }, []);

  const handleFitView = useCallback(() => {
    fitView({ duration: 300 });
  }, [fitView]);

  const handleExport = useCallback(() => {
    const dataStr = JSON.stringify({ nodes: filteredNodes, edges: filteredEdges }, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);
    const exportFileDefaultName = `${repo?.name || 'graph'}-data.json`;

    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  }, [filteredNodes, filteredEdges, repo]);

  const handleFocusNode = useCallback((nodeId: string) => {
    // Find the node
    const node = nodes.find((n) => n.id === nodeId);
    if (!node) return;

    // Highlight the node temporarily
    setSelectedNode(node);

    // Focus on the node with zoom
    fitView({
      duration: 500,
      padding: 0.3,
      nodes: [{ id: nodeId }],
      maxZoom: 1.5,
    });
  }, [nodes, fitView]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.key === 'f' && !e.metaKey && !e.ctrlKey) {
        e.preventDefault();
        handleFitView();
      }
      if (e.key === 'Escape') {
        if (selectedNode) {
          setSelectedNode(null);
        } else if (isFullscreen) {
          onToggleFullscreen();
        }
      }
      if (e.key === 'F11') {
        e.preventDefault();
        onToggleFullscreen();
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [handleFitView, selectedNode, isFullscreen, onToggleFullscreen]);

  return (
    <>
      <GraphToolbar
        onSearch={setSearchQuery}
        onFilterByType={setSelectedTypes}
        availableTypes={availableTypes}
        onFitView={handleFitView}
        onExport={handleExport}
        onToggleFullscreen={onToggleFullscreen}
        isFullscreen={isFullscreen}
        allNodes={initialNodes}
        onFocusNode={handleFocusNode}
      />
      <div className="flex-1 relative">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onNodeClick={onNodeClick}
          nodeTypes={nodeTypes}
          fitView
          defaultEdgeOptions={{
            type: 'smoothstep',
            animated: false,
            style: { stroke: '#94a3b8', strokeWidth: 2 },
          }}
        >
          <Background color="#e5e7eb" gap={16} />
          <Controls />
          <MiniMap
            nodeColor={(node) => {
              return node.style?.background as string || '#6b7280';
            }}
            maskColor="rgba(0, 0, 0, 0.1)"
          />
          <Panel position="top-left">
            <div className="bg-white rounded-lg shadow-lg p-4 border border-gray-200 max-w-sm">
              <h3 className="text-sm font-semibold text-gray-900 mb-2">
                Keyboard Shortcuts
              </h3>
              <ul className="text-xs text-gray-600 space-y-1">
                <li>• <kbd className="px-1 bg-gray-100 rounded">F</kbd> - Fit to view</li>
                <li>• <kbd className="px-1 bg-gray-100 rounded">F11</kbd> - Fullscreen</li>
                <li>• <kbd className="px-1 bg-gray-100 rounded">Esc</kbd> - Close / Exit</li>
                <li>• <kbd className="px-1 bg-gray-100 rounded">↑↓</kbd> - Navigate search results</li>
                <li>• <kbd className="px-1 bg-gray-100 rounded">Enter</kbd> - Focus selected file</li>
                <li>• Scroll to zoom</li>
                <li>• Drag to pan</li>
              </ul>
            </div>
          </Panel>
        </ReactFlow>

        {/* Selected Node Details */}
        {selectedNode && (
          <div className="absolute bottom-4 left-4 bg-white rounded-lg shadow-lg p-4 border border-gray-200 z-10 max-w-md">
            <div className="flex items-start justify-between mb-3">
              <h3 className="text-sm font-semibold text-gray-900">File Details</h3>
              <button
                onClick={() => setSelectedNode(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="space-y-2 text-xs">
              <div>
                <span className="font-medium text-gray-700">Path:</span>
                <p className="text-gray-600 mt-1 break-all">
                  {(selectedNode.data as { label?: string })?.label}
                </p>
              </div>
              <div>
                <span className="font-medium text-gray-700">Language:</span>
                <span className="ml-2 px-2 py-1 bg-gray-100 rounded text-gray-800">
                  {(selectedNode.data as { language?: string; extension?: string })?.language ||
                   (selectedNode.data as { language?: string; extension?: string })?.extension}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}

export default function RepoGraphPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const [id, setId] = useState<string>('');
  const [repo, setRepo] = useState<Repository | null>(null);
  const [initialNodes, setInitialNodes] = useState<Node[]>([]);
  const [initialEdges, setInitialEdges] = useState<Edge[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [layoutDirection, setLayoutDirection] = useState<'TB' | 'LR'>('TB');
  const [isFullscreen, setIsFullscreen] = useState(false);

  const toggleFullscreen = useCallback(() => {
    setIsFullscreen((prev) => !prev);
  }, []);

  useEffect(() => {
    params.then((p) => setId(p.id));
  }, [params]);

  useEffect(() => {
    const fetchData = async () => {
      if (!id) return;

      setIsLoading(true);
      setError(null);

      try {
        // Fetch repo info
        const repoRes = await fetch(`/api/repos/${id}`);
        if (!repoRes.ok) throw new Error('Failed to fetch repository');
        const repoData = await repoRes.json();
        setRepo(repoData);

        // Fetch graph data
        const graphRes = await fetch(`/api/repos/${id}/graph/data`);
        if (!graphRes.ok) throw new Error('Failed to fetch graph data');
        const graphData = await graphRes.json();

        // Apply layout
        const layouted = getLayoutedElements(
          graphData.nodes || [],
          graphData.edges || [],
          layoutDirection
        );

        setInitialNodes(layouted.nodes);
        setInitialEdges(layouted.edges);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load graph');
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [id, layoutDirection]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-gray-500">Loading graph...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <Link
          href={`/repos/${id}`}
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
          Back to Repository
        </Link>
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <ReactFlowProvider>
      <div className={`flex flex-col ${isFullscreen ? 'fixed inset-0 z-50 bg-white' : 'h-screen'}`}>
        {/* Header - conditional rendering in fullscreen */}
        {!isFullscreen && (
          <div className="bg-white border-b border-gray-200 px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Link
                  href={`/repos/${id}`}
                  className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900"
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
                  Back
                </Link>
                <h1 className="text-2xl font-bold text-gray-900">
                  {repo?.name} - Code Graph
                </h1>
              </div>
              <div className="flex items-center gap-4">
                <div className="text-sm text-gray-600">
                  {initialNodes.length} files, {initialEdges.length} dependencies
                </div>
                <select
                  value={layoutDirection}
                  onChange={(e) => setLayoutDirection(e.target.value as 'TB' | 'LR')}
                  className="px-3 py-1 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="TB">Top to Bottom</option>
                  <option value="LR">Left to Right</option>
                </select>
              </div>
            </div>
          </div>
        )}

        {/* Graph Content */}
        <GraphContent
          _id={id}
          repo={repo}
          initialNodes={initialNodes}
          initialEdges={initialEdges}
          _layoutDirection={layoutDirection}
          isFullscreen={isFullscreen}
          onToggleFullscreen={toggleFullscreen}
        />
      </div>
    </ReactFlowProvider>
  );
}
