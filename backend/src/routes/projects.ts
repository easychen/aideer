import express from 'express';
import path from 'path';
import { DatabaseService } from '../services/database.js';
import { FileSystemService } from '../services/filesystem.js';
import { CreateProjectRequest, ApiResponse, Project } from '../types/index.js';

const router: express.Router = express.Router();
const dbService = DatabaseService.getInstance();
const fsService = FileSystemService.getInstance();

// 定义项目数据根目录
const PROJECT_DATA_ROOT = path.resolve(process.cwd(), 'data');

// 获取所有项目
router.get('/', async (req, res) => {
  try {
    const projects = await dbService.getProjects();
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
    const fullProjectPath = path.resolve(PROJECT_DATA_ROOT, projectPath);
    
    // 验证路径是否在允许的根目录下
    if (!fullProjectPath.startsWith(PROJECT_DATA_ROOT)) {
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
    
    // 创建项目（使用完整路径）
    const project = await dbService.createProject({ name, path: fullProjectPath, description });
    
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
    
    // 扫描目录
    const files = await fsService.scanDirectory(project.path, projectId);
    
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

export default router;