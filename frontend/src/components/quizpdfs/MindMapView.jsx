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
  Map,
  BookOpen
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
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

  useEffect(() => {
    fetchMindMap();
  }, [id]);

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

  const handleDownload = () => {
    if (!mindMap) return;
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(mindMap, null, 2));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", `${mindMap.title.replace(/\s+/g, '_')}_mindmap.json`);
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
    toast.success('Mind map exported as JSON');
  };

  const getNodeColor = (level) => {
    const colors = [
      { bg: 'bg-gradient-to-r from-indigo-100 to-indigo-50', border: 'border-indigo-200', text: 'text-indigo-800', dot: 'bg-indigo-500' },
      { bg: 'bg-gradient-to-r from-teal-100 to-teal-50', border: 'border-teal-200', text: 'text-teal-800', dot: 'bg-teal-500' },
      { bg: 'bg-gradient-to-r from-purple-100 to-purple-50', border: 'border-purple-200', text: 'text-purple-800', dot: 'bg-purple-500' },
      { bg: 'bg-gradient-to-r from-emerald-100 to-emerald-50', border: 'border-emerald-200', text: 'text-emerald-800', dot: 'bg-emerald-500' },
      { bg: 'bg-gradient-to-r from-slate-100 to-slate-50', border: 'border-slate-200', text: 'text-slate-800', dot: 'bg-slate-500' },
      { bg: 'bg-gradient-to-r from-blue-100 to-blue-50', border: 'border-blue-200', text: 'text-blue-800', dot: 'bg-blue-500' },
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
          <motion.div 
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-start gap-2 py-1.5"
          >
            {hasChildren ? (
              <button
                onClick={() => toggleNode(node.id)}
                className="p-1 hover:bg-indigo-50 rounded-lg transition-colors flex-shrink-0 mt-1.5"
              >
                {isExpanded ? (
                  <ChevronDown className="w-4 h-4 text-indigo-500" />
                ) : (
                  <ChevronRight className="w-4 h-4 text-indigo-500" />
                )}
              </button>
            ) : (
              <div className="w-6 flex-shrink-0 flex items-center justify-center mt-2">
                <div className={`w-2 h-2 rounded-full ${color.dot}`} />
              </div>
            )}

            <motion.div 
              whileHover={{ scale: 1.02 }}
              className={`px-4 py-2.5 rounded-xl border shadow-sm ${color.bg} ${color.border} ${color.text} cursor-pointer hover:shadow-md transition-all`}
              onClick={() => hasChildren && toggleNode(node.id)}
            >
              <div className="text-sm font-bold">{node.label}</div>
              {node.description && (
                <div className="text-[11px] opacity-80 mt-1 font-normal max-w-xs leading-relaxed">
                  {node.description}
                </div>
              )}
            </motion.div>
          </motion.div>

          <AnimatePresence>
            {hasChildren && isExpanded && (
              <motion.div 
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="ml-8 pl-4 border-l-2 border-indigo-100 overflow-hidden"
              >
                {children.map(child => renderNode(child, depth + 1))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      );
    };

    return rootNodes.map(node => renderNode(node, 0));
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-slate-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-gradient-to-r from-indigo-500 to-purple-600 animate-pulse flex items-center justify-center shadow-lg shadow-indigo-100">
            <Loader2 className="w-6 h-6 text-white animate-spin" />
          </div>
          <span className="text-sm text-gray-500">Loading mind map...</span>
        </div>
      </div>
    );
  }

  if (!mindMap) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-slate-50">
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
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-slate-50 flex flex-col overflow-hidden">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-md border-b border-indigo-100 sticky top-0 z-50">
        <div className="px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3 cursor-pointer" onClick={() => navigate('/module2')}>
              <div className="p-2 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl shadow-lg shadow-indigo-100">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <span className="font-bold text-gray-900">StudyAI</span>
            </div>
            
            <nav className="hidden md:flex items-center gap-6">
              <button onClick={() => navigate('/module2')} className="text-sm text-gray-500 hover:text-indigo-600 transition-colors">Quizzes</button>
              <button onClick={() => navigate('/module2')} className="text-sm text-gray-500 hover:text-indigo-600 transition-colors">Flashcards</button>
              <button onClick={() => navigate('/module2')} className="text-sm font-medium text-indigo-600">Mind Maps</button>
              <button onClick={() => navigate('/module2')} className="text-sm text-gray-500 hover:text-indigo-600 transition-colors">Library</button>
            </nav>
            
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-medium text-sm shadow-md">
              U
            </div>
          </div>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden">
        {/* Left Sidebar */}
        <AnimatePresence>
          {showSidebar && (
            <motion.aside 
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: 288, opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              className="bg-white border-r border-indigo-100 flex flex-col overflow-y-auto"
            >
              {/* Active Mind Map */}
              <div className="p-4 border-b border-indigo-100">
                <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Active Mind Map</h3>
                <div className="p-3 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl border border-indigo-100 shadow-sm">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg shadow-md">
                      <Network className="w-4 h-4 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{mindMap.title}</p>
                      <p className="text-xs text-gray-500">{mindMap.totalNodes} nodes</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Navigation Links */}
              <div className="p-4 border-b border-indigo-100">
                <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Navigation</h3>
                <div className="space-y-1">
                  <button 
                    onClick={() => navigate('/module2')}
                    className="w-full flex items-center gap-3 px-3 py-2 text-sm text-gray-600 hover:bg-indigo-50 hover:text-indigo-600 rounded-lg transition-all group"
                  >
                    <FolderOpen className="w-4 h-4 text-gray-400 group-hover:text-indigo-500" />
                    Library
                  </button>
                  <button 
                    onClick={() => navigate('/module2')}
                    className="w-full flex items-center gap-3 px-3 py-2 text-sm text-gray-600 hover:bg-indigo-50 hover:text-indigo-600 rounded-lg transition-all group"
                  >
                    <BookOpen className="w-4 h-4 text-gray-400 group-hover:text-indigo-500" />
                    Quizzes
                  </button>
                  <button 
                    onClick={() => navigate('/module2')}
                    className="w-full flex items-center gap-3 px-3 py-2 text-sm text-gray-600 hover:bg-indigo-50 hover:text-indigo-600 rounded-lg transition-all group"
                  >
                    <Layers className="w-4 h-4 text-gray-400 group-hover:text-indigo-500" />
                    Flashcards
                  </button>
                </div>
              </div>

              {/* Favorites placeholder */}
              <div className="p-4 mt-auto">
                <div className="text-center py-6 bg-slate-50 rounded-2xl border border-slate-100">
                  <Heart className="w-6 h-6 text-slate-300 mx-auto mb-2" />
                  <p className="text-[11px] text-slate-400 font-medium">Add to favorites for quick access</p>
                </div>
              </div>
            </motion.aside>
          )}
        </AnimatePresence>

        {/* Main Content */}
        <main className="flex-1 flex flex-col overflow-hidden">
          {/* Mind Map Info Bar */}
          <div className="px-6 py-4 bg-white/50 backdrop-blur-sm border-b border-indigo-100">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-xl font-bold text-gray-900">{mindMap.title}</h1>
                <p className="text-sm text-gray-500 mt-0.5">
                  Central Topic: <span className="font-semibold text-indigo-600">{mindMap.centralTopic}</span>
                  <span className="mx-2 opacity-30">•</span>
                  {mindMap.subject}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowSidebar(!showSidebar)}
                  className={`p-2 rounded-lg transition-all ${showSidebar ? 'bg-indigo-100 text-indigo-600' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}
                  title={showSidebar ? "Hide sidebar" : "Show sidebar"}
                >
                  <Layers className="w-5 h-5" />
                </button>
                <button
                  onClick={handleDownload}
                  className="p-2 text-gray-500 hover:bg-indigo-100 hover:text-indigo-600 rounded-lg transition-all"
                  title="Download as JSON"
                >
                  <Download className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>

          {/* Mind Map Visualization */}
          <div className="flex-1 overflow-auto p-6 bg-slate-50/30">
            <div className="bg-white rounded-3xl shadow-xl border border-indigo-100 p-8 min-h-full">
              {/* Central Topic */}
              <div className="mb-12 flex justify-center">
                <motion.div 
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="inline-flex items-center gap-4 px-8 py-5 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-3xl text-white shadow-xl shadow-indigo-100 border-4 border-white"
                >
                  <div className="p-3 bg-white/20 rounded-2xl">
                    <Network className="w-8 h-8" />
                  </div>
                  <span className="text-2xl font-black tracking-tight">{mindMap.centralTopic}</span>
                </motion.div>
              </div>

              {/* Tree View */}
              <div 
                className="transition-transform origin-top flex flex-col items-center"
                style={{ transform: `scale(${zoom})` }}
              >
                <div className="w-full max-w-4xl">
                  {buildTree(mindMap.nodes)}
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Toolbar */}
          <div className="px-6 py-4 bg-white border-t border-indigo-100 shadow-[0_-4px_20px_-10px_rgba(0,0,0,0.1)]">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <button
                  onClick={expandAll}
                  className="flex items-center gap-2 px-5 py-2.5 text-sm font-bold text-gray-700 bg-slate-100 hover:bg-indigo-100 hover:text-indigo-600 rounded-xl transition-all"
                >
                  <Maximize2 className="w-4 h-4" />
                  Expand All
                </button>
                <button
                  onClick={collapseAll}
                  className="flex items-center gap-2 px-5 py-2.5 text-sm font-bold text-gray-700 bg-slate-100 hover:bg-rose-100 hover:text-rose-600 rounded-xl transition-all"
                >
                  <Minimize2 className="w-4 h-4" />
                  Collapse All
                </button>
              </div>

              <div className="flex items-center bg-slate-100 rounded-2xl px-2 py-1 shadow-inner border border-slate-200">
                <button
                  onClick={handleZoomOut}
                  className="p-2 text-gray-600 hover:bg-white hover:text-indigo-600 rounded-xl transition-all shadow-sm"
                  title="Zoom Out"
                >
                  <ZoomOut className="w-4 h-4" />
                </button>
                <span className="text-xs font-black text-indigo-600 w-16 text-center tabular-nums">{Math.round(zoom * 100)}%</span>
                <button
                  onClick={handleZoomIn}
                  className="p-2 text-gray-600 hover:bg-white hover:text-indigo-600 rounded-xl transition-all shadow-sm"
                  title="Zoom In"
                >
                  <ZoomIn className="w-4 h-4" />
                </button>
              </div>

              <button
                onClick={() => {
                  toast.success('Regenerating mind map...');
                  fetchMindMap();
                }}
                className="flex items-center gap-2 px-6 py-2.5 text-sm font-bold text-white bg-gradient-to-r from-indigo-500 to-purple-600 hover:shadow-lg shadow-indigo-100 rounded-xl transition-all hover:scale-105"
              >
                <RefreshCw className="w-4 h-4" />
                Regenerate
              </button>
            </div>
          </div>
        </main>

        {/* Right Panel - Source & Legend */}
        <aside className="w-72 bg-white border-l border-indigo-100 flex flex-col overflow-y-auto hidden xl:flex">
          {/* Source Document */}
          <div className="p-5 border-b border-indigo-100">
            <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4">Source Material</h3>
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 shadow-inner">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-indigo-100 rounded-xl">
                  <FileText className="w-5 h-5 text-indigo-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-gray-900 truncate">{mindMap.sourceFile || 'Uploaded PDF'}</p>
                  <p className="text-[10px] text-indigo-500 font-bold uppercase tracking-tight">{mindMap.subject}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Navigator Minimap placeholder */}
          <div className="p-5 flex-1">
            <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4">Navigator</h3>
            <div className="aspect-square bg-gradient-to-br from-indigo-50 to-slate-50 rounded-3xl border-2 border-dashed border-indigo-200 p-6 flex items-center justify-center relative overflow-hidden group">
              <div className="absolute inset-0 bg-white/20 backdrop-blur-[2px] opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="relative z-10 text-center">
                <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-xl shadow-indigo-100 border-4 border-white">
                  <Map className="w-8 h-8 text-white" />
                </div>
                <p className="text-[10px] font-black text-indigo-600 uppercase tracking-tighter">View Matrix</p>
                <p className="text-[10px] text-slate-400 mt-1">{mindMap.totalNodes} Nodes Mapped</p>
              </div>
            </div>
          </div>

          {/* Legend */}
          <div className="p-5 border-t border-indigo-100 bg-slate-50/50">
            <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4">Legend</h3>
            <div className="space-y-3">
              {[
                { color: 'bg-indigo-500', label: 'Main Branches', desc: 'Core concepts' },
                { color: 'bg-teal-500', label: 'Sub-topics', desc: 'Detailed areas' },
                { color: 'bg-purple-500', label: 'Nodes', desc: 'Specific details' },
              ].map((item, idx) => (
                <div key={idx} className="flex items-start gap-3">
                  <div className={`w-3 h-3 rounded-full ${item.color} mt-1 shadow-sm`} />
                  <div>
                    <p className="text-xs font-bold text-gray-700 leading-none">{item.label}</p>
                    <p className="text-[10px] text-gray-400 mt-0.5">{item.desc}</p>
                  </div>
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
