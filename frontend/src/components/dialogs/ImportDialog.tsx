import React, { useState, useRef } from 'react';
import { X, Upload, File, Folder, AlertCircle } from 'lucide-react';
import { useProjectStore } from '../../stores/useProjectStore';
import { apiService } from '../../services/api';

interface ImportDialogProps {
  isOpen: boolean;
  onClose: () => void;
  currentPath: string;
  onImportComplete: () => void;
}

interface FileItem {
  file: File;
  path: string;
  status: 'pending' | 'uploading' | 'success' | 'error';
  progress: number;
  error?: string;
}

const ImportDialog: React.FC<ImportDialogProps> = ({
  isOpen,
  onClose,
  currentPath,
  onImportComplete
}) => {
  const [selectedFiles, setSelectedFiles] = useState<FileItem[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const folderInputRef = useRef<HTMLInputElement>(null);
  const { currentProject } = useProjectStore();

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    const newFiles: FileItem[] = files.map(file => ({
      file,
      path: file.webkitRelativePath || file.name,
      status: 'pending',
      progress: 0
    }));
    setSelectedFiles(prev => [...prev, ...newFiles]);
  };

  const handleFolderSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    const newFiles: FileItem[] = files.map(file => ({
      file,
      path: file.webkitRelativePath,
      status: 'pending',
      progress: 0
    }));
    setSelectedFiles(prev => [...prev, ...newFiles]);
  };

  const removeFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const uploadFiles = async () => {
    if (!currentProject || selectedFiles.length === 0) return;

    setIsUploading(true);
    
    try {
      // 批量上传所有文件
      const formData = new FormData();
      formData.append('projectId', currentProject.id.toString());
      formData.append('targetPath', currentPath);
      
      // 添加所有文件和它们的路径信息
      const filePaths: string[] = [];
      selectedFiles.forEach((fileItem) => {
        formData.append('files', fileItem.file);
        filePaths.push(fileItem.path);
      });
      
      // 将文件路径信息作为JSON字符串传递
      formData.append('filePaths', JSON.stringify(filePaths));
      
      // 更新所有文件状态为上传中
      setSelectedFiles(prev => 
        prev.map(item => ({ ...item, status: 'uploading', progress: 0 }))
      );

      // 模拟进度更新
      const progressInterval = setInterval(() => {
        setSelectedFiles(prev => 
          prev.map(item => 
            item.progress < 90 
              ? { ...item, progress: item.progress + 10 } 
              : item
          )
        );
      }, 200);

      try {
        // 实际上传文件到后端API
        const response = await apiService.uploadFile(formData);
        
        clearInterval(progressInterval);
        
        if (response.success) {
          // 上传成功
          setSelectedFiles(prev => 
            prev.map(item => ({ ...item, status: 'success', progress: 100 }))
          );
        } else {
          throw new Error(response.error || 'Upload failed');
        }
      } catch (error) {
        clearInterval(progressInterval);
        // 上传失败
        setSelectedFiles(prev => 
          prev.map(item => ({ 
            ...item, 
            status: 'error', 
            progress: 0,
            error: error instanceof Error ? error.message : '上传失败'
          }))
        );
        console.error('Upload failed:', error);
      }

      // 所有文件处理完成后，延迟通知父组件刷新
      setTimeout(() => {
        onImportComplete();
        // 清空文件列表
        setSelectedFiles([]);
      }, 1000);
    } finally {
      setIsUploading(false);
    }
  };

  const getStatusColor = (status: FileItem['status']) => {
    switch (status) {
      case 'pending': return 'text-muted-foreground';
      case 'uploading': return 'text-blue-500';
      case 'success': return 'text-green-500';
      case 'error': return 'text-red-500';
      default: return 'text-muted-foreground';
    }
  };

  const getStatusIcon = (status: FileItem['status']) => {
    switch (status) {
      case 'uploading': return <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />;
      case 'success': return <div className="w-4 h-4 bg-green-500 rounded-full" />;
      case 'error': return <AlertCircle className="w-4 h-4 text-red-500" />;
      default: return null;
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-card rounded-lg shadow-lg w-full max-w-2xl max-h-[80vh] flex flex-col">
        {/* 头部 */}
        <div className="flex items-center justify-between p-6 border-b border-border">
          <div>
            <h2 className="text-lg font-semibold">导入文件</h2>
            <p className="text-sm text-muted-foreground mt-1">
              导入到: {currentProject?.name}{currentPath ? ` / ${currentPath}` : ''}
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-md hover:bg-muted flex items-center justify-center"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* 内容区域 */}
        <div className="flex-1 p-6 overflow-y-auto">
          {/* 选择文件按钮 */}
          <div className="space-y-4 mb-6">
            <div className="flex space-x-4">
              <button
                onClick={() => fileInputRef.current?.click()}
                className="flex-1 h-24 border-2 border-dashed border-border rounded-lg hover:border-primary/50 transition-colors flex flex-col items-center justify-center space-y-2"
              >
                <File className="w-6 h-6 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">选择文件</span>
              </button>
              
              <button
                onClick={() => folderInputRef.current?.click()}
                className="flex-1 h-24 border-2 border-dashed border-border rounded-lg hover:border-primary/50 transition-colors flex flex-col items-center justify-center space-y-2"
              >
                <Folder className="w-6 h-6 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">选择文件夹</span>
              </button>
            </div>
          </div>

          {/* 文件列表 */}
          {selectedFiles.length > 0 && (
            <div className="space-y-2">
              <h3 className="text-sm font-medium">待导入文件 ({selectedFiles.length})</h3>
              <div className="max-h-64 overflow-y-auto space-y-1">
                {selectedFiles.map((fileItem, index) => (
                  <div key={index} className="flex items-center space-x-3 p-2 bg-muted/30 rounded">
                    <div className="flex-shrink-0">
                      {getStatusIcon(fileItem.status)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm truncate">{fileItem.path}</p>
                      <p className="text-xs text-muted-foreground">
                        {(fileItem.file.size / 1024).toFixed(1)} KB
                      </p>
                      {fileItem.status === 'uploading' && (
                        <div className="w-full bg-muted rounded-full h-1 mt-1">
                          <div 
                            className="bg-blue-500 h-1 rounded-full transition-all duration-300"
                            style={{ width: `${fileItem.progress}%` }}
                          />
                        </div>
                      )}
                      {fileItem.error && (
                        <p className="text-xs text-red-500 mt-1">{fileItem.error}</p>
                      )}
                    </div>
                    <div className={`text-xs ${getStatusColor(fileItem.status)}`}>
                      {fileItem.status === 'pending' && '待上传'}
                      {fileItem.status === 'uploading' && '上传中'}
                      {fileItem.status === 'success' && '完成'}
                      {fileItem.status === 'error' && '失败'}
                    </div>
                    {fileItem.status === 'pending' && (
                      <button
                        onClick={() => removeFile(index)}
                        className="text-muted-foreground hover:text-foreground"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* 底部按钮 */}
        <div className="flex items-center justify-end space-x-3 p-6 border-t border-border">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm border border-border rounded-md hover:bg-muted transition-colors"
            disabled={isUploading}
          >
            取消
          </button>
          <button
            onClick={uploadFiles}
            disabled={selectedFiles.length === 0 || isUploading}
            className="px-4 py-2 text-sm bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
          >
            <Upload className="w-4 h-4" />
            <span>{isUploading ? '上传中...' : '开始导入'}</span>
          </button>
        </div>

        {/* 隐藏的文件输入 */}
        <input
          ref={fileInputRef}
          type="file"
          multiple
          className="hidden"
          onChange={handleFileSelect}
        />
        <input
          ref={folderInputRef}
          type="file"
          {...({ webkitdirectory: '' } as any)}
          multiple
          className="hidden"
          onChange={handleFolderSelect}
        />
      </div>
    </div>
  );
};

export default ImportDialog;