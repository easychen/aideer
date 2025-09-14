import { Plus, Settings, ChevronRight, Home, Edit2, Trash2, List, CheckSquare, Square, ChevronDown } from 'lucide-react';
import { useState } from 'react';
import { useProjectStore } from '../../stores/useProjectStore';
import { usePathContext } from '../../contexts/PathContext';
import ImportDialog from '../dialogs/ImportDialog';
import SettingsDialog from '../dialogs/SettingsDialog';
import EditFolderDialog from '../dialogs/EditFolderDialog';
import DeleteFolderDialog from '../dialogs/DeleteFolderDialog';

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
  onDeselectAll,
  onBatchDelete,
  onBatchMove
}: HeaderProps) => {
  const { currentProject } = useProjectStore();
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false);
  const [isSettingsDialogOpen, setIsSettingsDialogOpen] = useState(false);
  const [isHoveringBreadcrumb, setIsHoveringBreadcrumb] = useState(false);
  const [isEditFolderDialogOpen, setIsEditFolderDialogOpen] = useState(false);
  const [isDeleteFolderDialogOpen, setIsDeleteFolderDialogOpen] = useState(false);
  const [isBatchMenuOpen, setIsBatchMenuOpen] = useState(false);
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
        {breadcrumbSegments.map((segment, index) => (
          <div key={index} className="flex items-center space-x-1">
            <ChevronRight className="w-4 h-4 text-muted-foreground" />
            <button 
              className="px-2 py-1 text-sm hover:bg-muted/50 rounded transition-colors"
              title={`导航到 ${breadcrumbSegments.slice(0, index + 1).join('/')}`}
            >
              {segment}
            </button>
          </div>
        ))}
        
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
                disabled={selectedFiles.length === 0}
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
                      onBatchDelete?.();
                      setIsBatchMenuOpen(false);
                    }}
                    className="w-full px-3 py-2 text-left text-sm hover:bg-muted transition-colors text-destructive hover:text-destructive"
                  >
                    批量删除
                  </button>
                  <button
                    onClick={() => {
                      onBatchMove?.();
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
    </div>
  );
};

export default Header;