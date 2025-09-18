import { MediaScanner, MediaItem } from '../../utils/mediaScanner';

class MediaCollectorOverlay {
  private overlay: HTMLDivElement;
  private mediaScanner: MediaScanner;
  private selectedItems: Set<string> = new Set();
  private minWidth: number = 100;
  private allMediaItems: MediaItem[] = [];

  constructor() {
    this.mediaScanner = new MediaScanner(100);
    this.overlay = this.createOverlay();
    this.attachEventListeners();
  }

  // 保存单个媒体文件
  public async saveSingleMedia(mediaUrl: string, pageUrl: string): Promise<void> {
    try {
      const mediaItem = await this.getMediaItemInfo(mediaUrl);
      
      // 显示确认对话框
      this.showSaveConfirmDialog(mediaItem, pageUrl);
    } catch (error) {
      console.error('Get media info failed:', error);
      this.showNotification('获取文件信息失败', '请重试', 'error');
    }
  }

  // 显示保存确认对话框
  private async showSaveConfirmDialog(mediaItem: MediaItem, pageUrl: string): Promise<void> {
    // 获取保存路径设置
    const savePath = await this.getSavePath();
    
    // 从URL中提取文件名
    const fileName = this.getFileNameFromUrl(mediaItem.src);
    
    // 创建确认对话框
    const dialog = document.createElement('div');
    dialog.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.5);
      display: flex;
      justify-content: center;
      align-items: center;
      z-index: 10001;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    `;
    
    const dialogContent = document.createElement('div');
    dialogContent.style.cssText = `
      background: white;
      padding: 20px;
      border-radius: 8px;
      max-width: 400px;
      width: 90%;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
    `;
    
    dialogContent.innerHTML = `
      <h3 style="margin: 0 0 15px 0; color: #333;">确认保存文件</h3>
      <div style="margin-bottom: 15px;">
        <strong>文件名:</strong> ${fileName}
      </div>
      <div style="margin-bottom: 15px;">
        <label for="aideer-directory-input" style="display: block; margin-bottom: 5px;"><strong>目标路径:</strong></label>
        <input type="text" id="aideer-directory-input" value="${savePath}" style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px; font-size: 14px;" />
        <small style="color: #666; font-size: 12px; display: block; margin-top: 5px;">格式: 项目名/目录路径 (如: mybook/inbox)</small>
      </div>
      <div style="margin-bottom: 15px;">
        <strong>文件尺寸:</strong> ${mediaItem.width} × ${mediaItem.height}
      </div>
      <div id="aideer-loading-indicator" style="display: none; text-align: center; margin: 15px 0;">
        <div style="display: inline-block; width: 20px; height: 20px; border: 2px solid #f3f3f3; border-top: 2px solid #007bff; border-radius: 50%; animation: spin 1s linear infinite;"></div>
        <span style="margin-left: 10px;">正在保存...</span>
      </div>
      <div style="display: flex; gap: 10px; justify-content: flex-end;">
        <button id="aideer-cancel-btn" style="padding: 8px 16px; border: 1px solid #ddd; background: #f5f5f5; border-radius: 4px; cursor: pointer;">取消</button>
        <button id="aideer-confirm-btn" style="padding: 8px 16px; border: none; background: #007bff; color: white; border-radius: 4px; cursor: pointer;">确认保存</button>
      </div>
    `;

    // 添加旋转动画样式
    const style = document.createElement('style');
    style.textContent = `
      @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
      }
    `;
    document.head.appendChild(style);
    
    dialog.appendChild(dialogContent);
    document.body.appendChild(dialog);
    
    const cancelBtn = dialogContent.querySelector('#aideer-cancel-btn') as HTMLButtonElement;
    const confirmBtn = dialogContent.querySelector('#aideer-confirm-btn') as HTMLButtonElement;
    const loadingIndicator = dialogContent.querySelector('#aideer-loading-indicator') as HTMLDivElement;
    const directoryInput = dialogContent.querySelector('#aideer-directory-input') as HTMLInputElement;
    
    // 取消按钮事件
    cancelBtn.addEventListener('click', () => {
      document.body.removeChild(dialog);
      document.head.removeChild(style);
    });
    
    // 确认按钮事件
    confirmBtn.addEventListener('click', async () => {
      try {
        // 显示loading状态
        loadingIndicator.style.display = 'block';
        confirmBtn.disabled = true;
        cancelBtn.disabled = true;
        directoryInput.disabled = true;
        confirmBtn.textContent = '保存中...';
        
        // 获取用户输入的路径
        const customPath = directoryInput.value.trim();
        
        // 执行保存操作
        await this.performSaveWithCustomPath(mediaItem, pageUrl, customPath);
        
        // 保存成功，关闭对话框
        document.body.removeChild(dialog);
        document.head.removeChild(style);
        this.showNotification('保存成功', `文件已保存到 ${customPath}`, 'success');
        
      } catch (error) {
        console.error('Save failed:', error);
        // 隐藏loading，恢复按钮状态
        loadingIndicator.style.display = 'none';
        confirmBtn.disabled = false;
        cancelBtn.disabled = false;
        directoryInput.disabled = false;
        confirmBtn.textContent = '确认保存';
        this.showNotification('保存失败', '请检查网络连接和后端服务', 'error');
      }
    });
    
    // 点击背景关闭对话框
    dialog.addEventListener('click', (e) => {
      if (e.target === dialog) {
        document.body.removeChild(dialog);
        document.head.removeChild(style);
      }
    });
  }

  // 执行实际的保存操作（带自定义路径）
  private async performSaveWithCustomPath(mediaItem: MediaItem, pageUrl: string, customPath: string): Promise<void> {
    const apiUrl = await this.getApiUrl();
    
    // 获取图片的二进制数据
    const imageBlob = await this.fetchImageAsBlob(mediaItem.src);
    
    // 创建FormData
    const formData = new FormData();
    
    // 从URL中提取文件名
    const fileName = this.getFileNameFromUrl(mediaItem.src);
    
    // 处理自定义路径
    const pathParts = customPath.split('/').filter((part: string) => part.length > 0);
    
    // 添加文件到FormData
    formData.append('file', imageBlob, fileName);
    formData.append('source', pageUrl || window.location.href);
    formData.append('width', mediaItem.width.toString());
    formData.append('height', mediaItem.height.toString());
    
    // 添加路径信息
    if (pathParts.length > 0) {
      formData.append('directory', pathParts.join('/'));
    } else {
      formData.append('directory', 'inbox'); // 默认目录
    }
    
    const response = await fetch(`${apiUrl}/api/files/import-media-binary`, {
      method: 'POST',
      body: formData
    });

    if (!response.ok) {
      throw new Error('保存失败');
    }
  }

  // 执行实际的保存操作
  private async performSave(mediaItem: MediaItem, pageUrl: string): Promise<void> {
    const apiUrl = await this.getApiUrl();
    
    // 获取图片的二进制数据
    const imageBlob = await this.fetchImageAsBlob(mediaItem.src);
    
    // 创建FormData
    const formData = new FormData();
    
    // 从URL中提取文件名
    const fileName = this.getFileNameFromUrl(mediaItem.src);
    
    // 获取保存路径并处理
    const savePath = await this.getSavePath();
    const pathParts = savePath.split('/').filter(part => part.length > 0);
    
    // 添加文件到FormData
    formData.append('file', imageBlob, fileName);
    formData.append('source', pageUrl || window.location.href);
    formData.append('width', mediaItem.width.toString());
    formData.append('height', mediaItem.height.toString());
    
    // 添加路径信息
    if (pathParts.length > 0) {
      formData.append('directory', pathParts.join('/'));
    } else {
      formData.append('directory', 'inbox'); // 默认目录
    }
    
    const response = await fetch(`${apiUrl}/api/files/import-media-binary`, {
      method: 'POST',
      body: formData
    });

    if (!response.ok) {
      throw new Error('保存失败');
    }
  }

  // 获取图片的二进制数据
  private async fetchImageAsBlob(imageUrl: string): Promise<Blob> {
    try {
      const response = await fetch(imageUrl);
      if (!response.ok) {
        throw new Error(`Failed to fetch image: ${response.statusText}`);
      }
      return await response.blob();
    } catch (error) {
      console.error('Error fetching image:', error);
      throw new Error('无法获取图片数据');
    }
  }

  // 获取保存路径
  private async getSavePath(): Promise<string> {
    const result = await chrome.storage.sync.get(['savePath']);
    return result.savePath || '/downloads/images';
  }

  // 从URL中提取文件名
  private getFileNameFromUrl(url: string): string {
    try {
      const urlObj = new URL(url);
      const pathname = urlObj.pathname;
      const fileName = pathname.split('/').pop() || 'unknown';
      return fileName.length > 50 ? fileName.substring(0, 47) + '...' : fileName;
    } catch {
      return 'unknown';
    }
  }

  // 获取媒体文件信息
  private async getMediaItemInfo(url: string): Promise<MediaItem> {
    return new Promise((resolve) => {
      const img = new Image();
      const video = document.createElement('video');
      
      // 判断是图片还是视频
      const isVideo = /\.(mp4|webm|ogg|avi|mov)(\?.*)?$/i.test(url);
      
      if (isVideo) {
        video.onloadedmetadata = () => {
          resolve({
            src: url,
            type: 'video',
            width: video.videoWidth || 0,
            height: video.videoHeight || 0,
            element: video
          });
        };
        video.onerror = () => {
          // 如果无法加载，使用默认值
          resolve({
            src: url,
            type: 'video',
            width: 0,
            height: 0,
            element: video
          });
        };
        video.src = url;
      } else {
        img.onload = () => {
          resolve({
            src: url,
            type: 'image',
            width: img.naturalWidth || 0,
            height: img.naturalHeight || 0,
            element: img
          });
        };
        img.onerror = () => {
          // 如果无法加载，使用默认值
          resolve({
            src: url,
            type: 'image',
            width: 0,
            height: 0,
            element: img
          });
        };
        img.src = url;
      }
    });
  }

  // 显示通知
  private showNotification(title: string, message: string, type: 'success' | 'error'): void {
    const notification = document.createElement('div');
    notification.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: ${type === 'success' ? '#4CAF50' : '#f44336'};
      color: white;
      padding: 15px 20px;
      border-radius: 4px;
      box-shadow: 0 2px 10px rgba(0,0,0,0.2);
      z-index: 10001;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      font-size: 14px;
      max-width: 300px;
    `;
    
    notification.innerHTML = `
      <div style="font-weight: bold; margin-bottom: 5px;">${title}</div>
      <div>${message}</div>
    `;
    
    document.body.appendChild(notification);
    
    // 3秒后自动移除
    setTimeout(() => {
      if (notification.parentNode) {
        notification.parentNode.removeChild(notification);
      }
    }, 3000);
  }

  private createOverlay(): HTMLDivElement {
    // 检查是否已存在overlay，如果存在则先移除
    const existingOverlay = document.getElementById('aideer-media-collector-overlay');
    if (existingOverlay) {
      existingOverlay.remove();
    }

    const overlay = document.createElement('div');
    overlay.id = 'aideer-media-collector-overlay';
    overlay.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.8);
      z-index: 10000;
      display: none;
      overflow-y: auto;
      padding: 20px;
      box-sizing: border-box;
    `;

    const container = document.createElement('div');
    container.style.cssText = `
      max-width: 1200px;
      margin: 0 auto;
      background: white;
      border-radius: 8px;
      padding: 20px;
    `;

    const header = document.createElement('div');
    header.style.cssText = `
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 20px;
      border-bottom: 1px solid #eee;
      padding-bottom: 15px;
    `;

    const title = document.createElement('h2');
    title.textContent = 'AiDeer Importer';
    title.style.cssText = `
      margin: 0;
      color: #333;
      font-size: 24px;
    `;

    // 添加宽度过滤控件
    const filterContainer = document.createElement('div');
    filterContainer.style.cssText = `
      display: flex;
      align-items: center;
      gap: 10px;
      margin: 10px 0;
    `;

    const filterLabel = document.createElement('label');
    filterLabel.textContent = '最小宽度:';
    filterLabel.style.cssText = `
      font-size: 14px;
      color: #666;
    `;

    const widthSlider = document.createElement('input');
    widthSlider.type = 'range';
    widthSlider.min = '50';
    widthSlider.max = '1000';
    widthSlider.value = '100';
    widthSlider.style.cssText = `
      width: 150px;
    `;

    const widthValue = document.createElement('span');
    widthValue.textContent = '100px';
    widthValue.style.cssText = `
      font-size: 14px;
      color: #333;
      min-width: 50px;
    `;

    widthSlider.addEventListener('input', (e) => {
      const value = (e.target as HTMLInputElement).value;
      widthValue.textContent = `${value}px`;
      this.minWidth = parseInt(value);
      this.filterAndRenderMedia();
    });

    filterContainer.appendChild(filterLabel);
    filterContainer.appendChild(widthSlider);
    filterContainer.appendChild(widthValue);

    const controls = document.createElement('div');
    controls.style.cssText = `
      display: flex;
      gap: 10px;
      align-items: center;
    `;

    const selectAllBtn = document.createElement('button');
    selectAllBtn.textContent = '全选';
    selectAllBtn.style.cssText = `
      padding: 8px 16px;
      background: #007bff;
      color: white;
      border: none;
      border-radius: 4px;
      cursor: pointer;
      font-size: 14px;
    `;
    selectAllBtn.onclick = () => this.selectAll();

    const importBtn = document.createElement('button');
    importBtn.id = 'aideer-import-btn';
    importBtn.textContent = '导入选中';
    importBtn.style.cssText = `
      padding: 8px 16px;
      background: #28a745;
      color: white;
      border: none;
      border-radius: 4px;
      cursor: pointer;
      font-size: 14px;
    `;
    importBtn.onclick = () => this.importSelected();

    const closeBtn = document.createElement('button');
    closeBtn.textContent = '关闭';
    closeBtn.style.cssText = `
      padding: 8px 16px;
      background: #dc3545;
      color: white;
      border: none;
      border-radius: 4px;
      cursor: pointer;
      font-size: 14px;
    `;
    closeBtn.onclick = () => this.hide();

    controls.appendChild(selectAllBtn);
    controls.appendChild(importBtn);
    controls.appendChild(closeBtn);

    header.appendChild(title);
    header.appendChild(filterContainer);
    header.appendChild(controls);

    const mediaGrid = document.createElement('div');
    mediaGrid.id = 'aideer-media-grid';
    mediaGrid.style.cssText = `
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
      gap: 15px;
      max-height: 70vh;
      overflow-y: auto;
    `;

    container.appendChild(header);
    container.appendChild(mediaGrid);
    overlay.appendChild(container);

    return overlay;
  }

  private attachEventListeners(): void {
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        this.hide();
      }
    });

    this.overlay.addEventListener('click', (e) => {
      if (e.target === this.overlay) {
        this.hide();
      }
    });
  }

  public show(): void {
    if (!document.body.contains(this.overlay)) {
      document.body.appendChild(this.overlay);
    }
    
    this.overlay.style.display = 'block';
    this.loadMedia();
  }

  public hide(): void {
    this.overlay.style.display = 'none';
  }

  private async loadMedia(): Promise<void> {
    const mediaGrid = this.overlay.querySelector('#aideer-media-grid') as HTMLDivElement;
    mediaGrid.innerHTML = '<div style="text-align: center; padding: 20px;">正在扫描媒体文件...</div>';

    try {
      this.allMediaItems = await this.mediaScanner.getAllMedia();
      this.filterAndRenderMedia();
    } catch (error) {
      console.error('Failed to load media:', error);
      mediaGrid.innerHTML = '<div style="text-align: center; padding: 20px; color: red;">加载媒体文件失败</div>';
    }
  }

  private filterAndRenderMedia(): void {
    const filteredItems = this.allMediaItems.filter(item => {
      return item.width >= this.minWidth;
    });
    this.renderMediaItems(filteredItems);
  }

  private renderMediaItems(items: MediaItem[]): void {
    const mediaGrid = this.overlay.querySelector('#aideer-media-grid') as HTMLDivElement;

    if (items.length === 0) {
      mediaGrid.innerHTML = '<div style="text-align: center; padding: 20px;">未找到媒体文件</div>';
      return;
    }

    mediaGrid.innerHTML = '';

    items.forEach((item) => {
      const itemElement = document.createElement('div');
      itemElement.className = 'media-item';
      itemElement.style.cssText = `
        border: 1px solid #ddd;
        border-radius: 8px;
        padding: 10px;
        background: white;
        cursor: pointer;
        transition: all 0.2s;
        position: relative;
      `;

      const checkbox = document.createElement('input');
      checkbox.type = 'checkbox';
      checkbox.style.cssText = `
        position: absolute;
        top: 10px;
        right: 10px;
        width: 18px;
        height: 18px;
        cursor: pointer;
      `;
      checkbox.checked = this.selectedItems.has(item.src);
      checkbox.addEventListener('change', () => {
        if (checkbox.checked) {
          this.selectedItems.add(item.src);
          itemElement.style.borderColor = '#007bff';
          itemElement.style.backgroundColor = '#f8f9fa';
        } else {
          this.selectedItems.delete(item.src);
          itemElement.style.borderColor = '#ddd';
          itemElement.style.backgroundColor = 'white';
        }
      });

      const mediaPreview = document.createElement('div');
      mediaPreview.style.cssText = `
        width: 100%;
        height: 120px;
        background: #f5f5f5;
        border-radius: 4px;
        display: flex;
        align-items: center;
        justify-content: center;
        margin-bottom: 8px;
        overflow: hidden;
      `;

      if (item.type === 'image') {
        const img = document.createElement('img');
        img.src = item.src;
        img.style.cssText = `
          max-width: 100%;
          max-height: 100%;
          object-fit: cover;
        `;
        img.onerror = () => {
          mediaPreview.innerHTML = '<span style="color: #666;">图片加载失败</span>';
        };
        mediaPreview.appendChild(img);
      } else if (item.type === 'video') {
        const video = document.createElement('video');
        
        // 处理视频URL，避免blob URL问题
        let videoSrc = item.src;
        if (videoSrc && videoSrc.startsWith('blob:')) {
          // 对于blob URL，尝试从原始video元素获取更好的源
          const originalVideo = item.element as HTMLVideoElement;
          if (originalVideo && originalVideo.src && !originalVideo.src.startsWith('blob:')) {
            videoSrc = originalVideo.src;
          } else if (originalVideo && originalVideo.currentSrc && !originalVideo.currentSrc.startsWith('blob:')) {
            videoSrc = originalVideo.currentSrc;
          } else {
            // 如果仍然是blob URL，尝试从source元素获取
            const sources = originalVideo?.querySelectorAll('source');
            if (sources && sources.length > 0) {
              for (const source of sources) {
                if (source.src && !source.src.startsWith('blob:')) {
                  videoSrc = source.src;
                  break;
                }
              }
            }
          }
        }
        
        video.src = videoSrc;
        video.style.cssText = `
          max-width: 100%;
          max-height: 100%;
          object-fit: cover;
        `;
        video.controls = false;
        video.muted = true;
        video.onerror = () => {
          mediaPreview.innerHTML = '<span style="color: #666;">视频加载失败</span>';
        };
        mediaPreview.appendChild(video);
      }

      const mediaInfo = document.createElement('div');
      mediaInfo.style.cssText = `
        font-size: 12px;
        color: #666;
        line-height: 1.4;
      `;

      const fileName = item.src.split('/').pop() || item.src;
      mediaInfo.innerHTML = `
        <div style="font-weight: bold; margin-bottom: 4px;">${item.type === 'image' ? '图片' : '视频'}</div>
        <div style="word-break: break-all;">${fileName}</div>
        ${item.width && item.height ? `<div>${item.width} × ${item.height}</div>` : ''}
      `;

      itemElement.appendChild(checkbox);
      itemElement.appendChild(mediaPreview);
      itemElement.appendChild(mediaInfo);

      itemElement.addEventListener('click', (e) => {
        if (e.target !== checkbox) {
          checkbox.click();
        }
      });

      mediaGrid.appendChild(itemElement);
    });
  }

  private selectAll(): void {
    const checkboxes = this.overlay.querySelectorAll('input[type="checkbox"]') as NodeListOf<HTMLInputElement>;
    const allChecked = Array.from(checkboxes).every(cb => cb.checked);
    
    checkboxes.forEach(checkbox => {
      if (allChecked) {
        checkbox.checked = false;
        checkbox.dispatchEvent(new Event('change'));
      } else {
        checkbox.checked = true;
        checkbox.dispatchEvent(new Event('change'));
      }
    });
  }

  private async getApiUrl(): Promise<string> {
    const result = await chrome.storage.sync.get(['apiUrl']);
    return result.apiUrl || 'http://localhost:3001';
  }

  private async importSelected(): Promise<void> {
    if (this.selectedItems.size === 0) {
      alert('请先选择要导入的媒体文件');
      return;
    }

    // 获取导入按钮并显示loading状态
    const importBtn = this.overlay.querySelector('#aideer-import-btn') as HTMLButtonElement;
    const originalText = importBtn.textContent;
    importBtn.disabled = true;
    importBtn.innerHTML = '<span style="display: inline-block; width: 16px; height: 16px; border: 2px solid #fff; border-top: 2px solid transparent; border-radius: 50%; animation: spin 1s linear infinite; margin-right: 8px;"></span>导入中...';

    try {
      const allMedia = await this.mediaScanner.getAllMedia();
      const selectedMediaItems = allMedia.filter(item => this.selectedItems.has(item.src));
      const apiUrl = await this.getApiUrl();
      
      // 获取保存路径并处理
      const savePath = await this.getSavePath();
      const pathParts = savePath.split('/').filter(part => part.length > 0);
      const directory = pathParts.length > 0 ? pathParts.join('/') : 'inbox';
      
      let successCount = 0;
      let failCount = 0;
      
      // 逐个处理每个媒体文件，使用与单个图片相同的逻辑
      for (const mediaItem of selectedMediaItems) {
        try {
          // 创建FormData用于单个文件上传
          const formData = new FormData();
          
          // 获取图片的二进制数据
          const imageBlob = await this.fetchImageAsBlob(mediaItem.src);
          const fileName = this.getFileNameFromUrl(mediaItem.src);
          
          // 添加文件到FormData，使用与单个图片相同的字段名
          formData.append('file', imageBlob, fileName);
          formData.append('source', window.location.href);
          formData.append('width', mediaItem.width.toString());
          formData.append('height', mediaItem.height.toString());
          formData.append('directory', directory);
          
          // 发送到后端API，使用与单个图片相同的端点
          const response = await fetch(`${apiUrl}/api/files/import-media-binary`, {
            method: 'POST',
            body: formData
          });

          if (response.ok) {
            successCount++;
          } else {
            failCount++;
            console.error(`Failed to import ${mediaItem.src}:`, response.statusText);
          }
        } catch (error) {
          failCount++;
          console.error(`Failed to import ${mediaItem.src}:`, error);
        }
      }
      
      // 显示结果通知
      if (successCount > 0) {
        this.showNotification('导入完成', `成功导入 ${successCount} 个媒体文件${failCount > 0 ? `，失败 ${failCount} 个` : ''}`, successCount === selectedMediaItems.length ? 'success' : 'error');
      } else {
        this.showNotification('导入失败', '所有媒体文件导入失败，请检查网络连接和后端服务', 'error');
      }
      
      this.selectedItems.clear();
      this.hide();
    } catch (error) {
      console.error('Import failed:', error);
      this.showNotification('导入失败', '请检查网络连接和后端服务', 'error');
    } finally {
      // 恢复按钮状态
      importBtn.disabled = false;
      importBtn.textContent = originalText;
    }
  }
}

export default defineContentScript({
  matches: ['<all_urls>'],
  main() {
    console.log('AiDeer Importer content script loaded');
    
    const collector = new MediaCollectorOverlay();
    
    // 监听来自background script的消息
    chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
      if (message.action === 'show-media-collector') {
        collector.show();
        sendResponse({ success: true });
      } else if (message.action === 'save-single-media') {
        // 保存单个媒体文件
        collector.saveSingleMedia(message.mediaUrl, message.pageUrl);
        sendResponse({ success: true });
      }
    });
    
    // 添加快捷键支持
    document.addEventListener('keydown', (e) => {
      if (e.ctrlKey && e.shiftKey && e.key === 'M') {
        e.preventDefault();
        collector.show();
      }
    });
  }
});