import path from 'path';
import fs from 'fs-extra';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
// 定义项目数据根目录
const PROJECT_DATA_ROOT = path.resolve(__dirname, '../../data');

/**
 * 路径工具类
 */
export class PathUtils {
  /**
   * 将相对路径转换为绝对路径
   * @param relativePath 相对于 backend/data 目录的相对路径
   * @returns 完整的绝对路径
   */
  static getAbsolutePath(relativePath: string): string {
    return path.resolve(PROJECT_DATA_ROOT, relativePath);
  }

  /**
   * 将绝对路径转换为相对路径
   * @param absolutePath 绝对路径
   * @returns 相对于 backend/data 目录的相对路径
   */
  static getRelativePath(absolutePath: string): string {
    return path.relative(PROJECT_DATA_ROOT, absolutePath);
  }

  /**
   * 获取项目数据根目录
   * @returns 项目数据根目录的绝对路径
   */
  static getProjectDataRoot(): string {
    return PROJECT_DATA_ROOT;
  }

  /**
   * 验证路径是否在允许的根目录下
   * @param absolutePath 要验证的绝对路径
   * @returns 是否在允许的根目录下
   */
  static isPathAllowed(absolutePath: string): boolean {
    return absolutePath.startsWith(PROJECT_DATA_ROOT);
  }
}