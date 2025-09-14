const Sidebar = () => {
  return (
    <div className="w-64 bg-card border-r border-border flex flex-col">
      {/* 项目选择器 */}
      <div className="p-4 border-b border-border">
        <div className="h-8 bg-muted rounded animate-pulse"></div>
        <div className="text-xs text-muted-foreground mt-2">项目选择器占位</div>
      </div>
      
      {/* 文件树 */}
      <div className="flex-1 p-4">
        <div className="space-y-2">
          <div className="h-6 bg-muted rounded animate-pulse"></div>
          <div className="h-6 bg-muted rounded animate-pulse ml-4"></div>
          <div className="h-6 bg-muted rounded animate-pulse ml-4"></div>
          <div className="h-6 bg-muted rounded animate-pulse"></div>
          <div className="h-6 bg-muted rounded animate-pulse ml-4"></div>
        </div>
        <div className="text-xs text-muted-foreground mt-4">文件树组件占位</div>
      </div>
      
      {/* 底部工具栏 */}
      <div className="p-4 border-t border-border">
        <div className="flex space-x-2">
          <div className="h-8 w-8 bg-muted rounded animate-pulse"></div>
          <div className="h-8 w-8 bg-muted rounded animate-pulse"></div>
          <div className="h-8 w-8 bg-muted rounded animate-pulse"></div>
        </div>
        <div className="text-xs text-muted-foreground mt-2">工具栏占位</div>
      </div>
    </div>
  );
};

export default Sidebar;