import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { FileItem, ViewMode, SearchOptions, SearchResult } from '../types/index';
import { apiService } from '../services/api';

interface FileState {
  // 状态
  currentPath: string;
  files: FileItem[];
  selectedFiles: FileItem[];
  viewMode: ViewMode;
  loading: boolean;
  error: string | null;
  
  // 搜索相关
  searchQuery: string;
  searchResults: SearchResult[];
  isSearching: boolean;
  
  // 文件预览
  previewFile: FileItem | null;
  previewContent: string | null;
  
  // 操作
  browseDirectory: (path: string) => Promise<void>;
  getFileContent: (fileId: string, projectId: number) => Promise<void>;
  searchFiles: (options: SearchOptions) => Promise<void>;
  setViewMode: (mode: ViewMode) => void;
  selectFile: (file: FileItem) => void;
  selectMultipleFiles: (files: FileItem[]) => void;
  clearSelection: () => void;
  setPreviewFile: (file: FileItem | null) => void;
  clearError: () => void;
  goBack: () => void;
  goUp: () => void;
}

const defaultViewMode: ViewMode = {
  type: 'grid',
  sortBy: 'name',
  sortOrder: 'asc',
  showHidden: false
};

export const useFileStore = create<FileState>()(devtools(
  (set, get) => ({
    // 初始状态
    currentPath: '',
    files: [],
    selectedFiles: [],
    viewMode: defaultViewMode,
    loading: false,
    error: null,
    
    // 搜索状态
    searchQuery: '',
    searchResults: [],
    isSearching: false,
    
    // 预览状态
    previewFile: null,
    previewContent: null,
    
    // 浏览目录
    browseDirectory: async (path: string) => {
      set({ loading: true, error: null });
      try {
        const result = await apiService.getDirectoryContents(0, path); // TODO: 需要传入正确的projectId
        const { viewMode } = get();
        
        // 根据视图模式排序文件
        const sortedFiles = sortFiles(result.items, viewMode);
        
        set({ 
          currentPath: result.path,
          files: sortedFiles,
          selectedFiles: [],
          loading: false 
        });
      } catch (error) {
        set({ 
          error: error instanceof Error ? error.message : 'Failed to browse directory',
          loading: false 
        });
      }
    },
    
    // 获取文件内容
    getFileContent: async (fileId: string, projectId: number) => {
      set({ loading: true, error: null });
      try {
        const result = await apiService.getFileContent(fileId, projectId);
        set({ 
          previewContent: result.content,
          loading: false 
        });
      } catch (error) {
        set({ 
          error: error instanceof Error ? error.message : 'Failed to load file content',
          loading: false 
        });
      }
    },
    
    // 搜索文件
    searchFiles: async (options: SearchOptions) => {
      set({ isSearching: true, error: null, searchQuery: options.query });
      try {
        const result = await apiService.searchFiles(
          options.query,
          undefined, // projectId
          options.directory,
          options.extensions
        );
        
        // TODO: 将搜索结果转换为SearchResult格式
        const searchResults: SearchResult[] = result.results.map(file => ({
          file,
          matches: [] // 暂时为空，后续实现内容匹配
        }));
        
        set({ 
          searchResults,
          isSearching: false 
        });
      } catch (error) {
        set({ 
          error: error instanceof Error ? error.message : 'Failed to search files',
          isSearching: false 
        });
      }
    },
    
    // 设置视图模式
    setViewMode: (mode: ViewMode) => {
      const { files } = get();
      const sortedFiles = sortFiles(files, mode);
      set({ 
        viewMode: mode,
        files: sortedFiles 
      });
    },
    
    // 选择文件
    selectFile: (file: FileItem) => {
      set({ selectedFiles: [file] });
    },
    
    // 选择多个文件
    selectMultipleFiles: (files: FileItem[]) => {
      set({ selectedFiles: files });
    },
    
    // 清除选择
    clearSelection: () => {
      set({ selectedFiles: [] });
    },
    
    // 设置预览文件
    setPreviewFile: (file: FileItem | null) => {
      set({ previewFile: file, previewContent: null });
      if (file && file.type === 'file') {
        // 需要从外部传入projectId，这里暂时使用0作为占位符
        // TODO: 重构以支持正确的projectId传递
        get().getFileContent(file.id, file.projectId);
      }
    },
    
    // 清除错误
    clearError: () => {
      set({ error: null });
    },
    
    // 返回上一级
    goUp: () => {
      const { currentPath } = get();
      if (currentPath) {
        const parentPath = currentPath.split('/').slice(0, -1).join('/') || '/';
        get().browseDirectory(parentPath);
      }
    },
    
    // 后退（简单实现，可以后续扩展为历史记录）
    goBack: () => {
      get().goUp();
    }
  }),
  {
    name: 'file-store'
  }
));

// 文件排序辅助函数
function sortFiles(files: FileItem[], viewMode: ViewMode): FileItem[] {
  const sorted = [...files].sort((a, b) => {
    // 目录总是在文件前面
    if (a.type !== b.type) {
      return a.type === 'directory' ? -1 : 1;
    }
    
    let comparison = 0;
    
    switch (viewMode.sortBy) {
      case 'name':
        comparison = a.name.localeCompare(b.name);
        break;
      case 'size':
        comparison = a.size - b.size;
        break;
      case 'modified':
        comparison = new Date(a.lastModified).getTime() - new Date(b.lastModified).getTime();
        break;
      case 'type':
        comparison = (a.extension || '').localeCompare(b.extension || '');
        break;
    }
    
    return viewMode.sortOrder === 'desc' ? -comparison : comparison;
  });
  
  // 过滤隐藏文件
  if (!viewMode.showHidden) {
    return sorted.filter(file => !file.name.startsWith('.'));
  }
  
  return sorted;
}