import { useState } from 'react';
import { X, Folder, AlertCircle } from 'lucide-react';
import { useProjectStore } from '../../stores/useProjectStore';

interface CreateProjectDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

const CreateProjectDialog = ({ isOpen, onClose }: CreateProjectDialogProps) => {
  const [name, setName] = useState('');
  const [path, setPath] = useState('');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  
  const { createProject } = useProjectStore();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name.trim() || !path.trim()) {
      setError('项目名称和路径不能为空');
      return;
    }
    
    // 验证路径格式（不允许绝对路径和上级目录引用）
    if (path.startsWith('/') || path.includes('..')) {
      setError('路径必须是相对路径，且不能包含上级目录引用');
      return;
    }
    
    try {
      setIsSubmitting(true);
      setError('');
      
      await createProject({
        name: name.trim(),
        path: path.trim(),
        description: description.trim() || undefined
      });
      
      // 重置表单并关闭对话框
      setName('');
      setPath('');
      setDescription('');
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : '创建项目失败');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      setName('');
      setPath('');
      setDescription('');
      setError('');
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-card border border-border rounded-lg shadow-lg w-full max-w-md mx-4">
        {/* 头部 */}
        <div className="flex items-center justify-between p-6 border-b border-border">
          <div className="flex items-center space-x-2">
            <Folder className="w-5 h-5 text-primary" />
            <h2 className="text-lg font-semibold">创建新项目</h2>
          </div>
          <button
            onClick={handleClose}
            disabled={isSubmitting}
            className="p-1 hover:bg-accent rounded transition-colors disabled:opacity-50"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* 表单 */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* 错误提示 */}
          {error && (
            <div className="flex items-center space-x-2 p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
              <AlertCircle className="w-4 h-4 text-destructive" />
              <span className="text-sm text-destructive">{error}</span>
            </div>
          )}

          {/* 项目名称 */}
          <div className="space-y-2">
            <label htmlFor="name" className="text-sm font-medium">
              项目名称 *
            </label>
            <input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="输入项目名称"
              className="w-full px-3 py-2 border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary/20"
              disabled={isSubmitting}
              required
            />
          </div>

          {/* 项目路径 */}
          <div className="space-y-2">
            <label htmlFor="path" className="text-sm font-medium">
              项目路径 *
            </label>
            <div className="space-y-1">
              <div className="flex items-center space-x-2">
                <span className="text-sm text-muted-foreground px-2 py-1 bg-muted rounded">data/</span>
                <input
                  id="path"
                  type="text"
                  value={path}
                  onChange={(e) => setPath(e.target.value)}
                  placeholder="my-project"
                  className="flex-1 px-3 py-2 border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary/20"
                  disabled={isSubmitting}
                  required
                />
              </div>
              <p className="text-xs text-muted-foreground">
                项目将创建在 backend/data/ 目录下，请输入相对路径
              </p>
            </div>
          </div>

          {/* 项目描述 */}
          <div className="space-y-2">
            <label htmlFor="description" className="text-sm font-medium">
              项目描述
            </label>
            <textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="输入项目描述（可选）"
              rows={3}
              className="w-full px-3 py-2 border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 resize-none"
              disabled={isSubmitting}
            />
          </div>

          {/* 按钮 */}
          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={handleClose}
              disabled={isSubmitting}
              className="px-4 py-2 text-sm border border-border rounded-lg hover:bg-accent transition-colors disabled:opacity-50"
            >
              取消
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !name.trim() || !path.trim()}
              className="px-4 py-2 text-sm bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center space-x-2"
            >
              {isSubmitting && (
                <div className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
              )}
              <span>{isSubmitting ? '创建中...' : '创建项目'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateProjectDialog;