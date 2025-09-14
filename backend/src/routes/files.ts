import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs-extra';
import crypto from 'crypto';
import mimeTypes from 'mime-types';
import { DatabaseService } from '../services/database.js';
import { FileSystemService } from '../services/filesystem.js';
import { ApiResponse, FileItem, FileQueryParams } from '../types/index.js';

const router: express.Router = express.Router();
const dbService = DatabaseService.getInstance();
const fsService = FileSystemService.getInstance();

// 生成文件ID的辅助函数
function generateFileId(filePath: string): string {
  return crypto.createHash('md5').update(filePath).digest('hex');
}

// 配置multer用于文件上传
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 100 * 1024 * 1024, // 100MB限制
  },
});

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
    
    // 获取项目信息
    const projects = await dbService.getProjects();
    const project = projects.find(p => p.id === parseInt(projectId.toString()));
    
    if (!project) {
      return res.status(404).json({
        success: false,
        error: 'Project not found'
      } as ApiResponse);
    }
    
    // 直接从文件系统扫描文件
    const scannedFiles = await fsService.scanDirectory(project.path, project.id);
    
    // 为每个文件生成ID
    const filesWithId = scannedFiles.map(file => ({
      ...file,
      id: generateFileId(file.path)
    }));
    
    // 如果指定了目录路径，过滤文件
    let filteredFiles = filesWithId;
    if (directoryPath) {
      filteredFiles = filesWithId.filter(file => 
        file.relativePath.startsWith(directoryPath) || file.relativePath === directoryPath
      );
    }
    
    // 如果指定了类型，进一步过滤
    if (type) {
      filteredFiles = filteredFiles.filter(file => file.type === type);
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



// 获取单个文件信息
router.get('/:id', async (req, res) => {
  try {
    const fileId = req.params.id;
    const { projectId } = req.query;
    
    if (!projectId) {
      return res.status(400).json({
        success: false,
        error: 'Project ID is required'
      } as ApiResponse);
    }
    
    // 获取项目信息
    const projects = await dbService.getProjects();
    const project = projects.find(p => p.id === parseInt(projectId.toString()));
    
    if (!project) {
      return res.status(404).json({
        success: false,
        error: 'Project not found'
      } as ApiResponse);
    }
    
    // 扫描项目文件并查找匹配的文件
    const scannedFiles = await fsService.scanDirectory(project.path, project.id);
    const file = scannedFiles.find(f => generateFileId(f.path) === fileId);
    
    if (!file) {
      return res.status(404).json({
        success: false,
        error: 'File not found'
      } as ApiResponse);
    }
    
    return res.json({
      success: true,
      data: { ...file, id: fileId },
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

// 文件内容更新接口
router.put('/:id/content', async (req, res) => {
  try {
    const fileId = req.params.id;
    const { projectId, content } = req.body;
    
    if (!projectId) {
      return res.status(400).json({
        success: false,
        error: 'Project ID is required'
      } as ApiResponse);
    }
    
    if (content === undefined || content === null) {
      return res.status(400).json({
        success: false,
        error: 'Content is required'
      } as ApiResponse);
    }
    
    // 获取项目信息
    const projects = await dbService.getProjects();
    const project = projects.find(p => p.id === parseInt(projectId));
    
    if (!project) {
      return res.status(404).json({
        success: false,
        error: 'Project not found'
      } as ApiResponse);
    }
    
    // 扫描项目文件并查找匹配的文件
    const scannedFiles = await fsService.scanDirectory(project.path, project.id);
    const file = scannedFiles.find(f => generateFileId(f.path) === fileId);
    
    if (!file) {
      return res.status(404).json({
        success: false,
        error: 'File not found'
      } as ApiResponse);
    }
    
    if (file.type === 'directory') {
      return res.status(400).json({
        success: false,
        error: 'Cannot update directory content'
      } as ApiResponse);
    }
    
    // 根据内容类型处理数据
    let dataToWrite;
    if (typeof content === 'string') {
      // 如果是字符串，直接写入
      dataToWrite = content;
    } else if (content.type === 'base64') {
      // 如果是base64编码的二进制数据
      dataToWrite = Buffer.from(content.data, 'base64');
    } else if (content.type === 'buffer') {
      // 如果是buffer数据
      dataToWrite = Buffer.from(content.data);
    } else {
      return res.status(400).json({
        success: false,
        error: 'Invalid content format'
      } as ApiResponse);
    }
    
    // 写入文件
    await fs.writeFile(file.path, dataToWrite);
    
    // 获取更新后的文件信息
    const stats = await fs.stat(file.path);
    const updatedFile = {
      ...file,
      id: fileId,
      size: stats.size,
      modifiedAt: stats.mtime.toISOString()
    };
    
    return res.json({
      success: true,
      data: updatedFile,
      message: 'File content updated successfully'
    } as ApiResponse<FileItem>);
  } catch (error) {
    console.error('Error updating file content:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to update file content'
    } as ApiResponse);
  }
});

// 创建文件接口
router.post('/', async (req, res) => {
  try {
    const { projectId, relativePath, content } = req.body;
    
    if (!projectId || !relativePath) {
      return res.status(400).json({
        success: false,
        error: 'Project ID and relative path are required'
      } as ApiResponse);
    }
    
    // 获取项目信息
    const projects = await dbService.getProjects();
    const project = projects.find(p => p.id === parseInt(projectId));
    
    if (!project) {
      return res.status(404).json({
        success: false,
        error: 'Project not found'
      } as ApiResponse);
    }
    
    // 构建完整文件路径
    const fullPath = path.join(project.path, relativePath);
    
    // 检查文件是否已存在
    if (await fs.pathExists(fullPath)) {
      return res.status(409).json({
        success: false,
        error: 'File already exists'
      } as ApiResponse);
    }
    
    // 确保目录存在
    await fs.ensureDir(path.dirname(fullPath));
    
    // 根据内容类型处理数据
    let dataToWrite;
    if (typeof content === 'string') {
      // 如果是字符串，直接写入
      dataToWrite = content;
    } else if (content && content.type === 'base64') {
      // 如果是base64编码的二进制数据
      dataToWrite = Buffer.from(content.data, 'base64');
    } else if (content && content.type === 'buffer') {
      // 如果是buffer数据
      dataToWrite = Buffer.from(content.data);
    } else {
      // 默认为空文件
      dataToWrite = '';
    }
    
    // 写入文件
    await fs.writeFile(fullPath, dataToWrite);
    
    // 获取文件信息
    const stats = await fs.stat(fullPath);
    const fileId = generateFileId(fullPath);
    
    const newFile: FileItem = {
       id: fileId,
       name: path.basename(fullPath),
       path: fullPath,
       relativePath: relativePath,
       type: 'file',
       size: stats.size,
       lastModified: stats.mtime.toISOString(),
       createdAt: stats.birthtime.toISOString(),
       updatedAt: stats.mtime.toISOString(),
       projectId: project.id,
       mimeType: mimeTypes.lookup(fullPath) || 'application/octet-stream'
     };
    
    return res.json({
      success: true,
      data: newFile,
      message: 'File created successfully'
    } as ApiResponse<FileItem>);
  } catch (error) {
    console.error('Error creating file:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to create file'
    } as ApiResponse);
  }
});

// 文件重命名接口
router.put('/:id/rename', async (req, res) => {
  try {
    const fileId = req.params.id;
    const { projectId, newName } = req.body;
    
    if (!projectId || !newName) {
      return res.status(400).json({
        success: false,
        error: 'Project ID and new name are required'
      } as ApiResponse);
    }
    
    // 获取项目信息
    const projects = await dbService.getProjects();
    const project = projects.find(p => p.id === parseInt(projectId));
    
    if (!project) {
      return res.status(404).json({
        success: false,
        error: 'Project not found'
      } as ApiResponse);
    }
    
    // 扫描项目文件并查找匹配的文件
    const scannedFiles = await fsService.scanDirectory(project.path, project.id);
    const file = scannedFiles.find(f => generateFileId(f.path) === fileId);
    
    if (!file) {
      return res.status(404).json({
        success: false,
        error: 'File not found'
      } as ApiResponse);
    }
    
    if (file.type === 'directory') {
      return res.status(400).json({
        success: false,
        error: 'Cannot rename directories'
      } as ApiResponse);
    }
    
    // 构建新的文件路径
    const oldPath = file.path;
    const newPath = path.join(path.dirname(oldPath), newName);
    
    // 检查新文件名是否已存在
    if (await fs.pathExists(newPath)) {
      return res.status(409).json({
        success: false,
        error: 'A file with this name already exists'
      } as ApiResponse);
    }
    
    // 重命名文件
    await fs.rename(oldPath, newPath);
    
    // 获取重命名后的文件信息
    const fileStats = await fs.stat(newPath);
    const mimeType = mimeTypes.lookup(newPath) || undefined;
    const newRelativePath = path.relative(project.path, newPath);
    
    const renamedFile: FileItem = {
      id: generateFileId(newPath),
      projectId: project.id,
      name: path.basename(newPath),
      path: newPath,
      relativePath: newRelativePath,
      size: fileStats.size,
      type: 'file',
      mimeType: mimeType,
      extension: path.extname(newPath).slice(1) || undefined,
      createdAt: fileStats.birthtime.toISOString(),
      updatedAt: fileStats.mtime.toISOString(),
      lastModified: fileStats.mtime.toISOString(),
      thumbnailPath: undefined
    };
    
    return res.json({
      success: true,
      data: renamedFile,
      message: 'File renamed successfully'
    } as ApiResponse);
    
  } catch (error) {
    console.error('Error renaming file:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to rename file'
    } as ApiResponse);
  }
});

// 文件删除接口
router.delete('/:id', async (req, res) => {
  try {
    const fileId = req.params.id;
    const { projectId } = req.query;
    
    if (!projectId) {
      return res.status(400).json({
        success: false,
        error: 'Project ID is required'
      } as ApiResponse);
    }
    
    // 获取项目信息
    const projects = await dbService.getProjects();
    const project = projects.find(p => p.id === parseInt(projectId.toString()));
    
    if (!project) {
      return res.status(404).json({
        success: false,
        error: 'Project not found'
      } as ApiResponse);
    }
    
    // 扫描项目文件并查找匹配的文件
    const scannedFiles = await fsService.scanDirectory(project.path, project.id);
    const file = scannedFiles.find(f => generateFileId(f.path) === fileId);
    
    if (!file) {
      return res.status(404).json({
        success: false,
        error: 'File not found'
      } as ApiResponse);
    }
    
    if (file.type === 'directory') {
      return res.status(400).json({
        success: false,
        error: 'Cannot delete directories'
      } as ApiResponse);
    }
    
    // 删除文件
    await fs.remove(file.path);
    
    return res.json({
      success: true,
      message: 'File deleted successfully'
    } as ApiResponse);
    
  } catch (error) {
    console.error('Error deleting file:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to delete file'
    } as ApiResponse);
  }
});

// 文件上传接口
router.post('/upload', upload.array('files'), async (req, res) => {
  try {
    const { projectId, targetPath = '', filePaths } = req.body;
    const files = req.files as Express.Multer.File[];
    
    if (!projectId) {
      return res.status(400).json({
        success: false,
        error: 'Project ID is required'
      } as ApiResponse);
    }
    
    if (!files || files.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'No files provided'
      } as ApiResponse);
    }
    
    // 获取项目信息
    const projects = await dbService.getProjects();
    const project = projects.find(p => p.id === parseInt(projectId));
    
    if (!project) {
      return res.status(404).json({
        success: false,
        error: 'Project not found'
      } as ApiResponse);
    }
    
    const uploadedFiles: FileItem[] = [];
    const filePathsArray = filePaths ? JSON.parse(filePaths) : [];
    
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      // 使用前端传递的文件路径信息，如果没有则使用原始文件名
      const fileRelativePath = filePathsArray[i] || file.originalname;
      // 构建目标路径
      let relativePath = path.join(targetPath, fileRelativePath);
      let fullPath = path.join(project.path, relativePath);
       
       // 检查文件是否已存在，如果存在则自动添加数字后缀
       let counter = 1;
       const originalFullPath = fullPath;
       const originalRelativePath = relativePath;
       const fileExtension = path.extname(fileRelativePath);
       const fileNameWithoutExt = path.basename(fileRelativePath, fileExtension);
       const fileDir = path.dirname(fileRelativePath);
       
       while (await fs.pathExists(fullPath)) {
         const newFileName = `${fileNameWithoutExt}(${counter})${fileExtension}`;
         relativePath = path.join(targetPath, fileDir, newFileName);
         fullPath = path.join(project.path, relativePath);
         counter++;
       }
       
       // 确保目标目录存在
       await fs.ensureDir(path.dirname(fullPath));
       
       // 写入文件
       await fs.writeFile(fullPath, file.buffer);
       
       // 获取文件信息（不保存到数据库）
       const fileStats = await fs.stat(fullPath);
       const mimeType = mimeTypes.lookup(fullPath) || undefined;
       
       const fileItem: FileItem = {
         id: generateFileId(fullPath),
         projectId: project.id,
         name: path.basename(fullPath),
         path: fullPath,
         relativePath: relativePath,
         size: fileStats.size,
         type: 'file',
         mimeType: mimeType,
         extension: path.extname(fullPath).slice(1) || undefined,
         createdAt: fileStats.birthtime.toISOString(),
         updatedAt: fileStats.mtime.toISOString(),
         lastModified: fileStats.mtime.toISOString(),
         thumbnailPath: undefined
       };
       
       uploadedFiles.push(fileItem);
    }
    
    return res.json({
      success: true,
      data: {
        files: uploadedFiles,
        count: uploadedFiles.length
      },
      message: `Successfully uploaded ${uploadedFiles.length} files`
    } as ApiResponse);
    
  } catch (error) {
    console.error('Error uploading files:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to upload files'
    } as ApiResponse);
  }
});

export default router;