import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { Project } from '../types/index';
import { apiService } from '../services/api';

// 本地存储键名
const CURRENT_PROJECT_KEY = 'aideer-current-project-id';

// 本地存储工具函数
const storage = {
  getItem: (name: string) => {
    try {
      const item = localStorage.getItem(name);
      return item ? JSON.parse(item) : null;
    } catch {
      return null;
    }
  },
  setItem: (name: string, value: any) => {
    try {
      localStorage.setItem(name, JSON.stringify(value));
    } catch {
      // 忽略存储错误
    }
  },
  removeItem: (name: string) => {
    try {
      localStorage.removeItem(name);
    } catch {
      // 忽略删除错误
    }
  }
};

interface ProjectState {
  // 状态
  projects: Project[];
  currentProject: Project | null;
  loading: boolean;
  error: string | null;
  
  // 操作
  fetchProjects: () => Promise<void>;
  fetchProject: (id: number) => Promise<void>;
  createProject: (project: Omit<Project, 'id' | 'createdAt' | 'updatedAt' | 'fileCount' | 'totalSize'>) => Promise<void>;
  updateProject: (id: number, updates: Partial<Project>) => Promise<void>;
  deleteProject: (id: number) => Promise<void>;
  setCurrentProject: (project: Project | null) => void;
  clearError: () => void;
}

export const useProjectStore = create<ProjectState>()(devtools(
  (set, get) => ({
    // 初始状态
    projects: [],
    currentProject: null,
    loading: false,
    error: null,
    
    // 获取所有项目
    fetchProjects: async () => {
      set({ loading: true, error: null });
      try {
        const projects = await apiService.getProjects();
        const { currentProject } = get();
        
        // 尝试从本地存储恢复当前项目
        const savedProjectId = storage.getItem(CURRENT_PROJECT_KEY);
        let newCurrentProject = currentProject;
        
        if (savedProjectId && projects.length > 0) {
          // 查找保存的项目是否还存在
          const savedProject = projects.find(p => p.id === savedProjectId);
          if (savedProject) {
            newCurrentProject = savedProject;
          } else {
            // 如果保存的项目不存在，清除本地存储并使用第一个项目
            storage.removeItem(CURRENT_PROJECT_KEY);
            newCurrentProject = projects[0];
            storage.setItem(CURRENT_PROJECT_KEY, projects[0].id);
          }
        } else if (!currentProject && projects.length > 0) {
          // 如果没有当前项目且有项目列表，设置第一个为当前项目
          newCurrentProject = projects[0];
          storage.setItem(CURRENT_PROJECT_KEY, projects[0].id);
        }
        
        set({ 
          projects, 
          currentProject: newCurrentProject,
          loading: false 
        });
      } catch (error) {
        set({ 
          error: error instanceof Error ? error.message : 'Failed to fetch projects',
          loading: false 
        });
      }
    },
    
    // 获取单个项目
    fetchProject: async (id: number) => {
      set({ loading: true, error: null });
      try {
        const project = await apiService.getProject(id);
        set({ currentProject: project, loading: false });
      } catch (error) {
        set({ 
          error: error instanceof Error ? error.message : 'Failed to fetch project',
          loading: false 
        });
      }
    },
    
    // 创建项目
    createProject: async (projectData) => {
      set({ loading: true, error: null });
      try {
        const newProject = await apiService.createProject(projectData);
        set(state => ({ 
          projects: [...state.projects, newProject],
          loading: false 
        }));
      } catch (error) {
        set({ 
          error: error instanceof Error ? error.message : 'Failed to create project',
          loading: false 
        });
      }
    },
    
    // 更新项目
    updateProject: async (id: number, updates: Partial<Project>) => {
      set({ loading: true, error: null });
      try {
        const updatedProject = await apiService.updateProject(id, updates);
        set(state => ({
          projects: state.projects.map(p => p.id === id ? updatedProject : p),
          currentProject: state.currentProject?.id === id ? updatedProject : state.currentProject,
          loading: false
        }));
      } catch (error) {
        set({ 
          error: error instanceof Error ? error.message : 'Failed to update project',
          loading: false 
        });
      }
    },
    
    // 删除项目
    deleteProject: async (id: number) => {
      set({ loading: true, error: null });
      try {
        await apiService.deleteProject(id);
        const { currentProject, projects } = get();
        const remainingProjects = projects.filter(p => p.id !== id);
        
        let newCurrentProject = currentProject;
        if (currentProject?.id === id) {
          // 如果删除的是当前项目，选择第一个剩余项目或设为null
          newCurrentProject = remainingProjects.length > 0 ? remainingProjects[0] : null;
          
          // 更新本地存储
          if (newCurrentProject) {
            storage.setItem(CURRENT_PROJECT_KEY, newCurrentProject.id);
          } else {
            storage.removeItem(CURRENT_PROJECT_KEY);
          }
        }
        
        set({
          projects: remainingProjects,
          currentProject: newCurrentProject,
          loading: false
        });
      } catch (error) {
        set({ 
          error: error instanceof Error ? error.message : 'Failed to delete project',
          loading: false 
        });
      }
    },
    
    // 设置当前项目
    setCurrentProject: (project: Project | null) => {
      set({ currentProject: project });
      // 持久化到本地存储
      if (project) {
        storage.setItem(CURRENT_PROJECT_KEY, project.id);
      } else {
        storage.removeItem(CURRENT_PROJECT_KEY);
      }
    },
    
    // 清除错误
    clearError: () => {
      set({ error: null });
    }
  }),
  {
    name: 'project-store'
  }
));