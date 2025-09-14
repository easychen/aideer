import { File, Folder, Image, Video, Music, FileText, MoreVertical, Download, Trash2 } from 'lucide-react';
import { useState } from 'react';

interface FileItem {
  id: string;
  name: string;
  type: 'file' | 'folder';
  size?: string;
  modified: string;
  extension?: string;
}

const FileListItem = ({ item }: { item: FileItem }) => {
  const getFileIcon = (extension?: string) => {
    if (item.type === 'folder') return <Folder className="w-8 h-8 text-blue-500" />;
    
    switch (extension?.toLowerCase()) {
      case 'jpg':
      case 'jpeg':
      case 'png':
      case 'gif':
      case 'webp':
        return <Image className="w-8 h-8 text-green-500" />;
      case 'mp4':
      case 'avi':
      case 'mov':
      case 'mkv':
        return <Video className="w-8 h-8 text-purple-500" />;
      case 'mp3':
      case 'wav':
      case 'flac':
        return <Music className="w-8 h-8 text-orange-500" />;
      case 'txt':
      case 'md':
      case 'doc':
      case 'docx':
        return <FileText className="w-8 h-8 text-blue-400" />;
      default:
        return <File className="w-8 h-8 text-gray-500" />;
    }
  };

  return (
    <div className="flex items-center p-3 border border-border rounded-lg hover:bg-accent/50 transition-colors group">
      <div className="mr-3">
        {getFileIcon(item.extension)}
      </div>
      <div className="flex-1 min-w-0">
        <div className="font-medium text-sm truncate">{item.name}</div>
        <div className="text-xs text-muted-foreground flex items-center space-x-2">
          <span>{item.modified}</span>
          {item.size && <span>• {item.size}</span>}
        </div>
      </div>
      <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center space-x-1">
        <button 
          className="p-1 hover:bg-muted rounded transition-colors"
          title="下载"
        >
          <Download className="w-4 h-4" />
        </button>
        <button 
          className="p-1 hover:bg-muted rounded transition-colors"
          title="更多操作"
        >
          <MoreVertical className="w-4 h-4" />
        </button>
        <button 
          className="p-1 hover:bg-destructive/10 text-destructive rounded transition-colors"
          title="删除"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

const HomePage = () => {
  const [files] = useState<FileItem[]>([
    {
      id: '1',
      name: 'project-demo.mp4',
      type: 'file',
      extension: 'mp4',
      size: '125.3 MB',
      modified: '2024-01-15 14:30'
    },
    {
      id: '2',
      name: 'assets',
      type: 'folder',
      modified: '2024-01-15 12:15'
    },
    {
      id: '3',
      name: 'screenshot.png',
      type: 'file',
      extension: 'png',
      size: '2.1 MB',
      modified: '2024-01-15 10:45'
    },
    {
      id: '4',
      name: 'background-music.mp3',
      type: 'file',
      extension: 'mp3',
      size: '8.7 MB',
      modified: '2024-01-14 16:20'
    },
    {
      id: '5',
      name: 'README.md',
      type: 'file',
      extension: 'md',
      size: '1.2 KB',
      modified: '2024-01-14 09:30'
    }
  ]);

  return (
    <div className="h-full flex flex-col">
      {/* 文件列表头部 */}
      <div className="p-4 border-b border-border">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold">文件列表</h2>
            <p className="text-sm text-muted-foreground">{files.length} 个项目</p>
          </div>
          <div className="flex items-center space-x-2">
            <select className="px-3 py-1 text-sm border border-border rounded bg-background">
              <option>按名称排序</option>
              <option>按修改时间排序</option>
              <option>按大小排序</option>
            </select>
          </div>
        </div>
      </div>
      
      {/* 文件列表内容 */}
      <div className="flex-1 p-4">
        {files.length > 0 ? (
          <div className="space-y-2">
            {files.map((file) => (
              <FileListItem key={file.id} item={file} />
            ))}
          </div>
        ) : (
          <div className="mt-8 text-center text-muted-foreground">
            <div className="text-sm">当前目录为空</div>
            <div className="text-xs mt-1">拖拽文件到此处或点击导入按钮添加文件</div>
          </div>
        )}
      </div>
    </div>
  );
};

export default HomePage;