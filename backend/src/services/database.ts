import sqlite3 from 'sqlite3';
import path from 'path';
import fs from 'fs-extra';
import { CREATE_PROJECTS_TABLE, CREATE_INDEXES, ProjectModel } from '../models/index.js';
import { Project, DatabaseConfig } from '../types/index.js';

export class DatabaseService {
  private static instance: DatabaseService;
  private db: sqlite3.Database | null = null;
  private dbPath: string;
  
  private constructor() {
    // 私有构造函数，实现单例模式
    this.dbPath = path.join(process.cwd(), 'data', 'aideer.db');
  }
  
  public static getInstance(): DatabaseService {
    if (!DatabaseService.instance) {
      DatabaseService.instance = new DatabaseService();
    }
    return DatabaseService.instance;
  }
  
  public static async initialize(): Promise<void> {
    const instance = DatabaseService.getInstance();
    await instance.connect();
    await instance.createTables();
  }
  
  private async connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        // 确保数据目录存在
        const dataDir = path.dirname(this.dbPath);
        fs.ensureDirSync(dataDir);
        
        console.log('Connecting to database:', this.dbPath);
        
        this.db = new sqlite3.Database(this.dbPath, (err) => {
          if (err) {
            console.error('Failed to connect to database:', err);
            reject(err);
          } else {
            console.log('✅ Connected to SQLite database');
            // 启用外键约束
            this.db!.run('PRAGMA foreign_keys = ON');
            resolve();
          }
        });
      } catch (error) {
        console.error('Database connection error:', error);
        reject(error);
      }
    });
  }
  
  private async createTables(): Promise<void> {
    try {
      console.log('Creating database tables...');
      
      // 创建项目表
      await this.execute(CREATE_PROJECTS_TABLE);
      console.log('✅ Projects table created');
      
      // 创建索引
      for (const indexSql of CREATE_INDEXES) {
        await this.execute(indexSql);
      }
      console.log('✅ Database indexes created');
      
      console.log('Database service initialized successfully');
    } catch (error) {
      console.error('Failed to create database tables:', error);
      throw error;
    }
  }
  
  public async query(sql: string, params: any[] = []): Promise<any[]> {
    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error('Database not connected'));
        return;
      }
      
      this.db.all(sql, params, (err, rows) => {
        if (err) {
          console.error('Query error:', err, 'SQL:', sql, 'Params:', params);
          reject(err);
        } else {
          resolve(rows || []);
        }
      });
    });
  }
  
  public async execute(sql: string, params: any[] = []): Promise<{ changes: number; lastInsertRowid: number }> {
    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error('Database not connected'));
        return;
      }
      
      this.db.run(sql, params, function(err) {
        if (err) {
          console.error('Execute error:', err, 'SQL:', sql, 'Params:', params);
          reject(err);
        } else {
          resolve({ changes: this.changes, lastInsertRowid: this.lastID });
        }
      });
    });
  }
  
  // 项目相关操作
  public async createProject(project: Omit<Project, 'id' | 'createdAt' | 'updatedAt'>): Promise<Project> {
    const row = ProjectModel.toRow(project);
    const result = await this.execute(
      'INSERT INTO projects (name, path, description) VALUES (?, ?, ?)',
      [row.name, row.path, row.description]
    );
    
    const rows = await this.query('SELECT * FROM projects WHERE id = ?', [result.lastInsertRowid]);
    return ProjectModel.fromRow(rows[0]);
  }
  
  public async getProjects(): Promise<Project[]> {
    const rows = await this.query('SELECT * FROM projects ORDER BY created_at DESC');
    return rows.map(row => ProjectModel.fromRow(row));
  }
  
  public async getProjectById(id: number): Promise<Project | null> {
    const rows = await this.query('SELECT * FROM projects WHERE id = ?', [id]);
    return rows.length > 0 ? ProjectModel.fromRow(rows[0]) : null;
  }
  
  public async getProjectByPath(path: string): Promise<Project | null> {
    const rows = await this.query('SELECT * FROM projects WHERE path = ?', [path]);
    return rows.length > 0 ? ProjectModel.fromRow(rows[0]) : null;
  }
  
  public async updateProject(id: number, updates: Partial<Project>): Promise<Project> {
    const row = ProjectModel.toRow(updates);
    const setParts = [];
    const params = [];
    
    if (updates.name !== undefined) {
      setParts.push('name = ?');
      params.push(updates.name);
    }
    if (updates.path !== undefined) {
      setParts.push('path = ?');
      params.push(updates.path);
    }
    if (updates.description !== undefined) {
      setParts.push('description = ?');
      params.push(updates.description);
    }
    
    setParts.push('updated_at = ?');
    params.push(new Date().toISOString());
    params.push(id);
    
    await this.execute(
      `UPDATE projects SET ${setParts.join(', ')} WHERE id = ?`,
      params
    );
    
    const rows = await this.query('SELECT * FROM projects WHERE id = ?', [id]);
    return ProjectModel.fromRow(rows[0]);
  }
  
  public async deleteProject(id: number): Promise<void> {
    await this.execute('DELETE FROM projects WHERE id = ?', [id]);
  }
  
  // 文件相关操作已移除，现在直接从文件系统读取
  
  public async close(): Promise<void> {
    return new Promise((resolve) => {
      if (this.db) {
        this.db.close((err) => {
          if (err) {
            console.error('Error closing database:', err);
          } else {
            console.log('Database connection closed');
          }
          this.db = null;
          resolve();
        });
      } else {
        resolve();
      }
    });
  }
}