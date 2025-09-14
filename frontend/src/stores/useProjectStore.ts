import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { Project } from '../types/index';
import { apiService } from '../services/api';

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
  (set) => ({
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
        set({ projects, loading: false });
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
        set(state => ({
          projects: state.projects.filter(p => p.id !== id),
          currentProject: state.currentProject?.id === id ? null : state.currentProject,
          loading: false
        }));
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