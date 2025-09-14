import React, { useState } from 'react';
import { X, Download, FileText, Image, Music, Video, File, MessageCircle, Edit, Trash2 } from 'lucide-react';
import { FileItem } from '../../types/index';
import { apiService } from '../../services/api';
import { useFileUpdate } from '../../contexts/FileUpdateContext';

interface FileDetailModalProps {
  file: FileItem | null;
  isOpen: boolean;
  onClose: () => void;
  projectId: number;
  onFileUpdated?: () => void; // 文件更新后的回调，用于刷新文件列表
}

const FileDetailModal = ({ file, isOpen, onClose, projectId }: FileDetailModalProps) => {
  const [leftWidth, setLeftWidth] = useState(30); // 左侧栏宽度百分比
  const [rightWidth, setRightWidth] = useState(25); // 右侧栏宽度百分比
  const [isRenaming, setIsRenaming] = useState(false);
  const [newFileName, setNewFileName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { triggerFileUpdate } = useFileUpdate();
  
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
          <div className="w-full h-full bg-muted rounded-lg overflow-hidden flex items-center justify-center">
            <img
              src={`${apiBaseUrl}/data/mybook/${file.relativePath}`}
              alt={file.name}
              className="max-w-full max-h-full object-contain"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.style.display = 'none';
                target.nextElementSibling?.classList.remove('hidden');
              }}
            />
            <div className="hidden flex items-center justify-center h-full bg-muted">
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
          <div className="w-full h-full bg-muted rounded-lg overflow-hidden flex items-center justify-center">
            <video 
              className="max-w-full max-h-full object-contain"
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
        console.error('重命名文件失败:', error);
        console.error('重命名文件失败:', error);
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
    if (confirm(`确定要删除文件 "${file.name}" 吗？此操作不可撤销。`)) {
      try {
        await apiService.deleteFile(file.id.toString(), projectId);
        // 触发文件列表刷新
        triggerFileUpdate();
        onClose(); // 删除后关闭模态框
        // 文件删除成功，通过onClose关闭模态框已经给用户反馈
      } catch (error) {
        console.error('删除文件失败:', error);
        console.error('删除文件失败:', error);
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
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-card rounded-lg shadow-xl w-[90vw] h-[90vh] overflow-hidden flex flex-col">
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
              title="重命名文件"
            >
              <Edit className="w-5 h-5" />
            </button>
            <button
              onClick={handleDelete}
              className="p-2 hover:bg-muted rounded-lg transition-colors"
              title="删除文件"
            >
              <Trash2 className="w-5 h-5" />
            </button>
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

        {/* 重命名对话框 */}
        {isRenaming && (
          <div className="p-4 border-b border-border bg-muted/50">
            <div className="flex items-center space-x-3">
              <span className="text-sm font-medium">重命名文件:</span>
              <input
                type="text"
                value={newFileName}
                onChange={(e) => setNewFileName(e.target.value)}
                className="flex-1 px-3 py-2 border border-border rounded-md bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="请输入新的文件名"
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
                {isLoading ? '重命名中...' : '确认'}
              </button>
              <button
                onClick={cancelRename}
                disabled={isLoading}
                className="px-4 py-2 border border-border rounded-md text-sm hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed"
              >
                取消
              </button>
            </div>
          </div>
        )}

        {/* 三栏布局 */}
        <div className="flex flex-1 overflow-hidden">
          {/* 左侧栏 */}
          <div className="flex flex-col border-r border-border" style={{ width: `${leftWidth}%` }}>
            {/* 预览区域 */}
            <div className="flex-1 p-4 overflow-hidden">
              <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide mb-3">
                预览
              </h3>
              <div className="h-full">
                {renderPreview()}
              </div>
            </div>
            
            {/* 文件信息 */}
            <div className="border-t border-border p-4 max-h-[40%] overflow-y-auto">
              <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide mb-3">
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
          
          {/* 左侧拖拽条 */}
          <div 
            className="w-1 bg-border hover:bg-primary cursor-col-resize transition-colors"
            onMouseDown={(e) => handleMouseDown(e, 'left')}
          />
          
          {/* 中间栏 */}
          <div className="flex-1 flex flex-col border-r border-border">
            <div className="p-4 border-b border-border">
              <div className="flex items-center space-x-2">
                <Edit className="w-4 h-4" />
                <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
                  编辑器
                </h3>
              </div>
            </div>
            <div className="flex-1 p-4 flex items-center justify-center text-muted-foreground">
              <div className="text-center">
                <Edit className="w-16 h-16 mx-auto mb-4 opacity-50" />
                <p>文件编辑器组件</p>
                <p className="text-sm mt-1">即将推出</p>
              </div>
            </div>
          </div>
          
          {/* 右侧拖拽条 */}
          <div 
            className="w-1 bg-border hover:bg-primary cursor-col-resize transition-colors"
            onMouseDown={(e) => handleMouseDown(e, 'right')}
          />
          
          {/* 右侧栏 */}
          <div className="flex flex-col" style={{ width: `${rightWidth}%` }}>
            <div className="p-4 border-b border-border">
              <div className="flex items-center space-x-2">
                <MessageCircle className="w-4 h-4" />
                <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
                  AI 助手
                </h3>
              </div>
            </div>
            <div className="flex-1 p-4 flex items-center justify-center text-muted-foreground">
              <div className="text-center">
                <MessageCircle className="w-16 h-16 mx-auto mb-4 opacity-50" />
                <p>AI 聊天界面</p>
                <p className="text-sm mt-1">即将推出</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FileDetailModal;