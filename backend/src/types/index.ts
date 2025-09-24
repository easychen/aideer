// 项目相关类型定义
export interface Project {
  id: number;
  name: string;
  path: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
}

// 文件额外信息类型定义
export interface FileExtraInfo {
  id: number;
  blake3Hash: string;
  projectId: number;
  relativePaths: string[];
  links?: string[];
  tags?: string[];
  starred: boolean;
  notes?: string;
  extraJson?: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

// 文件相关类型定义
export interface FileItem {
  id: string;
  projectId: number;
  name: string;
  path: string;
  relativePath: string;
  size: number;
  type: 'file' | 'directory';
  mimeType?: string;
  extension?: string;
  createdAt: string;
  updatedAt: string;
  lastModified: string;
  thumbnailPath?: string;
}

// 目录树节点
export interface DirectoryNode {
  id: string;
  name: string;
  path: string;
  type: 'file' | 'directory';
  children?: DirectoryNode[];
  size?: number;
  mimeType?: string;
  extension?: string;
  lastModified: string;
}

// API响应格式
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// 项目创建请求
export interface CreateProjectRequest {
  name: string;
  path: string;
  description?: string;
}

// 目录扫描请求
export interface ScanDirectoryRequest {
  projectId: number;
  path: string;
  recursive?: boolean;
}

// 文件查询参数
export interface FileQueryParams {
  projectId?: number;
  directoryPath?: string;
  type?: 'file' | 'directory';
  mimeType?: string;
  limit?: number;
  offset?: number;
}

// 数据库配置
export interface DatabaseConfig {
  filename: string;
  mode?: number;
  verbose?: boolean;
}

// 文件系统事件
export interface FileSystemEvent {
  type: 'add' | 'change' | 'unlink' | 'addDir' | 'unlinkDir';
  path: string;
  stats?: {
    size: number;
    mtime: Date;
    isDirectory: boolean;
  };
}