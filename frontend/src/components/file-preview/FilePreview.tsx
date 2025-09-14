import React from 'react';
import { FileText, Image, Music, Video, File } from 'lucide-react';
import { FileItem } from '../../types/index';

interface FilePreviewProps {
  file: FileItem;
  className?: string;
  onClick?: () => void;
}

const FilePreview = ({ file, className = '', onClick }: FilePreviewProps) => {
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

  const fileType = getFileType(file.name);
  const apiBaseUrl = 'http://localhost:3001';

  const renderPreview = () => {
    switch (fileType) {
      case 'image':
        return (
          <div className="relative w-full h-32 bg-muted rounded-lg overflow-hidden group">
            <img
              src={`${apiBaseUrl}/data/mybook/${file.relativePath}`}
              alt={file.name}
              className="w-full h-full object-cover transition-transform group-hover:scale-105"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.style.display = 'none';
                target.nextElementSibling?.classList.remove('hidden');
              }}
            />
            <div className="hidden absolute inset-0 flex items-center justify-center bg-muted">
              <Image className="w-8 h-8 text-muted-foreground" />
            </div>
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
          </div>
        );
      
      case 'audio':
        return (
          <div className="w-full h-32 bg-muted rounded-lg flex flex-col items-center justify-center p-4">
            <Music className="w-8 h-8 text-blue-500 mb-2" />
            <audio 
              controls 
              className="w-full max-w-48"
              preload="none"
            >
              <source src={`${apiBaseUrl}/api/files/${file.id}/content`} />
              您的浏览器不支持音频播放
            </audio>
          </div>
        );
      
      case 'video':
        return (
          <div className="w-full h-32 bg-muted rounded-lg overflow-hidden">
            <video 
              className="w-full h-full object-cover"
              controls
              preload="metadata"
            >
              <source src={`${apiBaseUrl}/api/files/${file.id}/content`} />
              您的浏览器不支持视频播放
            </video>
          </div>
        );
      
      case 'document':
        return (
          <div className="w-full h-32 bg-muted rounded-lg flex items-center justify-center">
            <FileText className="w-8 h-8 text-green-500" />
          </div>
        );
      
      default:
        return (
          <div className="w-full h-32 bg-muted rounded-lg flex items-center justify-center">
            <File className="w-8 h-8 text-muted-foreground" />
          </div>
        );
    }
  };

  return (
    <div 
      className={`cursor-pointer transition-transform hover:scale-[1.02] ${className}`}
      onClick={onClick}
    >
      {renderPreview()}
      <div className="mt-2 px-1">
        <p className="text-sm font-medium truncate" title={file.name}>
          {file.name}
        </p>
        <p className="text-xs text-muted-foreground">
          {(file.size / 1024).toFixed(1)} KB
        </p>
      </div>
    </div>
  );
};

export default FilePreview;