import axios, { AxiosInstance, AxiosResponse } from 'axios';
import { Project, FileItem, ApiResponse } from '../types/index';

// API基础配置
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

class ApiService {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: API_BASE_URL,
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // 请求拦截器
    this.client.interceptors.request.use(
      (config) => {
        // 可以在这里添加认证token等
        console.log(`API Request: ${config.method?.toUpperCase()} ${config.url}`);
        return config;
      },
      (error) => {
        console.error('API Request Error:', error);
        return Promise.reject(error);
      }
    );

    // 响应拦截器
    this.client.interceptors.response.use(
      (response: AxiosResponse) => {
        console.log(`API Response: ${response.status} ${response.config.url}`);
        return response;
      },
      (error) => {
        console.error('API Response Error:', error.response?.data || error.message);
        return Promise.reject(error);
      }
    );
  }

  // 项目相关API
  async getProjects(): Promise<Project[]> {
    const response = await this.client.get<ApiResponse<Project[]>>('/projects');
    return response.data.data;
  }

  async getProject(id: string): Promise<Project> {
    const response = await this.client.get<ApiResponse<Project>>(`/projects/${id}`);
    return response.data.data;
  }

  async createProject(project: Omit<Project, 'id' | 'createdAt' | 'updatedAt' | 'fileCount' | 'totalSize'>): Promise<Project> {
    const response = await this.client.post<ApiResponse<Project>>('/projects', project);
    return response.data.data;
  }

  async updateProject(id: string, updates: Partial<Project>): Promise<Project> {
    const response = await this.client.put<ApiResponse<Project>>(`/projects/${id}`, updates);
    return response.data.data;
  }

  async deleteProject(id: string): Promise<void> {
    await this.client.delete(`/projects/${id}`);
  }

  // 文件系统相关API
  async browseDirectory(dirPath: string): Promise<{ path: string; items: FileItem[] }> {
    const response = await this.client.get<ApiResponse<{ path: string; items: FileItem[] }>>('/files/browse', {
      params: { dirPath }
    });
    return response.data.data;
  }

  async getFileContent(filePath: string): Promise<{ path: string; content: string; size: number; modifiedAt: string }> {
    const response = await this.client.get<ApiResponse<{ path: string; content: string; size: number; modifiedAt: string }>>('/files/content', {
      params: { filePath }
    });
    return response.data.data;
  }

  async searchFiles(query: string, directory?: string, extensions?: string[]): Promise<{ query: string; directory: string; results: FileItem[] }> {
    const params: any = { query };
    if (directory) params.directory = directory;
    if (extensions && extensions.length > 0) params.extensions = extensions.join(',');
    
    const response = await this.client.get<ApiResponse<{ query: string; directory: string; results: FileItem[] }>>('/files/search', {
      params
    });
    return response.data.data;
  }

  // 健康检查
  async healthCheck(): Promise<{ status: string; timestamp: string; version: string }> {
    const response = await this.client.get<{ status: string; timestamp: string; version: string }>('/health');
    return response.data;
  }
}

// 创建单例实例
export const apiService = new ApiService();
export default apiService;