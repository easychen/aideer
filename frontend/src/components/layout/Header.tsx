import { Plus, FolderPlus, Settings, Search, ChevronRight, Home } from 'lucide-react';
import { useState } from 'react';
import { useProjectStore } from '../../stores/useProjectStore';
import { usePathContext } from '../../contexts/PathContext';
import ImportDialog from '../dialogs/ImportDialog';

interface HeaderProps {
  currentPath?: string;
  onImportComplete?: () => void;
}

const Header = ({ currentPath = '', onImportComplete }: HeaderProps) => {
  const { currentProject } = useProjectStore();
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false);
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
  
  return (
    <div className="h-14 bg-card border-b border-border px-4 flex items-center justify-between">
      {/* 面包屑导航 */}
      <div className="flex items-center space-x-1">
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
      </div>
      
      {/* 中间：搜索框 */}
      <div className="flex-1 max-w-md mx-8">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <div className="h-9 bg-muted rounded pl-10"></div>
        </div>
      </div>
      
      {/* 右侧：操作按钮 */}
      <div className="flex items-center space-x-2">
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
          className="h-9 w-9 bg-muted hover:bg-accent rounded-md transition-colors flex items-center justify-center"
          title="新建文件夹"
        >
          <FolderPlus className="h-4 w-4" />
        </button>
        
        <button 
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
    </div>
  );
};

export default Header;