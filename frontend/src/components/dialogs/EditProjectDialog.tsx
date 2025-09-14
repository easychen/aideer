import React, { useState } from 'react';
import { X, Trash2, Edit3 } from 'lucide-react';
import { Project } from '../../types/index';
import { useProjectStore } from '../../stores/useProjectStore';

interface EditProjectDialogProps {
  isOpen: boolean;
  onClose: () => void;
  project: Project;
}

const EditProjectDialog: React.FC<EditProjectDialogProps> = ({ isOpen, onClose, project }) => {
  const [projectName, setProjectName] = useState(project.name);
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const { updateProject, deleteProject, fetchProjects } = useProjectStore();

  const handleUpdateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!projectName.trim()) return;

    setLoading(true);
    try {
      await updateProject(project.id, { name: projectName.trim() });
      await fetchProjects();
      onClose();
    } catch (error) {
      console.error('Failed to update project:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteProject = async () => {
    if (!confirm(`确定要删除项目 "${project.name}" 吗？此操作不可撤销。`)) {
      return;
    }

    setLoading(true);
    try {
      await deleteProject(project.id);
      await fetchProjects();
      onClose();
    } catch (error) {
      console.error('Failed to delete project:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-card border border-border rounded-lg shadow-lg w-full max-w-md mx-4">
        <div className="flex items-center justify-between p-4 border-b border-border">
          <h2 className="text-lg font-semibold">编辑项目</h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-muted/50 rounded-md transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        
        <div className="p-4 space-y-4">
          {/* 项目信息 */}
          <div className="space-y-2">
            <div className="text-sm text-muted-foreground">项目路径</div>
            <div className="text-sm font-mono bg-muted/30 p-2 rounded border">
              {project.path}
            </div>
          </div>
          
          {/* 编辑项目名称 */}
          {isEditing ? (
            <form onSubmit={handleUpdateProject} className="space-y-3">
              <div className="space-y-2">
                <label className="text-sm font-medium">项目名称</label>
                <input
                  type="text"
                  value={projectName}
                  onChange={(e) => setProjectName(e.target.value)}
                  className="w-full px-3 py-2 border border-border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-primary/50"
                  placeholder="请输入项目名称"
                  required
                  autoFocus
                />
              </div>
              <div className="flex space-x-2">
                <button
                  type="submit"
                  disabled={loading || !projectName.trim()}
                  className="flex-1 bg-primary text-primary-foreground px-4 py-2 rounded-md hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {loading ? '保存中...' : '保存'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsEditing(false);
                    setProjectName(project.name);
                  }}
                  className="px-4 py-2 border border-border rounded-md hover:bg-muted/50 transition-colors"
                >
                  取消
                </button>
              </div>
            </form>
          ) : (
            <div className="space-y-3">
              <div className="space-y-2">
                <div className="text-sm font-medium">项目名称</div>
                <div className="text-sm bg-muted/30 p-2 rounded border">
                  {project.name}
                </div>
              </div>
              
              {/* 操作按钮 */}
              <div className="flex space-x-2">
                <button
                  onClick={() => setIsEditing(true)}
                  className="flex-1 flex items-center justify-center space-x-2 px-4 py-2 border border-border rounded-md hover:bg-muted/50 transition-colors"
                >
                  <Edit3 className="w-4 h-4" />
                  <span>重命名</span>
                </button>
                <button
                  onClick={handleDeleteProject}
                  disabled={loading}
                  className="flex items-center justify-center space-x-2 px-4 py-2 bg-destructive text-destructive-foreground rounded-md hover:bg-destructive/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>删除</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default EditProjectDialog;