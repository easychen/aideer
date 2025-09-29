import { Folder, Plus, Search, MoreVertical, Calendar, HardDrive } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Project } from '../types/index';
import { apiService } from '../services/api';
import CreateProjectDialog from '../components/dialogs/CreateProjectDialog';

const ProjectCard = ({ project, onClick }: { project: Project; onClick: () => void }) => {
  const { t } = useTranslation();
  
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
          <span>{t('project.project')}</span>
        </div>
      </div>
    </div>
  );
};

const HomePage = () => {
  const { t } = useTranslation();
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
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border bg-card">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-semibold">{t('project.projectManagement')}</h1>
              <p className="text-sm text-muted-foreground mt-1">
                {t('project.selectProjectToStart')}
              </p>
            </div>
            <button
              onClick={() => setShowCreateDialog(true)}
              className="flex items-center space-x-2 bg-primary text-primary-foreground px-4 py-2 rounded-md hover:bg-primary/90 transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>{t('project.newProject')}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-6 py-6">
        {/* Search */}
        <div className="mb-6">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              placeholder={t('project.searchProjects')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
        </div>

        {/* Projects Grid */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-muted-foreground">{t('common.loading')}</div>
          </div>
        ) : filteredProjects.length === 0 ? (
          <div className="text-center py-12">
            {searchQuery ? (
              <div>
                <Search className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">{t('project.noMatchingProjects')}</h3>
                <p className="text-muted-foreground">{t('project.tryDifferentKeywords')}</p>
              </div>
            ) : (
              <div>
                <Folder className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">{t('project.noProjects')}</h3>
                <p className="text-muted-foreground mb-4">{t('project.createFirstProject')}</p>
                <button
                  onClick={() => setShowCreateDialog(true)}
                  className="bg-primary text-primary-foreground px-4 py-2 rounded-md hover:bg-primary/90 transition-colors"
                >
                  {t('project.createProject')}
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredProjects.map((project) => (
              <ProjectCard
                key={project.id}
                project={project}
                onClick={() => handleProjectClick(project)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Create Project Dialog */}
      <CreateProjectDialog
        isOpen={showCreateDialog}
        onClose={handleCreateDialogClose}
      />
    </div>
  );
};

export default HomePage;