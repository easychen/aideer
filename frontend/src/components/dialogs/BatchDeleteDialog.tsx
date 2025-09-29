import { useState, useEffect } from 'react';
import { X, AlertTriangle } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { apiService } from '../../services/api';
import { FileItem } from '../../types';

interface BatchDeleteDialogProps {
  isOpen: boolean;
  onClose: () => void;
  projectId: number;
  selectedFiles: string[];
  currentPath: string;
  onDeleteComplete?: () => void;
}

const BatchDeleteDialog = ({ 
  isOpen, 
  onClose, 
  projectId, 
  selectedFiles, 
  currentPath, 
  onDeleteComplete 
}: BatchDeleteDialogProps) => {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmText, setConfirmText] = useState('');
  const [fileDetails, setFileDetails] = useState<Record<string, string>>({});
  const [loadingFiles, setLoadingFiles] = useState(false);

  // 获取文件详情
  useEffect(() => {
    if (isOpen && selectedFiles.length > 0) {
      setLoadingFiles(true);
      const fetchFileDetails = async () => {
        try {
           const details: Record<string, string> = {};
           // 获取当前目录的所有文件
           const response = await apiService.getProjectFiles(projectId, {
             directoryPath: currentPath
           });
           // 根据ID匹配文件名
           response.files.forEach((file: FileItem) => {
             if (selectedFiles.includes(file.id)) {
               details[file.id] = file.name;
             }
           });
           setFileDetails(details);
        } catch (error) {
          console.error('Failed to fetch file details:', error);
          // 如果获取失败，使用文件ID作为显示名称
          const fallbackDetails: Record<string, string> = {};
          selectedFiles.forEach(fileId => {
            fallbackDetails[fileId] = fileId;
          });
          setFileDetails(fallbackDetails);
        } finally {
          setLoadingFiles(false);
        }
      };
      fetchFileDetails();
    }
  }, [isOpen, selectedFiles, projectId, currentPath]);

  const handleConfirmDelete = async () => {
    try {
      console.log('BatchDeleteDialog - projectId:', projectId, 'selectedFiles:', selectedFiles);
      setLoading(true);
      setError(null);
      
      // 获取当前目录的所有文件以获取文件名
      const response = await apiService.getProjectFiles(projectId, {
        directoryPath: currentPath
      });
      
      // 构建文件信息数组
      const filesToDelete = selectedFiles.map(fileId => {
        const file = response.files.find((f: FileItem) => f.id === fileId);
        if (!file) {
          throw new Error(`File with ID ${fileId} not found`);
        }
        return {
          name: file.name,
          directoryPath: currentPath
        };
      });
      
      console.log('Files to delete:', filesToDelete);
      
      // 批量删除文件
      const result = await apiService.batchDeleteFiles(filesToDelete, projectId);
      
      if (result.errors && result.errors.length > 0) {
        setError(`删除完成，但有 ${result.errors.length} 个文件删除失败`);
        console.warn('Batch delete errors:', result.errors);
      }
      
      onDeleteComplete?.();
      onClose();
    } catch (error) {
      console.error('Failed to batch delete files:', error);
      setError('批量删除文件失败，请重试');
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

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-background border border-border rounded-lg shadow-lg w-full max-w-md mx-4">
        <div className="flex items-center justify-between p-4 border-b border-border">
          <div className="flex items-center space-x-2">
            <AlertTriangle className="w-5 h-5 text-destructive" />
            <h2 className="text-lg font-semibold">{t('dialog.batchDeleteFiles')}</h2>
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
              您确定要删除以下 {selectedFiles.length} 个文件吗？
            </p>
            <div className="bg-muted/50 p-3 rounded-md max-h-32 overflow-y-auto">
              {loadingFiles ? (
                <div className="text-sm text-muted-foreground text-center py-2">
                  正在加载文件信息...
                </div>
              ) : (
                <>
                  {selectedFiles.slice(0, 5).map((fileId, index) => (
                    <p key={index} className="text-sm font-medium">
                      {fileDetails[fileId] || fileId}
                    </p>
                  ))}
                  {selectedFiles.length > 5 && (
                    <p className="text-xs text-muted-foreground mt-1">
                      ...还有 {selectedFiles.length - 5} 个文件
                    </p>
                  )}
                </>
              )}
            </div>
            <div className="bg-destructive/10 p-3 rounded-md border border-destructive/20">
              <p className="text-sm text-destructive font-medium flex items-center space-x-2">
                <AlertTriangle className="w-4 h-4" />
                <span>警告</span>
              </p>
              <p className="text-xs text-destructive/80 mt-1">
                此操作不可撤销，选中的文件将被永久删除。
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
                autoFocus
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

export default BatchDeleteDialog;