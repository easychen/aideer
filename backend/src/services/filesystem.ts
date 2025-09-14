import fs from 'fs/promises';
import path from 'path';
import { FileItem } from '../types';
import mime from 'mime-types';

export class FileSystemService {
  private static instance: FileSystemService;
  
  private constructor() {
    // 私有构造函数，实现单例模式
  }
  
  public static getInstance(): FileSystemService {
    if (!FileSystemService.instance) {
      FileSystemService.instance = new FileSystemService();
    }
    return FileSystemService.instance;
  }
  
  public static initialize(): void {
    try {
      console.log('Initializing file system service...');
      // TODO: 实现文件系统服务初始化逻辑
      // - 设置文件监听器
      // - 初始化缩略图生成器
      // - 配置文件类型检测
      console.log('File system service initialized successfully');
    } catch (error) {
      console.error('Failed to initialize file system service:', error);
      throw error;
    }
  }
  
  /**
   * 扫描目录，返回所有文件和子目录信息
   */
  public async scanDirectory(dirPath: string, projectId: number): Promise<FileItem[]> {
    const results: FileItem[] = [];
    
    try {
      await this.scanDirectoryRecursive(dirPath, dirPath, projectId, results);
    } catch (error) {
      console.error('Error scanning directory:', error);
      throw new Error(`Failed to scan directory: ${dirPath}`);
    }
    
    return results;
  }
  
  /**
   * 递归扫描目录
   */
  private async scanDirectoryRecursive(
    currentPath: string, 
    rootPath: string, 
    projectId: number, 
    results: FileItem[]
  ): Promise<void> {
    const entries = await fs.readdir(currentPath, { withFileTypes: true });
    
    for (const entry of entries) {
      // 跳过隐藏文件和特殊目录
      if (entry.name.startsWith('.') || entry.name === 'node_modules') {
        continue;
      }
      
      const fullPath = path.join(currentPath, entry.name);
      const relativePath = path.relative(rootPath, fullPath);
      
      if (entry.isDirectory()) {
        // 添加目录信息
        results.push({
            id: 0, // 将在数据库中生成
            projectId: projectId,
            name: entry.name,
            path: fullPath,
            relativePath: relativePath,
            type: 'directory',
            size: 0,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            lastModified: new Date().toISOString()
          });
        
        // 递归扫描子目录
        await this.scanDirectoryRecursive(fullPath, rootPath, projectId, results);
      } else if (entry.isFile()) {
        // 获取文件信息
        const fileInfo = await this.getFileInfo(fullPath);
        
        results.push({
            id: 0, // 将在数据库中生成
            projectId: projectId,
            name: entry.name,
            path: fullPath,
            relativePath: relativePath,
            type: 'file',
            mimeType: fileInfo.mimeType,
            extension: path.extname(entry.name).slice(1) || undefined,
            size: fileInfo.size,
            createdAt: fileInfo.createdAt,
            updatedAt: fileInfo.updatedAt,
            lastModified: fileInfo.updatedAt
          });
      }
    }
  }
  
  public async readDirectory(path: string): Promise<any[]> {
    // 占位实现
    return [];
  }
  
  /**
   * 获取文件详细信息
   */
  public async getFileInfo(filePath: string): Promise<{
      size: number;
      mimeType?: string;
      createdAt: string;
      updatedAt: string;
    }> {
    try {
      const stats = await fs.stat(filePath);
      const mimeType = mime.lookup(filePath) || undefined;
      
      return {
         size: stats.size,
         mimeType,
         createdAt: stats.birthtime.toISOString(),
         updatedAt: stats.mtime.toISOString()
       };
    } catch (error) {
      console.error('Error getting file info:', error);
      throw new Error(`Failed to get file info: ${filePath}`);
    }
  }
  
  /**
   * 检查路径是否存在且为目录
   */
  public async isValidDirectory(dirPath: string): Promise<boolean> {
    try {
      const stats = await fs.stat(dirPath);
      return stats.isDirectory();
    } catch (error) {
      return false;
    }
  }

  /**
   * 确保目录存在，如果不存在则创建
   */
  public async ensureDirectory(dirPath: string): Promise<void> {
    try {
      await fs.mkdir(dirPath, { recursive: true });
    } catch (error) {
      throw new Error(`Failed to create directory: ${dirPath}`);
    }
  }
  
  /**
   * 读取文件内容
   */
  public async readFile(filePath: string): Promise<string> {
    try {
      return await fs.readFile(filePath, 'utf-8');
    } catch (error) {
      console.error('Error reading file:', error);
      throw new Error(`Failed to read file: ${filePath}`);
    }
  }
  
  public async generateThumbnail(filePath: string): Promise<string | null> {
    // 占位实现
    return null;
  }
}