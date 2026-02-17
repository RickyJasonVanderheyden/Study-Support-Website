import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  Network, 
  ZoomIn, 
  ZoomOut, 
  Download,
  Loader2,
  ChevronRight,
  ChevronDown,
  Circle
} from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../services/api';

const MindMapView = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [mindMap, setMindMap] = useState(null);
  const [loading, setLoading] = useState(true);
  const [expandedNodes, setExpandedNodes] = useState(new Set());
  const [zoom, setZoom] = useState(1);

  useEffect(() => {
    fetchMindMap();
  }, [id]);

  const fetchMindMap = async () => {
    try {
      const response = await api.get(`/module2/generate/mindmaps/${id}`);
      setMindMap(response.data);
      // Expand all level 0 nodes by default
      const initialExpanded = new Set(
        response.data.nodes
          .filter(n => n.level === 0)
          .map(n => n.id)
      );
      setExpandedNodes(initialExpanded);
    } catch (error) {
      console.error('Error fetching mind map:', error);
      toast.error('Failed to load mind map');
      navigate('/module2');
    } finally {
      setLoading(false);
    }
  };

  const toggleNode = (nodeId) => {
    const newExpanded = new Set(expandedNodes);
    if (newExpanded.has(nodeId)) {
      newExpanded.delete(nodeId);
    } else {
      newExpanded.add(nodeId);
    }
    setExpandedNodes(newExpanded);
  };

  const expandAll = () => {
    setExpandedNodes(new Set(mindMap.nodes.map(n => n.id)));
  };

  const collapseAll = () => {
    setExpandedNodes(new Set());
  };

  const buildTree = (nodes) => {
    // Get root nodes (level 0)
    const rootNodes = nodes.filter(n => n.parentId === null || n.level === 0);
    
    const getChildren = (parentId) => {
      return nodes.filter(n => n.parentId === parentId);
    };

    const renderNode = (node, depth = 0) => {
      const children = getChildren(node.id);
      const hasChildren = children.length > 0;
      const isExpanded = expandedNodes.has(node.id);

      const colors = [
        { bg: 'bg-blue-100', border: 'border-blue-300', text: 'text-blue-800', line: 'bg-blue-300' },
        { bg: 'bg-purple-100', border: 'border-purple-300', text: 'text-purple-800', line: 'bg-purple-300' },
        { bg: 'bg-emerald-100', border: 'border-emerald-300', text: 'text-emerald-800', line: 'bg-emerald-300' },
        { bg: 'bg-orange-100', border: 'border-orange-300', text: 'text-orange-800', line: 'bg-orange-300' },
        { bg: 'bg-pink-100', border: 'border-pink-300', text: 'text-pink-800', line: 'bg-pink-300' },
        { bg: 'bg-cyan-100', border: 'border-cyan-300', text: 'text-cyan-800', line: 'bg-cyan-300' },
      ];

      const colorIndex = depth % colors.length;
      const color = colors[colorIndex];

      return (
        <div key={node.id} className="relative">
          <div className="flex items-start gap-2 py-1">
            {/* Expand/Collapse button */}
            {hasChildren ? (
              <button
                onClick={() => toggleNode(node.id)}
                className="p-1 hover:bg-gray-100 rounded transition-colors flex-shrink-0 mt-1"
              >
                {isExpanded ? (
                  <ChevronDown className="w-4 h-4 text-gray-500" />
                ) : (
                  <ChevronRight className="w-4 h-4 text-gray-500" />
                )}
              </button>
            ) : (
              <div className="w-6 flex-shrink-0 flex items-center justify-center mt-1">
                <Circle className="w-2 h-2 text-gray-300 fill-current" />
              </div>
            )}

            {/* Node content */}
            <div 
              className={`px-4 py-2 rounded-lg border ${color.bg} ${color.border} ${color.text} font-medium cursor-pointer hover:shadow-md transition-shadow`}
              onClick={() => hasChildren && toggleNode(node.id)}
            >
              <div className="text-sm">{node.label}</div>
              {node.description && (
                <div className="text-xs opacity-70 mt-1 font-normal max-w-xs">
                  {node.description}
                </div>
              )}
            </div>
          </div>

          {/* Children */}
          {hasChildren && isExpanded && (
            <div className="ml-8 pl-4 border-l-2 border-gray-200">
              {children.map(child => renderNode(child, depth + 1))}
            </div>
          )}
        </div>
      );
    };

    return rootNodes.map(node => renderNode(node, 0));
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
        <div className="flex items-center justify-center h-96">
          <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
        </div>
      </div>
    );
  }

  if (!mindMap) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
        <div className="text-center py-12">
          <p className="text-gray-500">Mind map not found</p>
          <button
            onClick={() => navigate('/module2')}
            className="mt-4 text-indigo-600 hover:text-indigo-700"
          >
            Return to Study Tools
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl shadow-lg">
                <Network className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-slate-900">Mind Map</h1>
                <p className="text-xs text-slate-500">Visual Learning</p>
              </div>
            </div>
            <button
              onClick={() => navigate('/module2')}
              className="flex items-center gap-2 px-4 py-2 text-sm text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Back
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Controls */}
        <div className="flex items-center justify-end gap-2 mb-6">
          
          <div className="flex items-center gap-2">
            <button
              onClick={collapseAll}
              className="px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            >
              Collapse All
            </button>
            <button
              onClick={expandAll}
              className="px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            >
              Expand All
            </button>
          </div>
        </div>

        {/* Mind Map Info */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-6">
          <div className="flex items-start gap-4">
            <div className="p-4 bg-purple-100 rounded-xl">
              <Network className="w-8 h-8 text-purple-600" />
            </div>
            <div className="flex-1">
              <h1 className="text-2xl font-bold text-gray-900 mb-2">{mindMap.title}</h1>
              <p className="text-gray-600 mb-4">{mindMap.description}</p>
              <div className="flex items-center gap-4 text-sm text-gray-500">
                <span>Central Topic: <strong className="text-gray-700">{mindMap.centralTopic}</strong></span>
                <span>•</span>
                <span><strong className="text-gray-700">{mindMap.totalNodes}</strong> nodes</span>
                <span>•</span>
                <span>Subject: <strong className="text-gray-700">{mindMap.subject}</strong></span>
              </div>
            </div>
          </div>
        </div>

        {/* Mind Map Visualization */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          {/* Central Topic */}
          <div className="mb-8">
            <div className="inline-flex items-center gap-3 px-6 py-4 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-2xl text-white shadow-lg">
              <Network className="w-6 h-6" />
              <span className="text-xl font-bold">{mindMap.centralTopic}</span>
            </div>
          </div>

          {/* Tree View */}
          <div 
            className="overflow-auto max-h-[600px] p-4"
            style={{ transform: `scale(${zoom})`, transformOrigin: 'top left' }}
          >
            {buildTree(mindMap.nodes)}
          </div>
        </div>

        {/* Legend */}
        <div className="mt-6 p-4 bg-gray-50 rounded-xl">
          <h3 className="text-sm font-medium text-gray-700 mb-2">Legend</h3>
          <div className="flex flex-wrap gap-4 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-blue-100 border border-blue-300" />
              <span className="text-gray-600">Level 1 - Main branches</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-purple-100 border border-purple-300" />
              <span className="text-gray-600">Level 2 - Sub-topics</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-emerald-100 border border-emerald-300" />
              <span className="text-gray-600">Level 3 - Details</span>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default MindMapView;
