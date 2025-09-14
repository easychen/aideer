import React, { useState, useRef } from 'react';
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

  // 图片预览状态
  const [isHovering, setIsHovering] = useState(false);
  const [mousePosition, setMousePosition] = useState({ x: 0.5, y: 0.5 });
  const [imageSize, setImageSize] = useState({ width: 0, height: 0 });
  const imageRef = useRef<HTMLImageElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // 处理鼠标移动事件
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current) return;
    
    const rect = containerRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width;
    const y = (e.clientY - rect.top) / rect.height;
    
    setMousePosition({ x: Math.max(0, Math.min(1, x)), y: Math.max(0, Math.min(1, y)) });
  };

  // 处理鼠标进入事件
  const handleMouseEnter = () => {
    setIsHovering(true);
  };

  // 处理鼠标离开事件
  const handleMouseLeave = () => {
    setIsHovering(false);
    setMousePosition({ x: 0.5, y: 0.5 });
  };

  // 处理图片加载完成事件
  const handleImageLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const img = e.target as HTMLImageElement;
    setImageSize({ width: img.naturalWidth, height: img.naturalHeight });
  };

  // 计算图片显示位置
  const getObjectPosition = () => {
    if (!isHovering || !containerRef.current) return '50% 0%'; // 默认显示顶部
    
    const containerRect = containerRef.current.getBoundingClientRect();
    const containerAspect = containerRect.width / containerRect.height;
    const imageAspect = imageSize.width / imageSize.height;
    
    if (imageAspect > containerAspect) {
      // 横向图片（宽>高），水平方向会被裁剪
      const x = mousePosition.x * 100;
      return `${x}% 0%`; // 保持顶部对齐
    } else {
      // 竖向图片（高>宽），垂直方向会被裁剪
      const y = mousePosition.y * 100;
      return `50% ${y}%`;
    }
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
          <div 
            ref={containerRef}
            className="relative w-full aspect-square bg-muted rounded-lg overflow-hidden group cursor-pointer"
            onMouseMove={handleMouseMove}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
          >
            <img
              ref={imageRef}
              src={`${apiBaseUrl}/data/mybook/${file.relativePath}`}
              alt={file.name}
              className="w-full h-full object-cover transition-all duration-200"
              style={{
                objectPosition: getObjectPosition()
              }}
              onLoad={handleImageLoad}
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