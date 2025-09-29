import { useState } from 'react';
import { X, Folder, AlertCircle } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useProjectStore } from '../../stores/useProjectStore';

interface CreateProjectDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

const CreateProjectDialog = ({ isOpen, onClose }: CreateProjectDialogProps) => {
  const { t } = useTranslation();
  const [name, setName] = useState('');
  const [path, setPath] = useState('');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  
  const { createProject } = useProjectStore();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name.trim() || !path.trim()) {
      setError(t('dialog.nameAndPathRequired'));
      return;
    }
    
    // 验证路径格式（不允许绝对路径和上级目录引用）
    if (path.startsWith('/') || path.includes('..')) {
      setError(t('dialog.pathMustBeRelative'));
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
      setError(err instanceof Error ? err.message : t('dialog.createProjectFailed'));
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
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border">
          <h2 className="text-lg font-semibold">{t('dialog.createProject')}</h2>
          <button
            onClick={handleClose}
            disabled={isSubmitting}
            className="text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Error Message */}
          {error && (
            <div className="flex items-center space-x-2 p-3 bg-destructive/10 border border-destructive/20 rounded-md">
              <AlertCircle className="w-4 h-4 text-destructive flex-shrink-0" />
              <span className="text-sm text-destructive">{error}</span>
            </div>
          )}

          {/* Project Name */}
          <div className="space-y-2">
            <label htmlFor="name" className="text-sm font-medium">
              {t('dialog.projectName')} <span className="text-destructive">*</span>
            </label>
            <input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={t('dialog.enterProjectName')}
              disabled={isSubmitting}
              className="w-full px-3 py-2 border border-border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50"
            />
          </div>

          {/* Project Path */}
          <div className="space-y-2">
            <label htmlFor="path" className="text-sm font-medium">
              {t('dialog.projectPath')} <span className="text-destructive">*</span>
            </label>
            <div className="relative">
              <Folder className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                id="path"
                type="text"
                value={path}
                onChange={(e) => setPath(e.target.value)}
                placeholder={t('dialog.enterProjectPath')}
                disabled={isSubmitting}
                className="w-full pl-10 pr-3 py-2 border border-border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50"
              />
            </div>
            <p className="text-xs text-muted-foreground">
              {t('dialog.pathDescription')}
            </p>
          </div>

          {/* Project Description */}
          <div className="space-y-2">
            <label htmlFor="description" className="text-sm font-medium">
              {t('dialog.projectDescription')}
            </label>
            <textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={t('dialog.enterProjectDescription')}
              disabled={isSubmitting}
              rows={3}
              className="w-full px-3 py-2 border border-border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50 resize-none"
            />
          </div>

          {/* Actions */}
          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={handleClose}
              disabled={isSubmitting}
              className="px-4 py-2 text-sm border border-border rounded-md hover:bg-accent transition-colors disabled:opacity-50"
            >
              {t('common.cancel')}
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !name.trim() || !path.trim()}
              className="px-4 py-2 text-sm bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors disabled:opacity-50"
            >
              {isSubmitting ? t('common.creating') : t('common.create')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateProjectDialog;