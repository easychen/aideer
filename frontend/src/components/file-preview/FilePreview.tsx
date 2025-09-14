import React, { useState, useRef } from 'react';
import { FileText, Image, Music, Video, File } from 'lucide-react';
import { FileItem } from '../../types/index';
import ContextMenu from '../context-menu/ContextMenu';

interface FilePreviewProps {
  file: FileItem;
  className?: string;
  onClick?: () => void;
  onRename?: (file: FileItem) => void;
  onDelete?: (file: FileItem) => void;
  onDownload?: (file: FileItem) => void;
  onPreview?: (file: FileItem) => void;
}

const FilePreview = ({ file, className = '', onClick, onRename, onDelete, onDownload, onPreview }: FilePreviewProps) => {
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
  
  // 右键菜单状态
  const [contextMenu, setContextMenu] = useState<{
    isOpen: boolean;
    position: { x: number; y: number };
  }>({ isOpen: false, position: { x: 0, y: 0 } });

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
  
  // 处理右键菜单
  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    setContextMenu({
      isOpen: true,
      position: { x: e.clientX, y: e.clientY }
    });
  };
  
  // 关闭右键菜单
  const handleCloseContextMenu = () => {
    setContextMenu({ isOpen: false, position: { x: 0, y: 0 } });
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
          <div className="w-full aspect-square bg-muted rounded-lg flex flex-col items-center justify-center p-2">
            <Music className="w-6 h-6 text-blue-500 mb-2" />
            <div className="text-xs text-center text-muted-foreground">
              音频文件
            </div>
          </div>
        );
      
      case 'video':
        return (
          <div className="w-full aspect-square bg-muted rounded-lg flex flex-col items-center justify-center p-2">
            <Video className="w-6 h-6 text-purple-500 mb-2" />
            <div className="text-xs text-center text-muted-foreground">
              视频文件
            </div>
          </div>
        );
      
      case 'document':
        return (
          <div className="w-full aspect-square bg-muted rounded-lg flex flex-col items-center justify-center p-2">
            <FileText className="w-6 h-6 text-green-500 mb-2" />
            <div className="text-xs text-center text-muted-foreground">
              文档文件
            </div>
          </div>
        );
      
      default:
        return (
          <div className="w-full aspect-square bg-muted rounded-lg flex flex-col items-center justify-center p-2">
            <File className="w-6 h-6 text-muted-foreground mb-2" />
            <div className="text-xs text-center text-muted-foreground">
              其他文件
            </div>
          </div>
        );
    }
  };

  return (
    <>
      <div 
        className={`cursor-pointer transition-transform hover:scale-[1.02] ${className}`}
        onClick={onClick}
        onContextMenu={handleContextMenu}
      >
        {renderPreview()}
      </div>
      
      <ContextMenu
        isOpen={contextMenu.isOpen}
        position={contextMenu.position}
        onClose={handleCloseContextMenu}
        onRename={onRename ? () => onRename(file) : undefined}
        onDelete={onDelete ? () => onDelete(file) : undefined}
        onDownload={onDownload ? () => onDownload(file) : undefined}
        onPreview={onPreview ? () => onPreview(file) : undefined}
      />
    </>
  );
};

export default FilePreview;