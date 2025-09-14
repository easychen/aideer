import express from 'express';
import { DatabaseService } from '../services/database.js';
import { FileSystemService } from '../services/filesystem.js';
import { ApiResponse, DirectoryNode, FileItem } from '../types/index.js';

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
    
    // 获取项目所有文件和目录
    const files = await fsService.scanDirectory(project.path, projectId);
    
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
    
    const files = await fsService.scanDirectory(project.path, parseInt(projectId.toString()));
    
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