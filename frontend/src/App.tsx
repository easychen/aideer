import { Routes, Route } from 'react-router-dom';
import Layout from './components/layout/Layout';
import MainPage from './pages/MainPage';
import { FileUpdateProvider } from './contexts/FileUpdateContext';

function App() {
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