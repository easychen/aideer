import { Routes, Route } from 'react-router-dom';
import Layout from './components/layout/Layout';
import MainPage from './pages/MainPage';
import { FileUpdateProvider } from './contexts/FileUpdateContext';
import { useTheme } from './hooks/useTheme';
import { initializePlugins } from './plugins/init';

function App() {
  // 初始化主题
  useTheme();
  
  // 初始化插件系统
  initializePlugins();
  
  return (
    <FileUpdateProvider>
      <div className="min-h-screen bg-background">
         <div className="fixed top-0 left-0 right-0 z-50 h-3 draggable-header hover:bg-gradient-to-b dark:from-gray-500  from-gray-200 to-transparent"></div>
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<MainPage />} />
          </Route>
        </Routes>
      </div>
    </FileUpdateProvider>
  );
}

export default App;