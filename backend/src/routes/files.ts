import express from 'express';
import { DatabaseService } from '../services/database.js';
import { FileSystemService } from '../services/filesystem.js';
import { ApiResponse, FileItem, FileQueryParams } from '../types/index.js';

const router: express.Router = express.Router();
const dbService = DatabaseService.getInstance();
const fsService = FileSystemService.getInstance();

// 获取项目文件列表
router.get('/', async (req, res) => {
  try {
    const { projectId, directoryPath, type, mimeType, limit, offset }: FileQueryParams = req.query as any;
    
    if (!projectId) {
      return res.status(400).json({
        success: false,
        error: 'Project ID is required'
      } as ApiResponse);
    }
    
    const files = await dbService.getFilesByProject(parseInt(projectId.toString()), type);
    
    // 如果指定了目录路径，过滤文件
    let filteredFiles = files;
    if (directoryPath) {
      filteredFiles = files.filter(file => 
        file.relativePath.startsWith(directoryPath) || file.relativePath === directoryPath
      );
    }
    
    // 如果指定了MIME类型，进一步过滤
    if (mimeType) {
      filteredFiles = filteredFiles.filter(file => file.mimeType === mimeType);
    }
    
    // 分页处理
    const startIndex = offset ? parseInt(offset.toString()) : 0;
     const endIndex = limit ? startIndex + parseInt(limit.toString()) : filteredFiles.length;
     const paginatedFiles = filteredFiles.slice(startIndex, endIndex);
    
    return res.json({
      success: true,
      data: {
        files: paginatedFiles,
        total: filteredFiles.length,
        offset: startIndex,
        limit: limit ? parseInt(limit.toString()) : filteredFiles.length
      },
      message: 'Files retrieved successfully'
    } as ApiResponse);
  } catch (error) {
    console.error('Error fetching files:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch files'
    } as ApiResponse);
  }
});

// 获取文件内容
router.get('/:id/content', async (req, res) => {
  try {
    const fileId = parseInt(req.params.id);
    // 暂时使用getFilesByProject方法获取文件
     const files = await dbService.getFilesByProject(0); // 需要实现getFileById方法
     const file = files.find(f => f.id === fileId);
    
    if (!file) {
      return res.status(404).json({
        success: false,
        error: 'File not found'
      } as ApiResponse);
    }
    
    if (file.type === 'directory') {
      return res.status(400).json({
        success: false,
        error: 'Cannot read content of a directory'
      } as ApiResponse);
    }
    
    const content = await fsService.readFile(file.path);
    
    return res.json({
      success: true,
      data: {
        file: file,
        content: content
      },
      message: 'File content retrieved successfully'
    } as ApiResponse);
  } catch (error) {
    console.error('Error reading file content:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to read file content'
    } as ApiResponse);
  }
});

// 获取单个文件信息
router.get('/:id', async (req, res) => {
  try {
    const fileId = parseInt(req.params.id);
    // 暂时使用getFilesByProject方法获取文件
     const files = await dbService.getFilesByProject(0); // 需要实现getFileById方法
     const file = files.find(f => f.id === fileId);
    
    if (!file) {
      return res.status(404).json({
        success: false,
        error: 'File not found'
      } as ApiResponse);
    }
    
    return res.json({
      success: true,
      data: file,
      message: 'File info retrieved successfully'
    } as ApiResponse<FileItem>);
  } catch (error) {
    console.error('Error fetching file info:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch file info'
    } as ApiResponse);
  }
});

export default router;