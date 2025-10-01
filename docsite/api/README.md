# API 文档

aiDeer 提供了完整的 RESTful API，支持所有核心功能的编程访问。本文档详细介绍了所有可用的 API 端点。

## 🔗 基础信息

- **基础 URL**: `http://localhost:3001/api`
- **数据格式**: JSON
- **字符编码**: UTF-8
- **HTTP 方法**: GET, POST, PUT, DELETE

## 📋 API 概览

| 模块 | 端点前缀 | 描述 |
|------|----------|------|
| 项目管理 | `/projects` | 项目的创建、查询和管理 |
| 目录操作 | `/directories` | 目录结构的查询和操作 |
| 文件管理 | `/files` | 文件的增删改查操作 |
| 文件信息 | `/file-extra-info` | 文件的额外信息查询 |
| 搜索功能 | `/search` | 文件和内容搜索 |

## 🗂️ 项目管理 API

### 获取数据根路径

```http
GET /api/projects/data-root
```

**响应示例**:
```json
{
  "dataRoot": "/Users/username/aideer-data"
}
```

### 获取所有项目

```http
GET /api/projects
```

**响应示例**:
```json
{
  "projects": [
    {
      "id": "project-1",
      "name": "我的项目",
      "path": "/Users/username/aideer-data/project-1",
      "createdAt": "2024-01-01T00:00:00.000Z",
      "updatedAt": "2024-01-01T00:00:00.000Z"
    }
  ]
}
```

### 创建新项目

```http
POST /api/projects
```

**请求体**:
```json
{
  "name": "新项目名称",
  "path": "project-folder-name"
}
```

**响应示例**:
```json
{
  "success": true,
  "project": {
    "id": "project-2",
    "name": "新项目名称",
    "path": "/Users/username/aideer-data/project-folder-name"
  }
}
```

## 📁 目录操作 API

### 获取项目文件树

```http
GET /api/directories/tree/:projectId
```

**路径参数**:
- `projectId`: 项目ID

**响应示例**:
```json
{
  "tree": {
    "name": "project-root",
    "type": "directory",
    "children": [
      {
        "name": "images",
        "type": "directory",
        "children": []
      },
      {
        "name": "documents",
        "type": "directory",
        "children": []
      }
    ]
  }
}
```

### 获取目录内容

```http
GET /api/directories/:projectId/children
```

**查询参数**:
- `path`: 目录路径（可选，默认为根目录）

**响应示例**:
```json
{
  "children": [
    {
      "name": "image1.jpg",
      "type": "file",
      "size": 1024000,
      "modifiedAt": "2024-01-01T00:00:00.000Z"
    },
    {
      "name": "subfolder",
      "type": "directory",
      "modifiedAt": "2024-01-01T00:00:00.000Z"
    }
  ]
}
```

### 创建目录

```http
POST /api/directories/:projectId
```

**请求体**:
```json
{
  "path": "new-folder/subfolder"
}
```

### 重命名目录

```http
PUT /api/directories/:projectId/rename
```

**请求体**:
```json
{
  "oldPath": "old-folder-name",
  "newPath": "new-folder-name"
}
```

## 📄 文件管理 API

### 获取文件列表

```http
GET /api/files/:projectId
```

**查询参数**:
- `page`: 页码（默认: 1）
- `limit`: 每页数量（默认: 50）
- `directory`: 目录路径过滤
- `type`: 文件类型过滤（image, video, document, other）
- `search`: 搜索关键词

**响应示例**:
```json
{
  "files": [
    {
      "id": "file-1",
      "name": "example.jpg",
      "path": "/images/example.jpg",
      "size": 1024000,
      "type": "image",
      "mimeType": "image/jpeg",
      "createdAt": "2024-01-01T00:00:00.000Z",
      "modifiedAt": "2024-01-01T00:00:00.000Z",
      "tags": ["风景", "旅行"],
      "notes": "美丽的风景照片"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 50,
    "total": 100,
    "totalPages": 2
  }
}
```

### 获取单个文件信息

```http
GET /api/files/:projectId/:fileId
```

**响应示例**:
```json
{
  "file": {
    "id": "file-1",
    "name": "example.jpg",
    "path": "/images/example.jpg",
    "size": 1024000,
    "type": "image",
    "mimeType": "image/jpeg",
    "width": 1920,
    "height": 1080,
    "createdAt": "2024-01-01T00:00:00.000Z",
    "modifiedAt": "2024-01-01T00:00:00.000Z",
    "tags": ["风景", "旅行"],
    "notes": "美丽的风景照片",
    "hash": "blake3-hash-value"
  }
}
```

### 上传文件

```http
POST /api/files/:projectId
```

**请求类型**: `multipart/form-data`

**表单字段**:
- `file`: 文件数据
- `directory`: 目标目录（可选）
- `tags`: 标签（JSON 数组字符串，可选）
- `notes`: 备注（可选）

**响应示例**:
```json
{
  "success": true,
  "file": {
    "id": "file-2",
    "name": "uploaded.jpg",
    "path": "/images/uploaded.jpg"
  }
}
```

### 批量导入媒体文件

```http
POST /api/files/:projectId/import-media
```

**请求体**:
```json
{
  "items": [
    {
      "url": "https://example.com/image1.jpg",
      "filename": "image1.jpg",
      "directory": "/images"
    },
    {
      "url": "https://example.com/video1.mp4",
      "filename": "video1.mp4",
      "directory": "/videos"
    }
  ]
}
```

**响应示例**:
```json
{
  "success": true,
  "imported": 2,
  "failed": 0,
  "results": [
    {
      "url": "https://example.com/image1.jpg",
      "success": true,
      "fileId": "file-3"
    },
    {
      "url": "https://example.com/video1.mp4",
      "success": true,
      "fileId": "file-4"
    }
  ]
}
```

### 更新文件信息

```http
PUT /api/files/:projectId/:fileId
```

**请求体**:
```json
{
  "name": "new-filename.jpg",
  "tags": ["新标签1", "新标签2"],
  "notes": "更新后的备注"
}
```

### 删除文件

```http
DELETE /api/files/:projectId/:fileId
```

**响应示例**:
```json
{
  "success": true,
  "message": "文件删除成功"
}
```

## ℹ️ 文件额外信息 API

### 获取文件额外信息

```http
GET /api/file-extra-info/:projectId
```

**查询参数**:
- `filePath`: 文件相对路径

**响应示例**:
```json
{
  "hash": "blake3-hash-value",
  "metadata": {
    "exif": {
      "camera": "Canon EOS R5",
      "lens": "RF 24-70mm F2.8 L IS USM",
      "iso": 100,
      "aperture": "f/2.8",
      "shutterSpeed": "1/125"
    }
  }
}
```

## 🔍 搜索 API

### 搜索文件

```http
GET /api/search/:projectId
```

**查询参数**:
- `q`: 搜索关键词
- `type`: 文件类型过滤
- `limit`: 结果数量限制（默认: 50）

**响应示例**:
```json
{
  "results": [
    {
      "file": {
        "id": "file-1",
        "name": "example.jpg",
        "path": "/images/example.jpg",
        "type": "image"
      },
      "score": 0.95,
      "matchType": "filename"
    }
  ],
  "total": 1,
  "query": "example"
}
```

## 📊 错误处理

### 错误响应格式

```json
{
  "error": true,
  "message": "错误描述",
  "code": "ERROR_CODE",
  "details": {
    "field": "具体错误信息"
  }
}
```

### 常见错误代码

| 状态码 | 错误代码 | 描述 |
|--------|----------|------|
| 400 | `INVALID_REQUEST` | 请求参数无效 |
| 404 | `NOT_FOUND` | 资源不存在 |
| 409 | `CONFLICT` | 资源冲突 |
| 413 | `FILE_TOO_LARGE` | 文件过大 |
| 415 | `UNSUPPORTED_MEDIA_TYPE` | 不支持的文件类型 |
| 500 | `INTERNAL_ERROR` | 服务器内部错误 |

## 🔐 认证和安全

当前版本的 API 主要用于本地开发环境，暂不包含认证机制。在生产环境中部署时，建议：

1. 添加 API 密钥认证
2. 使用 HTTPS 协议
3. 实施速率限制
4. 添加 CORS 配置

## 📝 使用示例

### JavaScript 示例

```javascript
// 获取项目列表
async function getProjects() {
  const response = await fetch('http://localhost:3001/api/projects');
  const data = await response.json();
  return data.projects;
}

// 上传文件
async function uploadFile(projectId, file, directory = '') {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('directory', directory);
  
  const response = await fetch(`http://localhost:3001/api/files/${projectId}`, {
    method: 'POST',
    body: formData
  });
  
  return await response.json();
}

// 搜索文件
async function searchFiles(projectId, query) {
  const response = await fetch(
    `http://localhost:3001/api/search/${projectId}?q=${encodeURIComponent(query)}`
  );
  return await response.json();
}
```

### Python 示例

```python
import requests
import json

# 基础 URL
BASE_URL = 'http://localhost:3001/api'

# 获取项目列表
def get_projects():
    response = requests.get(f'{BASE_URL}/projects')
    return response.json()['projects']

# 创建项目
def create_project(name, path):
    data = {'name': name, 'path': path}
    response = requests.post(f'{BASE_URL}/projects', json=data)
    return response.json()

# 上传文件
def upload_file(project_id, file_path, directory=''):
    with open(file_path, 'rb') as f:
        files = {'file': f}
        data = {'directory': directory}
        response = requests.post(
            f'{BASE_URL}/files/{project_id}',
            files=files,
            data=data
        )
    return response.json()
```

## 📚 相关文档

- [快速入门](../guide/getting-started.md)
- [项目管理](../guide/project-management.md)
- [文件操作](../guide/file-operations.md)
- [部署指南](../deployment/README.md)

---

如有疑问，请访问我们的 [GitHub Issues](https://github.com/easychen/aideer/issues) 或查看 [API 测试用例](https://github.com/easychen/aideer/tree/main/backend/tests)。