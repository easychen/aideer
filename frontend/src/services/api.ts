import axios, { AxiosInstance, AxiosResponse } from 'axios';
import { Project, FileItem, DirectoryNode, ApiResponse } from '../types/index';

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

  async getProject(id: number): Promise<Project> {
    const response = await this.client.get<ApiResponse<Project>>(`/projects/${id}`);
    return response.data.data || response.data;
  }

  async createProject(project: { name: string; path: string; description?: string }): Promise<Project> {
    const response = await this.client.post<ApiResponse<Project>>('/projects', project);
    return response.data.data || response.data;
  }

  async scanProject(projectId: number): Promise<{ scannedFiles: number }> {
    const response = await this.client.post<ApiResponse<{ scannedFiles: number }>>(`/projects/${projectId}/scan`);
    return response.data.data || response.data;
  }

  async updateProject(id: number, updates: Partial<Project>): Promise<Project> {
    const response = await this.client.put<ApiResponse<Project>>(`/projects/${id}`, updates);
    return response.data.data || response.data;
  }

  async deleteProject(id: number): Promise<void> {
    await this.client.delete(`/projects/${id}`);
  }

  // 文件相关API
  async getProjectFiles(projectId: number, options?: {
    directoryPath?: string;
    type?: 'file' | 'directory';
    mimeType?: string;
    limit?: number;
    offset?: number;
  }): Promise<{ files: FileItem[]; total: number; offset: number; limit: number }> {
    const response = await this.client.get<ApiResponse<{ files: FileItem[]; total: number; offset: number; limit: number }>>('/files', {
      params: {
        projectId,
        ...options
      }
    });
    return response.data.data || response.data;
  }

  async getFileById(fileId: number): Promise<FileItem> {
    const response = await this.client.get<ApiResponse<FileItem>>(`/files/${fileId}`);
    return response.data.data || response.data;
  }

  async getFileContent(fileId: number): Promise<{ file: FileItem; content: string }> {
    const response = await this.client.get<ApiResponse<{ file: FileItem; content: string }>>(`/files/${fileId}/content`);
    return response.data.data || response.data;
  }

  // 目录相关API
  async getDirectoryTree(projectId: number): Promise<DirectoryNode[]> {
    const response = await this.client.get<ApiResponse<DirectoryNode[]>>(`/directories/tree/${projectId}`);
    return response.data.data || response.data;
  }

  async getDirectoryContents(projectId: number, path?: string): Promise<{ path: string; items: FileItem[] }> {
    const response = await this.client.get<ApiResponse<{ path: string; items: FileItem[] }>>('/directories', {
      params: { projectId, path }
    });
    return response.data.data || response.data;
  }

  async searchFiles(query: string, projectId?: number, directory?: string, extensions?: string[]): Promise<{ query: string; directory: string; results: FileItem[] }> {
    const response = await this.client.get<ApiResponse<{ query: string; directory: string; results: FileItem[] }>>('/files/search', {
      params: {
        q: query,
        projectId,
        dir: directory,
        ext: extensions?.join(',')
      }
    });
    return response.data.data || response.data;
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