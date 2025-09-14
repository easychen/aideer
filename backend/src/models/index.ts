import { Project, FileItem } from '../types/index.js';

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

// 文件表SQL
export const CREATE_FILES_TABLE = `
  CREATE TABLE IF NOT EXISTS files (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    project_id INTEGER NOT NULL,
    name TEXT NOT NULL,
    path TEXT NOT NULL,
    relative_path TEXT NOT NULL,
    size INTEGER DEFAULT 0,
    type TEXT NOT NULL CHECK (type IN ('file', 'directory')),
    mime_type TEXT,
    extension TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    last_modified DATETIME,
    thumbnail_path TEXT,
    FOREIGN KEY (project_id) REFERENCES projects (id) ON DELETE CASCADE,
    UNIQUE(project_id, path)
  )
`;

// 创建索引
export const CREATE_INDEXES = [
  'CREATE INDEX IF NOT EXISTS idx_files_project_id ON files (project_id)',
  'CREATE INDEX IF NOT EXISTS idx_files_type ON files (type)',
  'CREATE INDEX IF NOT EXISTS idx_files_mime_type ON files (mime_type)',
  'CREATE INDEX IF NOT EXISTS idx_files_path ON files (path)',
  'CREATE INDEX IF NOT EXISTS idx_files_relative_path ON files (relative_path)',
  'CREATE INDEX IF NOT EXISTS idx_projects_path ON projects (path)'
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

// 文件模型类
export class FileModel {
  static fromRow(row: any): FileItem {
    return {
      id: row.id,
      projectId: row.project_id,
      name: row.name,
      path: row.path,
      relativePath: row.relative_path,
      size: row.size,
      type: row.type,
      mimeType: row.mime_type,
      extension: row.extension,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      lastModified: row.last_modified,
      thumbnailPath: row.thumbnail_path
    };
  }

  static toRow(file: Partial<FileItem>): any {
    return {
      project_id: file.projectId,
      name: file.name,
      path: file.path,
      relative_path: file.relativePath,
      size: file.size,
      type: file.type,
      mime_type: file.mimeType,
      extension: file.extension,
      last_modified: file.lastModified,
      thumbnail_path: file.thumbnailPath,
      updated_at: new Date().toISOString()
    };
  }
}