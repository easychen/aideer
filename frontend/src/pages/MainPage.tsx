import { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import { Folder } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import FileGrid from '../components/file-grid/FileGrid';
import FileDetailModal from '../components/file-detail/FileDetailModal';
import ImportDialog from '../components/dialogs/ImportDialog';
import { FileItem } from '../types/index';
import { useProjectStore } from '../stores/useProjectStore';
import { usePathContext } from '../contexts/PathContext';
import { useFileUpdate } from '../contexts/FileUpdateContext';

interface OutletContext {
  refreshTrigger: number;
  isManagementMode: boolean;
  onToggleManagement: () => void;
  selectedFiles: string[];
  onSelectAll: () => void;
  onDeselectAll: () => void;
  onBatchDelete: () => void;
  onBatchMove: () => void;
  onToggleFileSelection: (fileId: string) => void;
  updateAllFiles: (files: string[]) => void;
}

const MainPage = () => {
  const { t } = useTranslation();
  const { currentProject, loading, fetchProjects } = useProjectStore();
  const { currentPath, setCurrentPath } = usePathContext();
  const { 
    refreshTrigger, 
    isManagementMode, 
    onToggleManagement,
    selectedFiles,
    onSelectAll,
    onDeselectAll,
    onBatchDelete,
    onBatchMove,
    onToggleFileSelection,
    updateAllFiles
  } = useOutletContext<OutletContext>();
  const [selectedFile, setSelectedFile] = useState<FileItem | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  // const { fileUpdateTrigger, onFileUpdate } = useFileUpdate();
  const { fileUpdateTrigger } = useFileUpdate();
  
  // 拖拽相关状态
  const [isDragOver, setIsDragOver] = useState(false);
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false);
  const [draggedFiles, setDraggedFiles] = useState<File[]>([]);
  const [fileGridKey, setFileGridKey] = useState(0);

  useEffect(() => {
    // 初始化时加载项目列表
    if (!currentProject) {
      fetchProjects();
    }
  }, [currentProject, fetchProjects]);

  // 监听文件更新触发器
  useEffect(() => {
    if (fileUpdateTrigger > 0) {
      setFileGridKey(prev => prev + 1);
    }
  }, [fileUpdateTrigger]);

  // 监听刷新触发器
  useEffect(() => {
    if (refreshTrigger > 0) {
      setFileGridKey(prev => prev + 1);
    }
  }, [refreshTrigger]);

  const handleFileGridSelect = (file: FileItem) => {
    if (isManagementMode) {
      // 管理模式下，切换文件选中状态
      // 这个逻辑将在Layout组件中处理
      return;
    }
    
    if (file.type === 'directory') {
      // 如果选择的是目录，更新当前路径
      setCurrentPath(file.path);
    } else {
      // 处理文件选择逻辑 - 打开详情浮层
      setSelectedFile(file);
      setIsDetailModalOpen(true);
    }
  };

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">{t('common.loadingProject')}</p>
        </div>
      </div>
    );
  }

  if (!currentProject) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <Folder className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">{t('project.selectProject')}</p>
        </div>
      </div>
    );
  }

  // 拖拽事件处理器
  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    // 只有当离开整个拖拽区域时才设置为false
    if (!e.currentTarget.contains(e.relatedTarget as Node)) {
      setIsDragOver(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);

    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0 && currentProject) {
      setDraggedFiles(files);
      setIsImportDialogOpen(true);
    }
  };

  const handleImportComplete = () => {
    setIsImportDialogOpen(false);
    setDraggedFiles([]);
    // 触发文件列表刷新
    setFileGridKey(prev => prev + 1);
  };

  return (
    <div 
      className={`h-full relative ${isDragOver ? 'bg-blue-50 border-2 border-dashed border-blue-300' : ''}`}
      onDragEnter={handleDragEnter}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {/* 拖拽提示覆盖层 */}
      {isDragOver && (
        <div className="absolute inset-0 bg-blue-50/80 flex items-center justify-center z-10 pointer-events-none">
          <div className="text-center">
            <div className="text-2xl mb-2">📁</div>
            <p className="text-lg font-medium text-blue-600">{t('file.dropFilesToImport')}</p>
            <p className="text-sm text-blue-500">{t('file.dragFilesHere')}</p>
          </div>
        </div>
      )}

      <FileGrid 
        key={fileGridKey}
        projectId={currentProject.id}
        currentPath={currentPath}
        onFileSelect={handleFileGridSelect}
        isManagementMode={isManagementMode}
        selectedFiles={selectedFiles}
        onToggleFileSelection={onToggleFileSelection}
        onToggleManagement={onToggleManagement}
        onSelectAll={onSelectAll}
        onDeselectAll={onDeselectAll}
        onBatchDelete={onBatchDelete}
        onBatchMove={onBatchMove}
        updateAllFiles={updateAllFiles}
      />
      
      <FileDetailModal
        file={selectedFile}
        isOpen={isDetailModalOpen}
        onClose={() => {
          setIsDetailModalOpen(false);
          setSelectedFile(null);
        }}
        projectId={currentProject.id}
        onFileUpdated={() => {
          // 保持兼容性，但实际刷新由全局Context处理
        }}
      />

      {/* 拖拽导入对话框 */}
      <ImportDialog
        isOpen={isImportDialogOpen}
        onClose={() => {
          setIsImportDialogOpen(false);
          setDraggedFiles([]);
        }}
        currentPath={currentPath}
        onImportComplete={handleImportComplete}
        initialFiles={draggedFiles}
      />
    </div>
  );
};

export default MainPage;