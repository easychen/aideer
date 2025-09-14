import { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import { Folder } from 'lucide-react';
import FileGrid from '../components/file-grid/FileGrid';
import FileDetailModal from '../components/file-detail/FileDetailModal';
import { FileItem } from '../types/index';
import { useProjectStore } from '../stores/useProjectStore';
import { usePathContext } from '../contexts/PathContext';

interface OutletContext {
  refreshTrigger: number;
}

const MainPage = () => {
  const { currentProject, loading, fetchProjects } = useProjectStore();
  const { currentPath, setCurrentPath } = usePathContext();
  const { refreshTrigger } = useOutletContext<OutletContext>();
  const [selectedFile, setSelectedFile] = useState<FileItem | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

  useEffect(() => {
    // 初始化时加载项目列表
    fetchProjects();
  }, [fetchProjects]);

  const handleFileGridSelect = (file: FileItem) => {
    if (file.type === 'directory') {
      // 如果选择的是目录，更新当前路径
      setCurrentPath(file.path);
    } else {
      // 处理文件选择逻辑 - 打开详情浮层
      setSelectedFile(file);
      setIsDetailModalOpen(true);
    }
  };

  // 监听刷新触发器，当导入完成时重新渲染组件
  const [fileGridKey, setFileGridKey] = useState(0);
  
  useEffect(() => {
    if (refreshTrigger > 0) {
      console.log('Import completed, refreshing file list...');
      // 通过改变key来强制FileGrid重新渲染和重新加载数据
      setFileGridKey(prev => prev + 1);
    }
  }, [refreshTrigger]);



  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">加载项目中...</p>
        </div>
      </div>
    );
  }

  if (!currentProject) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <Folder className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">请选择一个项目</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full">
      <FileGrid 
        key={fileGridKey}
        projectId={currentProject.id}
        currentPath={currentPath}
        onFileSelect={handleFileGridSelect}
      />
      
      <FileDetailModal
        file={selectedFile}
        isOpen={isDetailModalOpen}
        onClose={() => {
          setIsDetailModalOpen(false);
          setSelectedFile(null);
        }}
      />
    </div>
  );
};

export default MainPage;