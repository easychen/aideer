import React, { useState, useMemo } from 'react';
import { X, Download, FileText, Image, Music, Video, File, Edit, Trash2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { FileItem } from '../../types/index';
import { apiService } from '../../services/api';
import { useFileUpdate } from '../../contexts/FileUpdateContext';
import PluginContainer from '../../plugins/components/PluginContainer';
import { pluginManager } from '../../plugins/manager/PluginManager';
import { useProjectStore } from '../../stores/useProjectStore';
import FileExtraInfoComponent from './FileExtraInfo';

interface FileDetailModalProps {
  file: FileItem | null;
  isOpen: boolean;
  onClose: () => void;
  projectId: number;
  onFileUpdated?: () => void; // 文件更新后的回调，用于刷新文件列表
}

const FileDetailModal = ({ file, isOpen, onClose, projectId }: FileDetailModalProps) => {
  const { t } = useTranslation();
  const { currentProject } = useProjectStore();
  const [leftWidth, setLeftWidth] = useState(30); // 左侧栏宽度百分比
  const [rightWidth, setRightWidth] = useState(25); // 右侧栏宽度百分比
  const [isRenaming, setIsRenaming] = useState(false);
  const [newFileName, setNewFileName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { triggerFileUpdate } = useFileUpdate();
  
  // 检查是否有可用插件
  const hasAvailablePlugins = useMemo(() => {
    if (!file) return false;
    const fileExtension = file.name.split('.').pop()?.toLowerCase() || '';
    const availablePlugins = pluginManager.getPluginsForExtension(fileExtension);
    return availablePlugins.length > 0;
  }, [file]);
  
  if (!isOpen || !file) return null;



  const getFileType = (fileName: string): 'image' | 'audio' | 'video' | 'document' | 'other' => {
    const ext = fileName.toLowerCase().split('.').pop() || '';
    
    if (['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp', 'svg'].includes(ext)) {
      return 'image';
    }
    if (['mp3', 'wav', 'ogg', 'aac', 'flac', 'm4a'].includes(ext)) {
      return 'audio';
    }
    if (['mp4', 'avi', 'mov', 'wmv', 'flv', 'webm', 'mkv'].includes(ext)) {
      return 'video';
    }
    if (['pdf', 'doc', 'docx', 'txt', 'md', 'rtf'].includes(ext)) {
      return 'document';
    }
    return 'other';
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  const fileType = getFileType(file.name);
  const apiBaseUrl = import.meta.env.VITE_RESOURCE_HOST || '';

  const getFileIcon = () => {
    switch (fileType) {
      case 'image':
        return <Image className="w-6 h-6 text-blue-500" />;
      case 'audio':
        return <Music className="w-6 h-6 text-green-500" />;
      case 'video':
        return <Video className="w-6 h-6 text-red-500" />;
      case 'document':
        return <FileText className="w-6 h-6 text-orange-500" />;
      default:
        return <File className="w-6 h-6 text-gray-500" />;
    }
  };

  const renderPreview = () => {
    switch (fileType) {
      case 'image':
        return (
          <div className="w-full h-full bg-muted rounded-lg overflow-hidden flex items-center justify-center">
            <img
              src={`${apiBaseUrl}/data/${currentProject?.path || 'mybook'}/${file.relativePath}`}
              alt={file.name}
              className="max-w-full max-h-full object-contain"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.style.display = 'none';
                target.nextElementSibling?.classList.remove('hidden');
              }}
            />
            <div className="hidden items-center justify-center h-full bg-muted">
              <Image className="w-12 h-12 text-muted-foreground" />
              <span className="ml-2 text-muted-foreground">{t('file.detail.previewContent.imageLoadError')}</span>
            </div>
          </div>
        );
      
      case 'audio':
        return (
          <div className="w-full bg-muted rounded-lg p-8 flex flex-col items-center">
            <Music className="w-16 h-16 text-blue-500 mb-4" />
            <audio 
              controls 
              className="w-full max-w-md"
              preload="none"
            >
              <source src={`${apiBaseUrl}/data/${currentProject?.path || 'mybook'}/${file.relativePath}`} />
              {t('file.detail.previewContent.audioNotSupported')}
            </audio>
          </div>
        );
      
      case 'video':
        return (
          <div className="w-full h-full bg-muted rounded-lg overflow-hidden flex items-center justify-center">
            <video 
              className="max-w-full max-h-full object-contain"
              controls
              preload="metadata"
            >
              <source src={`${apiBaseUrl}/data/${currentProject?.path || 'mybook'}/${file.relativePath}`} />
              {t('file.detail.previewContent.videoNotSupported')}
            </video>
          </div>
        );
      
      case 'document':
        return (
          <div className="w-full h-48 bg-muted rounded-lg flex items-center justify-center">
            <div className="text-center">
              <FileText className="w-16 h-16 text-green-500 mx-auto mb-2" />
              <p className="text-muted-foreground">{t('file.detail.previewContent.documentPreview')}</p>
            <p className="text-sm text-muted-foreground mt-1">{t('file.detail.previewContent.documentPreviewDesc')}</p>
            </div>
          </div>
        );
      
      default:
        return (
          <div className="w-full h-48 bg-muted rounded-lg flex items-center justify-center">
            <div className="text-center">
              <File className="w-16 h-16 text-muted-foreground mx-auto mb-2" />
              <p className="text-muted-foreground">{t('file.detail.previewContent.unsupportedFileType')}</p>
            </div>
          </div>
        );
    }
  };

  const handleDownload = () => {
    const currentProject = useProjectStore.getState().currentProject;
    const downloadUrl = `${apiBaseUrl}/data/${currentProject?.path || 'mybook'}/${file.relativePath}`;
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.download = file.name;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleRename = () => {
    setNewFileName(file.name);
    setIsRenaming(true);
  };

  const confirmRename = async () => {
    if (newFileName && newFileName !== file.name) {
      setIsLoading(true);
      try {
        await apiService.renameFile(file.id.toString(), projectId, newFileName);
        // 更新本地文件对象
        file.name = newFileName;
        // 触发文件列表刷新
        triggerFileUpdate();
        setIsRenaming(false);
      } catch (error) {
        console.error(t('file.detail.errors.renameFailed'), error);
        console.error(t('file.detail.errors.renameFailed'), error);
      } finally {
        setIsLoading(false);
      }
    }
  };

  const cancelRename = () => {
    setIsRenaming(false);
    setNewFileName('');
  };

  const handleDelete = async () => {
    if (confirm(t('file.detail.deleteConfirm', { fileName: file.name }))) {
      try {
        await apiService.deleteFile(file.id.toString(), projectId);
        // 触发文件列表刷新
        triggerFileUpdate();
        onClose(); // 删除后关闭模态框
        // 文件删除成功，通过onClose关闭模态框已经给用户反馈
      } catch (error) {
        console.error(t('file.detail.errors.deleteFailed'), error);
        console.error(t('file.detail.errors.deleteFailed'), error);
      }
    }
  };

  const handleMouseDown = (e: React.MouseEvent, type: 'left' | 'right') => {
    e.preventDefault();
    const startX = e.clientX;
    const startWidth = type === 'left' ? leftWidth : rightWidth;
    
    const handleMouseMove = (e: MouseEvent) => {
      const containerWidth = window.innerWidth * 0.8;
      const deltaX = e.clientX - startX;
      const deltaPercent = (deltaX / containerWidth) * 100;
      
      if (type === 'left') {
        const newWidth = Math.max(20, Math.min(50, startWidth + deltaPercent));
        setLeftWidth(newWidth);
      } else {
        const newWidth = Math.max(20, Math.min(50, startWidth - deltaPercent));
        setRightWidth(newWidth);
      }
    };
    
    const handleMouseUp = () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
    
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  return (
    <div className="fixed inset-0 dark:bg-black/90 bg-white/90 flex items-center justify-center z-50 p-4">
      <div className="bg-card rounded-lg shadow-xl w-[90vw] h-[90vh] overflow-hidden flex flex-col border">
        {/* 头部 */}
        <div className="flex items-center justify-between p-4 border-b border-border flex-shrink-0">
          <div className="flex items-center space-x-3">
            {getFileIcon()}
            <div>
              <h2 className="text-lg font-semibold truncate" title={file.name}>
                {file.name}
              </h2>
              <p className="text-sm text-muted-foreground">
                {formatFileSize(file.size)}
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={handleRename}
              className="p-2 hover:bg-muted rounded-lg transition-colors"
              title={t('file.detail.renameFile')}
            >
              <Edit className="w-5 h-5" />
            </button>
            <button
              onClick={handleDelete}
              className="p-2 hover:bg-muted rounded-lg transition-colors"
              title={t('file.detail.deleteFile')}
            >
              <Trash2 className="w-5 h-5" />
            </button>
            <button
              onClick={handleDownload}
              className="p-2 hover:bg-muted rounded-lg transition-colors"
              title={t('file.detail.downloadFile')}
            >
              <Download className="w-5 h-5" />
            </button>
            <button
              onClick={onClose}
              className="p-2 hover:bg-muted rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* 重命名对话框 */}
        {isRenaming && (
          <div className="p-4 border-b border-border bg-muted/50">
            <div className="flex items-center space-x-3">
              <span className="text-sm font-medium">{t('file.detail.renameDialog.title')}</span>
              <input
                type="text"
                value={newFileName}
                onChange={(e) => setNewFileName(e.target.value)}
                className="flex-1 px-3 py-2 border border-border rounded-md bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder={t('file.detail.renameDialog.placeholder')}
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    confirmRename();
                  } else if (e.key === 'Escape') {
                    cancelRename();
                  }
                }}
              />
              <button
                onClick={confirmRename}
                disabled={isLoading || !newFileName || newFileName === file.name}
                className="px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? t('file.detail.renameDialog.renaming') : t('file.detail.renameDialog.confirm')}
              </button>
              <button
                onClick={cancelRename}
                disabled={isLoading}
                className="px-4 py-2 border border-border rounded-md text-sm hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {t('file.detail.renameDialog.cancel')}
              </button>
            </div>
          </div>
        )}

        {/* 动态布局 - 根据插件可用性显示两栏或三栏 */}
        <div className="flex flex-1 overflow-hidden">
          {/* 左侧栏 */}
          <div className="flex flex-col border-r border-border" style={{ width: hasAvailablePlugins ? `${leftWidth}%` : '50%' }}>
            {/* 预览区域 */}
            <div className="flex-1 p-4 overflow-hidden">
              <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide mb-3">
                {t('file.detail.preview')}
              </h3>
              <div className="h-full">
                {renderPreview()}
              </div>
            </div>
            
            {/* 文件信息 */}
            <div className="border-t border-border p-4 max-h-[40%] overflow-y-auto">
              <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide mb-3">
                {t('file.detail.fileInfo')}
              </h3>
              <div className="space-y-2">
                <div className="flex items-start space-x-3">
                  <span className="text-sm text-muted-foreground flex-shrink-0 w-16">{t('file.detail.fileName')}:</span>
                  <span className="text-sm font-medium flex-1 truncate" title={file.name}>{file.name}</span>
                </div>
                <div className="flex items-start space-x-3">
                  <span className="text-sm text-muted-foreground flex-shrink-0 w-16">{t('file.detail.size')}:</span>
                  <span className="text-sm font-medium flex-1">{formatFileSize(file.size)}</span>
                </div>
                <div className="flex items-start space-x-3">
                  <span className="text-sm text-muted-foreground flex-shrink-0 w-16">{t('file.detail.type')}:</span>
                  <span className="text-sm font-medium flex-1">{file.name.split('.').pop()?.toUpperCase() || t('file.detail.unknown')}</span>
                </div>
                <div className="flex items-start space-x-3">
                  <span className="text-sm text-muted-foreground flex-shrink-0 w-16">{t('file.detail.modifiedTime')}:</span>
                  <span className="text-sm font-medium flex-1">{formatDate(file.lastModified)}</span>
                </div>
                <div className="flex items-start space-x-3">
                  <span className="text-sm text-muted-foreground flex-shrink-0 w-16">{t('file.detail.path')}:</span>
                  <span className="text-sm font-medium flex-1 truncate" title={file.relativePath}>
                    {file.relativePath}
                  </span>
                </div>
              </div>
            </div>
          </div>
          
          {/* 左侧拖拽条 - 仅在有插件时显示 */}
          {hasAvailablePlugins && (
            <div 
              className="w-1 bg-border hover:bg-primary cursor-col-resize transition-colors"
              onMouseDown={(e) => handleMouseDown(e, 'left')}
            />
          )}
          
          {/* 中间栏 - 插件系统 - 仅在有插件时显示 */}
          {hasAvailablePlugins && (
            <div className="flex-1 flex flex-col border-r border-border break-words break-all">
              <PluginContainer
                file={file}
                projectId={projectId}
              />
            </div>
          )}
          
          {/* 右侧拖拽条 */}
          <div 
            className="w-1 bg-border hover:bg-primary cursor-col-resize transition-colors"
            onMouseDown={(e) => handleMouseDown(e, 'right')}
          />
          
          {/* 右侧栏 - 文件额外信息 */}
          <div className="flex flex-col" style={{ width: hasAvailablePlugins ? `${rightWidth}%` : '50%' }}>
            <FileExtraInfoComponent
              file={file}
              projectId={projectId}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default FileDetailModal;