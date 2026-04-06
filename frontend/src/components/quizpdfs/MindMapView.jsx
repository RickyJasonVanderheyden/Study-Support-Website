import React, { useState, useEffect, useRef } from 'react';
/*
 * ══════════════════════════════════════════════════════
 *  MODULE 2 — THEMED COMPONENT
 *  Palette: Soft Mint / Warm Cream / Forest Green / Amber-Orange
 *  --cream: #F7F4EE  --mint: #D6ECD8  --forest: #1E4D35
 *  --cta: #E8820C    --surface: #FFFDF8
 *  Font: DM Sans (loaded by Module2Page)
 * ══════════════════════════════════════════════════════
 */
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  Network, 
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
  BookOpen,
  Sun,
  Moon,
  Quote,
  Search,
  X,
  Play,
  SkipForward,
  SkipBack,
  List
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import api from '../../services/api';

// Tree Outline Component
const TreeNode = ({ node, searchMatches, onNodeClick, selectedNodeId }) => {
  const [expanded, setExpanded] = useState(true);
  const isMatched = searchMatches.includes(node.id);
  const isSelected = selectedNodeId === node.id;

  return (
    <div>
      <div
        onClick={() => onNodeClick(node)}
        className={`px-3 py-2 rounded-lg cursor-pointer transition-all flex items-center gap-2 ${
          isSelected
            ? 'bg-[#FFF0DC] dark:bg-[#1E4D35]/50 text-[#C96800] dark:text-[#E8820C]'
            : isMatched
            ? 'bg-yellow-50 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-300'
            : 'text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-800'
        }`}
      >
        {node.children?.length > 0 && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              setExpanded(!expanded);
            }}
            className="p-0"
          >
            {expanded ? (
              <ChevronDown className="w-3.5 h-3.5" />
            ) : (
              <ChevronRight className="w-3.5 h-3.5" />
            )}
          </button>
        )}
        {node.children?.length === 0 && <div className="w-3.5" />}
        <span className="text-xs font-semibold truncate flex-1">{node.data.label}</span>
      </div>
      {expanded && node.children?.length > 0 && (
        <div className="ml-3 border-l border-gray-200 dark:border-slate-700 pl-2 space-y-1">
          {node.children.map(child => (
            <TreeNode
              key={child.id}
              node={child}
              searchMatches={searchMatches}
              onNodeClick={onNodeClick}
              selectedNodeId={selectedNodeId}
            />
          ))}
        </div>
      )}
    </div>
  );
};

// Table of Contents Component
const TableOfContents = ({ nodes, searchMatches, onNodeClick, selectedNodeId }) => {
  const nodesByLevel = getNodesByLevel(nodes);
  const levels = Object.keys(nodesByLevel)
    .map(Number)
    .sort((a, b) => a - b);

  return (
    <div className="space-y-4">
      {levels.map(level => (
        <div key={level}>
          <h4 className="text-[10px] font-black text-gray-400 dark:text-[#7A9080] uppercase tracking-widest mb-2 px-3">
            Level {level + 1}
          </h4>
          <div className="space-y-1">
            {nodesByLevel[level].map(node => (
              <button
                key={node.id}
                onClick={() => onNodeClick({ data: node.data, id: node.id })}
                className={`w-full text-left px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  selectedNodeId === node.id
                    ? 'bg-[#FFF0DC] dark:bg-[#1E4D35]/50 text-[#C96800] dark:text-[#E8820C]'
                    : searchMatches.includes(node.id)
                    ? 'bg-yellow-50 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-300'
                    : 'text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-800'
                }`}
              >
                {node.data.label}
              </button>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};

// Tour Controls Component
const TourControls = ({ currentTourIndex, totalTourSteps, onNext, onPrev, onExitTour }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex items-center gap-2 p-2.5 bg-gradient-to-r from-[#FFF0DC] to-[#FFE3B8] dark:from-[#1E4D35]/40 dark:to-[#1E4D35]/20 rounded-xl border border-[#E8820C] dark:border-[#E8820C]/50"
    >
      <Play className="w-4 h-4 text-[#C96800] dark:text-[#E8820C] flex-shrink-0" />
      <div className="flex-1">
        <p className="text-xs font-bold text-[#1E4D35] dark:text-[#E8820C]">
          Guided Tour: {currentTourIndex + 1} / {totalTourSteps}
        </p>
        <p className="text-[11px] text-gray-600 dark:text-gray-300">Step through each concept</p>
      </div>
      <div className="flex items-center gap-2">
        <button
          onClick={onPrev}
          disabled={currentTourIndex === 0}
          className="p-1 rounded-lg bg-white dark:bg-slate-800 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
        >
          <SkipBack className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={onNext}
          disabled={currentTourIndex === totalTourSteps - 1}
          className="p-1 rounded-lg bg-white dark:bg-slate-800 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
        >
          <SkipForward className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={onExitTour}
          className="px-2.5 py-1 rounded-lg bg-[#C96800] hover:bg-[#B85C00] text-white text-[11px] font-bold transition-all"
        >
          Exit
        </button>
      </div>
    </motion.div>
  );
};

// Utility Functions for Search, Filter, and Tour
const buildTreeHierarchy = (nodes, edges) => {
  const nodeMap = {};
  nodes.forEach(node => {
    nodeMap[node.id] = { ...node, children: [] };
  });

  edges.forEach(edge => {
    if (nodeMap[edge.source] && nodeMap[edge.target]) {
      nodeMap[edge.source].children.push(nodeMap[edge.target]);
    }
  });

  // Find root nodes (no incoming edges)
  const incomingEdges = new Set(edges.map(e => e.target));
  return Object.values(nodeMap).filter(node => !incomingEdges.has(node.id));
};

const searchNodes = (nodes, query) => {
  if (!query.trim()) return nodes.map(n => n.id);
  
  const lowerQuery = query.toLowerCase();
  const matching = new Set();
  
  const traverse = (node) => {
    if (
      node.data.label.toLowerCase().includes(lowerQuery) ||
      node.data.description?.toLowerCase().includes(lowerQuery)
    ) {
      matching.add(node.id);
    }
  };

  nodes.forEach(traverse);
  return Array.from(matching);
};

const getNodesByLevel = (nodes) => {
  const levels = {};
  nodes.forEach(node => {
    const level = node.data.level || 0;
    if (!levels[level]) levels[level] = [];
    levels[level].push(node);
  });
  return levels;
};

const getTourOrder = (nodes, edges) => {
  const roots = buildTreeHierarchy(nodes, edges);
  const order = [];
  const visited = new Set();

  const bfs = (node) => {
    if (visited.has(node.id)) return;
    visited.add(node.id);
    order.push(node.id);
    node.children.forEach(child => bfs(child));
  };

  roots.forEach(root => bfs(root));
  return order;
};

const getChildrenMap = (edges) => {
  const map = new Map();
  edges.forEach((edge) => {
    if (!map.has(edge.source)) {
      map.set(edge.source, []);
    }
    map.get(edge.source).push(edge.target);
  });
  return map;
};

const getParentMap = (edges) => {
  const map = new Map();
  edges.forEach((edge) => {
    map.set(edge.target, edge.source);
  });
  return map;
};

const collectAncestorIds = (nodeId, parentMap) => {
  const result = [];
  let current = parentMap.get(nodeId);
  while (current) {
    result.push(current);
    current = parentMap.get(current);
  }
  return result;
};

const getToneClasses = (level = 0) => {
  const tones = [
    {
      card: 'bg-[#FFF2E2] dark:bg-[#2A1A06] border-[#E8820C] dark:border-[#E8820C] text-[#6B3B02] dark:text-[#FFD7A4]',
      dot: 'bg-[#E8820C]'
    },
    {
      card: 'bg-[#EAF8EE] dark:bg-[#0F2818] border-emerald-400 dark:border-emerald-500 text-emerald-800 dark:text-emerald-200',
      dot: 'bg-emerald-500'
    },
    {
      card: 'bg-[#EAF5FF] dark:bg-[#0D2235] border-sky-400 dark:border-sky-500 text-sky-900 dark:text-sky-200',
      dot: 'bg-sky-500'
    },
    {
      card: 'bg-[#F4EEFF] dark:bg-[#24143B] border-violet-400 dark:border-violet-500 text-violet-900 dark:text-violet-200',
      dot: 'bg-violet-500'
    }
  ];
  return tones[level % tones.length];
};

const MindMapView = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [mindMap, setMindMap] = useState(null);
  const [loading, setLoading] = useState(true);
  const graphScrollRef = useRef(null);

  const [showSidebar, setShowSidebar] = useState(true);
  
  // Dark mode & Selected Node state
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [selectedNodeData, setSelectedNodeData] = useState(null);
  const [selectedNodeId, setSelectedNodeId] = useState(null);
  
  // NEW: Search, Filter, and Tour states
  const [searchQuery, setSearchQuery] = useState('');
  const [filterLevel, setFilterLevel] = useState(null);
  const [tourMode, setTourMode] = useState(false);
  const [currentTourIndex, setCurrentTourIndex] = useState(0);
  const [tourOrder, setTourOrder] = useState([]);
  const [viewMode, setViewMode] = useState('graph'); // 'graph', 'outline', 'toc'
  const [highlightedNodes, setHighlightedNodes] = useState(new Set());
  const [expandedNodeIds, setExpandedNodeIds] = useState(new Set());
  const [suspendAutoExpand, setSuspendAutoExpand] = useState(false);
  const [showAllRoots, setShowAllRoots] = useState(true);
 
  // Diagram state
  const [nodes, setNodes] = useState([]);
  const [edges, setEdges] = useState([]);

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
      { bg: 'bg-[#FFF0DC] dark:bg-[#1E4D35]/30', border: 'border-[#E8820C] dark:border-[#E8820C]', text: 'text-[#1A2E23] dark:text-[#D6ECD8]', dot: 'bg-[#E8820C]' },
      { bg: 'bg-teal-50 dark:bg-teal-900/30', border: 'border-teal-500 dark:border-teal-400', text: 'text-teal-900 dark:text-teal-100', dot: 'bg-teal-500' },
      { bg: 'bg-[#FFF0DC] dark:bg-[#1E4D35]/30', border: 'border-[#E8820C] dark:border-[#E8820C]', text: 'text-[#1A2E23] dark:text-[#D6ECD8]', dot: 'bg-[#E8820C]' },
      { bg: 'bg-emerald-50 dark:bg-emerald-900/30', border: 'border-emerald-500 dark:border-emerald-400', text: 'text-emerald-900 dark:text-emerald-100', dot: 'bg-emerald-500' },
      { bg: 'bg-[#F7F4EE] dark:bg-slate-800', border: 'border-[#7A9080] dark:border-[#7A9080]', text: 'text-[#1A2E23] dark:text-[#F7F4EE]', dot: 'bg-[#F7F4EE]0' },
      { bg: 'bg-blue-50 dark:bg-blue-900/30', border: 'border-blue-500 dark:border-blue-400', text: 'text-blue-900 dark:text-blue-100', dot: 'bg-blue-500' },
    ];
    return colors[level % colors.length];
  };

  const fetchMindMap = async () => {
    try {
      const response = await api.get(`/module2/generate/mindmaps/${id}`);
      const data = response.data;
      setMindMap(data);

      // Transform nodes and edges for static diagram
      const initialNodes = data.nodes.map((node) => ({
        id: node.id,
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
        }
      }));

      const initialEdges = data.nodes
        .filter((node) => node.parentId !== null)
        .map((node) => ({
          id: `e${node.parentId}-${node.id}`,
          source: node.parentId,
          target: node.id
        }));

      setNodes(initialNodes);
      setEdges(initialEdges);

      setExpandedNodeIds(new Set());
      setSuspendAutoExpand(true);
      setShowAllRoots(false);
      
      // Initialize tour order
      const order = getTourOrder(initialNodes, initialEdges);
      setTourOrder(order);
    } catch (error) {
      console.error('Error fetching mind map:', error);
      toast.error('Failed to load mind map');
      navigate('/module2');
    } finally {
      setLoading(false);
    }
  };

  // Handle search and filter
  useEffect(() => {
    if (!nodes.length) return;
    
    let matched = searchNodes(nodes, searchQuery);
    
    // Filter by level if selected
    if (filterLevel !== null) {
      matched = matched.filter(nodeId => {
        const node = nodes.find(n => n.id === nodeId);
        return node?.data.level === filterLevel;
      });
    }
    
    setHighlightedNodes(new Set(matched));
  }, [searchQuery, filterLevel, nodes.length]);

  // Handle tour navigation
  const scrollToNode = (nodeId, options = {}) => {
    const { behavior = 'smooth', retries = 6, delayMs = 80 } = options;
    const container = graphScrollRef.current;
    if (!container) return;

    let attempt = 0;
    const tryScroll = () => {
      const target = container.querySelector(`[data-node-id="${nodeId}"]`);
      if (target) {
        target.scrollIntoView({ behavior, block: 'center', inline: 'nearest' });
        return;
      }

      if (attempt < retries) {
        attempt += 1;
        setTimeout(tryScroll, delayMs);
      }
    };

    tryScroll();
  };

  useEffect(() => {
    if (!tourMode || tourOrder.length === 0) return;
    if (suspendAutoExpand) return;
    if (viewMode !== 'graph') {
      setViewMode('graph');
    }
    
    const currentNodeId = tourOrder[currentTourIndex];
    const currentNode = nodes.find(n => n.id === currentNodeId);
    
    if (currentNode) {
      const parentMap = getParentMap(edges);
      const ancestors = collectAncestorIds(currentNodeId, parentMap);
      setExpandedNodeIds((prev) => new Set([...prev, ...ancestors]));
      // Update selected node data
      setSelectedNodeData(currentNode.data);
      setSelectedNodeId(currentNodeId);
      scrollToNode(currentNodeId, { behavior: 'smooth', retries: 8, delayMs: 90 });
    }
  }, [tourMode, currentTourIndex, tourOrder, nodes, edges, viewMode, suspendAutoExpand]);

  useEffect(() => {
    if (!searchQuery.trim() || highlightedNodes.size === 0) return;
    if (suspendAutoExpand) return;

    const parentMap = getParentMap(edges);
    const ancestorsToOpen = new Set();
    highlightedNodes.forEach((id) => {
      collectAncestorIds(id, parentMap).forEach((ancestorId) => ancestorsToOpen.add(ancestorId));
    });

    if (ancestorsToOpen.size > 0) {
      setExpandedNodeIds((prev) => new Set([...prev, ...ancestorsToOpen]));
    }
  }, [searchQuery, highlightedNodes, edges, suspendAutoExpand]);

  useEffect(() => {
    fetchMindMap();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]); // Only re-fetch when ID changes

  const expandAll = () => {
    setSuspendAutoExpand(false);
    setShowAllRoots(true);
    setExpandedNodeIds(new Set(nodes.map((n) => n.id)));
    toast.success('Expanded all nodes');
  };

  const collapseAll = () => {
    setSuspendAutoExpand(true);
    setTourMode(false);
    setCurrentTourIndex(0);
    setSearchQuery('');
    setShowAllRoots(false);
    setExpandedNodeIds(new Set());
    setSelectedNodeData(null);
    setSelectedNodeId(null);
    if (graphScrollRef.current) {
      graphScrollRef.current.scrollTo({ top: 0, behavior: 'smooth' });
    }
    toast.success('Fully collapsed view');
  };

  // NEW: Node Click Handlers
  const onNodeClick = (event, node) => {
    if (typeof event === 'object' && event.data) {
      // Called from outline/TOC
      setSelectedNodeData(event.data);
      setSelectedNodeId(event.id);
      const parentMap = getParentMap(edges);
      const ancestors = collectAncestorIds(event.id, parentMap);
      setExpandedNodeIds((prev) => new Set([...prev, ...ancestors]));
      scrollToNode(event.id);
    } else {
      // Called from graph
      setSelectedNodeData(node.data);
      setSelectedNodeId(node.id);
    }
  };
  
  const onPaneClick = () => {
    setSelectedNodeData(null);
    setSelectedNodeId(null);
  };

  const handleTourNext = () => {
    if (currentTourIndex < tourOrder.length - 1) {
      setCurrentTourIndex(currentTourIndex + 1);
    }
  };

  const handleTourPrev = () => {
    if (currentTourIndex > 0) {
      setCurrentTourIndex(currentTourIndex - 1);
    }
  };

  const handleExitTour = () => {
    setTourMode(false);
    setCurrentTourIndex(0);
    setSelectedNodeData(null);
    setSelectedNodeId(null);
  };

  const childrenMap = getChildrenMap(edges);
  const parentMap = getParentMap(edges);
  const targetNodes = new Set(edges.map((e) => e.target));
  const rootNodes = nodes
    .filter((n) => !targetNodes.has(n.id))
    .sort((a, b) => (a.data.level ?? 0) - (b.data.level ?? 0));
  const visibleRootNodes = showAllRoots ? rootNodes : rootNodes.slice(0, 5);

  const renderDiagramNode = (nodeId, depth = 0) => {
    const node = nodes.find((n) => n.id === nodeId);
    if (!node) return null;

    const children = childrenMap.get(nodeId) || [];
    const hasChildren = children.length > 0;
    const isExpanded = expandedNodeIds.has(nodeId);
    const tone = getToneClasses(node.data.level ?? 0);
    const isHighlighted = highlightedNodes.size === 0 || highlightedNodes.has(node.id);
    const isSelected = selectedNodeId === node.id;
    const isCalmView = suspendAutoExpand && !showAllRoots;
    const indent = Math.min(depth * 20, 80);

    return (
      <div key={node.id} className="space-y-2">
        <motion.button
          data-node-id={node.id}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: isHighlighted ? 1 : 0.35, y: 0 }}
          onClick={(e) => {
            e.stopPropagation();
            setSelectedNodeData(node.data);
            setSelectedNodeId(node.id);
            if (hasChildren) {
              setExpandedNodeIds((prev) => {
                const next = new Set(prev);
                if (next.has(node.id)) {
                  next.delete(node.id);
                } else {
                  next.add(node.id);
                }
                return next;
              });
            }
          }}
          className={`w-full text-left rounded-xl border transition-all px-4 ${isCalmView ? 'py-2' : 'py-2.5'} ${tone.card} ${
            isSelected ? 'ring-2 ring-offset-1 ring-[#E8820C] dark:ring-[#FFB25A]' : ''
          }`}
          style={{ marginLeft: `${indent}px`, width: `calc(100% - ${indent}px)` }}
        >
          <div className="flex items-start gap-3">
            <div className={`mt-1 w-2.5 h-2.5 rounded-full ${tone.dot} flex-shrink-0`} />
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm font-bold truncate">{node.data.label}</p>
                {hasChildren && (
                  <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wide opacity-80">
                    {isExpanded ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                    {isExpanded ? 'Collapse' : 'Expand'}
                  </span>
                )}
              </div>
              {!isCalmView && node.data.description && (
                <p className="text-xs mt-1 leading-relaxed line-clamp-2 opacity-85">{node.data.description}</p>
              )}
              <div className="mt-2 flex items-center gap-2 text-[10px] font-bold uppercase tracking-wide opacity-70">
                <span>Level {(node.data.level ?? 0) + 1}</span>
                {parentMap.has(node.id) && <span>Related</span>}
              </div>
            </div>
          </div>
        </motion.button>

        {hasChildren && isExpanded && (
          <div className="space-y-2">
            {children.map((childId) => renderDiagramNode(childId, depth + 1))}
          </div>
        )}
      </div>
    );
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
      <div className="min-h-screen bg-gradient-to-br from-[#E8F5E9] via-[#F7F4EE] to-[#EDE8DF] dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-gradient-to-r from-[#E8820C] to-[#C96800] animate-pulse flex items-center justify-center shadow-lg shadow-[rgba(30,77,53,0.08)] dark:shadow-none">
            <Loader2 className="w-6 h-6 text-white animate-spin" />
          </div>
          <span className="text-sm text-gray-500 dark:text-gray-400">Loading mind map...</span>
        </div>
      </div>
    );
  }

  if (!mindMap) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#E8F5E9] via-[#F7F4EE] to-[#EDE8DF] dark:from-slate-900 dark:to-slate-950">
        <div className="text-center py-12">
          <p className="text-gray-500 dark:text-gray-400">Mind map not found</p>
          <button
            onClick={() => navigate('/module2')}
            className="mt-4 text-[#C96800] dark:text-[#E8820C]/70 hover:text-[#275E41]"
          >
            Return to Study Tools
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen bg-gradient-to-br from-[#E8F5E9] via-[#F7F4EE] to-[#EDE8DF] dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 flex flex-col overflow-hidden transition-colors duration-300">
      {/* Header */}
      <header className="bg-[#FFFDF8]/90 dark:bg-slate-900/80 backdrop-blur-md border-b border-[#D8E8DC] dark:border-slate-800 sticky top-0 z-50">
        <div className="px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3 cursor-pointer" onClick={() => navigate('/module2')}>
              <div className="p-2 bg-gradient-to-r from-[#1E4D35] to-[#2E5C42] rounded-xl shadow-lg shadow-[rgba(30,77,53,0.08)] dark:shadow-none">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <span className="font-bold text-gray-900 dark:text-white">StudyAI</span>
            </div>
            
            <nav className="hidden md:flex items-center gap-6">
              <button onClick={() => navigate('/module2')} className="text-sm text-gray-500 dark:text-gray-400 hover:text-[#C96800] dark:hover:text-[#E8820C]/70 transition-colors">Quizzes</button>
              <button onClick={() => navigate('/module2')} className="text-sm text-gray-500 dark:text-gray-400 hover:text-[#C96800] dark:hover:text-[#E8820C]/70 transition-colors">Flashcards</button>
              <button onClick={() => navigate('/module2')} className="text-sm font-medium text-[#C96800] dark:text-[#E8820C]/70">Mind Maps</button>
              <button onClick={() => navigate('/module2')} className="text-sm text-gray-500 dark:text-gray-400 hover:text-[#C96800] dark:hover:text-[#E8820C]/70 transition-colors">Library</button>
            </nav>
            
            <div className="flex items-center gap-4">
              {/* NEW: Dark Mode Toggle */}
              <button 
                onClick={() => setIsDarkMode(!isDarkMode)}
                className="p-2 rounded-lg text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors"
              >
                {isDarkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
              </button>

              <div className="w-9 h-9 rounded-full bg-gradient-to-r from-[#1E4D35] to-[#2E5C42] flex items-center justify-center text-white font-medium text-sm shadow-md">
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
              className="bg-white dark:bg-slate-900 border-r border-[#D8E8DC] dark:border-slate-800 flex flex-col overflow-y-auto z-10"
            >
              {/* Back Button */}
              <div className="p-4 border-b border-[#D8E8DC] dark:border-slate-800">
                <button
                  onClick={() => navigate('/module2')}
                  className="flex items-center gap-2 text-gray-500 dark:text-gray-400 hover:text-[#C96800] dark:hover:text-[#E8820C] text-sm transition-colors group"
                >
                  <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform duration-200" />
                  <span className="font-medium">Back to Library</span>
                </button>
              </div>

              {/* Active Mind Map */}
              <div className="p-4 border-b border-[#D8E8DC] dark:border-slate-800">
                <h3 className="text-xs font-semibold text-gray-400 dark:text-[#7A9080] uppercase tracking-wide mb-3">Active Mind Map</h3>
                <div className="p-3 bg-[#F7F4EE] dark:bg-slate-800 rounded-xl border border-[#D8E8DC] dark:border-slate-700 shadow-sm">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-[#1E4D35] rounded-lg shadow-md">
                      <Network className="w-4 h-4 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">{mindMap.title}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">{mindMap.totalNodes} nodes · {mindMap.subject}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Navigation Links */}
              <div className="p-4 border-b border-[#D8E8DC] dark:border-slate-800">
                <h3 className="text-xs font-semibold text-gray-400 dark:text-[#7A9080] uppercase tracking-wide mb-3">Study Tools</h3>
                <div className="space-y-1">
                  <button 
                    onClick={() => navigate('/module2?tab=library')}
                    className="w-full flex items-center gap-3 px-3 py-2 text-sm text-gray-600 dark:text-gray-300 hover:bg-[#FFF0DC] dark:hover:bg-slate-800 hover:text-[#C96800] dark:hover:text-[#E8820C] rounded-lg transition-all group"
                  >
                    <FolderOpen className="w-4 h-4 text-gray-400 dark:text-[#7A9080] group-hover:text-[#E8820C]" />
                    My Library
                  </button>
                  <button 
                    onClick={() => navigate('/module2')}
                    className="w-full flex items-center gap-3 px-3 py-2 text-sm text-gray-600 dark:text-gray-300 hover:bg-[#FFF0DC] dark:hover:bg-slate-800 hover:text-[#C96800] dark:hover:text-[#E8820C] rounded-lg transition-all group"
                  >
                    <BookOpen className="w-4 h-4 text-gray-400 dark:text-[#7A9080] group-hover:text-[#E8820C]" />
                    Quizzes
                  </button>
                  <button 
                    onClick={() => navigate('/module2')}
                    className="w-full flex items-center gap-3 px-3 py-2 text-sm text-[#C96800] dark:text-[#E8820C] bg-[#FFF0DC] dark:bg-[#1E4D35]/30 rounded-lg font-medium"
                  >
                    <Network className="w-4 h-4" />
                    Mind Maps
                  </button>
                  <button 
                    onClick={() => navigate('/module2')}
                    className="w-full flex items-center gap-3 px-3 py-2 text-sm text-gray-600 dark:text-gray-300 hover:bg-[#FFF0DC] dark:hover:bg-slate-800 hover:text-[#C96800] dark:hover:text-[#E8820C] rounded-lg transition-all group"
                  >
                    <Layers className="w-4 h-4 text-gray-400 dark:text-[#7A9080] group-hover:text-[#E8820C]" />
                    Flashcards
                  </button>
                </div>
              </div>
            </motion.aside>
          )}
        </AnimatePresence>

        {/* Main Content */}
        <main className="flex-1 min-h-0 flex flex-col overflow-hidden">
          {/* Mind Map Info Bar */}
          <div className="px-6 py-4 bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm border-b border-[#D8E8DC] dark:border-slate-800 z-10">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-xl font-bold text-gray-900 dark:text-white">{mindMap.title}</h1>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                  Central Topic: <span className="font-semibold text-[#C96800] dark:text-[#E8820C]/70">{mindMap.centralTopic}</span>
                  <span className="mx-2 opacity-30">•</span>
                  {mindMap.subject}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowSidebar(!showSidebar)}
                  className={`p-2 rounded-lg transition-all ${showSidebar ? 'bg-[#FFE3B8] dark:bg-[#1E4D35]/50 text-[#C96800] dark:text-[#E8820C]/70' : 'bg-gray-100 dark:bg-slate-800 text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-slate-700'}`}
                  title={showSidebar ? "Hide sidebar" : "Show sidebar"}
                >
                  <Layers className="w-5 h-5" />
                </button>
                <button
                  onClick={handleDownload}
                  className="p-2 text-gray-500 dark:text-gray-400 hover:bg-[#FFE3B8] dark:hover:bg-[#1E4D35]/50 hover:text-[#C96800] dark:hover:text-[#E8820C]/70 rounded-lg transition-all"
                  title="Download as JSON"
                >
                  <Download className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>

          {/* Mind Map Visualization */}
          <div className="flex-1 min-h-0 bg-[#F7F4EE] dark:bg-slate-950 relative">
            {/* Search & Filter Bar (floating) */}
            {viewMode === 'graph' && (
              <motion.div 
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="absolute top-4 left-4 right-4 z-20 flex gap-3 max-w-md"
              >
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-gray-600 pointer-events-none" />
                  <input
                    type="text"
                    placeholder="Search nodes..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 rounded-lg bg-white dark:bg-slate-800 border border-[#D8E8DC] dark:border-slate-700 text-sm focus:outline-none focus:ring-2 focus:ring-[#E8820C] dark:focus:ring-[#E8820C]/70 text-gray-900 dark:text-white"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery('')}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </motion.div>
            )}

            <div className="h-full min-h-0 p-4 sm:p-6">
              <div className="h-full min-h-0 rounded-2xl border border-[#D8E8DC] dark:border-slate-800 bg-white/80 dark:bg-slate-900/60 shadow-inner overflow-hidden flex flex-col">
                <div className="px-4 py-3 border-b border-[#D8E8DC] dark:border-slate-800 bg-[#F7F4EE] dark:bg-slate-900 sticky top-0 z-10">
                  <p className="text-xs font-bold text-[#3D5246] dark:text-[#C2E0C6]">
                    Fixed Diagram View: click a node to expand/collapse related nodes
                  </p>
                </div>
                <div ref={graphScrollRef} className="flex-1 min-h-0 overflow-y-auto overscroll-contain px-4 py-4 space-y-3" onClick={onPaneClick}>
                  {visibleRootNodes.map((rootNode) => renderDiagramNode(rootNode.id))}
                  {!showAllRoots && rootNodes.length > visibleRootNodes.length && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setShowAllRoots(true);
                        toast.success('Showing all top-level topics');
                      }}
                      className="w-full mt-2 px-3 py-2 text-xs font-bold rounded-lg border border-dashed border-[#C9DCCF] dark:border-slate-700 text-[#3D5246] dark:text-[#C2E0C6] hover:bg-[#F7F4EE] dark:hover:bg-slate-800 transition-all"
                    >
                      Show more top-level topics ({rootNodes.length - visibleRootNodes.length} more)
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Toolbar */}
          <div className="px-4 py-2.5 bg-white dark:bg-slate-900 border-t border-[#D8E8DC] dark:border-slate-800 z-10 shadow-[0_-4px_20px_-10px_rgba(0,0,0,0.1)] dark:shadow-none">
            <div className="space-y-2">
              {/* Tour Controls - visible when in tour mode */}
              {tourMode && (
                <TourControls
                  currentTourIndex={currentTourIndex}
                  totalTourSteps={tourOrder.length}
                  onNext={handleTourNext}
                  onPrev={handleTourPrev}
                  onExitTour={handleExitTour}
                />
              )}
              
              <div className="flex items-center justify-between flex-wrap gap-2">
                {/* Expand/Collapse & View Controls */}
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={expandAll}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-gray-700 dark:text-gray-300 bg-[#D6ECD8] dark:bg-slate-800 hover:bg-[#FFE3B8] dark:hover:bg-[#1E4D35]/50 hover:text-[#C96800] dark:hover:text-[#E8820C]/70 rounded-lg transition-all"
                  >
                    <Maximize2 className="w-3.5 h-3.5" />
                    Expand All
                  </button>
                  <button
                    onClick={collapseAll}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-gray-700 dark:text-gray-300 bg-[#D6ECD8] dark:bg-slate-800 hover:bg-[#FFE3B8] dark:hover:bg-[#1E4D35]/50 hover:text-[#C96800] dark:hover:text-[#E8820C]/70 rounded-lg transition-all"
                  >
                    <Minimize2 className="w-3.5 h-3.5" />
                    Collapse All
                  </button>
                </div>

                {/* Diagram Controls */}
                <div className="flex items-center gap-1.5 bg-gray-50 dark:bg-slate-800 p-1.5 rounded-lg">
                  <div className="text-[10px] font-bold text-gray-500 dark:text-gray-400 px-2">CONTENT SCROLL</div>
                  <button
                    onClick={() => {
                      if (graphScrollRef.current) {
                        graphScrollRef.current.scrollTo({ top: 0, behavior: 'smooth' });
                        toast.success('Scrolled to top');
                      }
                    }}
                    className="px-2.5 py-1.5 text-xs font-bold text-gray-600 dark:text-gray-300 hover:bg-white dark:hover:bg-slate-700 rounded-md transition-all"
                    title="Go to top"
                  >
                    Top
                  </button>
                  <button
                    onClick={() => {
                      if (graphScrollRef.current) {
                        graphScrollRef.current.scrollTo({ top: graphScrollRef.current.scrollHeight, behavior: 'smooth' });
                        toast.success('Scrolled to bottom');
                      }
                    }}
                    className="px-2.5 py-1.5 text-xs font-bold text-gray-600 dark:text-gray-300 hover:bg-white dark:hover:bg-slate-700 rounded-md transition-all"
                    title="Go to bottom"
                  >
                    Bottom
                  </button>
                </div>

                {/* View Mode & Tour */}
                <div className="flex items-center gap-1.5">
                  <div className="flex items-center gap-1.5 bg-gray-50 dark:bg-slate-800 p-1.5 rounded-lg">
                    <button
                      onClick={() => setViewMode('graph')}
                      className={`px-2 py-1.5 rounded-md text-xs font-bold transition-all ${
                        viewMode === 'graph'
                          ? 'bg-[#FFF0DC] dark:bg-[#1E4D35]/50 text-[#C96800] dark:text-[#E8820C]'
                          : 'text-gray-600 dark:text-gray-300 hover:bg-white dark:hover:bg-slate-700'
                      }`}
                      title="Graph view"
                    >
                      <Network className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => setViewMode('outline')}
                      className={`px-2 py-1.5 rounded-md text-xs font-bold transition-all ${
                        viewMode === 'outline'
                          ? 'bg-[#FFF0DC] dark:bg-[#1E4D35]/50 text-[#C96800] dark:text-[#E8820C]'
                          : 'text-gray-600 dark:text-gray-300 hover:bg-white dark:hover:bg-slate-700'
                      }`}
                      title="Outline view"
                    >
                      <List className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => setViewMode('toc')}
                      className={`px-2 py-1.5 rounded-md text-xs font-bold transition-all ${
                        viewMode === 'toc'
                          ? 'bg-[#FFF0DC] dark:bg-[#1E4D35]/50 text-[#C96800] dark:text-[#E8820C]'
                          : 'text-gray-600 dark:text-gray-300 hover:bg-white dark:hover:bg-slate-700'
                      }`}
                      title="Table of contents"
                    >
                      <BookOpen className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <button
                    onClick={() => {
                      if (!tourMode) {
                        setSuspendAutoExpand(false);
                        setShowAllRoots(true);
                        setTourMode(true);
                        setCurrentTourIndex(0);
                      }
                    }}
                    disabled={tourMode}
                    className="flex items-center gap-1.5 px-4 py-1.5 text-xs font-bold text-white bg-gradient-to-r from-[#E8820C] to-[#C96800] hover:shadow-lg shadow-[rgba(30,77,53,0.08)] dark:shadow-none rounded-lg transition-all hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Play className="w-3.5 h-3.5" />
                    Start Tour
                  </button>

                  <button
                    onClick={() => {
                      toast.success('Refreshing layout...');
                      fetchMindMap();
                    }}
                    className="flex items-center gap-1.5 px-4 py-1.5 text-xs font-bold text-white bg-gradient-to-r from-[#1E4D35] to-[#2E5C42] hover:shadow-lg rounded-lg transition-all hover:scale-105"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    Reset
                  </button>
                </div>
              </div>
            </div>
          </div>
        </main>

        {/* Right Panel - Source & Different Views */}
        <aside className="w-64 bg-white dark:bg-slate-900 border-l border-[#D8E8DC] dark:border-slate-800 flex flex-col overflow-y-auto hidden xl:flex z-10">
          
          {/* Source Document - ALWAYS VISIBLE */}
          <div className="p-5 border-b border-[#D8E8DC] dark:border-slate-800">
            <h3 className="text-[10px] font-black text-gray-400 dark:text-[#7A9080] uppercase tracking-widest mb-4">Source Material</h3>
            <div className="p-4 bg-[#F7F4EE] dark:bg-slate-800 rounded-2xl border border-[#D8E8DC] dark:border-slate-700 shadow-inner dark:shadow-none">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-[#FFE3B8] dark:bg-[#1E4D35]/50 rounded-xl">
                  <FileText className="w-5 h-5 text-[#C96800] dark:text-[#E8820C]/70" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-gray-900 dark:text-white truncate">{mindMap.sourceFile || 'Uploaded PDF'}</p>
                  <p className="text-[10px] text-[#E8820C] dark:text-[#E8820C]/70 font-bold uppercase tracking-tight">{mindMap.subject}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Search & Filter Section - Visible in all views */}
          <div className="p-4 border-b border-[#D8E8DC] dark:border-slate-800 space-y-3">
            {viewMode !== 'graph' && (
              <>
                <div>
                  <label className="text-[10px] font-black text-gray-400 dark:text-[#7A9080] uppercase tracking-widest mb-2 block">Search</label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 dark:text-gray-600 pointer-events-none" />
                    <input
                      type="text"
                      placeholder="Find topics..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 rounded-lg bg-gray-50 dark:bg-slate-800 border border-[#D8E8DC] dark:border-slate-700 text-xs focus:outline-none focus:ring-2 focus:ring-[#E8820C] dark:focus:ring-[#E8820C]/70 text-gray-900 dark:text-white"
                    />
                  </div>
                </div>
                
                <div>
                  <label className="text-[10px] font-black text-gray-400 dark:text-[#7A9080] uppercase tracking-widest mb-2 block">Filter by Level</label>
                  <select
                    value={filterLevel === null ? 'all' : filterLevel}
                    onChange={(e) => setFilterLevel(e.target.value === 'all' ? null : parseInt(e.target.value))}
                    className="w-full px-3 py-2 rounded-lg bg-gray-50 dark:bg-slate-800 border border-[#D8E8DC] dark:border-slate-700 text-xs focus:outline-none focus:ring-2 focus:ring-[#E8820C] dark:focus:ring-[#E8820C]/70 text-gray-900 dark:text-white"
                  >
                    <option value="all">All Levels</option>
                    {Object.keys(getNodesByLevel(nodes))
                      .map(Number)
                      .sort((a, b) => a - b)
                      .map((level) => (
                        <option key={level} value={level}>
                          Level {level + 1}
                        </option>
                      ))}
                  </select>
                </div>
              </>
            )}
          </div>

          {/* DYNAMIC CONTENT BASED ON VIEW MODE */}
          {viewMode === 'graph' ? (
            // GRAPH VIEW: Shows selected node context or overview
            <>
              {selectedNodeData ? (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-5 flex-1 flex flex-col"
                >
                  <h3 className="text-[10px] font-black text-[#E8820C] dark:text-[#E8820C]/70 uppercase tracking-widest mb-4">Extracted Context</h3>
                  
                  <div className="mb-4">
                    <h4 className="text-sm font-bold text-slate-800 dark:text-white">{selectedNodeData.label}</h4>
                  </div>

                  <div className="bg-[#F7F4EE] dark:bg-slate-800/50 rounded-2xl p-4 border border-[#D8E8DC] dark:border-slate-700 relative flex-1">
                    <div className="flex items-center justify-between mb-3 pb-3 border-b border-[#D8E8DC] dark:border-slate-700">
                      <span className="text-[10px] font-bold text-[#7A9080] dark:text-[#7A9080] uppercase">Citation Details</span>
                      <div className="flex items-center gap-1.5 text-[10px] font-bold px-2 py-1 rounded bg-white dark:bg-slate-700 text-[#3D5246] dark:text-[#C2E0C6] shadow-sm border border-[#E8DECE] dark:border-slate-600">
                        <FileText className="w-3 h-3" />
                        Pg {selectedNodeData.sourceMeta?.page} 
                        <span className="opacity-40">|</span> 
                        Ln {selectedNodeData.sourceMeta?.line}
                      </div>
                    </div>
                    
                    <div className="relative mt-2">
                      <Quote className="absolute -top-2 -left-2 w-6 h-6 opacity-10 text-[#E8820C] dark:text-[#E8820C]/70" />
                      <p className="text-sm italic pl-4 leading-relaxed text-[#1A2E23] dark:text-[#C2E0C6] relative z-10">
                        "{selectedNodeData.sourceMeta?.excerpt}"
                      </p>
                    </div>
                  </div>
                </motion.div>
              ) : (
                <>
                  {/* Map Stats Panel */}
                  <div className="p-5 flex-1">
                    <h3 className="text-[10px] font-black text-gray-400 dark:text-[#7A9080] uppercase tracking-widest mb-4">Map Overview</h3>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between p-3 bg-[#F7F4EE] dark:bg-slate-800/60 rounded-xl border border-[#E8DECE] dark:border-slate-700">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-lg bg-[#FFF0DC] dark:bg-[#1E4D35]/40 flex items-center justify-center">
                            <Network className="w-3.5 h-3.5 text-[#C96800] dark:text-[#E8820C]" />
                          </div>
                          <span className="text-xs font-semibold text-gray-600 dark:text-gray-300">Total Nodes</span>
                        </div>
                        <span className="text-sm font-black text-[#1E4D35] dark:text-[#D6ECD8]">{mindMap.totalNodes}</span>
                      </div>
                      <div className="flex items-center justify-between p-3 bg-[#F7F4EE] dark:bg-slate-800/60 rounded-xl border border-[#E8DECE] dark:border-slate-700">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-lg bg-[#D6ECD8] dark:bg-emerald-900/30 flex items-center justify-center">
                            <Layers className="w-3.5 h-3.5 text-[#1E4D35] dark:text-emerald-400" />
                          </div>
                          <span className="text-xs font-semibold text-gray-600 dark:text-gray-300">Subject</span>
                        </div>
                        <span className="text-xs font-bold text-[#C96800] dark:text-[#E8820C] truncate max-w-[100px]">{mindMap.subject}</span>
                      </div>
                      <div className="p-3 bg-[#FFF0DC] dark:bg-[#1E4D35]/20 rounded-xl border border-[#E8DECE] dark:border-[#1E4D35]/40">
                        <p className="text-[10px] font-black text-[#C96800] dark:text-[#E8820C] uppercase tracking-widest mb-1">Tip</p>
                        <p className="text-[10px] text-gray-500 dark:text-[#7A9080] leading-relaxed">Click any node to see its source context from the document.</p>
                      </div>
                      <div className="p-3 bg-[#D6ECD8]/60 dark:bg-emerald-900/20 rounded-xl border border-[#C2E0C6] dark:border-emerald-800/40">
                        <p className="text-[10px] font-black text-[#1E4D35] dark:text-emerald-400 uppercase tracking-widest mb-1">Controls</p>
                        <p className="text-[10px] text-gray-500 dark:text-[#7A9080] leading-relaxed">Scroll up/down in the main container · Click to select a node · Use sort buttons to rearrange.</p>
                      </div>
                    </div>
                  </div>

                  {/* Legend */}
                  <div className="p-5 border-t border-[#D8E8DC] dark:border-slate-800 bg-[#F7F4EE]/50 dark:bg-slate-800/20">
                    <h3 className="text-[10px] font-black text-gray-400 dark:text-[#7A9080] uppercase tracking-widest mb-4">Legend</h3>
                    <div className="space-y-3">
                      {[
                        { color: 'bg-[#E8820C]', label: 'Main Branches', desc: 'Core concepts' },
                        { color: 'bg-teal-500', label: 'Sub-topics', desc: 'Detailed areas' },
                        { color: 'bg-[#E8820C]', label: 'Nodes', desc: 'Specific details' },
                      ].map((item, idx) => (
                        <div key={idx} className="flex items-start gap-3">
                          <div className={`w-3 h-3 rounded-full ${item.color} mt-1 shadow-sm`} />
                          <div>
                            <p className="text-xs font-bold text-gray-700 dark:text-[#C2E0C6] leading-none">{item.label}</p>
                            <p className="text-[10px] text-gray-400 dark:text-[#7A9080] mt-0.5">{item.desc}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </>
          ) : viewMode === 'outline' ? (
            // OUTLINE VIEW: Hierarchical tree
            <div className="p-5 flex-1 overflow-y-auto">
              <h3 className="text-[10px] font-black text-gray-400 dark:text-[#7A9080] uppercase tracking-widest mb-4">Concept Hierarchy</h3>
              <div className="space-y-1">
                {buildTreeHierarchy(nodes, edges).map(rootNode => (
                  <TreeNode
                    key={rootNode.id}
                    node={rootNode}
                    searchMatches={Array.from(highlightedNodes)}
                    onNodeClick={onNodeClick}
                    selectedNodeId={selectedNodeId}
                  />
                ))}
              </div>
            </div>
          ) : (
            // TOC VIEW: Table of contents by level
            <div className="p-5 flex-1 overflow-y-auto">
              <h3 className="text-[10px] font-black text-gray-400 dark:text-[#7A9080] uppercase tracking-widest mb-4">Table of Contents</h3>
              <TableOfContents
                nodes={nodes}
                searchMatches={Array.from(highlightedNodes)}
                onNodeClick={onNodeClick}
                selectedNodeId={selectedNodeId}
              />
            </div>
          )}

        </aside>
      </div>
    </div>
  );
};

export default MindMapView;