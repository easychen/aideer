import { Plus, FolderPlus, Settings, Search, ChevronRight, Home } from 'lucide-react';
import Skeleton from 'react-loading-skeleton';
import { useState } from 'react';

const Header = () => {
  const [currentPath] = useState(['aideer', 'frontend', 'src', 'components']);
  
  return (
    <div className="h-14 bg-card border-b border-border px-4 flex items-center justify-between">
      {/* 面包屑导航 */}
      <div className="flex items-center space-x-1">
        <button className="flex items-center space-x-1 px-2 py-1 hover:bg-muted/50 rounded transition-colors">
          <Home className="w-4 h-4 text-muted-foreground" />
        </button>
        {currentPath.map((segment, index) => (
          <div key={index} className="flex items-center space-x-1">
            <ChevronRight className="w-4 h-4 text-muted-foreground" />
            <button 
              className="px-2 py-1 text-sm hover:bg-muted/50 rounded transition-colors"
              title={`导航到 ${currentPath.slice(0, index + 1).join('/')}`}
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
          <div className="h-9 bg-muted rounded pl-10 animate-pulse"></div>
        </div>
      </div>
      
      {/* 右侧：操作按钮 */}
      <div className="flex items-center space-x-2">
        <button 
          className="h-9 px-3 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors flex items-center space-x-2"
          title="添加项目到当前目录"
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
    </div>
  );
};

export default Header;