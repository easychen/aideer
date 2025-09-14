import React, { useState, useEffect } from 'react';
import { X, Folder, FolderOpen, ChevronRight, ChevronDown } from 'lucide-react';
import { DirectoryNode } from '../../types/index';
import { apiService } from '../../services/api';

interface BatchMoveDialogProps {
  isOpen: boolean;
  onClose: () => void;
  selectedFiles: string[];
  projectId: number;
  onMoveComplete?: () => void;
}

interface TreeNodeProps {
  node: DirectoryNode;
  level: number;
  onSelect: (path: string) => void;
  selectedPath: string;
}

const TreeNode: React.FC<TreeNodeProps> = ({ node, level, onSelect, selectedPath }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const isDirectory = node.type === 'directory';
  const isSelected = selectedPath === node.path;
  
  if (!isDirectory) return null;

  const handleToggle = () => {
    if (isDirectory && node.children && node.children.length > 0) {
      setIsExpanded(!isExpanded);
    }
  };

  const handleSelect = () => {
    if (isDirectory) {
      onSelect(node.path);
    }
  };

  const hasChildren = node.children && node.children.length > 0;

  return (
    <div>
      <div
        className={`flex items-center py-1 px-2 cursor-pointer hover:bg-gray-100 rounded ${
          isSelected ? 'bg-blue-100 text-blue-700' : ''
        }`}
        style={{ paddingLeft: `${level * 20 + 8}px` }}
        onClick={handleSelect}
      >
        <div className="flex items-center flex-1">
          {hasChildren ? (
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleToggle();
              }}
              className="mr-1 p-0.5 hover:bg-gray-200 rounded"
            >
              {isExpanded ? (
                <ChevronDown className="w-4 h-4" />
              ) : (
                <ChevronRight className="w-4 h-4" />
              )}
            </button>
          ) : (
            <div className="w-5 mr-1" />
          )}
          {isExpanded ? (
            <FolderOpen className="w-4 h-4 mr-2 text-blue-500" />
          ) : (
            <Folder className="w-4 h-4 mr-2 text-blue-500" />
          )}
          <span className="text-sm">{node.name}</span>
        </div>
      </div>
      {isExpanded && hasChildren && (
        <div>
          {node.children!.map((child) => (
            <TreeNode
              key={child.id}
              node={child}
              level={level + 1}
              onSelect={onSelect}
              selectedPath={selectedPath}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default function BatchMoveDialog({
  isOpen,
  onClose,
  selectedFiles,
  projectId,
  onMoveComplete
}: BatchMoveDialogProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [directoryTree, setDirectoryTree] = useState<DirectoryNode[]>([]);
  const [selectedPath, setSelectedPath] = useState<string>('');
  const [loadingTree, setLoadingTree] = useState(false);

  // 加载目录树
  useEffect(() => {
    if (isOpen) {
      loadDirectoryTree();
    }
  }, [isOpen, projectId]);

  const loadDirectoryTree = async () => {
    try {
      setLoadingTree(true);
      const tree = await apiService.getDirectoryTree(projectId);
      setDirectoryTree(tree);
    } catch (error) {
      console.error('Failed to load directory tree:', error);
      setError('加载目录树失败');
    } finally {
      setLoadingTree(false);
    }
  };

  const handleMove = async () => {
    if (!selectedPath) {
      setError('请选择目标目录');
      return;
    }

    if (selectedFiles.length === 0) {
      setError('没有选择要移动的文件');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // 批量移动文件
      const result = await apiService.batchMoveFiles(selectedFiles, selectedPath, projectId);
      
      if (result.errors && result.errors.length > 0) {
        setError(`移动完成，但有 ${result.errors.length} 个文件移动失败`);
        console.warn('Batch move errors:', result.errors);
      }

      onMoveComplete?.();
      onClose();
    } catch (error) {
      console.error('Failed to move files:', error);
      setError('移动文件失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      setError(null);
      setSelectedPath('');
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4">
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-lg font-semibold">批量移动文件</h2>
          <button
            onClick={handleClose}
            disabled={loading}
            className="text-gray-400 hover:text-gray-600 disabled:opacity-50"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4">
          <div className="mb-4">
            <p className="text-sm text-gray-600 mb-2">
              将 {selectedFiles.length} 个文件移动到：
            </p>
            
            {loadingTree ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
                <span className="ml-2 text-sm text-gray-500">加载目录树...</span>
              </div>
            ) : (
              <div className="border rounded-lg max-h-64 overflow-y-auto">
                {directoryTree.length > 0 ? (
                  directoryTree.map((node) => (
                    <TreeNode
                      key={node.id}
                      node={node}
                      level={0}
                      onSelect={setSelectedPath}
                      selectedPath={selectedPath}
                    />
                  ))
                ) : (
                  <div className="p-4 text-center text-gray-500">
                    没有找到目录
                  </div>
                )}
              </div>
            )}
            
            {selectedPath && (
              <div className="mt-2 p-2 bg-blue-50 rounded text-sm">
                <span className="text-gray-600">目标路径：</span>
                <span className="font-medium text-blue-700">{selectedPath}</span>
              </div>
            )}
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}
        </div>

        <div className="flex justify-end gap-3 p-4 border-t bg-gray-50">
          <button
            onClick={handleClose}
            disabled={loading}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50"
          >
            取消
          </button>
          <button
            onClick={handleMove}
            disabled={loading || !selectedPath || loadingTree}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
          >
            {loading && (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
            )}
            {loading ? '移动中...' : '确认移动'}
          </button>
        </div>
      </div>
    </div>
  );
}