import express from 'express';
import cors from 'cors';
import fs from 'fs';
import morgan from 'morgan';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

// 路由导入
import projectRoutes from './routes/projects.js';
import directoryRoutes from './routes/directories.js';
import fileRoutes from './routes/files.js';
import fileExtraInfoRoutes from './routes/fileExtraInfo.js';
import searchRoutes from './routes/search.js';

// 服务导入
import { DatabaseService } from './services/database.js';
import { FileSystemService } from './services/filesystem.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app: express.Application = express();
const PORT = process.env.PORT || 3001;

// 中间件配置
// app.use(helmet({
//   crossOriginResourcePolicy: false,
//   crossOriginEmbedderPolicy: false,
//   contentSecurityPolicy: {
//     directives: {
//       defaultSrc: ["'self'"],
//       imgSrc: ["'self'", "data:", "*"],
//       mediaSrc: ["'self'", "*"]
//     }
//   }
// }));
app.use(cors({
  origin: '*',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept', 'Origin', 'X-Requested-With']
}));
app.use(morgan('combined'));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// 添加一个前端网站的自动化挂载 
if(fs.existsSync(path.join(__dirname, './site'))) {
  app.use(express.static(path.join(__dirname, './site')));
}

// 静态文件服务
// app.use('/thumbnails', express.static(path.join(__dirname, '../thumbnails')));
app.use('/data', express.static(process.env.AI_DEER_DATA_PATH ?  path.join( process.env.AI_DEER_DATA_PATH, 'data' ) : path.join(__dirname, '../data')));

// API 路由
app.use('/api/projects', projectRoutes);
app.use('/api/directories', directoryRoutes);
app.use('/api/files', fileRoutes);
app.use('/api/file-extra-info', fileExtraInfoRoutes);
app.use('/api/search', searchRoutes);

// 健康检查
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

// 错误处理中间件
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Error:', err);
  res.status(500).json({ 
    error: 'Internal Server Error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
  });
});

// 404 处理
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// 启动服务器
const startServer = async () => {
  try {
    // 初始化数据库服务
    const dbService = DatabaseService.getInstance();
    const dataDir = process.env.AI_DEER_DATA_PATH || path.join(__dirname, '..', 'data');
    const dbPath = path.join(dataDir, 'aideer.db');
    
    // 确保数据目录存在
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
    
    await dbService.connect(dbPath);
    await dbService.createTables();
    console.log('✅ Database service initialized');
    
    // 初始化文件系统服务
    FileSystemService.initialize();
    console.log('✅ File system service initialized');
    
    app.listen(PORT, () => {
      console.log(`🚀 Server running on http://localhost:${PORT}`);
      console.log(`📊 Health check: http://localhost:${PORT}/api/health`);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
};

// 优雅关闭
process.on('SIGTERM', () => {
  console.log('🔄 SIGTERM received, shutting down gracefully');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('🔄 SIGINT received, shutting down gracefully');
  process.exit(0);
});

startServer();

export default app;