const ProjectPage = () => {
  return (
    <div className="flex h-full">
      {/* 文件网格视图 */}
      <div className="flex-1 p-6">
        <div className="mb-4">
          <h2 className="text-xl font-semibold mb-2">文件浏览</h2>
          <div className="text-sm text-muted-foreground">当前路径: /project/folder</div>
        </div>
        
        {/* 文件网格占位 */}
        <div className="file-grid">
          <div className="file-grid-item">
            <div className="w-16 h-16 bg-muted rounded mb-2 animate-pulse"></div>
            <div className="h-3 bg-muted rounded animate-pulse w-full"></div>
            <div className="text-xs text-muted-foreground mt-1">文件1</div>
          </div>
          
          <div className="file-grid-item">
            <div className="w-16 h-16 bg-muted rounded mb-2 animate-pulse"></div>
            <div className="h-3 bg-muted rounded animate-pulse w-full"></div>
            <div className="text-xs text-muted-foreground mt-1">文件2</div>
          </div>
          
          <div className="file-grid-item">
            <div className="w-16 h-16 bg-muted rounded mb-2 animate-pulse"></div>
            <div className="h-3 bg-muted rounded animate-pulse w-full"></div>
            <div className="text-xs text-muted-foreground mt-1">文件3</div>
          </div>
          
          <div className="file-grid-item">
            <div className="w-16 h-16 bg-muted rounded mb-2 animate-pulse"></div>
            <div className="h-3 bg-muted rounded animate-pulse w-full"></div>
            <div className="text-xs text-muted-foreground mt-1">文件4</div>
          </div>
        </div>
      </div>
      
      {/* 文件预览面板 */}
      <div className="w-80 bg-card border-l border-border p-6">
        <h3 className="text-lg font-medium mb-4">文件预览</h3>
        
        <div className="space-y-4">
          <div className="h-48 bg-muted rounded animate-pulse"></div>
          <div className="h-4 bg-muted rounded animate-pulse"></div>
          <div className="h-3 bg-muted rounded animate-pulse w-2/3"></div>
          <div className="h-3 bg-muted rounded animate-pulse w-1/2"></div>
        </div>
        
        <div className="text-xs text-muted-foreground mt-4">文件预览组件占位</div>
      </div>
    </div>
  );
};

export default ProjectPage;