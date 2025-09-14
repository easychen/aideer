import { Project } from '../types/index.js';

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



// 创建索引
export const CREATE_INDEXES = [
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