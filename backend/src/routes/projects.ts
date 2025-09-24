import express from 'express';
import path from 'path';
import { DatabaseService } from '../services/database.js';
import { FileSystemService } from '../services/filesystem.js';
import { CreateProjectRequest, ApiResponse, Project } from '../types/index.js';
import { PathUtils } from '../utils/pathUtils.js';

const router: express.Router = express.Router();
const dbService = DatabaseService.getInstance();
const fsService = FileSystemService.getInstance();

// 定义项目数据根目录
const PROJECT_DATA_ROOT = path.resolve(process.cwd(), 'data');

// 获取所有项目
router.get('/', async (req, res) => {
  try {
    const projects = await dbService.getAllProjects();
    res.json({
      success: true,
      data: projects,
      message: 'Projects retrieved successfully'
    } as ApiResponse<Project[]>);
  } catch (error) {
    console.error('Error fetching projects:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch projects'
    } as ApiResponse);
  }
});

// 创建新项目
router.post('/', async (req, res) => {
  try {
    const { name, path: projectPath, description }: CreateProjectRequest = req.body;
    
    // 验证输入
    if (!name || !projectPath) {
      return res.status(400).json({
        success: false,
        error: 'Name and path are required'
      } as ApiResponse);
    }
    
    // 构建完整的项目路径（限制在data目录下）
    const fullProjectPath = PathUtils.getAbsolutePath(projectPath);
    
    // 验证路径是否在允许的根目录下
    if (!PathUtils.isPathAllowed(fullProjectPath)) {
      return res.status(400).json({
        success: false,
        error: 'Project path must be within the data directory'
      } as ApiResponse);
    }
    
    // 确保目录存在，如果不存在则创建
    try {
      await fsService.ensureDirectory(fullProjectPath);
    } catch (error) {
      return res.status(400).json({
        success: false,
        error: 'Failed to create project directory'
      } as ApiResponse);
    }
    
    // 创建项目（使用相对路径存储）
    const project = await dbService.createProject({ name, path: projectPath, description });
    
    return res.json({
      success: true,
      data: project,
      message: 'Project created successfully'
    } as ApiResponse<Project>);
  } catch (error) {
    console.error('Error creating project:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to create project'
    } as ApiResponse);
  }
});

// 扫描项目目录
router.post('/:id/scan', async (req, res) => {
  try {
    const projectId = parseInt(req.params.id);
    
    // 获取项目信息
    const project = await dbService.getProjectById(projectId);
    if (!project) {
      return res.status(404).json({
        success: false,
        error: 'Project not found'
      } as ApiResponse);
    }
    
    // 扫描目录（将相对路径转换为绝对路径）
    const absolutePath = PathUtils.getAbsolutePath(project.path);
    const files = await fsService.scanDirectory(absolutePath, projectId);
    
    return res.json({
      success: true,
      data: { scannedFiles: files.length },
      message: `Successfully scanned ${files.length} files`
    } as ApiResponse<{ scannedFiles: number }>);
  } catch (error) {
    console.error('Error scanning project:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to scan project'
    } as ApiResponse);
  }
});

// 获取项目详情
router.get('/:id', async (req, res) => {
  try {
    const projectId = parseInt(req.params.id);
    const project = await dbService.getProjectById(projectId);
    
    if (!project) {
      return res.status(404).json({
        success: false,
        error: 'Project not found'
      } as ApiResponse);
    }
    
    return res.json({
      success: true,
      data: project,
      message: 'Project details retrieved successfully'
    });
  } catch (error) {
    console.error('Error fetching project details:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch project details'
    });
  }
});

// 更新项目
router.put('/:id', async (req, res) => {
  try {
    const projectId = parseInt(req.params.id);
    const updates = req.body;
    
    // 检查项目是否存在
    const existingProject = await dbService.getProjectById(projectId);
    if (!existingProject) {
      return res.status(404).json({
        success: false,
        error: 'Project not found'
      } as ApiResponse);
    }
    
    // 如果更新路径，需要验证新路径
    if (updates.path) {
      const fullProjectPath = PathUtils.getAbsolutePath(updates.path);
      if (!PathUtils.isPathAllowed(fullProjectPath)) {
        return res.status(400).json({
          success: false,
          error: 'Project path must be within the data directory'
        } as ApiResponse);
      }
    }
    
    // 更新项目
    const updatedProject = await dbService.updateProject(projectId, updates);
    
    return res.json({
      success: true,
      data: updatedProject,
      message: 'Project updated successfully'
    } as ApiResponse<Project>);
  } catch (error) {
    console.error('Error updating project:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to update project'
    } as ApiResponse);
  }
});

// 删除项目
router.delete('/:id', async (req, res) => {
  try {
    const projectId = parseInt(req.params.id);
    
    // 检查项目是否存在
    const existingProject = await dbService.getProjectById(projectId);
    if (!existingProject) {
      return res.status(404).json({
        success: false,
        error: 'Project not found'
      } as ApiResponse);
    }
    
    // 删除项目（注意：这里只删除数据库记录，不删除文件系统中的文件）
    await dbService.deleteProject(projectId);
    
    return res.json({
      success: true,
      message: 'Project deleted successfully'
    } as ApiResponse);
  } catch (error) {
    console.error('Error deleting project:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to delete project'
    } as ApiResponse);
  }
});

export default router;