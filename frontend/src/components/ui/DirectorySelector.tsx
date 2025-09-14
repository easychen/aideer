import { useState, useEffect } from 'react';
import { ChevronDown, ChevronRight, Folder } from 'lucide-react';
import { apiService } from '../../services/api';
import { DirectoryNode } from '../../types';

interface DirectorySelectorProps {
  projectId: number;
  selectedPath: string;
  onPathChange: (path: string) => void;
  className?: string;
}

const DirectorySelector = ({ projectId, selectedPath, onPathChange, className = '' }: DirectorySelectorProps) => {
  const [directoryTree, setDirectoryTree] = useState<DirectoryNode[]>([]);
  const [expandedPaths, setExpandedPaths] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    loadDirectoryTree();
  }, [projectId]);

  const loadDirectoryTree = async () => {
    try {
      setLoading(true);
      const tree = await apiService.getDirectoryTree(projectId);
      // 只保留目录类型的节点
      const directoriesOnly = filterDirectoriesOnly(tree);
      setDirectoryTree(directoriesOnly);
      
      // 展开选中路径的所有父级目录
      if (selectedPath) {
        const pathsToExpand = getParentPaths(selectedPath);
        setExpandedPaths(new Set(pathsToExpand));
      }
    } catch (error) {
      console.error('Failed to load directory tree:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterDirectoriesOnly = (nodes: DirectoryNode[]): DirectoryNode[] => {
    return nodes
      .filter(node => node.type === 'directory')
      .map(node => ({
        ...node,
        children: node.children ? filterDirectoriesOnly(node.children) : undefined
      }));
  };

  const getParentPaths = (path: string): string[] => {
    const parts = path.split('/').filter(Boolean);
    const paths: string[] = [''];
    
    for (let i = 0; i < parts.length; i++) {
      const currentPath = parts.slice(0, i + 1).join('/');
      paths.push(currentPath);
    }
    
    return paths;
  };

  const toggleExpanded = (path: string) => {
    const newExpanded = new Set(expandedPaths);
    if (newExpanded.has(path)) {
      newExpanded.delete(path);
    } else {
      newExpanded.add(path);
    }
    setExpandedPaths(newExpanded);
  };

  const handlePathSelect = (path: string) => {
    onPathChange(path);
    setIsOpen(false);
  };

  const getDisplayPath = (path: string) => {
    return path === '' ? '根目录' : path;
  };

  const renderDirectoryNode = (node: DirectoryNode, level: number = 0) => {
    const hasChildren = node.children && node.children.length > 0;
    const isExpanded = expandedPaths.has(node.path);
    const isSelected = selectedPath === node.path;

    return (
      <div key={node.id}>
        <div
          className={`flex items-center py-1 px-2 cursor-pointer hover:bg-accent rounded-sm ${
            isSelected ? 'bg-primary/10 text-primary' : ''
          }`}
          style={{ paddingLeft: `${level * 16 + 8}px` }}
          onClick={() => handlePathSelect(node.path)}
        >
          <div className="flex items-center flex-1">
            {hasChildren && (
              <button
                className="p-0.5 hover:bg-accent rounded mr-1"
                onClick={(e) => {
                  e.stopPropagation();
                  toggleExpanded(node.path);
                }}
              >
                {isExpanded ? (
                  <ChevronDown className="w-3 h-3" />
                ) : (
                  <ChevronRight className="w-3 h-3" />
                )}
              </button>
            )}
            {!hasChildren && <div className="w-4 mr-1" />}
            <Folder className="w-4 h-4 mr-2 text-muted-foreground" />
            <span className="text-sm">{node.name}</span>
          </div>
        </div>
        {hasChildren && isExpanded && (
          <div>
            {node.children!.map(child => renderDirectoryNode(child, level + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className={`relative ${className}`}>
      <div className="mb-2">
        <label className="block text-sm font-medium mb-1">
          上级目录
        </label>
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="w-full px-3 py-2 text-left border border-border rounded-md bg-background hover:bg-accent focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent flex items-center justify-between"
        >
          <span className="text-sm">{getDisplayPath(selectedPath)}</span>
          <ChevronDown className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        </button>
      </div>
      
      {isOpen && (
        <div className="absolute top-full left-0 right-0 z-50 mt-1 bg-background border border-border rounded-md shadow-lg max-h-64 overflow-y-auto">
          {loading ? (
            <div className="p-4 text-center text-sm text-muted-foreground">
              加载中...
            </div>
          ) : (
            <div className="p-2">
              {/* 根目录选项 */}
              <div
                className={`flex items-center py-1 px-2 cursor-pointer hover:bg-accent rounded-sm ${
                  selectedPath === '' ? 'bg-primary/10 text-primary' : ''
                }`}
                onClick={() => handlePathSelect('')}
              >
                <Folder className="w-4 h-4 mr-2 text-muted-foreground" />
                <span className="text-sm">根目录</span>
              </div>
              
              {/* 目录树 */}
              {directoryTree.map(node => renderDirectoryNode(node))}
            </div>
          )}
        </div>
      )}
      
      {/* 点击外部关闭下拉框 */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-40" 
          onClick={() => setIsOpen(false)}
        />
      )}
    </div>
  );
};

export default DirectorySelector;