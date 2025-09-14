import { ChevronDown, Folder, File, ChevronRight, RefreshCw, Minimize2 } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useProjectStore } from '../../stores/useProjectStore';
import { apiService } from '../../services/api';
import { DirectoryNode, FileItem } from '../../types/index';
import { usePathContext } from '../../contexts/PathContext';
import FileDetailModal from '../file-detail/FileDetailModal';
import { useFileUpdate } from '../../contexts/FileUpdateContext';

interface FileNode {
  id: string;
  name: string;
  path: string;
  type: 'file' | 'folder';
  children?: FileNode[];
}

const FileTreeItem = ({ node, level = 0, projectId, onFileClick }: { node: FileNode; level?: number; projectId: number; onFileClick?: (file: FileItem) => void }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [children, setChildren] = useState<FileNode[]>(node.children || []);
  const [loading, setLoading] = useState(false);
  const [hasLoadedChildren, setHasLoadedChildren] = useState(!!node.children);
  const { setCurrentPath } = usePathContext();
  
  const hasChildren = node.type === 'folder' && (children.length > 0 || !hasLoadedChildren);
  
  const handleClick = async () => {
    if (node.type === 'file') {
      // 处理文件点击 - 打开详情浮层
      if (onFileClick) {
        // 构造FileItem对象
        const fileItem: FileItem = {
            id: node.id,
            projectId: projectId,
            name: node.name,
            path: node.path,
            relativePath: node.path,
            type: 'file',
            size: 0, // 这里需要从API获取，暂时设为0
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            lastModified: new Date().toISOString(),
            thumbnailPath: undefined
          };
        onFileClick(fileItem);
      }
      return;
    }
    
    // 处理文件夹点击
    setCurrentPath(node.path);
    
    if (!isExpanded && !hasLoadedChildren) {
      setLoading(true);
      try {
        const response = await apiService.getDirectoryContents(projectId, node.path);
        const childNodes: FileNode[] = response.items.map((item: DirectoryNode) => ({
          id: item.id.toString(),
          name: item.name,
          path: item.path,
          type: item.type === 'directory' ? 'folder' : 'file'
        }));
        setChildren(childNodes);
        setHasLoadedChildren(true);
      } catch (error) {
        console.error('Failed to load directory contents:', error);
      } finally {
        setLoading(false);
      }
    }
    
    setIsExpanded(!isExpanded);
  };
  
  return (
    <div>
      <div 
        className="flex items-center py-1 px-2 hover:bg-muted/50 rounded cursor-pointer transition-colors"
        style={{ paddingLeft: `${level * 16 + 8}px` }}
        onClick={handleClick}
      >
        {node.type === 'folder' && hasChildren && (
          <ChevronRight 
            className={`w-4 h-4 text-muted-foreground transition-transform mr-1 ${
              isExpanded ? 'rotate-90' : ''
            }`} 
          />
        )}
        {node.type === 'folder' && !hasChildren && (
          <div className="w-4 h-4 mr-1" />
        )}
        {loading ? (
          <div className="w-4 h-4 mr-2 animate-spin">
            <RefreshCw className="w-4 h-4" />
          </div>
        ) : node.type === 'folder' ? (
          <Folder className="w-4 h-4 text-muted-foreground mr-2" />
        ) : (
          <File className="w-4 h-4 text-muted-foreground mr-2" />
        )}
        <span className="text-sm truncate">{node.name}</span>
      </div>
      
      {node.type === 'folder' && isExpanded && hasChildren && (
        <div>
          {children.map((child) => (
        <FileTreeItem key={child.id} node={child} level={level + 1} projectId={projectId} onFileClick={onFileClick} />
      ))}
        </div>
      )}
    </div>
  );
};

const FileTree = ({ projectId, refreshTrigger }: { projectId: number; refreshTrigger?: number }) => {
  const [treeData, setTreeData] = useState<FileNode[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedFile, setSelectedFile] = useState<FileItem | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { fileUpdateTrigger, onFileUpdate } = useFileUpdate();
  
  useEffect(() => {
    loadFileTree();
  }, [projectId]);
  
  // 监听刷新触发器
  useEffect(() => {
    if (refreshTrigger && refreshTrigger > 0) {
      loadFileTree();
    }
  }, [refreshTrigger]);
  
  // 监听全局文件更新事件
  useEffect(() => {
    const unsubscribe = onFileUpdate((updatedProjectId) => {
      // 如果没有指定项目ID或者是当前项目，则刷新文件树
      if (!updatedProjectId || updatedProjectId === projectId) {
        loadFileTree();
      }
    });
    
    return unsubscribe;
  }, [projectId, onFileUpdate]);
  
  // 监听全局文件更新触发器
  useEffect(() => {
    loadFileTree();
  }, [fileUpdateTrigger]);
  
  const loadFileTree = async () => {
    try {
      setLoading(true);
      setError(null);
      const tree = await apiService.getDirectoryTree(projectId);
      const nodes = Array.isArray(tree) ? tree : [tree];
      const fileNodes: FileNode[] = nodes.map((node: DirectoryNode) => ({
        id: node.id.toString(),
        name: node.name,
        path: node.path,
        type: node.type === 'directory' ? 'folder' : 'file',
        children: node.children?.map((child: DirectoryNode) => ({
          id: child.id.toString(),
          name: child.name,
          path: child.path,
          type: child.type === 'directory' ? 'folder' : 'file'
        }))
      }));
      setTreeData(fileNodes);
    } catch (error) {
      console.error('Failed to load file tree:', error);
      setError('加载文件树失败');
    } finally {
      setLoading(false);
    }
  };
  
  if (loading) {
    return (
      <div className="space-y-2">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="flex items-center space-x-2 animate-pulse">
            <div className="w-4 h-4 bg-muted rounded" />
            <div className="h-4 bg-muted rounded flex-1" />
          </div>
        ))}
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="text-center py-4">
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
  
  if (treeData.length === 0) {
    return (
      <div className="text-center py-4 text-sm text-muted-foreground">
        暂无文件
      </div>
    );
  }
  
  return (
    <div className="space-y-1">
      {treeData.map((node) => (
        <FileTreeItem 
          key={node.id} 
          node={node} 
          projectId={projectId} 
          onFileClick={(file) => {
            setSelectedFile(file);
            setIsDetailModalOpen(true);
          }}
        />
      ))}
      
      <FileDetailModal
        file={selectedFile}
        isOpen={isDetailModalOpen}
        onClose={() => {
          setIsDetailModalOpen(false);
          setSelectedFile(null);
        }}
        projectId={projectId}
        onFileUpdated={() => {
          // 文件更新后重新加载文件树
          loadFileTree();
        }}
      />
    </div>
  );
};

interface SidebarProps {
  refreshTrigger?: number;
  onRefresh?: () => void;
  onMinimize?: () => void;
}

const Sidebar = ({ refreshTrigger, onRefresh, onMinimize }: SidebarProps) => {
  const [isProjectDropdownOpen, setIsProjectDropdownOpen] = useState(false);
  const [internalRefreshTrigger, setInternalRefreshTrigger] = useState(0);
  const { projects, currentProject, fetchProjects, setCurrentProject } = useProjectStore();
  
  const handleRefresh = () => {
    // 如果有父组件的刷新回调，优先使用它来触发全局刷新
    if (onRefresh) {
      onRefresh();
    } else {
      // 否则只刷新文件树
      setInternalRefreshTrigger(prev => prev + 1);
    }
  };
  
  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  return (
    <div className="h-full bg-card flex flex-col">
      {/* 项目选择器 */}
      <div className="p-4 border-b border-border">
        <div className="relative">
          <button 
            className="w-full flex items-center justify-between p-2 bg-background border border-border rounded-md hover:bg-muted/50 transition-colors"
            onClick={() => setIsProjectDropdownOpen(!isProjectDropdownOpen)}
          >
            <div className="flex items-center space-x-2">
              <Folder className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm truncate">{currentProject?.name || '选择项目'}</span>
            </div>
            <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform ${isProjectDropdownOpen ? 'rotate-180' : ''}`} />
          </button>
          
          {isProjectDropdownOpen && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-popover border border-border rounded-md shadow-lg z-10">
              {projects.map((project) => (
                <button
                  key={project.id}
                  className="w-full flex items-center space-x-2 p-2 text-left hover:bg-muted/50 transition-colors first:rounded-t-md last:rounded-b-md"
                  onClick={() => {
                    setCurrentProject(project);
                    setIsProjectDropdownOpen(false);
                  }}
                >
                  <Folder className="w-4 h-4 text-muted-foreground" />
                  <div>
                    <div className="text-sm font-medium">{project.name}</div>
                    <div className="text-xs text-muted-foreground truncate">{project.path}</div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
      
      {/* 文件树 */}
      <div className="flex-1 p-4 overflow-y-auto">
        {currentProject ? (
          <FileTree projectId={currentProject.id} refreshTrigger={refreshTrigger || internalRefreshTrigger} />
        ) : (
          <div className="text-center py-8 text-sm text-muted-foreground">
            请选择一个项目
          </div>
        )}
      </div>
      
      {/* 底部工具栏 */}
      <div className="p-4 border-t border-border">
        <div className="flex items-center justify-between">
          <div className="flex space-x-2">
            <button 
              className="p-2 hover:bg-muted/50 rounded-md transition-colors"
              title="刷新文件树"
              onClick={handleRefresh}
            >
              <RefreshCw className="w-4 h-4 text-muted-foreground" />
            </button>
          </div>
          <button 
            className="p-2 hover:bg-muted/50 rounded-md transition-colors"
            title="最小化侧边栏"
            onClick={onMinimize}
          >
            <Minimize2 className="w-4 h-4 text-muted-foreground" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;