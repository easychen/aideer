export interface MediaItem {
  type: 'image' | 'video';
  src: string;
  alt?: string;
  title?: string;
  width: number;
  height: number;
  element: HTMLElement;
}

export class MediaScanner {
  private minSize: number;

  constructor(minSize: number = 300) {
    this.minSize = minSize;
  }

  // 扫描页面中的所有图片
  scanImages(): MediaItem[] {
    const images: MediaItem[] = [];
    const imgElements = document.querySelectorAll('img');
    
    imgElements.forEach(img => {
      // 获取实际显示尺寸
      const rect = img.getBoundingClientRect();
      const width = rect.width || img.naturalWidth || img.width;
      const height = rect.height || img.naturalHeight || img.height;
      
      // 过滤小尺寸图片
      if (width >= this.minSize || height >= this.minSize) {
        images.push({
          type: 'image',
          src: img.src,
          alt: img.alt,
          title: img.title,
          width: Math.round(width),
          height: Math.round(height),
          element: img
        });
      }
    });

    return images;
  }

  // 扫描页面中的所有视频
  scanVideos(): MediaItem[] {
    const videos: MediaItem[] = [];
    const videoElements = document.querySelectorAll('video');
    
    videoElements.forEach(video => {
      const rect = video.getBoundingClientRect();
      const width = rect.width || video.videoWidth || video.width;
      const height = rect.height || video.videoHeight || video.height;
      
      // 过滤小尺寸视频
      if (width >= this.minSize || height >= this.minSize) {
        // 优先获取非blob URL的视频源
        let videoSrc = video.src || video.currentSrc;
        
        // 如果是blob URL，尝试从source元素获取原始URL
        if (videoSrc && videoSrc.startsWith('blob:')) {
          const sources = video.querySelectorAll('source');
          for (const source of sources) {
            if (source.src && !source.src.startsWith('blob:')) {
              videoSrc = source.src;
              break;
            }
          }
        }
        
        videos.push({
          type: 'video',
          src: videoSrc,
          title: video.title,
          width: Math.round(width),
          height: Math.round(height),
          element: video
        });
      }
    });

    return videos;
  }

  // 扫描背景图片
  scanBackgroundImages(): MediaItem[] {
    const backgroundImages: MediaItem[] = [];
    const elements = document.querySelectorAll('*');
    
    elements.forEach(element => {
      const style = window.getComputedStyle(element);
      const backgroundImage = style.backgroundImage;
      
      if (backgroundImage && backgroundImage !== 'none') {
        const matches = backgroundImage.match(/url\(['"]?([^'"]+)['"]?\)/);
        if (matches && matches[1]) {
          const rect = element.getBoundingClientRect();
          const width = rect.width;
          const height = rect.height;
          
          if (width >= this.minSize || height >= this.minSize) {
            backgroundImages.push({
              type: 'image',
              src: matches[1],
              title: element.getAttribute('title') || undefined,
              alt: element.getAttribute('alt') || undefined,
              width: Math.round(width),
              height: Math.round(height),
              element: element as HTMLElement
            });
          }
        }
      }
    });

    return backgroundImages;
  }

  // 获取所有媒体文件
  getAllMedia(): MediaItem[] {
    const images = this.scanImages();
    const videos = this.scanVideos();
    const backgroundImages = this.scanBackgroundImages();
    
    // 去重（基于 src）
    const allMedia = [...images, ...videos, ...backgroundImages];
    const uniqueMedia = allMedia.filter((item, index, self) => 
      index === self.findIndex(t => t.src === item.src)
    );
    
    return uniqueMedia.sort((a, b) => (b.width * b.height) - (a.width * a.height));
  }

  // 更新最小尺寸过滤器
  setMinSize(minSize: number): void {
    this.minSize = minSize;
  }
}