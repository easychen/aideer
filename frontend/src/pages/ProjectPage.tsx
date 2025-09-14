import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Folder, ArrowLeft } from 'lucide-react';
import FileTree from '../components/file-tree/FileTree';
import FileGrid from '../components/file-grid/FileGrid';
import { DirectoryNode, FileItem, Project } from '../types/index';
import { apiService } from '../services/api';

const ProjectPage = () => {
  const { id } = useParams<{ id: string }>();
  const projectId = parseInt(id || '0', 10);
  
  const [project, setProject] = useState<Project | null>(null);
  const [selectedFile, setSelectedFile] = useState<FileItem | null>(null);
  const [selectedPath, setSelectedPath] = useState<string>('');
  const [currentPath, setCurrentPath] = useState<string>('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (projectId) {
      loadProject();
    }
  }, [projectId]);

  const loadProject = async () => {
    try {
      setLoading(true);
      const projectData = await apiService.getProject(projectId);
      setProject(projectData);
    } catch (error) {
      console.error('Failed to load project:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFileTreeSelect = (node: DirectoryNode) => {
    setSelectedPath(node.path);
    if (node.type === 'directory') {
      setCurrentPath(node.path);
    }
  };

  const handleFileGridSelect = (file: FileItem) => {
    setSelectedFile(file);
  };

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">加载项目中...</p>
        </div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <Folder className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-medium mb-2">项目未找到</h3>
          <p className="text-sm text-muted-foreground">请检查项目ID是否正确</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* 项目头部 */}
      <div className="p-4 border-b border-border">
        <div className="flex items-center space-x-4">
          <button 
            onClick={() => window.history.back()}
            className="p-2 hover:bg-accent rounded-lg transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <h1 className="text-xl font-semibold">{project.name}</h1>
            <p className="text-sm text-muted-foreground">{project.path}</p>
          </div>
        </div>
      </div>
      
      <div className="flex-1 flex">
        {/* 文件树侧边栏 */}
        <div className="w-80 border-r border-border bg-card">
          <div className="p-4 border-b border-border">
            <h3 className="font-medium">文件树</h3>
          </div>
          <FileTree 
            projectId={projectId}
            onFileSelect={handleFileTreeSelect}
            selectedPath={selectedPath}
          />
        </div>
        
        {/* 文件网格主区域 */}
        <div className="flex-1">
          <FileGrid 
            projectId={projectId}
            currentPath={currentPath}
            onFileSelect={handleFileGridSelect}
            selectedFileId={selectedFile?.id}
          />
        </div>
        
        {/* 文件预览面板 */}
        {selectedFile && (
          <div className="w-80 bg-card border-l border-border">
            <div className="p-4 border-b border-border">
              <h3 className="font-medium">文件详情</h3>
            </div>
            <div className="p-4">
              <div className="space-y-4">
                <div>
                  <h4 className="font-medium text-sm mb-1">{selectedFile.name}</h4>
                  <p className="text-xs text-muted-foreground">{selectedFile.path}</p>
                </div>
                
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">大小:</span>
                    <span>{(selectedFile.size / 1024).toFixed(2)} KB</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">类型:</span>
                    <span>{selectedFile.extension || '未知'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">修改时间:</span>
                    <span>{new Date(selectedFile.lastModified).toLocaleDateString()}</span>
                  </div>
                </div>
                
                {selectedFile.thumbnailPath && (
                  <div>
                    <h5 className="font-medium text-sm mb-2">预览</h5>
                    <img 
                      src={selectedFile.thumbnailPath} 
                      alt={selectedFile.name}
                      className="w-full rounded border"
                    />
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProjectPage;