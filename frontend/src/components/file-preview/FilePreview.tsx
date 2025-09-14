import React, { useState, useRef, useCallback, useEffect } from 'react';
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
  
  // 视频预览状态
  const [videoDuration, setVideoDuration] = useState(0);
  const [videoLoaded, setVideoLoaded] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
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
  
  // 处理视频加载完成事件
  const handleVideoLoad = useCallback(() => {
    if (videoRef.current) {
      setVideoDuration(videoRef.current.duration);
      setVideoLoaded(true);
    }
  }, []);
  
  // 绘制视频帧到canvas
  const drawVideoFrame = useCallback((time: number) => {
    if (!videoRef.current || !canvasRef.current || !videoLoaded) return;
    
    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    
    if (!ctx) return;
    
    video.currentTime = time;
    video.addEventListener('seeked', function onSeeked() {
      video.removeEventListener('seeked', onSeeked);
      
      // 计算保持宽高比的裁剪参数
      const videoAspect = video.videoWidth / video.videoHeight;
      const canvasAspect = canvas.width / canvas.height;
      
      let sx = 0, sy = 0, sw = video.videoWidth, sh = video.videoHeight;
      
      if (videoAspect > canvasAspect) {
        // 视频更宽，裁剪左右两边
        sw = video.videoHeight * canvasAspect;
        sx = (video.videoWidth - sw) / 2;
      } else {
        // 视频更高，裁剪上下两边
        sh = video.videoWidth / canvasAspect;
        sy = (video.videoHeight - sh) / 2;
      }
      
      ctx.drawImage(video, sx, sy, sw, sh, 0, 0, canvas.width, canvas.height);
    });
  }, [videoLoaded]);
  
  // 处理视频鼠标移动事件
  const handleVideoMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current || !videoLoaded || videoDuration === 0) return;
    
    const rect = containerRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width;
    const normalizedX = Math.max(0, Math.min(1, x));
    
    setMousePosition({ x: normalizedX, y: 0.5 });
    
    // 根据鼠标位置计算视频时间
    const targetTime = normalizedX * videoDuration;
    drawVideoFrame(targetTime);
  }, [videoLoaded, videoDuration, drawVideoFrame]);
  
  // 初始化视频第一帧
  useEffect(() => {
    if (videoLoaded && getFileType(file) === 'video') {
      drawVideoFrame(0);
    }
  }, [videoLoaded, file, drawVideoFrame]);
  


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

  const getFileType = (file: FileItem): 'image' | 'audio' | 'video' | 'document' | 'other' => {
    // 优先使用mimeType判断
    if (file.mimeType) {
      if (file.mimeType.startsWith('image/')) {
        return 'image';
      }
      if (file.mimeType.startsWith('audio/')) {
        return 'audio';
      }
      if (file.mimeType.startsWith('video/')) {
        return 'video';
      }
      if (file.mimeType.startsWith('text/') || 
          file.mimeType === 'application/pdf' ||
          file.mimeType === 'application/msword' ||
          file.mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
        return 'document';
      }
    }
    
    // 如果mimeType不可用，回退到文件扩展名判断
    const ext = file.name.toLowerCase().split('.').pop() || '';
    
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

  const fileType = getFileType(file);
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
          <div 
            ref={containerRef}
            className="relative w-full aspect-square bg-muted rounded-lg overflow-hidden group cursor-pointer"
            onMouseMove={handleVideoMouseMove}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
          >
            {/* 隐藏的视频元素用于获取帧 */}
            <video
              ref={videoRef}
              src={`${apiBaseUrl}/data/mybook/${file.relativePath}`}
              className="hidden"
              onLoadedMetadata={handleVideoLoad}
              preload="metadata"
              muted
            />
            
            {/* Canvas用于显示视频帧 */}
            <canvas
              ref={canvasRef}
              className="w-full h-full object-cover transition-all duration-200"
              width={200}
              height={200}
            />
            
            {/* 默认显示图标（视频未加载时） */}
            {!videoLoaded && (
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <Video className="w-6 h-6 text-purple-500 mb-2" />
                <div className="text-xs text-center text-muted-foreground">
                  视频文件
                </div>
              </div>
            )}
            
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
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
    <div 
      className={`cursor-pointer transition-transform hover:scale-[1.02] ${className}`}
      onClick={onClick}
    >
      {renderPreview()}
    </div>
  );
};

export default FilePreview;