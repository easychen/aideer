import { Project, FileExtraInfo } from '../types/index.js';

// 项目表SQL
export const CREATE_PROJECTS_TABLE = `
  CREATE TABLE IF NOT EXISTS projects (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    path TEXT NOT NULL UNIQUE,
    description TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`;

// 文件额外信息表SQL
export const CREATE_FILE_EXTRA_INFO_TABLE = `
  CREATE TABLE IF NOT EXISTS file_extra_info (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    blake3_hash TEXT NOT NULL UNIQUE,
    file_paths TEXT NOT NULL,
    links TEXT,
    tags TEXT,
    starred INTEGER DEFAULT 0,
    notes TEXT,
    extra_json TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`;

// 创建索引
export const CREATE_INDEXES = [
  'CREATE INDEX IF NOT EXISTS idx_projects_path ON projects (path)',
  'CREATE INDEX IF NOT EXISTS idx_file_extra_info_blake3 ON file_extra_info (blake3_hash)',
  'CREATE INDEX IF NOT EXISTS idx_file_extra_info_starred ON file_extra_info (starred)',
  'CREATE INDEX IF NOT EXISTS idx_file_extra_info_updated ON file_extra_info (updated_at)'
];

// 项目模型类
export class ProjectModel {
  static fromRow(row: any): Project {
    return {
      id: row.id,
      name: row.name,
      path: row.path,
      description: row.description,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    };
  }

  static toRow(project: Partial<Project>): any {
    return {
      name: project.name,
      path: project.path,
      description: project.description,
      updated_at: new Date().toISOString()
    };
  }
}