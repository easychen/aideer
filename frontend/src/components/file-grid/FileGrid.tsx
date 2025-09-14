import { useState, useEffect } from 'react';
import { Download, Eye, MoreVertical, FileText } from 'lucide-react';
import { FileItem } from '../../types/index';
import { apiService } from '../../services/api';
import { getFileIcon, getFileTypeColor } from '../../utils/fileIcons';
import FilePreview from '../file-preview/FilePreview';

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
  const [sortBy, setSortBy] = useState<'name' | 'size' | 'modified'>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

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

  const sortedFiles = [...files].sort((a, b) => {
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
          <div className="flex items-center space-x-2">
            <select 
              value={`${sortBy}-${sortOrder}`}
              onChange={(e) => {
                const [newSortBy, newSortOrder] = e.target.value.split('-') as [typeof sortBy, typeof sortOrder];
                setSortBy(newSortBy);
                setSortOrder(newSortOrder);
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
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {sortedFiles.map((file) => (
            <FilePreview
              key={file.id}
              file={file}
              onClick={() => onFileSelect?.(file)}
              className={selectedFileId === file.id.toString() ? 'ring-2 ring-primary' : ''}
            />
          ))}
        </div>
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
    </div>
  );
};

export default FileGrid;