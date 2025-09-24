import { Plus, Settings, ChevronRight, Home, Edit2, Trash2, List, CheckSquare, Square, ChevronDown, Search, X } from 'lucide-react';
import { useState } from 'react';
import { useProjectStore } from '../../stores/useProjectStore';
import { usePathContext } from '../../contexts/PathContext';
import ImportDialog from '../dialogs/ImportDialog';
import SettingsDialog from '../dialogs/SettingsDialog';
import EditFolderDialog from '../dialogs/EditFolderDialog';
import DeleteFolderDialog from '../dialogs/DeleteFolderDialog';
import BatchDeleteDialog from '../dialogs/BatchDeleteDialog';
import BatchMoveDialog from '../dialogs/BatchMoveDialog';
import { FileItem } from '../../types/index';
import FileDetailModal from '../file-detail/FileDetailModal';
import { apiService } from '../../services/api';

interface SearchResult {
  type: 'file' | 'note';
  id: string;
  name: string;
  path: string;
  relativePath: string;
  projectId: number;
  projectName: string;
  matchType: 'filename' | 'content';
  snippet?: string;
  notes?: string;
  tags?: string[];
  starred?: boolean;
}

interface HeaderProps {
  currentPath?: string;
  onImportComplete?: () => void;
  isManagementMode?: boolean;
  onToggleManagement?: () => void;
  selectedFiles?: string[];
  onSelectAll?: () => void;
  onDeselectAll?: () => void;
  onBatchDelete?: () => void;
  onBatchMove?: () => void;
}

const Header = ({ 
  currentPath = '', 
  onImportComplete,
  isManagementMode = false,
  onToggleManagement,
  selectedFiles = [],
  onSelectAll,
  onDeselectAll
}: HeaderProps) => {
  const { currentProject } = useProjectStore();
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false);
  const [isSettingsDialogOpen, setIsSettingsDialogOpen] = useState(false);
  const [isHoveringBreadcrumb, setIsHoveringBreadcrumb] = useState(false);
  const [isEditFolderDialogOpen, setIsEditFolderDialogOpen] = useState(false);
  const [isDeleteFolderDialogOpen, setIsDeleteFolderDialogOpen] = useState(false);
  const [isBatchMenuOpen, setIsBatchMenuOpen] = useState(false);
  const [isBatchDeleteDialogOpen, setIsBatchDeleteDialogOpen] = useState(false);
  const [isBatchMoveDialogOpen, setIsBatchMoveDialogOpen] = useState(false);
  
  // 搜索相关状态
  const [isSearchVisible, setIsSearchVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedFile, setSelectedFile] = useState<FileItem | null>(null);
  const [isFileDetailOpen, setIsFileDetailOpen] = useState(false);
  
  const { setCurrentPath } = usePathContext();

  const handleImportClick = () => {
    if (currentProject) {
      setIsImportDialogOpen(true);
    }
  };

  const handleImportComplete = () => {
    setIsImportDialogOpen(false);
    onImportComplete?.();
  };
  
  const handleSettingsClick = () => {
    setIsSettingsDialogOpen(true);
  };
  
  const handleSettingsClose = () => {
    setIsSettingsDialogOpen(false);
  };

  const handleSearchToggle = () => {
    setIsSearchVisible(!isSearchVisible);
    if (!isSearchVisible) {
      setSearchQuery('');
      setSearchResults([]);
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim() || !currentProject) return;
    
    setIsSearching(true);
    try {
      const results = await apiService.search(searchQuery, currentProject.id);
      setSearchResults(results.results);
    } catch (error) {
      console.error('搜索失败:', error);
      // 清空搜索结果
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  const handleSearchResultClick = async (result: SearchResult) => {
    try {
      if (result.type === 'file') {
        // 获取文件详细信息
        const fileInfo = await apiService.getFileById(result.id, result.projectId);
        setSelectedFile(fileInfo);
        setIsFileDetailOpen(true);
      } else if (result.type === 'note') {
        // 对于笔记类型，需要先获取文件信息
        const files = await apiService.getProjectFiles(result.projectId);
        const matchingFile = files.files.find(f => f.relativePath === result.relativePath);
        if (matchingFile) {
          setSelectedFile(matchingFile);
          setIsFileDetailOpen(true);
        }
      }
    } catch (error) {
      console.error('获取文件信息失败:', error);
    }
    
    // 清空搜索结果
    setSearchResults([]);
    setIsSearchVisible(false);
    setSearchQuery('');
  };
  
  // 从项目数据目录开始构建面包屑路径
  const getBreadcrumbPath = () => {
    if (!currentProject || !currentPath) {
      return [];
    }
    
    // 移除项目路径前缀，只显示相对于项目数据目录的路径
    const relativePath = currentPath.replace(/^\//, ''); // 移除开头的斜杠
    if (!relativePath) {
      return [];
    }
    
    return relativePath.split('/').filter(segment => segment.length > 0);
  };
  
  const breadcrumbSegments = getBreadcrumbPath();
  
  const handleEditDirectory = () => {
    setIsEditFolderDialogOpen(true);
  };

  const handleFolderRenamed = (newPath?: string) => {
    setIsEditFolderDialogOpen(false);
    // 如果提供了新路径，更新当前路径
    if (newPath) {
      setCurrentPath(newPath);
    }
    onImportComplete?.(); // 触发刷新
  };

  const handleDeleteDirectory = () => {
    setIsDeleteFolderDialogOpen(true);
  };

  const handleFolderDeleted = () => {
    setIsDeleteFolderDialogOpen(false);
    // 删除后返回上级目录
    const pathSegments = currentPath.split('/').filter(Boolean);
    if (pathSegments.length > 1) {
      pathSegments.pop();
      setCurrentPath(pathSegments.join('/'));
    } else {
      setCurrentPath('');
    }
    onImportComplete?.(); // 触发刷新
  };

  const handleBatchDeleteComplete = () => {
    setIsBatchDeleteDialogOpen(false);
    onImportComplete?.(); // 触发刷新
  };

  const handleBatchMoveComplete = () => {
    setIsBatchMoveDialogOpen(false);
    onImportComplete?.(); // 触发刷新
  };

  return (
    <div className="h-14 bg-card border-b border-border px-4 flex items-center justify-between">
      {/* 面包屑导航 */}
      <div 
        className="flex items-center space-x-1"
        onMouseEnter={() => setIsHoveringBreadcrumb(true)}
        onMouseLeave={() => setIsHoveringBreadcrumb(false)}
      >
        <button 
          className="flex items-center space-x-1 px-2 py-1 hover:bg-muted/50 rounded transition-colors"
          onClick={() => setCurrentPath('')}
          title="返回项目根目录"
        >
          <Home className="w-4 h-4 text-muted-foreground" />
          {currentProject && (
            <span className="text-sm text-muted-foreground ml-1">{currentProject.name}</span>
          )}
        </button>
        {breadcrumbSegments.map((segment, index) => {
          const targetPath = breadcrumbSegments.slice(0, index + 1).join('/');
          return (
            <div key={index} className="flex items-center space-x-1">
              <ChevronRight className="w-4 h-4 text-muted-foreground" />
              <button 
                className="px-2 py-1 text-sm hover:bg-muted/50 rounded transition-colors"
                onClick={() => setCurrentPath(targetPath)}
                title={`导航到 ${targetPath}`}
              >
                {segment}
              </button>
            </div>
          );
        })}
        
        {/* 编辑和删除按钮 - 仅在hover时显示且有路径时显示 */}
        {isHoveringBreadcrumb && currentPath && (
          <div className="flex items-center space-x-1 ml-2">
            <button
              onClick={handleEditDirectory}
              className="p-1 hover:bg-muted/50 rounded transition-colors"
              title="编辑目录名称"
            >
              <Edit2 className="w-3 h-3 text-muted-foreground" />
            </button>
            <button
              onClick={handleDeleteDirectory}
              className="p-1 hover:bg-muted/50 rounded transition-colors"
              title="删除目录"
            >
              <Trash2 className="w-3 h-3 text-muted-foreground hover:text-destructive" />
            </button>
          </div>
        )}
      </div>
      
      {/* 中间：空白区域 */}
      <div className="flex-1"></div>
      
      {/* 右侧：操作按钮 */}
      <div className="flex items-center space-x-2">
        {/* 管理按钮 */}
        <button 
          onClick={onToggleManagement}
          className={`h-9 px-3 rounded-md transition-colors flex items-center space-x-2 ${
            isManagementMode 
              ? 'bg-primary text-primary-foreground hover:bg-primary/90' 
              : 'bg-muted hover:bg-accent text-muted-foreground hover:text-foreground'
          }`}
          title="批量管理"
        >
          <List className="h-4 w-4" />
          <span className="text-sm">管理</span>
        </button>
        
        {/* 管理模式下的操作按钮 */}
        {isManagementMode && (
          <>
            <button 
              onClick={onSelectAll}
              className="h-9 px-3 bg-muted hover:bg-accent rounded-md transition-colors flex items-center space-x-2 text-muted-foreground hover:text-foreground"
              title="全选"
            >
              <CheckSquare className="h-4 w-4" />
              <span className="text-sm">全选</span>
            </button>
            
            <button 
              onClick={onDeselectAll}
              className="h-9 px-3 bg-muted hover:bg-accent rounded-md transition-colors flex items-center space-x-2 text-muted-foreground hover:text-foreground"
              title="全不选"
            >
              <Square className="h-4 w-4" />
              <span className="text-sm">全不选</span>
            </button>
            
            {/* 批量操作下拉菜单 */}
            <div className="relative">
              <button 
                onClick={() => setIsBatchMenuOpen(!isBatchMenuOpen)}
                disabled={selectedFiles.length === 0 || !currentProject}
                className="h-9 px-3 bg-muted hover:bg-accent rounded-md transition-colors flex items-center space-x-2 text-muted-foreground hover:text-foreground disabled:opacity-50 disabled:cursor-not-allowed"
                title="批量操作"
              >
                <span className="text-sm">批量操作 ({selectedFiles.length})</span>
                <ChevronDown className="h-4 w-4" />
              </button>
              
              {isBatchMenuOpen && selectedFiles.length > 0 && (
                <div className="absolute right-0 top-full mt-1 w-32 bg-background border border-border rounded-md shadow-lg z-50">
                  <button
                    onClick={() => {
                      setIsBatchDeleteDialogOpen(true);
                      setIsBatchMenuOpen(false);
                    }}
                    className="w-full px-3 py-2 text-left text-sm hover:bg-muted transition-colors text-destructive hover:text-destructive"
                  >
                    批量删除
                  </button>
                  <button
                    onClick={() => {
                      setIsBatchMoveDialogOpen(true);
                      setIsBatchMenuOpen(false);
                    }}
                    className="w-full px-3 py-2 text-left text-sm hover:bg-muted transition-colors"
                  >
                    批量移动
                  </button>
                </div>
              )}
            </div>
          </>
        )}
        
        {/* 搜索功能 */}
        <div className="relative flex items-center">
          {/* 搜索框 - 可切换显示 */}
          {isSearchVisible && (
            <div className="flex items-center mr-2">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleSearch();
                  } else if (e.key === 'Escape') {
                    setIsSearchVisible(false);
                    setSearchQuery('');
                    setSearchResults([]);
                  }
                }}
                placeholder="搜索文件和笔记..."
                className="h-9 px-3 w-64 border border-border rounded-md bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                autoFocus
              />
              <button
                onClick={() => {
                  setIsSearchVisible(false);
                  setSearchQuery('');
                  setSearchResults([]);
                }}
                className="ml-1 p-2 hover:bg-muted rounded-md transition-colors"
                title="关闭搜索"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          )}
          
          {/* 搜索按钮 */}
          <button 
            onClick={isSearchVisible ? handleSearch : handleSearchToggle}
            disabled={!currentProject || (isSearchVisible && !searchQuery.trim())}
            className="h-9 w-9 bg-muted hover:bg-accent rounded-md transition-colors flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
            title={isSearchVisible ? "搜索" : "打开搜索"}
          >
            <Search className="h-4 w-4" />
          </button>
          
          {/* 搜索结果下拉框 */}
          {searchResults.length > 0 && (
            <div className="absolute top-full right-0 mt-1 w-80 bg-background border border-border rounded-md shadow-lg z-50 max-h-96 overflow-y-auto">
              <div className="p-2 border-b border-border">
                <span className="text-sm font-medium text-muted-foreground">搜索结果 ({searchResults.length})</span>
              </div>
              {searchResults.map((result) => (
                <button
                  key={`${result.type}-${result.id}`}
                  onClick={() => handleSearchResultClick(result)}
                  className="w-full p-3 text-left hover:bg-muted transition-colors border-b border-border last:border-b-0"
                >
                  <div className="flex items-start space-x-3">
                    {/* 图片预览 */}
                    <div className="w-12 h-12 flex-shrink-0 rounded-md overflow-hidden bg-muted flex items-center justify-center">
                      {result.type === 'file' && result.relativePath && (
                        result.relativePath.match(/\.(jpg|jpeg|png|gif|webp|svg)$/i) ? (
                          <img 
                            src={`${import.meta.env.VITE_RESOURCE_HOST || ''}/data/${result.projectName}/${result.relativePath}`}
                            alt={result.name}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              // 如果图片加载失败，显示文件图标
                              const target = e.target as HTMLImageElement;
                              target.style.display = 'none';
                              target.nextElementSibling?.classList.remove('hidden');
                            }}
                          />
                        ) : (
                          <div className="text-muted-foreground text-xs">
                            {result.relativePath?.split('.').pop()?.toUpperCase() || 'FILE'}
                          </div>
                        )
                      )}
                      {result.type === 'note' && result.relativePath && (
                        result.relativePath.match(/\.(jpg|jpeg|png|gif|webp|svg)$/i) ? (
                          <img 
                            src={`${import.meta.env.VITE_RESOURCE_HOST || ''}/data/${result.projectName}/${result.relativePath}`}
                            alt={result.name}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              // 如果图片加载失败，显示笔记图标
                              const target = e.target as HTMLImageElement;
                              target.style.display = 'none';
                              target.nextElementSibling?.classList.remove('hidden');
                            }}
                          />
                        ) : (
                          <div className="text-green-500 text-lg">📝</div>
                        )
                      )}
                      {result.type === 'note' && !result.relativePath && (
                        <div className="text-green-500 text-lg">📝</div>
                      )}
                      {/* 备用图标，当图片加载失败时显示 */}
                      <div className="hidden text-muted-foreground text-xs">
                        {result.relativePath?.split('.').pop()?.toUpperCase() || 'FILE'}
                      </div>
                    </div>
                    
                    {/* 文件信息 */}
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-sm truncate">{result.name}</div>
                      <div className="text-xs text-muted-foreground mt-1">
                        {result.type === 'file' ? (
                          <span>文件: {result.relativePath}</span>
                        ) : (
                          <span>笔记: {result.snippet || result.notes || '包含匹配内容'}</span>
                        )}
                      </div>
                    </div>
                    
                    {/* 类型指示器 */}
                    <div className={`w-2 h-2 rounded-full mt-2 flex-shrink-0 ${
                      result.type === 'file' ? 'bg-blue-500' : 'bg-green-500'
                    }`} />
                  </div>
                </button>
              ))}
            </div>
          )}
          
          {/* 搜索加载状态 */}
          {isSearching && (
            <div className="absolute top-full right-0 mt-1 w-80 bg-background border border-border rounded-md shadow-lg z-50 p-4 text-center">
              <div className="text-sm text-muted-foreground">搜索中...</div>
            </div>
          )}
        </div>
        
        <button 
          onClick={handleImportClick}
          disabled={!currentProject}
          className="h-9 px-3 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
          title="导入文件到当前目录"
        >
          <Plus className="h-4 w-4" />
          <span className="text-sm">导入</span>
        </button>
        

        <button 
          onClick={handleSettingsClick}
          className="h-9 w-9 bg-muted hover:bg-accent rounded-md transition-colors flex items-center justify-center"
          title="设置"
        >
          <Settings className="h-4 w-4" />
        </button>
      </div>

      {/* 导入对话框 */}
      <ImportDialog
        isOpen={isImportDialogOpen}
        onClose={() => setIsImportDialogOpen(false)}
        currentPath={currentPath}
        onImportComplete={handleImportComplete}
      />
      
      {/* 设置对话框 */}
      <SettingsDialog
        isOpen={isSettingsDialogOpen}
        onClose={handleSettingsClose}
      />
      
      {/* 编辑目录对话框 */}
       <EditFolderDialog
         isOpen={isEditFolderDialogOpen}
         onClose={() => setIsEditFolderDialogOpen(false)}
         projectId={currentProject?.id || 0}
         currentPath={currentPath}
         onFolderRenamed={handleFolderRenamed}
       />
       
       {/* 删除目录对话框 */}
       <DeleteFolderDialog
         isOpen={isDeleteFolderDialogOpen}
         onClose={() => setIsDeleteFolderDialogOpen(false)}
         projectId={currentProject?.id || 0}
         currentPath={currentPath}
         onFolderDeleted={handleFolderDeleted}
       />
       
       {/* 批量删除对话框 */}
        <BatchDeleteDialog
          isOpen={isBatchDeleteDialogOpen}
          onClose={() => setIsBatchDeleteDialogOpen(false)}
          projectId={currentProject?.id || 0}
          selectedFiles={selectedFiles}
          currentPath={currentPath}
          onDeleteComplete={handleBatchDeleteComplete}
        />
        
        {/* 批量移动对话框 */}
        <BatchMoveDialog
          isOpen={isBatchMoveDialogOpen}
          onClose={() => setIsBatchMoveDialogOpen(false)}
          projectId={currentProject?.id || 0}
          selectedFiles={selectedFiles}
          onMoveComplete={handleBatchMoveComplete}
        />

      {/* 文件详情模态框 */}
      <FileDetailModal
        file={selectedFile}
        isOpen={isFileDetailOpen}
        onClose={() => {
          setIsFileDetailOpen(false);
          setSelectedFile(null);
        }}
        projectId={currentProject?.id || 0}
      />
    </div>
  );
};

export default Header;