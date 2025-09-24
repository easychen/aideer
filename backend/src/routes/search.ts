import express from 'express';
import { DatabaseService } from '../services/database.js';
import { FileSystemService } from '../services/filesystem.js';
import { ApiResponse, FileItem, FileExtraInfo } from '../types/index.js';
import { PathUtils } from '../utils/pathUtils.js';

const router: express.Router = express.Router();
const dbService = DatabaseService.getInstance();
const fsService = FileSystemService.getInstance();

// 搜索结果接口
export interface SearchResult {
  id: string;
  type: 'file' | 'note';
  name: string;
  path: string;
  relativePath: string;
  projectId: number;
  projectName: string;
  matchType: 'filename' | 'content';
  snippet?: string; // 匹配的内容片段
  notes?: string;
  tags?: string[];
  starred?: boolean;
}

// 搜索API
router.get('/', async (req, res) => {
  try {
    const { query, projectId } = req.query;
    
    if (!query || typeof query !== 'string' || query.trim().length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Search query is required'
      } as ApiResponse);
    }
    
    if (!projectId) {
      return res.status(400).json({
        success: false,
        error: 'Project ID is required'
      } as ApiResponse);
    }

    // 获取项目信息
    const projects = await dbService.getAllProjects();
    const project = projects.find(p => p.id === parseInt(projectId.toString()));
    
    if (!project) {
      return res.status(404).json({
        success: false,
        error: 'Project not found'
      } as ApiResponse);
    }

    const searchQuery = query.toString().toLowerCase().trim();
    const results: SearchResult[] = [];

    // 1. 搜索文件名
    try {
      const absolutePath = PathUtils.getAbsolutePath(project.path);
      const scannedFiles = await fsService.scanDirectory(absolutePath, project.id);
      
      // 过滤匹配的文件
      const matchingFiles = scannedFiles.filter(file => 
        file.name.toLowerCase().includes(searchQuery) ||
        file.relativePath.toLowerCase().includes(searchQuery)
      );

      // 转换为搜索结果格式
      for (const file of matchingFiles) {
        results.push({
          id: file.id,
          type: 'file',
          name: file.name,
          path: file.path,
          relativePath: file.relativePath,
          projectId: file.projectId,
          projectName: project.name,
          matchType: 'filename'
        });
      }
    } catch (error) {
      console.error('Error searching files:', error);
    }

    // 2. 搜索笔记内容
    try {
      const allFileExtraInfo = await dbService.getAllFileExtraInfo();
      
      // 过滤当前项目的文件额外信息
      const projectFileExtraInfo = allFileExtraInfo.filter(info => 
        info.projectId === project.id
      );

      // 搜索笔记内容、标签等
      for (const info of projectFileExtraInfo) {
        let isMatch = false;
        let snippet = '';
        
        // 搜索笔记内容
        if (info.notes && info.notes.toLowerCase().includes(searchQuery)) {
          isMatch = true;
          // 提取匹配的内容片段
          const noteIndex = info.notes.toLowerCase().indexOf(searchQuery);
          const start = Math.max(0, noteIndex - 50);
          const end = Math.min(info.notes.length, noteIndex + searchQuery.length + 50);
          snippet = info.notes.substring(start, end);
          if (start > 0) snippet = '...' + snippet;
          if (end < info.notes.length) snippet = snippet + '...';
        }
        
        // 搜索标签
        if (info.tags && info.tags.some(tag => tag.toLowerCase().includes(searchQuery))) {
          isMatch = true;
          snippet = `Tags: ${info.tags.join(', ')}`;
        }

        if (isMatch && info.relativePaths && info.relativePaths.length > 0) {
          // 只为第一个相对路径创建一个搜索结果，避免重复
          const relativePath = info.relativePaths[0];
          const fileName = relativePath.split('/').pop() || relativePath;
          results.push({
            id: `note_${info.id}`,
            type: 'note',
            name: fileName,
            path: relativePath,
            relativePath: relativePath,
            projectId: info.projectId,
            projectName: project.name,
            matchType: 'content',
            snippet: snippet,
            notes: info.notes,
            tags: info.tags,
            starred: info.starred
          });
        }
      }
    } catch (error) {
      console.error('Error searching notes:', error);
    }

    // 按相关性排序（文件名匹配优先，然后是内容匹配）
    results.sort((a, b) => {
      if (a.matchType !== b.matchType) {
        return a.matchType === 'filename' ? -1 : 1;
      }
      return a.name.localeCompare(b.name);
    });

    return res.json({
      success: true,
      data: {
        query: searchQuery,
        results: results,
        total: results.length
      },
      message: 'Search completed successfully'
    } as ApiResponse);

  } catch (error) {
    console.error('Error performing search:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to perform search'
    } as ApiResponse);
  }
});

export default router;