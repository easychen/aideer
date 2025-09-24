import { Router, Request, Response } from 'express';
import { DatabaseService } from '../services/database.js';
import { Blake3HashCalculator } from '../utils/blake3Hash.js';
import { FileExtraInfo } from '../types/index.js';
import fs from 'fs';
import path from 'path';

const router: Router = Router();

/**
 * 获取文件的额外信息
 * GET /api/file-extra-info/:filePath?projectId=xxx
 */
router.get('/:filePath(*)', async (req: Request, res: Response) => {
  try {
    const relativePath = decodeURIComponent(req.params.filePath);
    const projectId = req.query.projectId as string;
    
    if (!projectId) {
      return res.status(400).json({ error: '缺少项目ID参数' });
    }

    // 获取项目信息
    const db = DatabaseService.getInstance();
    const project = await db.getProjectById(parseInt(projectId));
    if (!project) {
      return res.status(404).json({ error: '项目不存在' });
    }

    // 构建完整的文件路径
    const { PathUtils } = await import('../utils/pathUtils.js');
    const projectAbsolutePath = PathUtils.getAbsolutePath(project.path);
    const filePath = path.join(projectAbsolutePath, relativePath);
    
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: '文件不存在' });
    }

    // 计算文件的BLAKE3哈希
    const blake3Hash = await Blake3HashCalculator.calculateFileHash(filePath);
    
    // 从数据库查询额外信息
    let fileExtraInfo = await db.getFileExtraInfoByHash(blake3Hash);

    // 如果不存在记录，创建一个默认记录
    if (!fileExtraInfo) {
      fileExtraInfo = await db.createFileExtraInfo({
        blake3Hash,
        projectId: project.id,
        relativePaths: [relativePath],
        starred: false
      });
    } else {
      // 检查文件路径是否已存在，如果不存在则添加
      if (!fileExtraInfo.relativePaths.includes(relativePath)) {
      const updatedPaths = [...fileExtraInfo.relativePaths, relativePath];
      fileExtraInfo = await db.updateFileExtraInfo(blake3Hash, {
        relativePaths: updatedPaths
      });
      }
    }

    res.json(fileExtraInfo);
    return;
  } catch (error) {
    console.error('获取文件额外信息失败:', error);
    res.status(500).json({ error: '获取文件额外信息失败' });
    return;
  }
});

/**
 * 更新文件的额外信息
 * PUT /api/file-extra-info/:filePath?projectId=xxx
 */
router.put('/:filePath(*)', async (req: Request, res: Response) => {
  try {
    const relativePath = decodeURIComponent(req.params.filePath);
    const projectId = req.query.projectId as string;
    const updateData = req.body;
    
    if (!projectId) {
      return res.status(400).json({ error: '缺少项目ID参数' });
    }

    // 获取项目信息
    const db = DatabaseService.getInstance();
    const project = await db.getProjectById(parseInt(projectId));
    if (!project) {
      return res.status(404).json({ error: '项目不存在' });
    }

    // 构建完整的文件路径
    const { PathUtils } = await import('../utils/pathUtils.js');
    const projectAbsolutePath = PathUtils.getAbsolutePath(project.path);
    const filePath = path.join(projectAbsolutePath, relativePath);
    
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: '文件不存在' });
    }

    // 计算文件的BLAKE3哈希
    const blake3Hash = await Blake3HashCalculator.calculateFileHash(filePath);
    
    let fileExtraInfo = await db.getFileExtraInfoByHash(blake3Hash);

    if (!fileExtraInfo) {
      // 如果记录不存在，创建新记录
    fileExtraInfo = await db.createFileExtraInfo({
      blake3Hash,
      projectId: project.id,
      relativePaths: [relativePath],
      starred: false,
      ...updateData
    });
  } else {
    // 更新现有记录
    fileExtraInfo = await db.updateFileExtraInfo(blake3Hash, {
      ...updateData,
      relativePaths: updateData.relativePaths || [relativePath]
    });
    }

    res.json(fileExtraInfo);
    return;
  } catch (error) {
    console.error('更新文件额外信息失败:', error);
    res.status(500).json({ error: '更新文件额外信息失败' });
    return;
  }
});

/**
 * 删除文件的额外信息
 * DELETE /api/file-extra-info/:filePath?projectId=xxx
 */
router.delete('/:filePath(*)', async (req: Request, res: Response) => {
  try {
    const relativePath = decodeURIComponent(req.params.filePath);
    const projectId = req.query.projectId as string;
    
    if (!projectId) {
      return res.status(400).json({ error: '缺少项目ID参数' });
    }

    // 获取项目信息
    const db = DatabaseService.getInstance();
    const project = await db.getProjectById(parseInt(projectId));
    if (!project) {
      return res.status(404).json({ error: '项目不存在' });
    }

    // 构建完整的文件路径
    const { PathUtils } = await import('../utils/pathUtils.js');
    const projectAbsolutePath = PathUtils.getAbsolutePath(project.path);
    const filePath = path.join(projectAbsolutePath, relativePath);
    
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: '文件不存在' });
    }

    // 计算文件的BLAKE3哈希
    const blake3Hash = await Blake3HashCalculator.calculateFileHash(filePath);
    
    // 删除数据库中的额外信息
    const success = await db.deleteFileExtraInfo(blake3Hash);

    if (!success) {
      return res.status(404).json({ error: '文件额外信息不存在' });
    }

    res.json({ success: true, message: '文件额外信息已删除' });
    return;
  } catch (error) {
    console.error('删除文件额外信息失败:', error);
    res.status(500).json({ error: '删除文件额外信息失败' });
    return;
  }
});

/**
 * 同步文件路径信息
 * POST /api/file-extra-info/sync-paths
 * 根据项目ID数组，扫描项目目录并更新文件额外信息的路径
 */
router.post('/sync-paths', async (req: Request, res: Response) => {
  try {
    const { projectIds } = req.body;
    
    if (!projectIds || !Array.isArray(projectIds) || projectIds.length === 0) {
      return res.status(400).json({ error: '请提供有效的项目ID数组' });
    }

    const db = DatabaseService.getInstance();
    
    // 获取指定的项目信息
    const allProjects = await db.getAllProjects();
    const projects = allProjects.filter(p => projectIds.includes(p.id));
    
    if (projects.length === 0) {
      return res.status(400).json({ error: '未找到有效的项目' });
    }

    const allFileExtraInfo = await db.getAllFileExtraInfo();
    
    let syncedCount = 0;
    let errorCount = 0;
    const errors: string[] = [];

    for (const info of allFileExtraInfo) {
      try {
        // 找到对应的项目
        const project = projects.find(p => p.id === info.projectId);
        if (!project) {
          continue; // 跳过不在指定项目列表中的文件
        }

        const { PathUtils } = await import('../utils/pathUtils.js');
        const projectAbsolutePath = PathUtils.getAbsolutePath(project.path);
        
        const validRelativePaths: string[] = [];
        
        // 检查现有相对路径是否仍然有效
        for (const relativePath of info.relativePaths) {
          const absolutePath = path.join(projectAbsolutePath, relativePath);
          if (fs.existsSync(absolutePath)) {
            validRelativePaths.push(relativePath);
          }
        }

        // 在项目目录中查找具有相同哈希的文件
        const foundPaths = await findFilesByHash(projectAbsolutePath, info.blake3Hash);
        for (const foundAbsolutePath of foundPaths) {
          const relativePath = path.relative(projectAbsolutePath, foundAbsolutePath);
          if (!validRelativePaths.includes(relativePath)) {
            validRelativePaths.push(relativePath);
          }
        }

        // 更新文件路径
        if (validRelativePaths.length !== info.relativePaths.length || 
            !validRelativePaths.every(path => info.relativePaths.includes(path))) {
          await db.updateFileExtraInfo(info.blake3Hash, {
            relativePaths: validRelativePaths
          });
          syncedCount++;
        }
      } catch (error) {
        console.error(`同步文件 ${info.blake3Hash} 时出错:`, error);
        errorCount++;
        errors.push(`文件 ${info.blake3Hash}: ${error instanceof Error ? error.message : '未知错误'}`);
      }
    }

    res.json({
      message: '文件路径同步完成',
      updatedCount: syncedCount,
      errorCount,
      errors: errors.slice(0, 10) // 只返回前10个错误
    });
    return;
  } catch (error) {
    console.error('同步文件路径失败:', error);
    res.status(500).json({ error: '同步文件路径失败' });
    return;
  }
});

/**
 * 获取所有文件额外信息
 * GET /api/file-extra-info
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    const db = DatabaseService.getInstance();
    const allFileExtraInfo = await db.getAllFileExtraInfo();
    res.json(allFileExtraInfo);
  } catch (error) {
    console.error('获取所有文件额外信息失败:', error);
    res.status(500).json({ error: '获取所有文件额外信息失败' });
  }
});

/**
 * 递归查找目录中具有指定哈希的文件
 */
async function findFilesByHash(directory: string, targetHash: string): Promise<string[]> {
  const foundPaths: string[] = [];
  
  async function searchDirectory(dir: string) {
    try {
      const entries = fs.readdirSync(dir, { withFileTypes: true });
      
      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        
        if (entry.isDirectory()) {
          // 递归搜索子目录
          await searchDirectory(fullPath);
        } else if (entry.isFile()) {
          try {
            // 计算文件哈希并比较
            const fileHash = await Blake3HashCalculator.calculateFileHash(fullPath);
            if (fileHash === targetHash) {
              foundPaths.push(fullPath);
            }
          } catch (error) {
            // 忽略无法读取的文件
            console.warn(`无法计算文件哈希: ${fullPath}`, error);
          }
        }
      }
    } catch (error) {
      console.warn(`无法读取目录: ${dir}`, error);
    }
  }
  
  await searchDirectory(directory);
  return foundPaths;
}

export default router;