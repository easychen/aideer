import express from 'express';
import path from 'path';
import fs from 'fs-extra';
import { DatabaseService } from '../services/database.js';
import { FileSystemService } from '../services/filesystem.js';
import { ApiResponse, DirectoryNode, FileItem } from '../types/index.js';
import { PathUtils } from '../utils/pathUtils.js';

const router: express.Router = express.Router();
const dbService = DatabaseService.getInstance();
const fsService = FileSystemService.getInstance();

// 获取项目文件树
router.get('/tree/:projectId', async (req, res) => {
  try {
    const projectId = parseInt(req.params.projectId);
    
    // 获取项目信息
    const project = await dbService.getProjectById(projectId);
    if (!project) {
      return res.status(404).json({
        success: false,
        error: 'Project not found'
      } as ApiResponse);
    }
    
    // 扫描项目目录（将相对路径转换为绝对路径）
    const absolutePath = PathUtils.getAbsolutePath(project.path);
    const files = await fsService.scanDirectory(absolutePath, projectId);
    
    // 构建文件树
    const tree = buildDirectoryTree(files);
    
    return res.json({
      success: true,
      data: tree,
      message: 'Directory tree retrieved successfully'
    } as ApiResponse<DirectoryNode[]>);
  } catch (error) {
    console.error('Error fetching directory tree:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch directory tree'
    } as ApiResponse);
  }
});

// 获取指定目录的直接子项
router.get('/', async (req, res) => {
  try {
    const { projectId, path } = req.query;
    
    if (!projectId) {
      return res.status(400).json({
        success: false,
        error: 'Project ID is required'
      } as ApiResponse);
    }
    
    // 获取项目信息
    const project = await dbService.getProjectById(parseInt(projectId.toString()));
    if (!project) {
      return res.status(404).json({
        success: false,
        error: 'Project not found'
      } as ApiResponse);
    }
    
    // 构建完整目录路径（将相对路径转换为绝对路径）
    const projectAbsolutePath = PathUtils.getAbsolutePath(project.path);
    const files = await fsService.scanDirectory(projectAbsolutePath, parseInt(projectId.toString()));
    
    // 过滤指定路径下的直接子项
    const targetPath = path ? path.toString() : '';
    const directChildren = files.filter((file: FileItem) => {
      const parentPath = file.relativePath.split('/').slice(0, -1).join('/');
      return parentPath === targetPath;
    });
    
    return res.json({
      success: true,
      data: {
        path: targetPath,
        items: directChildren
      },
      message: 'Directory contents retrieved successfully'
    } as ApiResponse);
  } catch (error) {
    console.error('Error fetching directory contents:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch directory contents'
    } as ApiResponse);
  }
});

// 创建目录
router.post('/', async (req, res) => {
  try {
    const { projectId, path: dirPath } = req.body;
    
    if (!projectId || !dirPath) {
      return res.status(400).json({
        success: false,
        error: 'Project ID and path are required'
      } as ApiResponse);
    }
    
    // 获取项目信息
    const project = await dbService.getProjectById(parseInt(projectId));
    if (!project) {
      return res.status(404).json({
        success: false,
        error: 'Project not found'
      } as ApiResponse);
    }
    
    // 构建完整目录路径
    const projectAbsolutePath = PathUtils.getAbsolutePath(project.path);
    const fullDirPath = path.join(projectAbsolutePath, dirPath);
    
    // 检查目录是否已存在
    if (await fs.pathExists(fullDirPath)) {
      return res.status(409).json({
        success: false,
        error: 'Directory already exists'
      } as ApiResponse);
    }
    
    // 创建目录
    await fs.ensureDir(fullDirPath);
    
    return res.json({
      success: true,
      data: { success: true },
      message: 'Directory created successfully'
    } as ApiResponse);
  } catch (error) {
    console.error('Error creating directory:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to create directory'
    } as ApiResponse);
  }
});

// 重命名目录
router.put('/rename', async (req, res) => {
  try {
    const { projectId, oldPath, newPath } = req.body;
    
    if (!projectId || !oldPath || !newPath) {
      return res.status(400).json({
        success: false,
        error: 'Project ID, old path and new path are required'
      } as ApiResponse);
    }
    
    // 获取项目信息
    const project = await dbService.getProjectById(parseInt(projectId));
    if (!project) {
      return res.status(404).json({
        success: false,
        error: 'Project not found'
      } as ApiResponse);
    }
    
    // 构建完整路径
    const projectAbsolutePath = PathUtils.getAbsolutePath(project.path);
    const fullOldPath = path.join(projectAbsolutePath, oldPath);
    const fullNewPath = path.join(projectAbsolutePath, newPath);
    
    // 检查源目录是否存在
    if (!(await fs.pathExists(fullOldPath))) {
      return res.status(404).json({
        success: false,
        error: 'Source directory not found'
      } as ApiResponse);
    }
    
    // 检查目标目录是否已存在
    if (await fs.pathExists(fullNewPath)) {
      return res.status(409).json({
        success: false,
        error: 'Target directory already exists'
      } as ApiResponse);
    }
    
    // 重命名目录
    await fs.move(fullOldPath, fullNewPath);
    
    return res.json({
      success: true,
      data: { success: true },
      message: 'Directory renamed successfully'
    } as ApiResponse);
  } catch (error) {
    console.error('Error renaming directory:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to rename directory'
    } as ApiResponse);
  }
});

// 删除目录
router.delete('/', async (req, res) => {
  try {
    const { projectId, path: dirPath } = req.body;
    
    if (!projectId || !dirPath) {
      return res.status(400).json({
        success: false,
        error: 'Project ID and path are required'
      } as ApiResponse);
    }
    
    // 获取项目信息
    const project = await dbService.getProjectById(parseInt(projectId));
    if (!project) {
      return res.status(404).json({
        success: false,
        error: 'Project not found'
      } as ApiResponse);
    }
    
    // 构建完整目录路径
    const projectAbsolutePath = PathUtils.getAbsolutePath(project.path);
    const fullDirPath = path.join(projectAbsolutePath, dirPath);
    
    // 检查目录是否存在
    if (!(await fs.pathExists(fullDirPath))) {
      return res.status(404).json({
        success: false,
        error: 'Directory not found'
      } as ApiResponse);
    }
    
    // 删除目录及其所有内容
    await fs.remove(fullDirPath);
    
    return res.json({
      success: true,
      data: { success: true },
      message: 'Directory deleted successfully'
    } as ApiResponse);
  } catch (error) {
    console.error('Error deleting directory:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to delete directory'
    } as ApiResponse);
  }
});

/**
 * 构建目录树结构
 */
function buildDirectoryTree(files: FileItem[]): DirectoryNode[] {
  const nodeMap = new Map<string, DirectoryNode>();
  const rootNodes: DirectoryNode[] = [];
  
  // 首先创建所有节点
  files.forEach(file => {
    const node: DirectoryNode = {
      id: file.id,
      name: file.name,
      path: file.relativePath,
      type: file.type,
      size: file.size,
      mimeType: file.mimeType,
      extension: file.extension,
      lastModified: file.lastModified,
      children: file.type === 'directory' ? [] : undefined
    };
    nodeMap.set(file.relativePath, node);
  });
  
  // 然后建立父子关系
  files.forEach(file => {
    const node = nodeMap.get(file.relativePath)!;
    const pathParts = file.relativePath.split('/');
    
    if (pathParts.length === 1) {
      // 根级文件/目录
      rootNodes.push(node);
    } else {
      // 找到父目录
      const parentPath = pathParts.slice(0, -1).join('/');
      const parentNode = nodeMap.get(parentPath);
      if (parentNode && parentNode.children) {
        parentNode.children.push(node);
      }
    }
  });
  
  // 排序：目录在前，文件在后，同类型按名称排序
  const sortNodes = (nodes: DirectoryNode[]) => {
    nodes.sort((a, b) => {
      if (a.type !== b.type) {
        return a.type === 'directory' ? -1 : 1;
      }
      return a.name.localeCompare(b.name);
    });
    
    nodes.forEach(node => {
      if (node.children) {
        sortNodes(node.children);
      }
    });
  };
  
  sortNodes(rootNodes);
  return rootNodes;
}

export default router;