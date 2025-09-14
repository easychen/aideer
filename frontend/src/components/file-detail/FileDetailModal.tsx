import React from 'react';
import { X, Download, Eye, Calendar, HardDrive, FileText, Image, Music, Video, File } from 'lucide-react';
import { FileItem } from '../../types/index';

interface FileDetailModalProps {
  file: FileItem | null;
  isOpen: boolean;
  onClose: () => void;
}

const FileDetailModal = ({ file, isOpen, onClose }: FileDetailModalProps) => {
  if (!isOpen || !file) return null;

  // 从项目路径中提取项目名称
  const getProjectName = (projectPath: string): string => {
    return projectPath.split('/').pop() || '';
  };

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
  const apiBaseUrl = 'http://localhost:3001';

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
          <div className="w-full bg-muted rounded-lg overflow-hidden">
            <img
              src={`${apiBaseUrl}/data/mybook/${file.relativePath}`}
              alt={file.name}
              className="w-full object-contain"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.style.display = 'none';
                target.nextElementSibling?.classList.remove('hidden');
              }}
            />
            <div className="hidden flex items-center justify-center h-48 bg-muted">
              <Image className="w-12 h-12 text-muted-foreground" />
              <span className="ml-2 text-muted-foreground">无法加载图片</span>
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
              <source src={`${apiBaseUrl}/data/mybook/${file.relativePath}`} />
              您的浏览器不支持音频播放
            </audio>
          </div>
        );
      
      case 'video':
        return (
          <div className="w-full max-h-96 bg-muted rounded-lg overflow-hidden">
            <video 
              className="w-full h-full object-contain"
              controls
              preload="metadata"
            >
              <source src={`${apiBaseUrl}/data/mybook/${file.relativePath}`} />
              您的浏览器不支持视频播放
            </video>
          </div>
        );
      
      case 'document':
        return (
          <div className="w-full h-48 bg-muted rounded-lg flex items-center justify-center">
            <div className="text-center">
              <FileText className="w-16 h-16 text-green-500 mx-auto mb-2" />
              <p className="text-muted-foreground">文档预览</p>
              <p className="text-sm text-muted-foreground mt-1">点击下载按钮查看完整内容</p>
            </div>
          </div>
        );
      
      default:
        return (
          <div className="w-full h-48 bg-muted rounded-lg flex items-center justify-center">
            <div className="text-center">
              <File className="w-16 h-16 text-muted-foreground mx-auto mb-2" />
              <p className="text-muted-foreground">无法预览此文件类型</p>
            </div>
          </div>
        );
    }
  };

  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = `${apiBaseUrl}/api/files/${file.id}/content`;
    link.download = file.name;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-card rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        {/* 头部 */}
        <div className="flex items-center justify-between p-6 border-b border-border">
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
              onClick={handleDownload}
              className="p-2 hover:bg-muted rounded-lg transition-colors"
              title="下载文件"
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

        {/* 内容区域 */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
          {/* 预览区域 */}
          <div className="mb-6">
            {renderPreview()}
          </div>

          {/* 文件信息 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-3">
              <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
                文件信息
              </h3>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">文件名:</span>
                  <span className="text-sm font-medium">{file.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">大小:</span>
                  <span className="text-sm font-medium">{formatFileSize(file.size)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">类型:</span>
                  <span className="text-sm font-medium">{file.name.split('.').pop()?.toUpperCase() || '未知'}</span>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
                时间信息
              </h3>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">修改时间:</span>
                  <span className="text-sm font-medium">{formatDate(file.lastModified)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">路径:</span>
                  <span className="text-sm font-medium truncate" title={file.relativePath}>
                    {file.relativePath}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FileDetailModal;