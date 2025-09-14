import { Outlet } from 'react-router-dom';
import { Panel, PanelGroup, PanelResizeHandle } from 'react-resizable-panels';
import React, { useState } from 'react';
import { Menu } from 'lucide-react';
import Sidebar from './Sidebar';
import Header from './Header';
import { PathProvider, usePathContext } from '../../contexts/PathContext';

const LayoutContent = () => {
  const { currentPath } = usePathContext();
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [isSidebarMinimized, setIsSidebarMinimized] = useState(false);
  const [floatingButtonPosition, setFloatingButtonPosition] = useState({ x: 20, y: window.innerHeight - 80 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [hasDragged, setHasDragged] = useState(false);

  const handleImportComplete = () => {
    // 触发刷新，可以通过增加计数器来通知子组件
    setRefreshTrigger(prev => prev + 1);
  };

  const handleRefresh = () => {
    // 处理文件树刷新，同时刷新文件列表
    setRefreshTrigger(prev => prev + 1);
  };

  const handleSidebarToggle = () => {
    setIsSidebarMinimized(!isSidebarMinimized);
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setHasDragged(false);
    setDragOffset({
      x: e.clientX - floatingButtonPosition.x,
      y: e.clientY - floatingButtonPosition.y
    });
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (isDragging) {
      setHasDragged(true);
      setFloatingButtonPosition({
        x: Math.max(0, Math.min(window.innerWidth - 60, e.clientX - dragOffset.x)),
        y: Math.max(0, Math.min(window.innerHeight - 60, e.clientY - dragOffset.y))
      });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // 添加全局鼠标事件监听
  React.useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, dragOffset]);
  
  return (
    <div className="h-screen bg-background relative">
      {isSidebarMinimized ? (
        // 最小化状态：显示浮动按钮
        <>
          <button
            onClick={() => {
              if (!hasDragged) {
                handleSidebarToggle();
              }
            }}
            onMouseDown={handleMouseDown}
            className={`fixed z-50 p-3 bg-card border border-border rounded-lg shadow-lg hover:bg-accent transition-colors ${
              isDragging ? 'cursor-grabbing' : 'cursor-grab'
            }`}
            style={{
              left: `${floatingButtonPosition.x}px`,
              top: `${floatingButtonPosition.y}px`
            }}
            title="展开侧边栏（可拖拽）"
          >
            <Menu className="w-5 h-5 text-muted-foreground" />
          </button>
          <div className="flex flex-col h-full overflow-hidden">
            {/* 顶部导航 */}
            <Header currentPath={currentPath} onImportComplete={handleImportComplete} />
            
            {/* 页面内容 */}
            <main className="flex-1 overflow-auto">
              <Outlet context={{ refreshTrigger }} />
            </main>
          </div>
        </>
      ) : (
        // 正常状态：显示面板布局
        <PanelGroup direction="horizontal" autoSaveId="main-layout">
          {/* 左侧面板 - 侧边栏 */}
          <Panel defaultSize={20} minSize={15} maxSize={40}>
            <Sidebar 
              refreshTrigger={refreshTrigger} 
              onRefresh={handleRefresh}
              onMinimize={handleSidebarToggle}
            />
          </Panel>
          
          {/* 分割线 */}
          <PanelResizeHandle className="w-1 bg-border hover:bg-accent transition-colors" />
          
          {/* 右侧面板 - 主内容区域 */}
          <Panel defaultSize={80}>
            <div className="flex flex-col h-full overflow-hidden">
              {/* 顶部导航 */}
              <Header currentPath={currentPath} onImportComplete={handleImportComplete} />
              
              {/* 页面内容 */}
              <main className="flex-1 overflow-auto">
                <Outlet context={{ refreshTrigger }} />
              </main>
            </div>
          </Panel>
        </PanelGroup>
      )}
    </div>
  );
};

const Layout = () => {
  return (
    <PathProvider>
      <LayoutContent />
    </PathProvider>
  );
};

export default Layout;