import React, { useState } from 'react';
import { X } from 'lucide-react';
import { apiService } from '../../services/api';

interface EditFolderDialogProps {
  isOpen: boolean;
  onClose: () => void;
  projectId: number;
  currentPath: string;
  onFolderRenamed?: (newPath?: string) => void;
}

const EditFolderDialog = ({ isOpen, onClose, projectId, currentPath, onFolderRenamed }: EditFolderDialogProps) => {
  const [newName, setNewName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 获取当前目录名称
  const getCurrentFolderName = () => {
    const segments = currentPath.split('/').filter(Boolean);
    return segments[segments.length - 1] || '';
  };

  // 当对话框打开时，设置默认值
  React.useEffect(() => {
    if (isOpen) {
      setNewName(getCurrentFolderName());
      setError(null);
    }
  }, [isOpen, currentPath]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) {
      setError('请输入目录名称');
      return;
    }

    const currentName = getCurrentFolderName();
    if (newName.trim() === currentName) {
      onClose();
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      // 构建新路径
      const pathSegments = currentPath.split('/').filter(Boolean);
      pathSegments[pathSegments.length - 1] = newName.trim();
      const newPath = pathSegments.join('/');
      
      // 调用API重命名目录
      await apiService.renameDirectory(projectId, currentPath, newPath);
      
      onFolderRenamed?.(newPath);
      onClose();
    } catch (error) {
      console.error('Failed to rename folder:', error);
      setError('重命名目录失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setNewName('');
    setError(null);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-background border border-border rounded-lg shadow-lg w-full max-w-md mx-4">
        <div className="flex items-center justify-between p-4 border-b border-border">
          <h2 className="text-lg font-semibold">重命名目录</h2>
          <button
            onClick={handleClose}
            className="p-1 hover:bg-muted rounded-md transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          <div>
            <label htmlFor="folderName" className="block text-sm font-medium mb-2">
              目录名称
            </label>
            <input
              id="folderName"
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="请输入新的目录名称"
              className="w-full px-3 py-2 border border-border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              autoFocus
            />
            <p className="text-xs text-muted-foreground mt-1">
              当前路径: {currentPath}
            </p>
          </div>
          
          {error && (
            <div className="text-sm text-destructive bg-destructive/10 p-2 rounded-md">
              {error}
            </div>
          )}
          
          <div className="flex justify-end space-x-2 pt-2">
            <button
              type="button"
              onClick={handleClose}
              className="px-4 py-2 text-sm border border-border rounded-md hover:bg-muted transition-colors"
            >
              取消
            </button>
            <button
              type="submit"
              disabled={loading || !newName.trim()}
              className="px-4 py-2 text-sm bg-primary text-primary-foreground rounded-md hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? '重命名中...' : '重命名'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditFolderDialog;