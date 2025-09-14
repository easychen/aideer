const HomePage = () => {
  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-2">欢迎使用 AiDeer</h1>
        <p className="text-muted-foreground">AI驱动的智能文件管理器</p>
      </div>
      
      {/* 项目列表占位 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <div className="p-4 border border-border rounded-lg">
          <div className="h-32 bg-muted rounded animate-pulse mb-4"></div>
          <div className="h-4 bg-muted rounded animate-pulse mb-2"></div>
          <div className="h-3 bg-muted rounded animate-pulse w-2/3"></div>
          <div className="text-xs text-muted-foreground mt-2">项目卡片占位</div>
        </div>
        
        <div className="p-4 border border-border rounded-lg">
          <div className="h-32 bg-muted rounded animate-pulse mb-4"></div>
          <div className="h-4 bg-muted rounded animate-pulse mb-2"></div>
          <div className="h-3 bg-muted rounded animate-pulse w-2/3"></div>
          <div className="text-xs text-muted-foreground mt-2">项目卡片占位</div>
        </div>
        
        <div className="p-4 border border-border rounded-lg">
          <div className="h-32 bg-muted rounded animate-pulse mb-4"></div>
          <div className="h-4 bg-muted rounded animate-pulse mb-2"></div>
          <div className="h-3 bg-muted rounded animate-pulse w-2/3"></div>
          <div className="text-xs text-muted-foreground mt-2">项目卡片占位</div>
        </div>
      </div>
      
      {/* 添加项目按钮占位 */}
      <div className="mt-6">
        <div className="h-10 w-32 bg-primary/20 rounded animate-pulse"></div>
        <div className="text-xs text-muted-foreground mt-2">添加项目按钮占位</div>
      </div>
    </div>
  );
};

export default HomePage;