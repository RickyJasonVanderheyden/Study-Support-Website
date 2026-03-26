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
  BookOpen,
  Sun,
  Moon,
  Quote
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import ReactFlow, { 
  Background, 
  Controls, 
  MiniMap, 
  useNodesState, 
  useEdgesState, 
  Handle, 
  Position,
  MarkerType
} from 'reactflow';
import dagre from 'dagre';
import 'reactflow/dist/style.css';
import toast from 'react-hot-toast';
import api from '../../services/api';

// Custom Node Component
const CustomNode = ({ data }) => {
  const { label, description, level, color, sourceMeta } = data;
  
  return (
    <motion.div 
      initial={{ scale: 0.9, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      className={`px-4 py-2.5 rounded-xl border-2 shadow-xl ${color.bg} ${color.border} ${color.text} min-w-[150px] max-w-[250px] relative`}
    >
      <Handle type="target" position={Position.Top} className="!bg-indigo-300 dark:!bg-indigo-500 !w-2 !h-2" />
      
      <div className="text-sm font-black leading-tight mb-1">{label}</div>
      {description && (
        <div className="text-[10px] opacity-70 font-medium leading-relaxed mb-1.5">
          {description}
        </div>
      )}
      
      {/* Small Page Badge on Node */}
      {sourceMeta && sourceMeta.page && (
        <div className={`mt-1 inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[8px] font-bold uppercase ${color.dot} text-white`}>
          <FileText className="w-2.5 h-2.5" />
          Pg {sourceMeta.page}
        </div>
      )}

      <Handle type="source" position={Position.Bottom} className="!bg-indigo-300 dark:!bg-indigo-500 !w-2 !h-2" />
    </motion.div>
  );
};

const nodeTypes = {
  custom: CustomNode,
};

// Layout Helper
const dagreGraph = new dagre.graphlib.Graph();
dagreGraph.setDefaultEdgeLabel(() => ({}));

const getLayoutedElements = (nodes, edges, direction = 'TB') => {
  const isHorizontal = direction === 'LR';
  dagreGraph.setGraph({ rankdir: direction });

  nodes.forEach((node) => {
    dagreGraph.setNode(node.id, { width: 250, height: 100 });
  });

  edges.forEach((edge) => {
    dagreGraph.setEdge(edge.source, edge.target);
  });

  dagre.layout(dagreGraph);

  const layoutedNodes = nodes.map((node) => {
    const nodeWithPosition = dagreGraph.node(node.id);
    return {
      ...node,
      targetPosition: isHorizontal ? Position.Left : Position.Top,
      sourcePosition: isHorizontal ? Position.Right : Position.Bottom,
      position: {
        x: nodeWithPosition.x - 125,
        y: nodeWithPosition.y - 50,
      },
    };
  });

  return { nodes: layoutedNodes, edges };
};

const MindMapView = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [mindMap, setMindMap] = useState(null);
  const [loading, setLoading] = useState(true);

  const [showSidebar, setShowSidebar] = useState(true);
  
  // NEW: Dark mode & Selected Node state
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [selectedNodeData, setSelectedNodeData] = useState(null);
 
  // React Flow state
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);

  // NEW: Dark Mode Effect to toggle HTML class
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  // UPDATED: Added dark mode color variants
  const getNodeColor = (level) => {
    const colors = [
      { bg: 'bg-indigo-50 dark:bg-indigo-900/30', border: 'border-indigo-500 dark:border-indigo-400', text: 'text-indigo-900 dark:text-indigo-100', dot: 'bg-indigo-500' },
      { bg: 'bg-teal-50 dark:bg-teal-900/30', border: 'border-teal-500 dark:border-teal-400', text: 'text-teal-900 dark:text-teal-100', dot: 'bg-teal-500' },
      { bg: 'bg-purple-50 dark:bg-purple-900/30', border: 'border-purple-500 dark:border-purple-400', text: 'text-purple-900 dark:text-purple-100', dot: 'bg-purple-500' },
      { bg: 'bg-emerald-50 dark:bg-emerald-900/30', border: 'border-emerald-500 dark:border-emerald-400', text: 'text-emerald-900 dark:text-emerald-100', dot: 'bg-emerald-500' },
      { bg: 'bg-slate-50 dark:bg-slate-800', border: 'border-slate-500 dark:border-slate-400', text: 'text-slate-900 dark:text-slate-100', dot: 'bg-slate-500' },
      { bg: 'bg-blue-50 dark:bg-blue-900/30', border: 'border-blue-500 dark:border-blue-400', text: 'text-blue-900 dark:text-blue-100', dot: 'bg-blue-500' },
    ];
    return colors[level % colors.length];
  };

  const fetchMindMap = async () => {
    try {
      const response = await api.get(`/module2/generate/mindmaps/${id}`);
      const data = response.data;
      setMindMap(data);

      // Transform nodes and edges for React Flow
      const initialNodes = data.nodes.map((node) => ({
        id: node.id,
        type: 'custom',
        data: { 
          label: node.label, 
          description: node.description, 
          level: node.level,
          color: getNodeColor(node.level),
          // MOCK DATA: Assuming your backend will send this soon
          sourceMeta: node.sourceMeta || { 
            page: Math.floor(Math.random() * 20) + 1, 
            line: Math.floor(Math.random() * 15) + 1, 
            excerpt: `This is context from the PDF regarding ${node.label}.` 
          }
        },
        position: { x: 0, y: 0 }, // Position will be set by dagre
      }));

      const initialEdges = data.nodes
        .filter((node) => node.parentId !== null)
        .map((node) => ({
          id: `e${node.parentId}-${node.id}`,
          source: node.parentId,
          target: node.id,
          type: 'smoothstep',
          animated: true,
          // UPDATED: Dynamic edge stroke color for dark mode
          style: { stroke: isDarkMode ? '#818cf8' : '#6366f1', strokeWidth: 2 },
          markerEnd: {
            type: MarkerType.ArrowClosed,
            color: isDarkMode ? '#818cf8' : '#6366f1',
          },
        }));

      const layouted = getLayoutedElements(initialNodes, initialEdges);
      setNodes(layouted.nodes);
      setEdges(layouted.edges);
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
    // eslint-disable-next-line
  }, [id, isDarkMode]); // Re-fetch or update edges when dark mode changes

  const onLayout = (direction) => {
    const layouted = getLayoutedElements(nodes, edges, direction);
    setNodes([...layouted.nodes]);
    setEdges([...layouted.edges]);
  };

  // NEW: Node Click Handlers
  const onNodeClick = (event, node) => {
    setSelectedNodeData(node.data);
  };
  
  const onPaneClick = () => {
    setSelectedNodeData(null);
  };

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

 
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-slate-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-gradient-to-r from-indigo-500 to-purple-600 animate-pulse flex items-center justify-center shadow-lg shadow-indigo-100 dark:shadow-none">
            <Loader2 className="w-6 h-6 text-white animate-spin" />
          </div>
          <span className="text-sm text-gray-500 dark:text-gray-400">Loading mind map...</span>
        </div>
      </div>
    );
  }

  if (!mindMap) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-slate-50 dark:from-slate-900 dark:to-slate-950">
        <div className="text-center py-12">
          <p className="text-gray-500 dark:text-gray-400">Mind map not found</p>
          <button
            onClick={() => navigate('/module2')}
            className="mt-4 text-indigo-600 dark:text-indigo-400 hover:text-indigo-700"
          >
            Return to Study Tools
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-slate-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 flex flex-col overflow-hidden transition-colors duration-300">
      {/* Header */}
      <header className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-indigo-100 dark:border-slate-800 sticky top-0 z-50">
        <div className="px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3 cursor-pointer" onClick={() => navigate('/module2')}>
              <div className="p-2 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl shadow-lg shadow-indigo-100 dark:shadow-none">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <span className="font-bold text-gray-900 dark:text-white">StudyAI</span>
            </div>
            
            <nav className="hidden md:flex items-center gap-6">
              <button onClick={() => navigate('/module2')} className="text-sm text-gray-500 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">Quizzes</button>
              <button onClick={() => navigate('/module2')} className="text-sm text-gray-500 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">Flashcards</button>
              <button onClick={() => navigate('/module2')} className="text-sm font-medium text-indigo-600 dark:text-indigo-400">Mind Maps</button>
              <button onClick={() => navigate('/module2')} className="text-sm text-gray-500 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">Library</button>
            </nav>
            
            <div className="flex items-center gap-4">
              {/* NEW: Dark Mode Toggle */}
              <button 
                onClick={() => setIsDarkMode(!isDarkMode)}
                className="p-2 rounded-lg text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors"
              >
                {isDarkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
              </button>

              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-medium text-sm shadow-md">
                U
              </div>
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
              className="bg-white dark:bg-slate-900 border-r border-indigo-100 dark:border-slate-800 flex flex-col overflow-y-auto z-10"
            >
              {/* Active Mind Map */}
              <div className="p-4 border-b border-indigo-100 dark:border-slate-800">
                <h3 className="text-xs font-semibold text-gray-400 dark:text-slate-500 uppercase tracking-wide mb-3">Active Mind Map</h3>
                <div className="p-3 bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-slate-800 dark:to-slate-800 rounded-xl border border-indigo-100 dark:border-slate-700 shadow-sm">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg shadow-md">
                      <Network className="w-4 h-4 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{mindMap.title}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">{mindMap.totalNodes} nodes</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Navigation Links */}
              <div className="p-4 border-b border-indigo-100 dark:border-slate-800">
                <h3 className="text-xs font-semibold text-gray-400 dark:text-slate-500 uppercase tracking-wide mb-3">Navigation</h3>
                <div className="space-y-1">
                  <button 
                    onClick={() => navigate('/module2')}
                    className="w-full flex items-center gap-3 px-3 py-2 text-sm text-gray-600 dark:text-gray-300 hover:bg-indigo-50 dark:hover:bg-slate-800 hover:text-indigo-600 dark:hover:text-indigo-400 rounded-lg transition-all group"
                  >
                    <FolderOpen className="w-4 h-4 text-gray-400 dark:text-slate-500 group-hover:text-indigo-500 dark:group-hover:text-indigo-400" />
                    Library
                  </button>
                  <button 
                    onClick={() => navigate('/module2')}
                    className="w-full flex items-center gap-3 px-3 py-2 text-sm text-gray-600 dark:text-gray-300 hover:bg-indigo-50 dark:hover:bg-slate-800 hover:text-indigo-600 dark:hover:text-indigo-400 rounded-lg transition-all group"
                  >
                    <BookOpen className="w-4 h-4 text-gray-400 dark:text-slate-500 group-hover:text-indigo-500 dark:group-hover:text-indigo-400" />
                    Quizzes
                  </button>
                  <button 
                    onClick={() => navigate('/module2')}
                    className="w-full flex items-center gap-3 px-3 py-2 text-sm text-gray-600 dark:text-gray-300 hover:bg-indigo-50 dark:hover:bg-slate-800 hover:text-indigo-600 dark:hover:text-indigo-400 rounded-lg transition-all group"
                  >
                    <Layers className="w-4 h-4 text-gray-400 dark:text-slate-500 group-hover:text-indigo-500 dark:group-hover:text-indigo-400" />
                    Flashcards
                  </button>
                </div>
              </div>

              {/* Favorites placeholder */}
              <div className="p-4 mt-auto">
                <div className="text-center py-6 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-700">
                  <Heart className="w-6 h-6 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
                  <p className="text-[11px] text-slate-400 dark:text-slate-500 font-medium">Add to favorites for quick access</p>
                </div>
              </div>
            </motion.aside>
          )}
        </AnimatePresence>

        {/* Main Content */}
        <main className="flex-1 flex flex-col overflow-hidden">
          {/* Mind Map Info Bar */}
          <div className="px-6 py-4 bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm border-b border-indigo-100 dark:border-slate-800 z-10">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-xl font-bold text-gray-900 dark:text-white">{mindMap.title}</h1>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                  Central Topic: <span className="font-semibold text-indigo-600 dark:text-indigo-400">{mindMap.centralTopic}</span>
                  <span className="mx-2 opacity-30">•</span>
                  {mindMap.subject}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowSidebar(!showSidebar)}
                  className={`p-2 rounded-lg transition-all ${showSidebar ? 'bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400' : 'bg-gray-100 dark:bg-slate-800 text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-slate-700'}`}
                  title={showSidebar ? "Hide sidebar" : "Show sidebar"}
                >
                  <Layers className="w-5 h-5" />
                </button>
                <button
                  onClick={handleDownload}
                  className="p-2 text-gray-500 dark:text-gray-400 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 hover:text-indigo-600 dark:hover:text-indigo-400 rounded-lg transition-all"
                  title="Download as JSON"
                >
                  <Download className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>

          {/* Mind Map Visualization */}
          <div className="flex-1 bg-slate-50 dark:bg-slate-950 relative">
            <ReactFlow
              nodes={nodes}
              edges={edges}
              onNodesChange={onNodesChange}
              onEdgesChange={onEdgesChange}
              onNodeClick={onNodeClick}
              onPaneClick={onPaneClick}
              nodeTypes={nodeTypes}
              fitView
              minZoom={0.1}
              maxZoom={2}
            >
              <Background color={isDarkMode ? "#334155" : "#e2e8f0"} gap={20} />
              <Controls className={`!shadow-lg !rounded-xl ${isDarkMode ? '!bg-slate-800 !border-slate-700 !fill-slate-200' : '!bg-white !border-indigo-100'}`} />
              <MiniMap 
                nodeStrokeColor={(n) => n.data.color.border}
                nodeColor={(n) => isDarkMode ? '#1e293b' : n.data.color.bg.split(' ')[0].replace('bg-', '')}
                maskColor={isDarkMode ? "rgba(15, 23, 42, 0.8)" : "rgba(99, 102, 241, 0.05)"}
                className={`!shadow-lg !rounded-xl ${isDarkMode ? '!bg-slate-900 !border-slate-800' : '!bg-white !border-indigo-100'}`}
              />
            </ReactFlow>
          </div>

          {/* Bottom Toolbar */}
          <div className="px-6 py-4 bg-white dark:bg-slate-900 border-t border-indigo-100 dark:border-slate-800 z-10 shadow-[0_-4px_20px_-10px_rgba(0,0,0,0.1)] dark:shadow-none">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => onLayout('TB')}
                  className="flex items-center gap-2 px-5 py-2.5 text-sm font-bold text-gray-700 dark:text-gray-300 bg-slate-100 dark:bg-slate-800 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 hover:text-indigo-600 dark:hover:text-indigo-400 rounded-xl transition-all"
                >
                  <Maximize2 className="w-4 h-4" />
                   Vertical Layout
                </button>
                <button
                     onClick={() => onLayout('LR')}
                  className="flex items-center gap-2 px-5 py-2.5 text-sm font-bold text-gray-700 dark:text-gray-300 bg-slate-100 dark:bg-slate-800 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 hover:text-indigo-600 dark:hover:text-indigo-400 rounded-xl transition-all"
                >
                  <Minimize2 className="w-4 h-4" />
                Horizontal Layout
                </button>
              </div>

              <button
                onClick={() => {
                    toast.success('Refreshing layout...');
                  fetchMindMap();
                }}
                className="flex items-center gap-2 px-6 py-2.5 text-sm font-bold text-white bg-gradient-to-r from-indigo-500 to-purple-600 hover:shadow-lg shadow-indigo-100 dark:shadow-none rounded-xl transition-all hover:scale-105"
              >
                <RefreshCw className="w-4 h-4" />
                Reset View
              </button>
            </div>
          </div>
        </main>

        {/* Right Panel - Source & Legend (WITH NEW CONTEXT SWITCHER) */}
        <aside className="w-72 bg-white dark:bg-slate-900 border-l border-indigo-100 dark:border-slate-800 flex flex-col overflow-y-auto hidden xl:flex z-10">
          
          {/* Source Document - ALWAYS VISIBLE */}
          <div className="p-5 border-b border-indigo-100 dark:border-slate-800">
            <h3 className="text-[10px] font-black text-gray-400 dark:text-slate-500 uppercase tracking-widest mb-4">Source Material</h3>
            <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-inner dark:shadow-none">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-indigo-100 dark:bg-indigo-900/50 rounded-xl">
                  <FileText className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-gray-900 dark:text-white truncate">{mindMap.sourceFile || 'Uploaded PDF'}</p>
                  <p className="text-[10px] text-indigo-500 dark:text-indigo-400 font-bold uppercase tracking-tight">{mindMap.subject}</p>
                </div>
              </div>
            </div>
          </div>

          {/* DYNAMIC CONTENT SWITCHER */}
          {selectedNodeData ? (
            
            // NEW: Shows when a node is clicked
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-5 flex-1 flex flex-col"
            >
              <h3 className="text-[10px] font-black text-indigo-500 dark:text-indigo-400 uppercase tracking-widest mb-4">Extracted Context</h3>
              
              <div className="mb-4">
                <h4 className="text-sm font-bold text-slate-800 dark:text-white">{selectedNodeData.label}</h4>
              </div>

              <div className="bg-slate-50 dark:bg-slate-800/50 rounded-2xl p-4 border border-slate-200 dark:border-slate-700 relative flex-1">
                <div className="flex items-center justify-between mb-3 pb-3 border-b border-slate-200 dark:border-slate-700">
                  <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase">Citation Details</span>
                  <div className="flex items-center gap-1.5 text-[10px] font-bold px-2 py-1 rounded bg-white dark:bg-slate-700 text-slate-600 dark:text-slate-300 shadow-sm border border-slate-100 dark:border-slate-600">
                    <FileText className="w-3 h-3" />
                    Pg {selectedNodeData.sourceMeta?.page} 
                    <span className="opacity-40">|</span> 
                    Ln {selectedNodeData.sourceMeta?.line}
                  </div>
                </div>
                
                <div className="relative mt-2">
                  <Quote className="absolute -top-2 -left-2 w-6 h-6 opacity-10 text-indigo-500 dark:text-indigo-400" />
                  <p className="text-sm italic pl-4 leading-relaxed text-slate-700 dark:text-slate-300 relative z-10">
                    "{selectedNodeData.sourceMeta?.excerpt}"
                  </p>
                </div>
              </div>
            </motion.div>

          ) : (
            // ORIGINAL: Shows when NO node is clicked
            <>
              {/* Navigator Minimap placeholder */}
              <div className="p-5 flex-1">
                <h3 className="text-[10px] font-black text-gray-400 dark:text-slate-500 uppercase tracking-widest mb-4">Navigator</h3>
                <div className="aspect-square bg-gradient-to-br from-indigo-50 to-slate-50 dark:from-slate-800 dark:to-slate-900 rounded-3xl border-2 border-dashed border-indigo-200 dark:border-slate-700 p-6 flex items-center justify-center relative overflow-hidden group">
                  <div className="absolute inset-0 bg-white/20 dark:bg-black/20 backdrop-blur-[2px] opacity-0 group-hover:opacity-100 transition-opacity" />
                  <div className="relative z-10 text-center">
                    <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-xl shadow-indigo-100 dark:shadow-none border-4 border-white dark:border-slate-800">
                      <Map className="w-8 h-8 text-white" />
                    </div>
                    <p className="text-[10px] font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-tighter">View Matrix</p>
                    <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-1">{mindMap.totalNodes} Nodes Mapped</p>
                  </div>
                </div>
              </div>

              {/* Legend */}
              <div className="p-5 border-t border-indigo-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/20">
                <h3 className="text-[10px] font-black text-gray-400 dark:text-slate-500 uppercase tracking-widest mb-4">Legend</h3>
                <div className="space-y-3">
                  {[
                    { color: 'bg-indigo-500', label: 'Main Branches', desc: 'Core concepts' },
                    { color: 'bg-teal-500', label: 'Sub-topics', desc: 'Detailed areas' },
                    { color: 'bg-purple-500', label: 'Nodes', desc: 'Specific details' },
                  ].map((item, idx) => (
                    <div key={idx} className="flex items-start gap-3">
                      <div className={`w-3 h-3 rounded-full ${item.color} mt-1 shadow-sm`} />
                      <div>
                        <p className="text-xs font-bold text-gray-700 dark:text-slate-300 leading-none">{item.label}</p>
                        <p className="text-[10px] text-gray-400 dark:text-slate-500 mt-0.5">{item.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}

        </aside>
      </div>
    </div>
  );
};

export default MindMapView;