# AiDeer 数字资产管理工具 - 实现规划

## 项目概述

AiDeer 是一个用于管理用户通过大模型生成的数字资产的工具，采用前后端分离架构，支持 Electron 桌面应用和 Docker 部署两种方式。

## 技术栈

### 前端
- React 18 + TypeScript
- Radix UI (无头组件库)
- Tailwind CSS (样式系统)
- Vite (构建工具)
- React Router (路由)
- Axios (HTTP 客户端)
- React Query/SWR (数据获取)
- React DnD (拖拽功能)
- Framer Motion (动画库)

### 后端
- Express.js
- SQLite3 (数据库)
- Multer (文件上传)
- CORS (跨域支持)

### 桌面应用
- Electron
- Electron Forge (打包工具)

## 项目结构

```
aideer/
├── packages/
│   ├── frontend/                 # React 前端
│   │   ├── src/
│   │   │   ├── components/       # UI 组件
│   │   │   │   ├── ui/           # 基础 UI 组件 (基于 Radix UI)
│   │   │   │   ├── Layout/       # 布局组件
│   │   │   │   ├── FileTree/     # 文件树组件
│   │   │   │   ├── FileGrid/     # 文件网格组件
│   │   │   │   ├── FilePreview/  # 文件预览组件
│   │   │   │   └── FileDialog/   # 文件选择对话框
│   │   │   ├── adapters/         # 环境适配层
│   │   │   │   ├── browser/      # 浏览器环境适配
│   │   │   │   ├── electron/     # Electron 环境适配
│   │   │   │   └── index.ts      # 适配器工厂
│   │   │   ├── pages/            # 页面
│   │   │   ├── hooks/            # 自定义 hooks
│   │   │   ├── services/         # API 服务
│   │   │   ├── types/            # TypeScript 类型
│   │   │   └── utils/            # 工具函数
│   │   ├── public/
│   │   ├── package.json
│   │   ├── vite.config.ts
│   │   └── tailwind.config.js
│   ├── backend/                  # Express 后端
│   │   ├── src/
│   │   │   ├── routes/           # 路由
│   │   │   ├── models/           # 数据模型
│   │   │   ├── services/         # 业务逻辑
│   │   │   ├── middleware/       # 中间件
│   │   │   └── utils/            # 工具函数
│   │   ├── database/             # 数据库相关
│   │   └── package.json
│   └── electron/                 # Electron 主进程
│       ├── src/
│       │   ├── main.ts           # 主进程入口
│       │   └── preload.ts        # 预加载脚本
│       ├── forge.config.js       # Electron Forge 配置
│       └── package.json
├── docker/                       # Docker 配置
│   ├── Dockerfile
│   └── docker-compose.yml
├── scripts/                      # 构建脚本
└── package.json                  # 根目录配置
```

## 数据库设计

### 设计原则
- **本地文件系统为唯一数据源**: SQLite 数据库仅作为文件系统的查询索引和缓存
- **每个项目一个数据库**: 在项目根目录的 `.aideer/` 文件夹中创建 `index.db`
- **文件系统同步**: 定期扫描文件系统变化，更新数据库索引

### 表结构

#### 1. directories 表 (目录索引表)
```sql
CREATE TABLE directories (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    parent_id INTEGER,
    relative_path TEXT NOT NULL UNIQUE, -- 相对于项目根目录的路径
    full_path TEXT NOT NULL, -- 完整的绝对路径
    is_deleted INTEGER DEFAULT 0, -- 软删除标记
    last_scanned DATETIME DEFAULT CURRENT_TIMESTAMP,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (parent_id) REFERENCES directories(id) ON DELETE CASCADE
);
```

#### 2. files 表 (文件索引表)
```sql
CREATE TABLE files (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    directory_id INTEGER,
    name TEXT NOT NULL,
    relative_path TEXT NOT NULL UNIQUE, -- 相对于项目根目录的路径
    full_path TEXT NOT NULL, -- 完整的绝对路径
    file_type TEXT NOT NULL, -- 'document', 'image', 'video'
    mime_type TEXT,
    file_size INTEGER,
    file_hash TEXT, -- 文件 MD5 哈希，用于检测文件变化
    thumbnail_path TEXT, -- 缩略图相对路径
    metadata TEXT, -- JSON 格式存储额外信息
    tags TEXT, -- JSON 数组格式存储标签
    is_deleted INTEGER DEFAULT 0, -- 软删除标记
    last_modified DATETIME, -- 文件系统的最后修改时间
    last_scanned DATETIME DEFAULT CURRENT_TIMESTAMP,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (directory_id) REFERENCES directories(id) ON DELETE SET NULL
);
```

#### 3. scan_history 表 (扫描历史表)
```sql
CREATE TABLE scan_history (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    scan_type TEXT NOT NULL, -- 'full', 'incremental', 'watch'
    files_added INTEGER DEFAULT 0,
    files_updated INTEGER DEFAULT 0,
    files_deleted INTEGER DEFAULT 0,
    directories_added INTEGER DEFAULT 0,
    directories_deleted INTEGER DEFAULT 0,
    scan_duration INTEGER, -- 扫描耗时(毫秒)
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

## API 设计

### 项目管理
- `POST /api/project/open` - 打开项目目录
- `GET /api/project/info` - 获取当前项目信息
- `POST /api/project/scan` - 扫描文件系统更新索引
- `GET /api/project/scan/status` - 获取扫描状态

### 目录管理
- `GET /api/directories` - 获取目录树
- `GET /api/directories/:id` - 获取目录详情
- `POST /api/directories` - 创建目录(文件系统操作)
- `PUT /api/directories/:id` - 重命名目录(文件系统操作)
- `DELETE /api/directories/:id` - 删除目录(文件系统操作)

### 文件管理
- `GET /api/files` - 获取文件列表(支持目录筛选)
- `GET /api/files/:id` - 获取文件详情
- `POST /api/files/upload` - 上传文件到指定目录
- `PUT /api/files/:id` - 更新文件信息(重命名、移动等)
- `DELETE /api/files/:id` - 删除文件(文件系统操作)
- `GET /api/files/:id/content` - 获取文件内容
- `GET /api/files/:id/thumbnail` - 获取缩略图

### 搜索和筛选
- `GET /api/search/files` - 搜索文件
- `GET /api/files/by-type/:type` - 按类型获取文件
- `GET /api/files/by-tag/:tag` - 按标签获取文件

## UI 组件设计

### 基础组件库 (基于 Radix UI + Tailwind CSS)

#### 1. 基础 UI 组件
```typescript
// src/components/ui/button.tsx
import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/utils/cn';

const buttonVariants = cva(
  'inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none ring-offset-background',
  {
    variants: {
      variant: {
        default: 'bg-primary text-primary-foreground hover:bg-primary/90',
        destructive: 'bg-destructive text-destructive-foreground hover:bg-destructive/90',
        outline: 'border border-input hover:bg-accent hover:text-accent-foreground',
        secondary: 'bg-secondary text-secondary-foreground hover:bg-secondary/80',
        ghost: 'hover:bg-accent hover:text-accent-foreground',
        link: 'underline-offset-4 hover:underline text-primary'
      },
      size: {
        default: 'h-10 py-2 px-4',
        sm: 'h-9 px-3 rounded-md',
        lg: 'h-11 px-8 rounded-md'
      }
    },
    defaultVariants: {
      variant: 'default',
      size: 'default'
    }
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button';
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = 'Button';

export { Button, buttonVariants };
```

#### 2. 对话框组件
```typescript
// src/components/ui/dialog.tsx
import * as React from 'react';
import * as DialogPrimitive from '@radix-ui/react-dialog';
import { X } from 'lucide-react';
import { cn } from '@/utils/cn';

const Dialog = DialogPrimitive.Root;
const DialogTrigger = DialogPrimitive.Trigger;

const DialogPortal = ({
  className,
  ...props
}: DialogPrimitive.DialogPortalProps) => (
  <DialogPrimitive.Portal className={cn(className)} {...props} />
);
DialogPortal.displayName = DialogPrimitive.Portal.displayName;

const DialogOverlay = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Overlay>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Overlay>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Overlay
    ref={ref}
    className={cn(
      'fixed inset-0 z-50 bg-background/80 backdrop-blur-sm data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0',
      className
    )}
    {...props}
  />
));
DialogOverlay.displayName = DialogPrimitive.Overlay.displayName;

export {
  Dialog,
  DialogTrigger,
  DialogPortal,
  DialogOverlay,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription
};
```

### 环境适配层设计

#### 1. 适配器接口定义
```typescript
// src/adapters/types.ts
export interface FileSystemAdapter {
  selectDirectory(): Promise<string | null>;
  selectFiles(options?: {
    multiple?: boolean;
    accept?: string[];
  }): Promise<File[] | null>;
  openFile(filePath: string): Promise<void>;
  showInFolder(filePath: string): Promise<void>;
  readFile(filePath: string): Promise<ArrayBuffer>;
  writeFile(filePath: string, data: ArrayBuffer): Promise<void>;
}

export interface NotificationAdapter {
  showNotification(title: string, body: string): void;
  showError(message: string): void;
  showSuccess(message: string): void;
}

export interface PlatformAdapter {
  fileSystem: FileSystemAdapter;
  notification: NotificationAdapter;
  platform: 'browser' | 'electron';
}
```

#### 2. 浏览器环境适配器
```typescript
// src/adapters/browser/fileSystem.ts
import { FileSystemAdapter } from '../types';

export class BrowserFileSystemAdapter implements FileSystemAdapter {
  async selectDirectory(): Promise<string | null> {
    if ('showDirectoryPicker' in window) {
      try {
        const dirHandle = await (window as any).showDirectoryPicker();
        return dirHandle.name;
      } catch (error) {
        return null;
      }
    }
    throw new Error('Directory selection not supported in this browser');
  }

  async selectFiles(options?: {
    multiple?: boolean;
    accept?: string[];
  }): Promise<File[] | null> {
    return new Promise((resolve) => {
      const input = document.createElement('input');
      input.type = 'file';
      input.multiple = options?.multiple ?? false;
      if (options?.accept) {
        input.accept = options.accept.join(',');
      }
      
      input.onchange = (e) => {
        const files = Array.from((e.target as HTMLInputElement).files || []);
        resolve(files.length > 0 ? files : null);
      };
      
      input.oncancel = () => resolve(null);
      input.click();
    });
  }

  async openFile(filePath: string): Promise<void> {
    window.open(filePath, '_blank');
  }

  async showInFolder(filePath: string): Promise<void> {
    // 浏览器环境下无法实现，显示提示
    console.warn('showInFolder not supported in browser environment');
  }

  async readFile(filePath: string): Promise<ArrayBuffer> {
    const response = await fetch(filePath);
    return response.arrayBuffer();
  }

  async writeFile(filePath: string, data: ArrayBuffer): Promise<void> {
    // 浏览器环境下通过下载实现
    const blob = new Blob([data]);
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filePath.split('/').pop() || 'file';
    a.click();
    URL.revokeObjectURL(url);
  }
}
```

#### 3. Electron 环境适配器
```typescript
// src/adapters/electron/fileSystem.ts
import { FileSystemAdapter } from '../types';

declare global {
  interface Window {
    electronAPI?: {
      selectDirectory(): Promise<string | null>;
      selectFiles(options?: any): Promise<string[] | null>;
      openFile(filePath: string): Promise<void>;
      showInFolder(filePath: string): Promise<void>;
      readFile(filePath: string): Promise<ArrayBuffer>;
      writeFile(filePath: string, data: ArrayBuffer): Promise<void>;
    };
  }
}

export class ElectronFileSystemAdapter implements FileSystemAdapter {
  async selectDirectory(): Promise<string | null> {
    if (!window.electronAPI) {
      throw new Error('Electron API not available');
    }
    return window.electronAPI.selectDirectory();
  }

  async selectFiles(options?: {
    multiple?: boolean;
    accept?: string[];
  }): Promise<File[] | null> {
    if (!window.electronAPI) {
      throw new Error('Electron API not available');
    }
    
    const filePaths = await window.electronAPI.selectFiles(options);
    if (!filePaths) return null;
    
    // 将文件路径转换为 File 对象
    const files: File[] = [];
    for (const filePath of filePaths) {
      const data = await this.readFile(filePath);
      const fileName = filePath.split('/').pop() || 'file';
      const file = new File([data], fileName);
      files.push(file);
    }
    
    return files;
  }

  async openFile(filePath: string): Promise<void> {
    if (!window.electronAPI) {
      throw new Error('Electron API not available');
    }
    return window.electronAPI.openFile(filePath);
  }

  async showInFolder(filePath: string): Promise<void> {
    if (!window.electronAPI) {
      throw new Error('Electron API not available');
    }
    return window.electronAPI.showInFolder(filePath);
  }

  async readFile(filePath: string): Promise<ArrayBuffer> {
    if (!window.electronAPI) {
      throw new Error('Electron API not available');
    }
    return window.electronAPI.readFile(filePath);
  }

  async writeFile(filePath: string, data: ArrayBuffer): Promise<void> {
    if (!window.electronAPI) {
      throw new Error('Electron API not available');
    }
    return window.electronAPI.writeFile(filePath, data);
  }
}
```

#### 4. 适配器工厂
```typescript
// src/adapters/index.ts
import { PlatformAdapter } from './types';
import { BrowserFileSystemAdapter } from './browser/fileSystem';
import { BrowserNotificationAdapter } from './browser/notification';
import { ElectronFileSystemAdapter } from './electron/fileSystem';
import { ElectronNotificationAdapter } from './electron/notification';

function detectPlatform(): 'browser' | 'electron' {
  return typeof window !== 'undefined' && window.electronAPI ? 'electron' : 'browser';
}

export function createPlatformAdapter(): PlatformAdapter {
  const platform = detectPlatform();
  
  if (platform === 'electron') {
    return {
      platform,
      fileSystem: new ElectronFileSystemAdapter(),
      notification: new ElectronNotificationAdapter()
    };
  } else {
    return {
      platform,
      fileSystem: new BrowserFileSystemAdapter(),
      notification: new BrowserNotificationAdapter()
    };
  }
}

// 全局适配器实例
export const platformAdapter = createPlatformAdapter();
```

#### 5. React Hook 封装
```typescript
// src/hooks/usePlatform.ts
import { useContext, createContext, ReactNode } from 'react';
import { PlatformAdapter, createPlatformAdapter } from '@/adapters';

const PlatformContext = createContext<PlatformAdapter | null>(null);

export function PlatformProvider({ children }: { children: ReactNode }) {
  const adapter = createPlatformAdapter();
  
  return (
    <PlatformContext.Provider value={adapter}>
      {children}
    </PlatformContext.Provider>
  );
}

export function usePlatform() {
  const context = useContext(PlatformContext);
  if (!context) {
    throw new Error('usePlatform must be used within a PlatformProvider');
  }
  return context;
}

// 便捷 hooks
export function useFileSystem() {
  const { fileSystem } = usePlatform();
  return fileSystem;
}

export function useNotification() {
  const { notification } = usePlatform();
  return notification;
}
```

## 核心功能实现

### 1. 项目初始化
- 首次启动时显示项目目录选择界面
- 用户选择现有目录作为项目根目录
- 在选定目录下创建 `.aideer/` 配置文件夹
- 初始化 SQLite 数据库 (`.aideer/index.db`)
- 创建缩略图存储目录 (`.aideer/thumbnails/`)
- 执行首次文件系统扫描，建立索引

### 2. 文件树组件 (FileTree)
- 使用递归组件渲染多级目录结构
- 支持展开/收起功能
- 支持右键菜单 (新建文件夹、重命名、删除)
- 支持拖拽排序和移动

```typescript
// src/components/FileTree/FileTree.tsx
import React, { useState } from 'react';
import * as ContextMenu from '@radix-ui/react-context-menu';
import { ChevronRight, ChevronDown, Folder, FolderOpen } from 'lucide-react';
import { cn } from '@/utils/cn';
import { useFileSystem } from '@/hooks/usePlatform';

interface TreeNode {
  id: string;
  name: string;
  type: 'directory' | 'file';
  children?: TreeNode[];
  expanded?: boolean;
}

interface FileTreeProps {
  data: TreeNode[];
  onSelect?: (node: TreeNode) => void;
  selectedId?: string;
}

export function FileTree({ data, onSelect, selectedId }: FileTreeProps) {
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());
  const fileSystem = useFileSystem();

  const toggleExpanded = (nodeId: string) => {
    const newExpanded = new Set(expandedNodes);
    if (newExpanded.has(nodeId)) {
      newExpanded.delete(nodeId);
    } else {
      newExpanded.add(nodeId);
    }
    setExpandedNodes(newExpanded);
  };

  const TreeNodeComponent = ({ node, level = 0 }: { node: TreeNode; level?: number }) => {
    const isExpanded = expandedNodes.has(node.id);
    const hasChildren = node.children && node.children.length > 0;
    const isSelected = selectedId === node.id;

    return (
      <div>
        <ContextMenu.Root>
          <ContextMenu.Trigger asChild>
            <div
              className={cn(
                'flex items-center py-1 px-2 hover:bg-accent hover:text-accent-foreground cursor-pointer select-none',
                isSelected && 'bg-accent text-accent-foreground',
                'transition-colors'
              )}
              style={{ paddingLeft: `${level * 16 + 8}px` }}
              onClick={() => {
                if (node.type === 'directory' && hasChildren) {
                  toggleExpanded(node.id);
                }
                onSelect?.(node);
              }}
            >
              {node.type === 'directory' && hasChildren && (
                <button
                  className="mr-1 p-0.5 hover:bg-accent-foreground/10 rounded"
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleExpanded(node.id);
                  }}
                >
                  {isExpanded ? (
                    <ChevronDown className="h-3 w-3" />
                  ) : (
                    <ChevronRight className="h-3 w-3" />
                  )}
                </button>
              )}
              
              {node.type === 'directory' ? (
                isExpanded ? (
                  <FolderOpen className="h-4 w-4 mr-2 text-blue-500" />
                ) : (
                  <Folder className="h-4 w-4 mr-2 text-blue-500" />
                )
              ) : (
                <div className="h-4 w-4 mr-2" /> // 文件图标占位
              )}
              
              <span className="text-sm truncate">{node.name}</span>
            </div>
          </ContextMenu.Trigger>
          
          <ContextMenu.Portal>
            <ContextMenu.Content className="min-w-[220px] bg-popover p-1 rounded-md border shadow-md">
              <ContextMenu.Item className="px-2 py-1.5 text-sm hover:bg-accent hover:text-accent-foreground rounded cursor-pointer">
                新建文件夹
              </ContextMenu.Item>
              <ContextMenu.Item className="px-2 py-1.5 text-sm hover:bg-accent hover:text-accent-foreground rounded cursor-pointer">
                重命名
              </ContextMenu.Item>
              <ContextMenu.Separator className="h-px bg-border my-1" />
              <ContextMenu.Item className="px-2 py-1.5 text-sm hover:bg-destructive hover:text-destructive-foreground rounded cursor-pointer">
                删除
              </ContextMenu.Item>
            </ContextMenu.Content>
          </ContextMenu.Portal>
        </ContextMenu.Root>
        
        {node.type === 'directory' && hasChildren && isExpanded && (
          <div>
            {node.children!.map((child) => (
              <TreeNodeComponent
                key={child.id}
                node={child}
                level={level + 1}
              />
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="w-full">
      {data.map((node) => (
        <TreeNodeComponent key={node.id} node={node} />
      ))}
    </div>
  );
}
```

### 3. 文件网格组件 (FileGrid)
- 瀑布流或网格布局显示文件
- 支持按文件类型筛选 (文档、图片、视频)
- 文件缩略图生成和显示
- 支持多选、拖拽上传

```typescript
// src/components/FileGrid/FileGrid.tsx
import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import * as Tabs from '@radix-ui/react-tabs';
import { Grid, List, Upload } from 'lucide-react';
import { cn } from '@/utils/cn';
import { Button } from '@/components/ui/button';
import { useFileSystem } from '@/hooks/usePlatform';

interface FileItem {
  id: string;
  name: string;
  type: 'document' | 'image' | 'video';
  size: number;
  thumbnailUrl?: string;
  createdAt: Date;
}

interface FileGridProps {
  files: FileItem[];
  onFileSelect?: (file: FileItem) => void;
  onFilesUpload?: (files: File[]) => void;
  selectedFiles?: string[];
  viewMode?: 'grid' | 'list';
}

export function FileGrid({
  files,
  onFileSelect,
  onFilesUpload,
  selectedFiles = [],
  viewMode = 'grid'
}: FileGridProps) {
  const [activeTab, setActiveTab] = useState<'all' | 'document' | 'image' | 'video'>('all');
  const [currentViewMode, setCurrentViewMode] = useState(viewMode);
  const fileSystem = useFileSystem();

  const onDrop = useCallback((acceptedFiles: File[]) => {
    onFilesUpload?.(acceptedFiles);
  }, [onFilesUpload]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    noClick: true
  });

  const filteredFiles = files.filter(file => {
    if (activeTab === 'all') return true;
    return file.type === activeTab;
  });

  const FileCard = ({ file }: { file: FileItem }) => {
    const isSelected = selectedFiles.includes(file.id);
    
    return (
      <div
        className={cn(
          'relative group cursor-pointer rounded-lg border-2 transition-all duration-200',
          isSelected
            ? 'border-primary bg-primary/5'
            : 'border-transparent hover:border-border hover:shadow-md'
        )}
        onClick={() => onFileSelect?.(file)}
      >
        <div className="aspect-square bg-muted rounded-lg overflow-hidden">
          {file.thumbnailUrl ? (
            <img
              src={file.thumbnailUrl}
              alt={file.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-muted-foreground">
              {file.type === 'document' && '📄'}
              {file.type === 'image' && '🖼️'}
              {file.type === 'video' && '🎬'}
            </div>
          )}
        </div>
        
        <div className="p-2">
          <p className="text-sm font-medium truncate" title={file.name}>
            {file.name}
          </p>
          <p className="text-xs text-muted-foreground">
            {formatFileSize(file.size)}
          </p>
        </div>
        
        {isSelected && (
          <div className="absolute top-2 right-2 w-5 h-5 bg-primary rounded-full flex items-center justify-center">
            <div className="w-2 h-2 bg-primary-foreground rounded-full" />
          </div>
        )}
      </div>
    );
  };

  const FileListItem = ({ file }: { file: FileItem }) => {
    const isSelected = selectedFiles.includes(file.id);
    
    return (
      <div
        className={cn(
          'flex items-center p-3 rounded-lg cursor-pointer transition-colors',
          isSelected
            ? 'bg-primary/5 border border-primary'
            : 'hover:bg-accent'
        )}
        onClick={() => onFileSelect?.(file)}
      >
        <div className="w-10 h-10 bg-muted rounded flex items-center justify-center mr-3">
          {file.type === 'document' && '📄'}
          {file.type === 'image' && '🖼️'}
          {file.type === 'video' && '🎬'}
        </div>
        
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium truncate">{file.name}</p>
          <p className="text-xs text-muted-foreground">
            {formatFileSize(file.size)} • {file.createdAt.toLocaleDateString()}
          </p>
        </div>
        
        {isSelected && (
          <div className="w-5 h-5 bg-primary rounded-full flex items-center justify-center ml-2">
            <div className="w-2 h-2 bg-primary-foreground rounded-full" />
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="h-full flex flex-col" {...getRootProps()}>
      <input {...getInputProps()} />
      
      {/* 工具栏 */}
      <div className="flex items-center justify-between p-4 border-b">
        <Tabs.Root value={activeTab} onValueChange={(value: any) => setActiveTab(value)}>
          <Tabs.List className="grid w-full grid-cols-4 bg-muted p-1 rounded-lg">
            <Tabs.Trigger value="all" className="text-sm">全部</Tabs.Trigger>
            <Tabs.Trigger value="document" className="text-sm">文档</Tabs.Trigger>
            <Tabs.Trigger value="image" className="text-sm">图片</Tabs.Trigger>
            <Tabs.Trigger value="video" className="text-sm">视频</Tabs.Trigger>
          </Tabs.List>
        </Tabs.Root>
        
        <div className="flex items-center gap-2">
          <Button
            variant={currentViewMode === 'grid' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setCurrentViewMode('grid')}
          >
            <Grid className="h-4 w-4" />
          </Button>
          <Button
            variant={currentViewMode === 'list' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setCurrentViewMode('list')}
          >
            <List className="h-4 w-4" />
          </Button>
        </div>
      </div>
      
      {/* 文件列表 */}
      <div className="flex-1 overflow-auto p-4">
        {isDragActive && (
          <div className="absolute inset-0 bg-primary/10 border-2 border-dashed border-primary rounded-lg flex items-center justify-center z-10">
            <div className="text-center">
              <Upload className="h-12 w-12 mx-auto mb-4 text-primary" />
              <p className="text-lg font-medium text-primary">拖放文件到这里</p>
            </div>
          </div>
        )}
        
        {currentViewMode === 'grid' ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {filteredFiles.map((file) => (
              <FileCard key={file.id} file={file} />
            ))}
          </div>
        ) : (
          <div className="space-y-2">
            {filteredFiles.map((file) => (
              <FileListItem key={file.id} file={file} />
            ))}
          </div>
        )}
        
        {filteredFiles.length === 0 && (
          <div className="text-center py-12">
            <p className="text-muted-foreground">暂无文件</p>
          </div>
        )}
      </div>
    </div>
  );
}

function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}
```

### 4. 文件预览组件 (FilePreview)
- 图片: 支持常见格式预览
- 视频: 支持播放控制
- 文档: PDF 预览，Office 文档预览
- 音频: 音频播放器

```typescript
// src/components/FilePreview/FilePreview.tsx
import React, { useState, useEffect } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { X, Download, ExternalLink, ZoomIn, ZoomOut, RotateCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/utils/cn';
import { useFileSystem } from '@/hooks/usePlatform';

interface FilePreviewProps {
  file: {
    id: string;
    name: string;
    type: 'image' | 'video' | 'document' | 'audio';
    url: string;
    size: number;
  } | null;
  isOpen: boolean;
  onClose: () => void;
}

export function FilePreview({ file, isOpen, onClose }: FilePreviewProps) {
  const [zoom, setZoom] = useState(100);
  const [rotation, setRotation] = useState(0);
  const fileSystem = useFileSystem();

  useEffect(() => {
    if (isOpen && file) {
      setZoom(100);
      setRotation(0);
    }
  }, [isOpen, file]);

  if (!file) return null;

  const handleDownload = async () => {
    try {
      const data = await fileSystem.readFile(file.url);
      await fileSystem.writeFile(file.name, data);
    } catch (error) {
      console.error('Download failed:', error);
    }
  };

  const handleOpenExternal = async () => {
    try {
      await fileSystem.openFile(file.url);
    } catch (error) {
      console.error('Open external failed:', error);
    }
  };

  const renderPreview = () => {
    switch (file.type) {
      case 'image':
        return (
          <div className="flex items-center justify-center h-full">
            <img
              src={file.url}
              alt={file.name}
              className="max-w-full max-h-full object-contain transition-transform duration-200"
              style={{
                transform: `scale(${zoom / 100}) rotate(${rotation}deg)`
              }}
            />
          </div>
        );
      
      case 'video':
        return (
          <div className="flex items-center justify-center h-full">
            <video
              src={file.url}
              controls
              className="max-w-full max-h-full"
              style={{
                transform: `scale(${zoom / 100})`
              }}
            >
              您的浏览器不支持视频播放。
            </video>
          </div>
        );
      
      case 'audio':
        return (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <div className="w-32 h-32 bg-muted rounded-full flex items-center justify-center mb-4 mx-auto">
                <span className="text-4xl">🎵</span>
              </div>
              <h3 className="text-lg font-medium mb-4">{file.name}</h3>
              <audio src={file.url} controls className="w-full max-w-md">
                您的浏览器不支持音频播放。
              </audio>
            </div>
          </div>
        );
      
      case 'document':
        if (file.name.toLowerCase().endsWith('.pdf')) {
          return (
            <div className="h-full">
              <iframe
                src={file.url}
                className="w-full h-full border-0"
                title={file.name}
              />
            </div>
          );
        } else {
          return (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <div className="w-32 h-32 bg-muted rounded-lg flex items-center justify-center mb-4 mx-auto">
                  <span className="text-4xl">📄</span>
                </div>
                <h3 className="text-lg font-medium mb-2">{file.name}</h3>
                <p className="text-muted-foreground mb-4">无法预览此文档类型</p>
                <Button onClick={handleOpenExternal}>
                  <ExternalLink className="h-4 w-4 mr-2" />
                  使用外部应用打开
                </Button>
              </div>
            </div>
          );
        }
      
      default:
        return (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <p className="text-muted-foreground">无法预览此文件类型</p>
            </div>
          </div>
        );
    }
  };

  return (
    <Dialog.Root open={isOpen} onOpenChange={onClose}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/80 z-50" />
        <Dialog.Content className="fixed inset-4 bg-background rounded-lg shadow-lg z-50 flex flex-col">
          {/* 头部工具栏 */}
          <div className="flex items-center justify-between p-4 border-b">
            <div className="flex-1 min-w-0">
              <h2 className="text-lg font-semibold truncate">{file.name}</h2>
              <p className="text-sm text-muted-foreground">
                {formatFileSize(file.size)}
              </p>
            </div>
            
            <div className="flex items-center gap-2 ml-4">
              {file.type === 'image' && (
                <>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setZoom(Math.max(25, zoom - 25))}
                    disabled={zoom <= 25}
                  >
                    <ZoomOut className="h-4 w-4" />
                  </Button>
                  <span className="text-sm min-w-[3rem] text-center">{zoom}%</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setZoom(Math.min(400, zoom + 25))}
                    disabled={zoom >= 400}
                  >
                    <ZoomIn className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setRotation((rotation + 90) % 360)}
                  >
                    <RotateCw className="h-4 w-4" />
                  </Button>
                </>
              )}
              
              <Button variant="ghost" size="sm" onClick={handleDownload}>
                <Download className="h-4 w-4" />
              </Button>
              
              <Button variant="ghost" size="sm" onClick={handleOpenExternal}>
                <ExternalLink className="h-4 w-4" />
              </Button>
              
              <Dialog.Close asChild>
                <Button variant="ghost" size="sm">
                  <X className="h-4 w-4" />
                </Button>
              </Dialog.Close>
            </div>
          </div>
          
          {/* 预览内容 */}
          <div className="flex-1 overflow-hidden">
            {renderPreview()}
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}
```

### 5. 文件选择对话框 (FileDialog)
- 环境自适应的文件选择
- 支持多选和文件类型过滤
- 统一的用户体验

```typescript
// src/components/FileDialog/FileDialog.tsx
import React, { useState } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { Upload, File, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useFileSystem, usePlatform } from '@/hooks/usePlatform';

interface FileDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onFilesSelected: (files: File[]) => void;
  accept?: string[];
  multiple?: boolean;
  title?: string;
}

export function FileDialog({
  isOpen,
  onClose,
  onFilesSelected,
  accept,
  multiple = true,
  title = '选择文件'
}: FileDialogProps) {
  const [isDragOver, setIsDragOver] = useState(false);
  const fileSystem = useFileSystem();
  const { platform } = usePlatform();

  const handleFileSelect = async () => {
    try {
      const files = await fileSystem.selectFiles({
        multiple,
        accept
      });
      
      if (files && files.length > 0) {
        onFilesSelected(files);
        onClose();
      }
    } catch (error) {
      console.error('File selection failed:', error);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      // 文件类型过滤
      const filteredFiles = accept
        ? files.filter(file => {
            const extension = '.' + file.name.split('.').pop()?.toLowerCase();
            return accept.some(acceptType => {
              if (acceptType.startsWith('.')) {
                return acceptType.toLowerCase() === extension;
              }
              return file.type.startsWith(acceptType.split('/')[0]);
            });
          })
        : files;
      
      if (filteredFiles.length > 0) {
        onFilesSelected(multiple ? filteredFiles : [filteredFiles[0]]);
        onClose();
      }
    }
  };

  return (
    <Dialog.Root open={isOpen} onOpenChange={onClose}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/50 z-50" />
        <Dialog.Content className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-background rounded-lg shadow-lg z-50 w-full max-w-md">
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <Dialog.Title className="text-lg font-semibold">
                {title}
              </Dialog.Title>
              <Dialog.Close asChild>
                <Button variant="ghost" size="sm">
                  <X className="h-4 w-4" />
                </Button>
              </Dialog.Close>
            </div>
            
            <div
              className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                isDragOver
                  ? 'border-primary bg-primary/5'
                  : 'border-muted-foreground/25 hover:border-muted-foreground/50'
              }`}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
            >
              <Upload className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              
              <h3 className="text-lg font-medium mb-2">
                {platform === 'browser' ? '拖放文件到这里' : '选择或拖放文件'}
              </h3>
              
              <p className="text-muted-foreground mb-4">
                {multiple ? '支持多个文件' : '选择一个文件'}
                {accept && (
                  <span className="block text-sm mt-1">
                    支持格式: {accept.join(', ')}
                  </span>
                )}
              </p>
              
              <Button onClick={handleFileSelect}>
                <File className="h-4 w-4 mr-2" />
                浏览文件
              </Button>
            </div>
            
            <div className="flex justify-end gap-2 mt-6">
              <Dialog.Close asChild>
                <Button variant="outline">取消</Button>
              </Dialog.Close>
            </div>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
```

### 6. 拖拽上传功能
- 支持从系统文件管理器拖拽文件到应用
- 自动识别文件类型并分类
- 生成缩略图 (图片、视频首帧)

## Electron 集成

### 主进程 (main.ts)
```typescript
import { BrowserWindow, app } from 'electron';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 启动 Express 服务器
const startServer = async () => {
  const { default: server } = await import('./backend/dist/app.js');
  return new Promise((resolve) => {
    const httpServer = server.listen(0, 'localhost', () => {
      const port = httpServer.address().port;
      resolve(`http://localhost:${port}`);
    });
  });
};

// 创建窗口并加载前端
const createWindow = async () => {
  const serverUrl = await startServer();
  
  const mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js')
    }
  });
  
  mainWindow.loadURL(serverUrl);
};
```

### 预加载脚本 (preload.ts)
```typescript
import { contextBridge, ipcRenderer } from 'electron';

// 暴露安全的 API 给渲染进程
contextBridge.exposeInMainWorld('electronAPI', {
  selectDirectory: () => ipcRenderer.invoke('select-directory'),
  openFile: (filePath: string) => ipcRenderer.invoke('open-file', filePath),
  showInFolder: (filePath: string) => ipcRenderer.invoke('show-in-folder', filePath)
});
```

## Docker 部署

### Dockerfile
```dockerfile
FROM node:18-alpine

WORKDIR /app

# 复制并安装依赖
COPY package*.json ./
RUN npm ci --only=production

# 复制构建后的文件
COPY packages/frontend/dist ./public
COPY packages/backend/dist ./backend

EXPOSE 3000

CMD ["node", "--experimental-modules", "backend/app.js"]
```

## 开发流程

### 阶段一: 基础架构搭建
1. 初始化 monorepo 结构
2. 配置 Vite + React + TypeScript + Tailwind
3. 配置 Express + SQLite 后端
4. 配置 Electron Forge

### 阶段二: 核心功能开发
1. 实现项目目录选择和初始化
2. 实现文件系统扫描和索引构建
3. 实现文件树组件(基于索引数据)
4. 实现文件网格组件和预览功能

### 阶段三: 文件系统集成
1. 实现文件系统监听和增量更新
2. 实现文件操作(创建、重命名、删除、移动)
3. 实现拖拽上传和文件导入
4. 实现缩略图生成和缓存

### 阶段四: 高级功能和优化
1. 实现搜索和筛选功能
2. 实现文件标签和元数据管理
3. 优化大量文件的性能
4. 实现数据库维护和修复工具

### 阶段五: 打包和部署
1. 配置 Electron 打包
2. 配置 Docker 部署
3. 编写文档和测试

## 技术难点和解决方案

### 1. 文件缩略图生成
- 图片: 使用 Sharp 库生成缩略图
- 视频: 使用 FFmpeg 提取首帧
- 文档: 使用 PDF.js 或其他库生成预览图

```typescript
// 缩略图生成服务示例
import sharp from 'sharp';
import ffmpeg from 'fluent-ffmpeg';
import { promises as fs } from 'fs';
import path from 'path';

export class ThumbnailService {
  async generateImageThumbnail(inputPath: string, outputPath: string): Promise<void> {
    await sharp(inputPath)
      .resize(200, 200, { fit: 'cover' })
      .jpeg({ quality: 80 })
      .toFile(outputPath);
  }

  async generateVideoThumbnail(inputPath: string, outputPath: string): Promise<void> {
    return new Promise((resolve, reject) => {
      ffmpeg(inputPath)
        .screenshots({
          count: 1,
          folder: path.dirname(outputPath),
          filename: path.basename(outputPath)
        })
        .on('end', resolve)
        .on('error', reject);
    });
  }
}
```

### 2. 大量文件的性能优化
- 虚拟滚动 (react-window)
- 懒加载缩略图
- 分页或无限滚动

```typescript
// 虚拟滚动组件示例
import { FixedSizeGrid as Grid } from 'react-window';
import { memo } from 'react';

interface FileGridProps {
  files: FileItem[];
  columnCount: number;
  rowHeight: number;
}

export const VirtualFileGrid = memo<FileGridProps>(({ files, columnCount, rowHeight }) => {
  const rowCount = Math.ceil(files.length / columnCount);

  const Cell = ({ columnIndex, rowIndex, style }) => {
    const index = rowIndex * columnCount + columnIndex;
    const file = files[index];
    
    if (!file) return <div style={style} />;
    
    return (
      <div style={style}>
        <FileCard file={file} />
      </div>
    );
  };

  return (
    <Grid
      columnCount={columnCount}
      columnWidth={200}
      height={600}
      rowCount={rowCount}
      rowHeight={rowHeight}
      width={800}
    >
      {Cell}
    </Grid>
  );
});
```

### 3. 文件系统同步机制
- **启动时全量扫描**: 应用启动时扫描整个项目目录，同步数据库索引
- **实时监听**: 使用 chokidar 监听文件系统变化，增量更新索引
- **定期校验**: 定期对比文件系统和数据库，修复不一致
- **文件哈希校验**: 通过 MD5 哈希检测文件内容变化
- **软删除机制**: 文件被删除时先标记为已删除，定期清理

```typescript
// 文件系统监听服务示例
import chokidar from 'chokidar';
import { createHash } from 'crypto';
import { promises as fs } from 'fs';
import path from 'path';

export class FileSystemWatcher {
  private watcher: chokidar.FSWatcher | null = null;
  
  async startWatching(projectPath: string): Promise<void> {
    this.watcher = chokidar.watch(projectPath, {
      ignored: /(^|[\/\\])\../, // 忽略隐藏文件
      persistent: true
    });

    this.watcher
      .on('add', (filePath) => this.handleFileAdded(filePath))
      .on('change', (filePath) => this.handleFileChanged(filePath))
      .on('unlink', (filePath) => this.handleFileDeleted(filePath))
      .on('addDir', (dirPath) => this.handleDirectoryAdded(dirPath))
      .on('unlinkDir', (dirPath) => this.handleDirectoryDeleted(dirPath));
  }

  private async calculateFileHash(filePath: string): Promise<string> {
    const fileBuffer = await fs.readFile(filePath);
    return createHash('md5').update(fileBuffer).digest('hex');
  }

  private async handleFileAdded(filePath: string): Promise<void> {
    // 实现文件添加逻辑
  }

  private async handleFileChanged(filePath: string): Promise<void> {
    // 实现文件变更逻辑
  }

  private async handleFileDeleted(filePath: string): Promise<void> {
    // 实现文件删除逻辑
  }
}
```

### 4. 跨平台兼容性
- 路径处理使用 path 模块
- 文件操作使用 fs-extra
- 系统集成使用 Electron API

```typescript
// 跨平台路径处理示例
import path from 'path';
import { promises as fs } from 'fs';
import { app } from 'electron';

export class PathUtils {
  static getProjectConfigPath(projectPath: string): string {
    return path.join(projectPath, '.aideer');
  }

  static getDatabasePath(projectPath: string): string {
    return path.join(this.getProjectConfigPath(projectPath), 'index.db');
  }

  static getThumbnailsPath(projectPath: string): string {
    return path.join(this.getProjectConfigPath(projectPath), 'thumbnails');
  }

  static async ensureDirectoryExists(dirPath: string): Promise<void> {
    try {
      await fs.access(dirPath);
    } catch {
      await fs.mkdir(dirPath, { recursive: true });
    }
  }

  static getRelativePath(basePath: string, targetPath: string): string {
    return path.relative(basePath, targetPath);
  }
}
```

## 后续扩展功能

1. 文件标签和分类系统
2. 全文搜索功能
3. 文件版本管理
4. 云同步支持
5. 插件系统
6. 批量操作工具
7. 文件分享功能
8. AI 辅助分类和标记

---

这个规划涵盖了项目的核心架构、技术选型、数据库设计、API 设计和开发流程。请确认是否符合您的需求，我将根据您的反馈开始具体的开发工作。