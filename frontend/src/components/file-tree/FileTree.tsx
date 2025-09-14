import { useState, useEffect } from 'react';
import { ChevronRight, ChevronDown, Folder, FolderOpen } from 'lucide-react';
import { DirectoryNode } from '../../types/index';
import { apiService } from '../../services/api';
import { getFileIcon, getFileTypeColor } from '../../utils/fileIcons';

interface FileTreeProps {
  projectId: number;
  onFileSelect?: (file: DirectoryNode) => void;
  selectedPath?: string;
}

interface TreeNodeProps {
  node: DirectoryNode;
  level: number;
  onFileSelect?: (file: DirectoryNode) => void;
  selectedPath?: string;
  projectId: number;
}

const TreeNode = ({ node, level, onFileSelect, selectedPath, projectId }: TreeNodeProps) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [children, setChildren] = useState<DirectoryNode[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasLoadedChildren, setHasLoadedChildren] = useState(false);

  const isDirectory = node.type === 'directory';
  const isSelected = selectedPath === node.path;
  const hasChildren = isDirectory && (children.length > 0 || !hasLoadedChildren);

  const handleToggle = async () => {
    if (!isDirectory) {
      onFileSelect?.(node);
      return;
    }

    if (!isExpanded && !hasLoadedChildren) {
      setLoading(true);
      try {
        const directoryChildren = await apiService.getDirectoryContents(projectId, node.path);
        setChildren(directoryChildren.items || []);
        setHasLoadedChildren(true);
      } catch (error) {
        console.error('Failed to load directory contents:', error);
      } finally {
        setLoading(false);
      }
    }

    setIsExpanded(!isExpanded);
    if (!isDirectory) {
      onFileSelect?.(node);
    }
  };

  const handleFileClick = () => {
    if (!isDirectory) {
      onFileSelect?.(node);
    }
  };

  return (
    <div>
      <div
        className={`flex items-center py-1 px-2 hover:bg-accent/50 cursor-pointer rounded-sm transition-colors ${
          isSelected ? 'bg-accent' : ''
        }`}
        style={{ paddingLeft: `${level * 12 + 8}px` }}
        onClick={handleToggle}
      >
        {hasChildren && (
          <div className="w-4 h-4 flex items-center justify-center mr-1">
            {loading ? (
              <div className="w-3 h-3 border border-muted-foreground border-t-transparent rounded-full animate-spin" />
            ) : isExpanded ? (
              <ChevronDown className="w-3 h-3" />
            ) : (
              <ChevronRight className="w-3 h-3" />
            )}
          </div>
        )}
        
        {!hasChildren && <div className="w-5" />}
        
        <div className="flex items-center space-x-2 flex-1 min-w-0">
          {isDirectory ? (
            isExpanded ? (
              <FolderOpen className="w-4 h-4 text-blue-500 flex-shrink-0" />
            ) : (
              <Folder className="w-4 h-4 text-blue-500 flex-shrink-0" />
            )
          ) : (
            <div className={getFileTypeColor(node.name)}>
              {getFileIcon(node.name, 16)}
            </div>
          )}
          <span 
            className="text-sm truncate" 
            title={node.name}
            onClick={handleFileClick}
          >
            {node.name}
          </span>
        </div>
      </div>
      
      {isExpanded && children.length > 0 && (
        <div>
          {children.map((child) => (
            <TreeNode
              key={child.path}
              node={child}
              level={level + 1}
              onFileSelect={onFileSelect}
              selectedPath={selectedPath}
              projectId={projectId}
            />
          ))}
        </div>
      )}
    </div>
  );
};

const FileTree = ({ projectId, onFileSelect, selectedPath }: FileTreeProps) => {
  const [rootNodes, setRootNodes] = useState<DirectoryNode[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadFileTree();
  }, [projectId]);

  const loadFileTree = async () => {
    try {
      setLoading(true);
      setError(null);
      const tree = await apiService.getDirectoryTree(projectId);
      setRootNodes(Array.isArray(tree) ? tree : [tree]);
    } catch (error) {
      console.error('Failed to load file tree:', error);
      setError('加载文件树失败');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="p-4">
        <div className="space-y-2">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="flex items-center space-x-2 animate-pulse">
              <div className="w-4 h-4 bg-muted rounded" />
              <div className="h-4 bg-muted rounded flex-1" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 text-center">
        <p className="text-sm text-destructive mb-2">{error}</p>
        <button 
          onClick={loadFileTree}
          className="text-xs text-primary hover:underline"
        >
          重试
        </button>
      </div>
    );
  }

  if (rootNodes.length === 0) {
    return (
      <div className="p-4 text-center text-sm text-muted-foreground">
        暂无文件
      </div>
    );
  }

  return (
    <div className="h-full overflow-auto">
      <div className="p-2">
        {rootNodes.map((node) => (
          <TreeNode
            key={node.path}
            node={node}
            level={0}
            onFileSelect={onFileSelect}
            selectedPath={selectedPath}
            projectId={projectId}
          />
        ))}
      </div>
    </div>
  );
};

export default FileTree;