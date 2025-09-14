import { useState, useEffect } from 'react';
import { Download, Eye, MoreVertical, FileText, Grid3X3, List, Minus, Plus, Image, Film, Search } from 'lucide-react';
import { FileItem } from '../../types/index';
import { apiService } from '../../services/api';
import { getFileIcon, getFileTypeColor } from '../../utils/fileIcons';
import FilePreview from '../file-preview/FilePreview';
import ContextMenu from '../context-menu/ContextMenu';
import { useViewSettings, previewSizeConfig, PreviewSize } from '../../stores/viewSettings';

interface FileGridProps {
  projectId: number;
  currentPath?: string;
  onFileSelect?: (file: FileItem) => void;
  selectedFileId?: string;
}

interface FileCardProps {
  file: FileItem;
  onSelect?: (file: FileItem) => void;
  isSelected?: boolean;
}

const FileCard = ({ file, onSelect, isSelected }: FileCardProps) => {

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
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div
      className={`p-4 border border-border rounded-lg hover:bg-accent/50 transition-colors cursor-pointer group ${
        isSelected ? 'bg-accent border-primary' : ''
      }`}
      onClick={() => onSelect?.(file)}
    >
      {/* 文件图标和缩略图 */}
      <div className="flex items-center justify-center mb-3">
        {file.thumbnailPath ? (
          <img 
            src={file.thumbnailPath} 
            alt={file.name}
            className="w-16 h-16 object-cover rounded"
          />
        ) : (
          <div className="w-16 h-16 flex items-center justify-center bg-muted rounded">
            <div className={getFileTypeColor(file.name)}>
              {getFileIcon(file.name, 32)}
            </div>
          </div>
        )}
      </div>
      
      {/* 文件信息 */}
      <div className="space-y-1">
        <h3 className="font-medium text-sm truncate" title={file.name}>
          {file.name}
        </h3>
        <p className="text-xs text-muted-foreground">
          {formatFileSize(file.size)}
        </p>
        <p className="text-xs text-muted-foreground">
          {formatDate(file.lastModified)}
        </p>
      </div>
      
      {/* 操作按钮 */}
      <div className="flex items-center justify-between mt-3 opacity-0 group-hover:opacity-100 transition-opacity">
        <div className="flex items-center space-x-1">
          <button 
            className="p-1 hover:bg-muted rounded transition-colors"
            title="预览"
            onClick={(e) => {
              e.stopPropagation();
              // TODO: 实现文件预览
            }}
          >
            <Eye className="w-4 h-4" />
          </button>
          <button 
            className="p-1 hover:bg-muted rounded transition-colors"
            title="下载"
            onClick={(e) => {
              e.stopPropagation();
              // TODO: 实现文件下载
            }}
          >
            <Download className="w-4 h-4" />
          </button>
        </div>
        <button 
          className="p-1 hover:bg-muted rounded transition-colors"
          title="更多操作"
          onClick={(e) => {
            e.stopPropagation();
            // TODO: 实现更多操作菜单
          }}
        >
          <MoreVertical className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

const FileGrid = ({ projectId, currentPath = '', onFileSelect, selectedFileId }: FileGridProps) => {
  const [files, setFiles] = useState<FileItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  // 从localStorage读取排序设置，默认按修改时间由新到旧
  const [sortBy, setSortBy] = useState<'name' | 'size' | 'modified'>(() => {
    const saved = localStorage.getItem('fileGrid-sortBy');
    return (saved as 'name' | 'size' | 'modified') || 'modified';
  });
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>(() => {
    const saved = localStorage.getItem('fileGrid-sortOrder');
    return (saved as 'asc' | 'desc') || 'desc';
  });
  
  // 文件类型过滤设置，默认只显示媒体文件
  const [filterMode, setFilterMode] = useState<'all' | 'media'>(() => {
    const saved = localStorage.getItem('fileGrid-filterMode');
    return (saved as 'all' | 'media') || 'media';
  });
  const [renameDialogOpen, setRenameDialogOpen] = useState(false);
  const [renamingFile, setRenamingFile] = useState<FileItem | null>(null);
  const [newFileName, setNewFileName] = useState('');
  
  // 右键菜单状态
  const [contextMenu, setContextMenu] = useState<{
    isOpen: boolean;
    position: { x: number; y: number };
    file: FileItem | null;
  }>({ isOpen: false, position: { x: 0, y: 0 }, file: null });
  
  // 搜索状态
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchKeyword, setSearchKeyword] = useState('');
  
  // 视图设置
  const { viewMode, previewSize, setViewMode, setPreviewSize } = useViewSettings();

  useEffect(() => {
    loadFiles();
  }, [projectId, currentPath]);

  const loadFiles = async () => {
    try {
      setLoading(true);
      setError(null);
      
      if (currentPath) {
        // 如果指定了路径，获取该目录的内容
        const response = await apiService.getDirectoryContents(projectId, currentPath);
        const filesOnly = response.items.filter((item: any) => item.type === 'file');
        setFiles(filesOnly);
      } else {
        // 如果没有指定路径，获取项目根目录的文件
        const response = await apiService.getProjectFiles(projectId, { limit: 1000, offset: 0 });
        const filesOnly = response.files.filter((item: FileItem) => item.type === 'file');
        // 只显示根目录下的文件（不包含子目录中的文件）
        const rootFiles = filesOnly.filter((file: FileItem) => {
          const pathParts = file.relativePath.split('/');
          return pathParts.length === 1; // 只有一级路径的文件
        });
        setFiles(rootFiles);
      }
    } catch (error) {
      console.error('Failed to load files:', error);
      setError('加载文件失败');
    } finally {
      setLoading(false);
    }
  };

  const handleRename = (file: FileItem) => {
    setRenamingFile(file);
    setNewFileName(file.name);
    setRenameDialogOpen(true);
  };

  const handleDelete = async (file: FileItem) => {
    if (window.confirm(`确定要删除文件 "${file.name}" 吗？此操作不可撤销。`)) {
      try {
        await apiService.deleteFile(file.id, projectId);
        // 重新加载文件列表
        await loadFiles();
      } catch (error) {
        console.error('Failed to delete file:', error);
        alert('删除文件失败');
      }
    }
  };

  const handleRenameConfirm = async () => {
    if (!renamingFile || !newFileName.trim()) return;
    
    try {
      await apiService.renameFile(renamingFile.id, projectId, newFileName.trim());
      // 重新加载文件列表
      await loadFiles();
      setRenameDialogOpen(false);
      setRenamingFile(null);
      setNewFileName('');
    } catch (error) {
      console.error('Failed to rename file:', error);
      alert('重命名文件失败');
    }
  };

  const handleDownload = (file: FileItem) => {
    const apiBaseUrl = 'http://localhost:3001';
    const downloadUrl = `${apiBaseUrl}/data/mybook/${file.relativePath}`;
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.download = file.name;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePreview = (file: FileItem) => {
    onFileSelect?.(file);
  };

  // 预览图大小控制
  const previewSizes: PreviewSize[] = ['xs', 'sm', 'md', 'lg', 'xl'];
  const currentSizeIndex = previewSizes.indexOf(previewSize);
  
  const increaseSizeSize = () => {
    if (currentSizeIndex < previewSizes.length - 1) {
      setPreviewSize(previewSizes[currentSizeIndex + 1]);
    }
  };
  
  const decreaseSize = () => {
    if (currentSizeIndex > 0) {
      setPreviewSize(previewSizes[currentSizeIndex - 1]);
    }
  };

  // 格式化文件大小
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  // 处理右键菜单
  const handleContextMenu = (e: React.MouseEvent, file: FileItem) => {
    e.preventDefault();
    e.stopPropagation();
    setContextMenu({
      isOpen: true,
      position: { x: e.clientX, y: e.clientY },
      file
    });
  };

  // 关闭右键菜单
  const handleCloseContextMenu = () => {
    setContextMenu({ isOpen: false, position: { x: 0, y: 0 }, file: null });
  };

  // 右键菜单操作处理
  const handleContextMenuAction = (action: () => void) => {
    handleCloseContextMenu();
    action();
  };

  // 媒体文件类型判断
  const isMediaFile = (file: FileItem) => {
    const extension = file.name.split('.').pop()?.toLowerCase() || '';
    const mediaExtensions = [
      // 图片
      'jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp', 'svg', 'ico', 'tiff', 'tif',
      // 视频
      'mp4', 'avi', 'mov', 'wmv', 'flv', 'webm', 'mkv', 'm4v', '3gp', 'ogv',
      // 音频
      'mp3', 'wav', 'flac', 'aac', 'ogg', 'wma', 'm4a', 'opus'
    ];
    return mediaExtensions.includes(extension);
  };

  // 过滤和排序文件
  let filteredFiles = filterMode === 'media' 
    ? files.filter(isMediaFile)
    : files;

  // 按搜索关键字过滤
  if (searchKeyword.trim()) {
    filteredFiles = filteredFiles.filter(file => 
      file.name.toLowerCase().includes(searchKeyword.toLowerCase())
    );
  }

  const sortedFiles = [...filteredFiles].sort((a, b) => {
    let comparison = 0;
    
    switch (sortBy) {
      case 'name':
        comparison = a.name.localeCompare(b.name);
        break;
      case 'size':
        comparison = a.size - b.size;
        break;
      case 'modified':
        comparison = new Date(a.lastModified).getTime() - new Date(b.lastModified).getTime();
        break;
    }
    
    return sortOrder === 'asc' ? comparison : -comparison;
  });



  if (loading) {
    return (
      <div className="p-6">
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {[...Array(12)].map((_, i) => (
            <div key={i} className="p-4 border border-border rounded-lg">
              <div className="animate-pulse">
                <div className="w-16 h-16 bg-muted rounded mx-auto mb-3" />
                <div className="h-4 bg-muted rounded mb-1" />
                <div className="h-3 bg-muted rounded w-2/3" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 text-center">
        <p className="text-sm text-destructive mb-2">{error}</p>
        <button 
          onClick={loadFiles}
          className="text-xs text-primary hover:underline"
        >
          重试
        </button>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* 工具栏 */}
      <div className="p-4 border-b border-border">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold">
              {currentPath ? `${currentPath.split('/').pop()} 目录` : '文件列表'}
            </h2>
            <p className="text-sm text-muted-foreground">{sortedFiles.length} 个文件</p>
          </div>
          <div className="flex items-center space-x-4">
            {/* 搜索区域 */}
            <div className="flex items-center space-x-2">
              {isSearchOpen && (
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <input
                    type="text"
                    placeholder="搜索文件名..."
                    value={searchKeyword}
                    onChange={(e) => setSearchKeyword(e.target.value)}
                    className="w-64 pl-10 pr-4 py-1.5 text-sm border border-border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                    autoFocus
                  />
                </div>
              )}
              <button
                onClick={() => setIsSearchOpen(!isSearchOpen)}
                className={`p-2 rounded-md transition-colors ${
                  isSearchOpen ? 'bg-primary text-primary-foreground' : 'hover:bg-accent'
                }`}
                title="搜索文件"
              >
                <Search className="w-4 h-4" />
              </button>
            </div>
            
            {/* 视图模式切换 */}
            <div className="flex items-center space-x-1 border border-border rounded-md p-1">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-1 rounded transition-colors ${
                  viewMode === 'grid' ? 'bg-primary text-primary-foreground' : 'hover:bg-accent'
                }`}
                title="网格视图"
              >
                <Grid3X3 className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-1 rounded transition-colors ${
                  viewMode === 'list' ? 'bg-primary text-primary-foreground' : 'hover:bg-accent'
                }`}
                title="列表视图"
              >
                <List className="w-4 h-4" />
              </button>
            </div>
            
            {/* 文件类型过滤 */}
            <div className="flex items-center space-x-1 border border-border rounded-md p-1">
              <button
                onClick={() => {
                  setFilterMode('media');
                  localStorage.setItem('fileGrid-filterMode', 'media');
                }}
                className={`p-1 rounded transition-colors ${
                  filterMode === 'media' ? 'bg-primary text-primary-foreground' : 'hover:bg-accent'
                }`}
                title="只显示媒体文件"
              >
                <Image className="w-4 h-4" />
              </button>
              <button
                onClick={() => {
                  setFilterMode('all');
                  localStorage.setItem('fileGrid-filterMode', 'all');
                }}
                className={`p-1 rounded transition-colors ${
                  filterMode === 'all' ? 'bg-primary text-primary-foreground' : 'hover:bg-accent'
                }`}
                title="显示全部文件"
              >
                <FileText className="w-4 h-4" />
              </button>
            </div>
            
            {/* 预览图大小控制 */}
            {viewMode === 'grid' && (
              <div className="flex items-center space-x-2">
                <button
                  onClick={decreaseSize}
                  disabled={currentSizeIndex === 0}
                  className="p-1 hover:bg-accent rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  title="缩小预览图"
                >
                  <Minus className="w-4 h-4" />
                </button>
                <div className="flex space-x-1">
                  {previewSizes.map((size, index) => (
                    <div
                      key={size}
                      className={`w-2 h-2 rounded-full ${
                        index === currentSizeIndex ? 'bg-primary' : 'bg-muted'
                      }`}
                    />
                  ))}
                </div>
                <button
                  onClick={increaseSizeSize}
                  disabled={currentSizeIndex === previewSizes.length - 1}
                  className="p-1 hover:bg-accent rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  title="放大预览图"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            )}
            
            {/* 排序选择 */}
            <select 
              value={`${sortBy}-${sortOrder}`}
              onChange={(e) => {
                const [newSortBy, newSortOrder] = e.target.value.split('-') as [typeof sortBy, typeof sortOrder];
                setSortBy(newSortBy);
                setSortOrder(newSortOrder);
                // 保存到localStorage
                localStorage.setItem('fileGrid-sortBy', newSortBy);
                localStorage.setItem('fileGrid-sortOrder', newSortOrder);
              }}
              className="px-3 py-1 text-sm border border-border rounded bg-background"
            >
              <option value="name-asc">按名称 A-Z</option>
              <option value="name-desc">按名称 Z-A</option>
              <option value="size-asc">按大小 小-大</option>
              <option value="size-desc">按大小 大-小</option>
              <option value="modified-desc">按修改时间 新-旧</option>
              <option value="modified-asc">按修改时间 旧-新</option>
            </select>
          </div>
        </div>
      </div>
      
      {/* 文件网格 */}
      <div className="flex-1 p-4 overflow-auto">
        {sortedFiles.length > 0 ? (
          viewMode === 'grid' ? (
            <div className={`grid gap-4 ${
              previewSizeConfig[previewSize].cols
            }`}>
              {sortedFiles.map((file) => (
                <div
                  key={file.id}
                  className={`flex flex-col cursor-pointer hover:bg-accent/50 rounded-lg p-2 transition-colors ${
                    selectedFileId === file.id ? 'ring-2 ring-primary' : ''
                  } ${previewSizeConfig[previewSize].containerClass}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    onFileSelect?.(file);
                  }}
                  onContextMenu={(e) => handleContextMenu(e, file)}
                >
                  <div className={`flex-shrink-0 mx-auto ${
                    previewSizeConfig[previewSize].itemWidth
                  } ${
                    previewSizeConfig[previewSize].itemHeight
                  }`}>
                    <FilePreview
                      file={file}
                      className="w-full h-full"
                    />
                  </div>
                  <div className="mt-2 px-1 min-h-[2.5rem] flex flex-col justify-start">
                    <p className="text-sm font-medium text-center line-clamp-2 leading-tight" title={file.name}>
                      {file.name}
                    </p>
                    <p className="text-xs text-muted-foreground text-center mt-1">
                      {formatFileSize(file.size)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="divide-y divide-border">
              {sortedFiles.map((file) => (
                <div
                  key={file.id}
                  className={`flex items-center space-x-3 p-3 hover:bg-accent/50 cursor-pointer transition-colors ${
                    selectedFileId === file.id ? 'bg-accent' : ''
                  }`}
                  onClick={(e) => {
                    e.stopPropagation();
                    onFileSelect?.(file);
                  }}
                  onContextMenu={(e) => handleContextMenu(e, file)}
                >
                  <div className="flex-shrink-0 w-12 h-12">
                    <FilePreview
                      file={file}
                      className="w-full h-full"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{file.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatFileSize(file.size)} • {new Date(file.lastModified).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )
        ) : (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
              <FileText className="w-8 h-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-medium mb-2">暂无文件</h3>
            <p className="text-sm text-muted-foreground">
              {currentPath ? '当前目录下没有文件' : '项目中还没有文件'}
            </p>
          </div>
        )}
      </div>
      
      {/* 右键菜单 */}
       <ContextMenu
         isOpen={contextMenu.isOpen}
         position={contextMenu.position}
         onClose={handleCloseContextMenu}
         onPreview={contextMenu.file ? () => handleContextMenuAction(() => handlePreview(contextMenu.file!)) : undefined}
         onDownload={contextMenu.file ? () => handleContextMenuAction(() => handleDownload(contextMenu.file!)) : undefined}
         onRename={contextMenu.file ? () => handleContextMenuAction(() => handleRename(contextMenu.file!)) : undefined}
         onDelete={contextMenu.file ? () => handleContextMenuAction(() => handleDelete(contextMenu.file!)) : undefined}
       />
      
      {/* 重命名对话框 */}
      {renameDialogOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-background border border-border rounded-lg p-6 w-96 max-w-[90vw]">
            <h3 className="text-lg font-semibold mb-4">重命名文件</h3>
            <div className="mb-4">
              <label className="block text-sm font-medium mb-2">新文件名</label>
              <input
                type="text"
                value={newFileName}
                onChange={(e) => setNewFileName(e.target.value)}
                className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="输入新的文件名"
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleRenameConfirm();
                  } else if (e.key === 'Escape') {
                    setRenameDialogOpen(false);
                  }
                }}
              />
            </div>
            <div className="flex justify-end space-x-2">
              <button
                onClick={() => {
                  setRenameDialogOpen(false);
                  setRenamingFile(null);
                  setNewFileName('');
                }}
                className="px-4 py-2 text-sm border border-border rounded-md hover:bg-accent transition-colors"
              >
                取消
              </button>
              <button
                onClick={handleRenameConfirm}
                disabled={!newFileName.trim()}
                className="px-4 py-2 text-sm bg-primary text-primary-foreground rounded-md hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                确认
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FileGrid;