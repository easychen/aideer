// 项目相关类型
export interface Project {
  id: number;
  name: string;
  path: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
}

// 文件相关类型
export interface FileItem {
  id: number;
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
  id: number;
  name: string;
  path: string;
  type: 'file' | 'directory';
  children?: DirectoryNode[];
  size?: number;
  mimeType?: string;
  extension?: string;
  lastModified: string;
}

// API响应类型
export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  error?: string;
}

// 用户界面状态类型
export interface ViewMode {
  type: 'grid' | 'list' | 'tree';
  sortBy: 'name' | 'size' | 'modified' | 'type';
  sortOrder: 'asc' | 'desc';
  showHidden: boolean;
}

// 搜索相关类型
export interface SearchOptions {
  query: string;
  directory?: string;
  extensions?: string[];
  includeContent?: boolean;
  caseSensitive?: boolean;
}

export interface SearchResult {
  file: FileItem;
  matches: {
    line: number;
    content: string;
    highlight: { start: number; end: number }[];
  }[];
}

// 应用设置类型
export interface AppSettings {
  theme: 'light' | 'dark' | 'system';
  language: 'zh' | 'en';
  defaultView: ViewMode['type'];
  thumbnailSize: 'small' | 'medium' | 'large';
  showPreview: boolean;
  autoSave: boolean;
}

// Electron API类型（如果在Electron环境中）
export interface ElectronAPI {
  openFileDialog: () => Promise<{ canceled: boolean; filePaths: string[] }>;
  openDirectoryDialog: () => Promise<{ canceled: boolean; filePaths: string[] }>;
  saveFileDialog: () => Promise<{ canceled: boolean; filePath?: string }>;
  getAppVersion: () => Promise<string>;
  store: {
    get: (key: string) => Promise<any>;
    set: (key: string, value: any) => Promise<void>;
    delete: (key: string) => Promise<void>;
  };
  platform: string;
  isElectron: boolean;
}

// 扩展全局Window接口
declare global {
  interface Window {
    electronAPI?: ElectronAPI;
  }
}

export {};