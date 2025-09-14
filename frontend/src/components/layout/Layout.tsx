import { Outlet } from 'react-router-dom';
import { Panel, PanelGroup, PanelResizeHandle } from 'react-resizable-panels';
import { useState } from 'react';
import Sidebar from './Sidebar';
import Header from './Header';
import { PathProvider, usePathContext } from '../../contexts/PathContext';

const LayoutContent = () => {
  const { currentPath } = usePathContext();
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const handleImportComplete = () => {
    // 触发刷新，可以通过增加计数器来通知子组件
    setRefreshTrigger(prev => prev + 1);
  };

  const handleRefresh = () => {
    // 处理文件树刷新，同时刷新文件列表
    setRefreshTrigger(prev => prev + 1);
  };
  
  return (
    <div className="h-screen bg-background">
      <PanelGroup direction="horizontal" autoSaveId="main-layout">
        {/* 左侧面板 - 侧边栏 */}
        <Panel defaultSize={20} minSize={15} maxSize={40}>
          <Sidebar refreshTrigger={refreshTrigger} onRefresh={handleRefresh} />
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