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
  Circle,
  Sparkles,
  Clock,
  FileText,
  Maximize2,
  Minimize2,
  RefreshCw,
  Layers,
  FolderOpen,
  Heart,
  Map
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
  const [showSidebar, setShowSidebar] = useState(true);

  useEffect(() => {
    fetchMindMap();
  }, [id]);

  const fetchMindMap = async () => {
    try {
      const response = await api.get(`/module2/generate/mindmaps/${id}`);
      setMindMap(response.data);
      const initialExpanded = new Set(
        response.data.nodes
          .filter(n => n.level === 0 || n.level === 1)
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

  const handleZoomIn = () => setZoom(prev => Math.min(prev + 0.1, 2));
  const handleZoomOut = () => setZoom(prev => Math.max(prev - 0.1, 0.5));

  const getNodeColor = (level) => {
    const colors = [
      { bg: 'bg-gradient-to-r from-blue-100 to-blue-50', border: 'border-blue-200', text: 'text-blue-800', dot: 'bg-blue-500' },
      { bg: 'bg-gradient-to-r from-emerald-100 to-emerald-50', border: 'border-emerald-200', text: 'text-emerald-800', dot: 'bg-emerald-500' },
      { bg: 'bg-gradient-to-r from-purple-100 to-purple-50', border: 'border-purple-200', text: 'text-purple-800', dot: 'bg-purple-500' },
      { bg: 'bg-gradient-to-r from-amber-100 to-amber-50', border: 'border-amber-200', text: 'text-amber-800', dot: 'bg-amber-500' },
      { bg: 'bg-gradient-to-r from-rose-100 to-rose-50', border: 'border-rose-200', text: 'text-rose-800', dot: 'bg-rose-500' },
      { bg: 'bg-gradient-to-r from-cyan-100 to-cyan-50', border: 'border-cyan-200', text: 'text-cyan-800', dot: 'bg-cyan-500' },
    ];
    return colors[level % colors.length];
  };

  const buildTree = (nodes) => {
    const rootNodes = nodes.filter(n => n.parentId === null || n.level === 0);
    
    const getChildren = (parentId) => {
      return nodes.filter(n => n.parentId === parentId);
    };

    const renderNode = (node, depth = 0) => {
      const children = getChildren(node.id);
      const hasChildren = children.length > 0;
      const isExpanded = expandedNodes.has(node.id);
      const color = getNodeColor(depth);

      return (
        <div key={node.id} className="relative">
          <div className="flex items-start gap-2 py-1.5">
            {hasChildren ? (
              <button
                onClick={() => toggleNode(node.id)}
                className="p-1 hover:bg-gray-100 rounded transition-colors flex-shrink-0 mt-1.5"
              >
                {isExpanded ? (
                  <ChevronDown className="w-4 h-4 text-gray-500" />
                ) : (
                  <ChevronRight className="w-4 h-4 text-gray-500" />
                )}
              </button>
            ) : (
              <div className="w-6 flex-shrink-0 flex items-center justify-center mt-2">
                <div className={`w-2 h-2 rounded-full ${color.dot}`} />
              </div>
            )}

            <div 
              className={`px-4 py-2.5 rounded-xl border ${color.bg} ${color.border} ${color.text} cursor-pointer hover:shadow-md transition-all`}
              onClick={() => hasChildren && toggleNode(node.id)}
            >
              <div className="text-sm font-medium">{node.label}</div>
              {node.description && (
                <div className="text-xs opacity-70 mt-1 font-normal max-w-xs">
                  {node.description}
                </div>
              )}
            </div>
          </div>

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
      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-amber-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-gradient-to-r from-orange-400 to-amber-500 animate-pulse flex items-center justify-center">
            <Loader2 className="w-6 h-6 text-white animate-spin" />
          </div>
          <span className="text-sm text-gray-500">Loading mind map...</span>
        </div>
      </div>
    );
  }

  if (!mindMap) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-amber-50">
        <div className="text-center py-12">
          <p className="text-gray-500">Mind map not found</p>
          <button
            onClick={() => navigate('/module2')}
            className="mt-4 text-orange-600 hover:text-orange-700"
          >
            Return to Library
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-amber-50 flex flex-col">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm border-b border-orange-100 sticky top-0 z-50">
        <div className="px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-br from-orange-400 to-amber-500 rounded-xl shadow-lg">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <span className="font-bold text-gray-900">StudyAI</span>
            </div>
            
            <nav className="hidden md:flex items-center gap-6">
              <span className="text-sm text-gray-500 hover:text-gray-900 cursor-pointer">Quizzes</span>
              <span className="text-sm text-gray-500 hover:text-gray-900 cursor-pointer">Flashcards</span>
              <span className="text-sm font-medium text-orange-600">Mind Maps</span>
              <span className="text-sm text-gray-500 hover:text-gray-900 cursor-pointer">Library</span>
            </nav>
            
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-orange-400 to-amber-500 flex items-center justify-center text-white font-medium text-sm">
              U
            </div>
          </div>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden">
        {/* Left Sidebar */}
        {showSidebar && (
          <aside className="w-72 bg-white border-r border-orange-100 flex flex-col overflow-y-auto">
            {/* Active Mind Map */}
            <div className="p-4 border-b border-orange-100">
              <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Active Mind Map</h3>
              <div className="p-3 bg-gradient-to-r from-orange-50 to-amber-50 rounded-xl border border-orange-200">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-orange-500 rounded-lg">
                    <Network className="w-4 h-4 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{mindMap.title}</p>
                    <p className="text-xs text-gray-500">{mindMap.totalNodes} nodes</p>
                  </div>
                </div>
              </div>
            </div>

            {/* My Library */}
            <div className="p-4 border-b border-orange-100">
              <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">My Library</h3>
              <button 
                onClick={() => navigate('/module2')}
                className="w-full flex items-center gap-3 px-3 py-2 text-sm text-gray-700 hover:bg-orange-50 rounded-lg transition-colors"
              >
                <FolderOpen className="w-4 h-4 text-gray-400" />
                All Mind Maps
              </button>
            </div>

            {/* Recent */}
            <div className="p-4 border-b border-orange-100">
              <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Recent</h3>
              <div className="space-y-1">
                <div className="flex items-center gap-3 px-3 py-2 bg-orange-50 rounded-lg">
                  <Clock className="w-4 h-4 text-orange-500" />
                  <span className="text-sm text-gray-700 truncate">{mindMap.title}</span>
                </div>
              </div>
            </div>

            {/* Favorites */}
            <div className="p-4">
              <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Favorites</h3>
              <div className="text-center py-4">
                <Heart className="w-6 h-6 text-gray-300 mx-auto mb-2" />
                <p className="text-xs text-gray-400">No favorites yet</p>
              </div>
            </div>
          </aside>
        )}

        {/* Main Content */}
        <main className="flex-1 flex flex-col overflow-hidden">
          {/* Mind Map Info Bar */}
          <div className="px-6 py-4 bg-white/50 border-b border-orange-100">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-xl font-bold text-gray-900">{mindMap.title}</h1>
                <p className="text-sm text-gray-500">
                  Central Topic: <span className="font-medium text-gray-700">{mindMap.centralTopic}</span>
                  <span className="mx-2">•</span>
                  {mindMap.subject}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowSidebar(!showSidebar)}
                  className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg transition-colors"
                  title={showSidebar ? "Hide sidebar" : "Show sidebar"}
                >
                  <Layers className="w-5 h-5" />
                </button>
                <button
                  onClick={() => {}}
                  className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg transition-colors"
                  title="Download"
                >
                  <Download className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>

          {/* Mind Map Visualization */}
          <div className="flex-1 overflow-auto p-6">
            <div className="bg-white rounded-2xl shadow-sm border border-orange-100 p-6 min-h-full">
              {/* Central Topic */}
              <div className="mb-8 flex justify-center">
                <div className="inline-flex items-center gap-3 px-6 py-4 bg-gradient-to-r from-orange-500 to-amber-500 rounded-2xl text-white shadow-lg">
                  <Network className="w-6 h-6" />
                  <span className="text-xl font-bold">{mindMap.centralTopic}</span>
                </div>
              </div>

              {/* Tree View */}
              <div 
                className="transition-transform origin-top"
                style={{ transform: `scale(${zoom})` }}
              >
                {buildTree(mindMap.nodes)}
              </div>
            </div>
          </div>

          {/* Bottom Toolbar */}
          <div className="px-6 py-3 bg-white border-t border-orange-100">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <button
                  onClick={expandAll}
                  className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                >
                  <Maximize2 className="w-4 h-4" />
                  Expand All
                </button>
                <button
                  onClick={collapseAll}
                  className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                >
                  <Minimize2 className="w-4 h-4" />
                  Collapse All
                </button>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleZoomOut}
                  className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                  title="Zoom Out"
                >
                  <ZoomOut className="w-5 h-5" />
                </button>
                <span className="text-sm text-gray-500 w-16 text-center">{Math.round(zoom * 100)}%</span>
                <button
                  onClick={handleZoomIn}
                  className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                  title="Zoom In"
                >
                  <ZoomIn className="w-5 h-5" />
                </button>
              </div>

              <button
                onClick={() => {
                  toast.success('Regenerating mind map...');
                  fetchMindMap();
                }}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-orange-500 to-amber-500 hover:shadow-md rounded-lg transition-all"
              >
                <RefreshCw className="w-4 h-4" />
                Regenerate
              </button>
            </div>
          </div>
        </main>

        {/* Right Panel - Source & Navigator */}
        <aside className="w-64 bg-white border-l border-orange-100 flex flex-col overflow-y-auto hidden lg:flex">
          {/* Source Document */}
          <div className="p-4 border-b border-orange-100">
            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Source Document</h3>
            <div className="p-3 bg-gray-50 rounded-xl border border-gray-200">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-orange-100 rounded-lg">
                  <FileText className="w-4 h-4 text-orange-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{mindMap.sourceFile || 'Uploaded PDF'}</p>
                  <p className="text-xs text-gray-500">{mindMap.subject}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Navigator Minimap */}
          <div className="p-4 flex-1">
            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Navigator</h3>
            <div className="aspect-square bg-gradient-to-br from-orange-50 to-amber-50 rounded-xl border border-orange-200 p-4 flex items-center justify-center">
              <div className="relative">
                <div className="w-12 h-12 bg-gradient-to-r from-orange-400 to-amber-500 rounded-full flex items-center justify-center">
                  <Map className="w-6 h-6 text-white" />
                </div>
                <div className="absolute -top-2 -right-4 w-6 h-6 bg-blue-100 rounded-full border-2 border-white" />
                <div className="absolute -bottom-2 -left-4 w-6 h-6 bg-emerald-100 rounded-full border-2 border-white" />
                <div className="absolute -bottom-4 right-0 w-6 h-6 bg-purple-100 rounded-full border-2 border-white" />
              </div>
            </div>
            <p className="text-xs text-center text-gray-400 mt-3">{mindMap.totalNodes} nodes total</p>
          </div>

          {/* Legend */}
          <div className="p-4 border-t border-orange-100">
            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Legend</h3>
            <div className="space-y-2">
              {[
                { color: 'bg-blue-500', label: 'Main Branches' },
                { color: 'bg-emerald-500', label: 'Sub-topics' },
                { color: 'bg-purple-500', label: 'Details' },
              ].map((item, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <div className={`w-3 h-3 rounded-full ${item.color}`} />
                  <span className="text-xs text-gray-600">{item.label}</span>
                </div>
              ))}
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
};

export default MindMapView;
