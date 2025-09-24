import sqlite3 from 'sqlite3';
import { Project, FileExtraInfo } from '../types/index.js';
import { CREATE_PROJECTS_TABLE, CREATE_FILE_EXTRA_INFO_TABLE, CREATE_INDEXES } from '../models/index.js';

export class DatabaseService {
  private static instance: DatabaseService;
  private db: sqlite3.Database | null = null;

  private constructor() {}

  public static getInstance(): DatabaseService {
    if (!DatabaseService.instance) {
      DatabaseService.instance = new DatabaseService();
    }
    return DatabaseService.instance;
  }

  public async connect(dbPath: string): Promise<void> {
    return new Promise((resolve, reject) => {
      this.db = new sqlite3.Database(dbPath, (err) => {
        if (err) {
          reject(err);
        } else {
          resolve();
        }
      });
    });
  }

  public async createTables(): Promise<void> {
    if (!this.db) {
      throw new Error('Database not connected');
    }

    return new Promise((resolve, reject) => {
      this.db!.serialize(() => {
        // 创建项目表
        this.db!.run(CREATE_PROJECTS_TABLE, (err) => {
          if (err) reject(err);
        });

        // 创建文件额外信息表
        this.db!.run(CREATE_FILE_EXTRA_INFO_TABLE, (err) => {
          if (err) reject(err);
        });

        // 创建索引
        CREATE_INDEXES.forEach(indexSql => {
          this.db!.run(indexSql, (err) => {
            if (err) console.error('Error creating index:', err);
          });
        });

        resolve();
      });
    });
  }

  public async query(sql: string, params: any[] = []): Promise<any[]> {
    if (!this.db) {
      throw new Error('Database not connected');
    }

    return new Promise((resolve, reject) => {
      this.db!.all(sql, params, (err, rows) => {
        if (err) {
          reject(err);
        } else {
          resolve(rows);
        }
      });
    });
  }

  public async run(sql: string, params: any[] = []): Promise<{ lastID: number; changes: number }> {
    if (!this.db) {
      throw new Error('Database not connected');
    }

    return new Promise((resolve, reject) => {
      this.db!.run(sql, params, function(err) {
        if (err) {
          reject(err);
        } else {
          resolve({ lastID: this.lastID, changes: this.changes });
        }
      });
    });
  }

  // 项目相关方法
  public async createProject(project: Omit<Project, 'id' | 'createdAt' | 'updatedAt'>): Promise<Project> {
    const sql = `
      INSERT INTO projects (name, path, description)
      VALUES (?, ?, ?)
    `;
    const result = await this.run(sql, [project.name, project.path, project.description]);
    
    const createdProject = await this.query(
      'SELECT * FROM projects WHERE id = ?',
      [result.lastID]
    );
    
    return this.mapProjectRow(createdProject[0]);
  }

  public async getProjectByPath(path: string): Promise<Project | null> {
    const rows = await this.query('SELECT * FROM projects WHERE path = ?', [path]);
    return rows.length > 0 ? this.mapProjectRow(rows[0]) : null;
  }

  public async getAllProjects(): Promise<Project[]> {
    const rows = await this.query('SELECT * FROM projects ORDER BY updated_at DESC');
    return rows.map(row => this.mapProjectRow(row));
  }

  public async getProjectById(id: number): Promise<Project | null> {
    const rows = await this.query('SELECT * FROM projects WHERE id = ?', [id]);
    return rows.length > 0 ? this.mapProjectRow(rows[0]) : null;
  }

  public async updateProject(id: number, updates: Partial<Project>): Promise<Project | null> {
    const setClause = Object.keys(updates)
      .filter(key => key !== 'id' && key !== 'createdAt' && key !== 'updatedAt')
      .map(key => `${this.camelToSnake(key)} = ?`)
      .join(', ');
    
    if (!setClause) return null;

    const values = Object.entries(updates)
      .filter(([key]) => key !== 'id' && key !== 'createdAt' && key !== 'updatedAt')
      .map(([, value]) => value);

    const sql = `UPDATE projects SET ${setClause}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`;
    await this.run(sql, [...values, id]);

    const rows = await this.query('SELECT * FROM projects WHERE id = ?', [id]);
    return rows.length > 0 ? this.mapProjectRow(rows[0]) : null;
  }

  public async deleteProject(id: number): Promise<boolean> {
    const result = await this.run('DELETE FROM projects WHERE id = ?', [id]);
    return result.changes > 0;
  }

  // 文件额外信息相关方法
  public async createFileExtraInfo(info: Omit<FileExtraInfo, 'id' | 'createdAt' | 'updatedAt'>): Promise<FileExtraInfo> {
    const sql = `
      INSERT INTO file_extra_info (blake3_hash, file_paths, links, tags, starred, notes, extra_json)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `;
    const result = await this.run(sql, [
      info.blake3Hash,
      JSON.stringify(info.filePaths),
      info.links ? JSON.stringify(info.links) : null,
      info.tags ? JSON.stringify(info.tags) : null,
      info.starred ? 1 : 0,
      info.notes,
      info.extraJson ? JSON.stringify(info.extraJson) : null
    ]);
    
    const created = await this.query(
      'SELECT * FROM file_extra_info WHERE id = ?',
      [result.lastID]
    );
    
    return this.mapFileExtraInfoRow(created[0]);
  }

  public async getFileExtraInfoByHash(blake3Hash: string): Promise<FileExtraInfo | null> {
    const rows = await this.query('SELECT * FROM file_extra_info WHERE blake3_hash = ?', [blake3Hash]);
    return rows.length > 0 ? this.mapFileExtraInfoRow(rows[0]) : null;
  }

  public async updateFileExtraInfo(blake3Hash: string, updates: Partial<FileExtraInfo>): Promise<FileExtraInfo | null> {
    const setClause = Object.keys(updates)
      .filter(key => key !== 'id' && key !== 'createdAt' && key !== 'updatedAt' && key !== 'blake3Hash')
      .map(key => `${this.camelToSnake(key)} = ?`)
      .join(', ');
    
    if (!setClause) return null;

    const values = Object.entries(updates)
      .filter(([key]) => key !== 'id' && key !== 'createdAt' && key !== 'updatedAt' && key !== 'blake3Hash')
      .map(([key, value]) => {
        if (key === 'filePaths' || key === 'links' || key === 'tags' || key === 'extraJson') {
          return value ? JSON.stringify(value) : null;
        }
        if (key === 'starred') {
          return value ? 1 : 0;
        }
        return value;
      });

    const sql = `UPDATE file_extra_info SET ${setClause}, updated_at = CURRENT_TIMESTAMP WHERE blake3_hash = ?`;
    await this.run(sql, [...values, blake3Hash]);

    const rows = await this.query('SELECT * FROM file_extra_info WHERE blake3_hash = ?', [blake3Hash]);
    return rows.length > 0 ? this.mapFileExtraInfoRow(rows[0]) : null;
  }

  public async deleteFileExtraInfo(blake3Hash: string): Promise<boolean> {
    const result = await this.run('DELETE FROM file_extra_info WHERE blake3_hash = ?', [blake3Hash]);
    return result.changes > 0;
  }

  public async getAllFileExtraInfo(): Promise<FileExtraInfo[]> {
    const rows = await this.query('SELECT * FROM file_extra_info ORDER BY updated_at DESC');
    return rows.map(row => this.mapFileExtraInfoRow(row));
  }

  // 辅助方法
  private mapProjectRow(row: any): Project {
    return {
      id: row.id,
      name: row.name,
      path: row.path,
      description: row.description,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    };
  }

  private mapFileExtraInfoRow(row: any): FileExtraInfo {
    return {
      id: row.id,
      blake3Hash: row.blake3_hash,
      filePaths: JSON.parse(row.file_paths || '[]'),
      links: row.links ? JSON.parse(row.links) : [],
      tags: row.tags ? JSON.parse(row.tags) : [],
      starred: row.starred === 1,
      notes: row.notes || '',
      extraJson: row.extra_json ? JSON.parse(row.extra_json) : {},
      createdAt: row.created_at,
      updatedAt: row.updated_at
    };
  }

  private camelToSnake(str: string): string {
    return str.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
  }

  public async close(): Promise<void> {
    if (this.db) {
      return new Promise((resolve, reject) => {
        this.db!.close((err) => {
          if (err) {
            reject(err);
          } else {
            this.db = null;
            resolve();
          }
        });
      });
    }
  }
}