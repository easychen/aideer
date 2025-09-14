import { useState } from 'react';
import { X, AlertTriangle } from 'lucide-react';
import { apiService } from '../../services/api';

interface DeleteFolderDialogProps {
  isOpen: boolean;
  onClose: () => void;
  projectId: number;
  currentPath: string;
  onFolderDeleted?: () => void;
}

const DeleteFolderDialog = ({ isOpen, onClose, projectId, currentPath, onFolderDeleted }: DeleteFolderDialogProps) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmText, setConfirmText] = useState('');

  // 获取当前目录名称
  const getCurrentFolderName = () => {
    const segments = currentPath.split('/').filter(Boolean);
    return segments[segments.length - 1] || '';
  };

  const handleConfirmDelete = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // 调用API删除目录
      await apiService.deleteDirectory(projectId, currentPath);
      
      onFolderDeleted?.();
      onClose();
    } catch (error) {
      console.error('Failed to delete folder:', error);
      setError('删除目录失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setError(null);
    setConfirmText('');
    onClose();
  };

  const isDeleteEnabled = confirmText.toLowerCase() === 'delete';

  if (!isOpen) return null;

  const folderName = getCurrentFolderName();

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-background border border-border rounded-lg shadow-lg w-full max-w-md mx-4">
        <div className="flex items-center justify-between p-4 border-b border-border">
          <div className="flex items-center space-x-2">
            <AlertTriangle className="w-5 h-5 text-destructive" />
            <h2 className="text-lg font-semibold">删除目录</h2>
          </div>
          <button
            onClick={handleClose}
            className="p-1 hover:bg-muted rounded-md transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        
        <div className="p-4 space-y-4">
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">
              您确定要删除以下目录吗？
            </p>
            <div className="bg-muted/50 p-3 rounded-md">
              <p className="text-sm font-medium">{folderName}</p>
              <p className="text-xs text-muted-foreground mt-1">
                路径: {currentPath}
              </p>
            </div>
            <div className="bg-destructive/10 p-3 rounded-md border border-destructive/20">
              <p className="text-sm text-destructive font-medium flex items-center space-x-2">
                <AlertTriangle className="w-4 h-4" />
                <span>警告</span>
              </p>
              <p className="text-xs text-destructive/80 mt-1">
                此操作不可撤销，目录及其所有内容将被永久删除。
              </p>
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">
                请输入 <code className="bg-muted px-1 py-0.5 rounded text-xs">delete</code> 以确认删除：
              </label>
              <input
                type="text"
                value={confirmText}
                onChange={(e) => setConfirmText(e.target.value)}
                placeholder="输入 delete"
                className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent"
              />
            </div>
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
              onClick={handleConfirmDelete}
              disabled={loading || !isDeleteEnabled}
              className="px-4 py-2 text-sm bg-destructive text-destructive-foreground rounded-md hover:bg-destructive/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? '删除中...' : '确认删除'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DeleteFolderDialog;