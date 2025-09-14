import { Folder, Plus, Search, MoreVertical, Calendar, HardDrive } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Project } from '../types/index';
import { apiService } from '../services/api';
import CreateProjectDialog from '../components/dialogs/CreateProjectDialog';

const ProjectCard = ({ project, onClick }: { project: Project; onClick: () => void }) => {
  return (
    <div 
      className="p-4 border border-border rounded-lg hover:bg-accent/50 transition-colors cursor-pointer group"
      onClick={onClick}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
            <Folder className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h3 className="font-medium text-sm">{project.name}</h3>
            <p className="text-xs text-muted-foreground">{project.path}</p>
          </div>
        </div>
        <button className="opacity-0 group-hover:opacity-100 transition-opacity">
          <MoreVertical className="w-4 h-4 text-muted-foreground" />
        </button>
      </div>
      
      {project.description && (
        <p className="text-xs text-muted-foreground mb-3 line-clamp-2">{project.description}</p>
      )}
      
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <div className="flex items-center space-x-1">
          <Calendar className="w-3 h-3" />
          <span>{new Date(project.updatedAt).toLocaleDateString()}</span>
        </div>
        <div className="flex items-center space-x-1">
          <HardDrive className="w-3 h-3" />
          <span>项目</span>
        </div>
      </div>
    </div>
  );
};

const HomePage = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    loadProjects();
  }, []);

  const loadProjects = async () => {
    try {
      setLoading(true);
      const projects = await apiService.getProjects();
      setProjects(projects);
    } catch (error) {
      console.error('Failed to load projects:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleProjectClick = (project: Project) => {
    navigate(`/project/${project.id}`);
  };

  const handleCreateProject = () => {
    setShowCreateDialog(true);
  };

  const handleCreateDialogClose = () => {
    setShowCreateDialog(false);
    // 重新加载项目列表
    loadProjects();
  };

  const filteredProjects = projects.filter(project =>
    project.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    project.path.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="h-full flex flex-col">
      {/* 头部 */}
      <div className="p-6 border-b border-border">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold">项目管理</h1>
            <p className="text-sm text-muted-foreground">选择一个项目开始文件管理</p>
          </div>
          <button 
            onClick={handleCreateProject}
            className="flex items-center space-x-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>新建项目</span>
          </button>
        </div>
        
        {/* 搜索框 */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="搜索项目..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
        </div>
      </div>
      
      {/* 项目列表 */}
      <div className="flex-1 p-6">
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="p-4 border border-border rounded-lg">
                <div className="animate-pulse">
                  <div className="flex items-center space-x-3 mb-3">
                    <div className="w-10 h-10 bg-muted rounded-lg"></div>
                    <div className="flex-1">
                      <div className="h-4 bg-muted rounded w-3/4 mb-1"></div>
                      <div className="h-3 bg-muted rounded w-1/2"></div>
                    </div>
                  </div>
                  <div className="h-3 bg-muted rounded w-full mb-2"></div>
                  <div className="h-3 bg-muted rounded w-2/3"></div>
                </div>
              </div>
            ))}
          </div>
        ) : filteredProjects.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredProjects.map((project) => (
              <ProjectCard 
                key={project.id} 
                project={project} 
                onClick={() => handleProjectClick(project)}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
              <Folder className="w-8 h-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-medium mb-2">
              {searchQuery ? '未找到匹配的项目' : '暂无项目'}
            </h3>
            <p className="text-sm text-muted-foreground mb-4">
              {searchQuery ? '尝试调整搜索条件' : '创建您的第一个项目开始管理文件'}
            </p>
            {!searchQuery && (
              <button 
                onClick={handleCreateProject}
                className="flex items-center space-x-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors mx-auto"
              >
                <Plus className="w-4 h-4" />
                <span>创建项目</span>
              </button>
            )}
          </div>
        )}
      </div>
      
      {/* 创建项目对话框 */}
      <CreateProjectDialog 
        isOpen={showCreateDialog}
        onClose={handleCreateDialogClose}
      />
    </div>
  );
};

export default HomePage;