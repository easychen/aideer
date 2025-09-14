const Header = () => {
  return (
    <header className="h-14 bg-card border-b border-border flex items-center justify-between px-6">
      {/* 左侧：面包屑导航 */}
      <div className="flex items-center space-x-2">
        <div className="h-6 w-32 bg-muted rounded animate-pulse"></div>
        <div className="text-xs text-muted-foreground">面包屑导航占位</div>
      </div>
      
      {/* 中间：搜索框 */}
      <div className="flex-1 max-w-md mx-8">
        <div className="h-9 bg-muted rounded animate-pulse"></div>
        <div className="text-xs text-muted-foreground text-center mt-1">搜索框占位</div>
      </div>
      
      {/* 右侧：操作按钮 */}
      <div className="flex items-center space-x-2">
        <div className="h-8 w-8 bg-muted rounded animate-pulse"></div>
        <div className="h-8 w-8 bg-muted rounded animate-pulse"></div>
        <div className="h-8 w-8 bg-muted rounded animate-pulse"></div>
        <div className="text-xs text-muted-foreground ml-2">操作按钮占位</div>
      </div>
    </header>
  );
};

export default Header;