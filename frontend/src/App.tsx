import { Routes, Route } from 'react-router-dom';
import { useEffect } from 'react';
import Layout from './components/layout/Layout';
import MainPage from './pages/MainPage';
import { FileUpdateProvider } from './contexts/FileUpdateContext';
import { useTheme } from './hooks/useTheme';

function App() {
  // 初始化主题
  useTheme();
  
  return (
    <FileUpdateProvider>
      <div className="min-h-screen bg-background">
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