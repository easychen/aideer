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

  async getFileById(fileId: string, projectId: number): Promise<FileItem> {
    const response = await this.client.get<ApiResponse<FileItem>>(`/files/${fileId}`, {
      params: { projectId }
    });
    return response.data.data || response.data;
  }

  async getFileContent(fileId: string, projectId: number): Promise<{ file: FileItem; content: string }> {
    const response = await this.client.get<ApiResponse<{ file: FileItem; content: string }>>(`/files/${fileId}/content`, {
      params: { projectId }
    });
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

  async createDirectory(projectId: number, path: string): Promise<{ success: boolean; message?: string }> {
    const response = await this.client.post<ApiResponse<{ success: boolean; message?: string }>>('/directories', {
      projectId,
      path
    });
    return response.data.data || response.data;
  }

  async renameDirectory(projectId: number, oldPath: string, newPath: string): Promise<{ success: boolean; message?: string }> {
    const response = await this.client.put<ApiResponse<{ success: boolean; message?: string }>>('/directories/rename', {
      projectId,
      oldPath,
      newPath
    });
    return response.data.data || response.data;
  }

  async deleteDirectory(projectId: number, path: string): Promise<{ success: boolean; message?: string }> {
    const response = await this.client.delete<ApiResponse<{ success: boolean; message?: string }>>('/directories', {
      data: {
        projectId,
        path
      }
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

  // 文件上传API
  async uploadFile(formData: FormData): Promise<{ success: boolean; data?: any; error?: string; message?: string }> {
    try {
      const response = await this.client.post<ApiResponse<{ files: any[]; count: number }>>(
        `/files/upload`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        }
      );
      
      // 检查后端返回的success字段
      const responseData = response.data;
      if (responseData.success) {
        return {
          success: true,
          data: responseData.data,
          message: responseData.message
        };
      } else {
        return {
          success: false,
          error: responseData.error || 'Upload failed'
        };
      }
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.error || error.message || 'Upload failed'
      };
    }
  }

  // 文件重命名API
  async renameFile(fileId: string, projectId: number, newName: string): Promise<FileItem> {
    try {
      const response = await this.client.put<ApiResponse<FileItem>>(`/files/${fileId}/rename`, {
        projectId,
        newName
      });
      return response.data.data || response.data;
    } catch (error: any) {
      console.error('Rename file error:', error);
      throw new Error(error.response?.data?.error || error.message || 'Failed to rename file');
    }
  }

  // 文件删除API
  async deleteFile(fileId: string, projectId: number): Promise<void> {
    try {
      await this.client.delete(`/files/${fileId}`, {
        params: { projectId }
      });
    } catch (error: any) {
      console.error('Delete file error:', error);
      throw new Error(error.response?.data?.error || error.message || 'Failed to delete file');
    }
  }

  // 批量删除文件API
  async batchDeleteFiles(files: Array<{name: string, directoryPath: string}>, projectId: number): Promise<{ deletedFiles: string[]; deletedCount: number; errors: string[] }> {
    try {
      console.log('API batchDeleteFiles - projectId:', projectId, 'files:', files);
      const requestData = { projectId, files };
      console.log('Request data:', requestData);
      const response = await this.client.delete<ApiResponse<{ deletedFiles: string[]; deletedCount: number; errors: string[] }>>('/files/batch', {
        data: requestData
      });
      return response.data.data || response.data;
    } catch (error: any) {
      console.error('Batch delete files error:', error);
      throw new Error(error.response?.data?.error || error.message || 'Failed to delete files');
    }
  }

  // 批量移动文件API
  async batchMoveFiles(fileIds: string[], targetPath: string, projectId: number): Promise<{ movedFiles: FileItem[]; movedCount: number; errors: string[] }> {
    try {
      const response = await this.client.put<ApiResponse<{ movedFiles: FileItem[]; movedCount: number; errors: string[] }>>('/files/batch/move', {
        projectId,
        fileIds,
        targetPath
      });
      return response.data.data || response.data;
    } catch (error: any) {
      console.error('Batch move files error:', error);
      throw new Error(error.response?.data?.error || error.message || 'Failed to move files');
    }
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