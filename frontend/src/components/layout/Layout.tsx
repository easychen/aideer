import { Outlet } from 'react-router-dom';
import { Panel, PanelGroup, PanelResizeHandle } from 'react-resizable-panels';
import Sidebar from './Sidebar';
import Header from './Header';

const Layout = () => {
  return (
    <div className="h-screen bg-background">
      <PanelGroup direction="horizontal" autoSaveId="main-layout">
        {/* 左侧面板 - 侧边栏 */}
        <Panel defaultSize={20} minSize={15} maxSize={40}>
          <Sidebar />
        </Panel>
        
        {/* 分割线 */}
        <PanelResizeHandle className="w-1 bg-border hover:bg-accent transition-colors" />
        
        {/* 右侧面板 - 主内容区域 */}
        <Panel defaultSize={80}>
          <div className="flex flex-col h-full overflow-hidden">
            {/* 顶部导航 */}
            <Header />
            
            {/* 页面内容 */}
            <main className="flex-1 overflow-auto">
              <Outlet />
            </main>
          </div>
        </Panel>
      </PanelGroup>
    </div>
  );
};

export default Layout;