# 更新日志

本文档记录了 aiDeer 的所有重要更新和变更。

## [1.0.0] - 2024-01-15

### 🎉 首次发布

这是 aiDeer 的首个正式版本，包含完整的核心功能。

#### ✨ 新功能

**核心系统**
- 🗂️ 项目化文件管理系统
- 📁 智能文件扫描和导入
- 🔍 全文搜索和智能过滤
- 🏷️ 文件标签和备注系统
- 📊 文件统计和可视化

**用户界面**
- 🎨 现代化响应式界面设计
- 🌙 深色/浅色主题切换
- 🌐 中英文双语支持
- 📱 移动端适配
- ⌨️ 完整的键盘快捷键支持

**文件管理**
- 📷 图片文件预览和缩略图
- 🎥 视频文件预览和播放
- 📄 文档文件信息展示
- 🔄 批量文件操作
- 📤 文件导入导出功能

**浏览器扩展**
- 🌐 Chrome/Firefox 浏览器扩展
- 📸 网页媒体文件批量收集
- 🎯 智能文件过滤和去重
- ⚡ 一键导入到 aiDeer 系统
- ⌨️ 快捷键支持 (Ctrl+Shift+M)

**API 接口**
- 🔌 完整的 RESTful API
- 📊 项目管理接口
- 📁 文件操作接口
- 🔍 搜索功能接口
- 📤 批量导入接口

#### 🛠️ 技术特性

**前端技术栈**
- React 18 + TypeScript
- Vite 构建工具
- Radix UI 组件库
- Framer Motion 动画
- Zustand 状态管理
- React Router 路由
- React Query 数据获取
- i18next 国际化

**后端技术栈**
- Node.js + Express
- TypeScript
- SQLite 数据库
- Sharp 图像处理
- Chokidar 文件监控
- Multer 文件上传
- CORS 跨域支持

**浏览器扩展**
- WXT 开发框架
- TypeScript
- Chrome Extension API
- 跨浏览器兼容

#### 📋 支持的文件格式

**图片格式**
- JPEG/JPG
- PNG
- GIF
- WebP
- SVG
- BMP
- TIFF

**视频格式**
- MP4
- WebM
- AVI
- MOV
- MKV
- FLV

**文档格式**
- PDF
- DOC/DOCX
- TXT
- MD
- RTF

#### 🔧 系统要求

**桌面应用**
- Windows 10 或更高版本
- macOS 10.14 或更高版本
- Linux (Ubuntu 18.04+ 或同等版本)
- 4GB RAM (推荐 8GB)
- 1GB 可用磁盘空间

**浏览器扩展**
- Chrome 88+
- Firefox 78+
- Edge 88+

**开发环境**
- Node.js 16.0+
- npm 7.0+

#### 🚀 性能优化

- ⚡ 虚拟滚动支持大量文件显示
- 🖼️ 智能缩略图生成和缓存
- 📊 数据库索引优化
- 🔄 增量文件扫描
- 💾 内存使用优化

#### 🔒 安全特性

- 🛡️ 文件路径安全验证
- 🔐 BLAKE3 文件哈希校验
- 🚫 恶意文件类型过滤
- 🔒 本地数据存储

---

## 🔮 即将推出

### [1.1.0] - 计划中

#### 🎯 计划功能

**增强功能**
- 🔄 文件版本控制
- 🏷️ 智能标签建议
- 📊 高级统计报表
- 🔗 文件关联和引用
- 📱 移动端应用

**插件系统**
- 🔌 插件开发 SDK
- 🎨 图像处理插件
- 📝 文档转换插件
- ☁️ 云存储同步插件
- 🤖 AI 智能分析插件

**协作功能**
- 👥 多用户支持
- 💬 文件评论系统
- 📤 文件分享功能
- 🔄 实时同步
- 📧 邮件通知

**性能优化**
- 🚀 更快的文件扫描
- 💾 更好的内存管理
- 🔍 搜索性能提升
- 📊 数据库优化
- 🖼️ 缩略图生成优化

### [1.2.0] - 计划中

#### 🎯 高级功能

**AI 智能功能**
- 🤖 智能文件分类
- 🔍 图像内容识别
- 📝 自动标签生成
- 🎯 重复文件检测
- 📊 使用模式分析

**企业功能**
- 🏢 企业级部署支持
- 👥 用户权限管理
- 📊 审计日志
- 🔒 高级安全功能
- 📈 企业级统计报表

**集成功能**
- ☁️ 云存储集成 (Google Drive, Dropbox, OneDrive)
- 📧 邮件客户端集成
- 🎨 设计工具集成 (Figma, Sketch)
- 📊 办公软件集成 (Office, Google Workspace)
- 🔗 第三方 API 集成

---

## 📝 版本说明

### 版本号规则

aiDeer 采用语义化版本控制 (Semantic Versioning):
- **主版本号**: 不兼容的 API 修改
- **次版本号**: 向下兼容的功能性新增
- **修订版本号**: 向下兼容的问题修正

### 更新类型说明

- 🎉 **新功能**: 全新的功能特性
- ✨ **功能增强**: 现有功能的改进
- 🐛 **问题修复**: Bug 修复
- 🔧 **技术改进**: 代码重构和技术优化
- 📚 **文档更新**: 文档和说明的更新
- 🔒 **安全更新**: 安全相关的修复和改进
- ⚡ **性能优化**: 性能提升相关的改进
- 💔 **破坏性变更**: 不向下兼容的修改

### 支持政策

- **长期支持版本 (LTS)**: 每个主版本的最后一个次版本
- **安全更新**: 所有支持版本都会收到安全更新
- **功能更新**: 只有最新版本会收到新功能
- **支持周期**: 每个主版本支持 2 年

---

## 🤝 贡献指南

### 如何贡献

我们欢迎社区贡献！您可以通过以下方式参与：

1. **报告问题**: 在 [GitHub Issues](https://github.com/easychen/aideer/issues) 报告 Bug
2. **功能建议**: 提出新功能的想法和建议
3. **代码贡献**: 提交 Pull Request 修复问题或添加功能
4. **文档改进**: 帮助改进文档和教程
5. **测试反馈**: 参与 Beta 版本测试

### 开发环境搭建

```bash
# 克隆仓库
git clone https://github.com/easychen/aideer.git
cd aideer

# 安装依赖
npm install

# 启动开发环境
npm run dev
```

### 提交规范

请遵循 [Conventional Commits](https://www.conventionalcommits.org/) 规范：

```
type(scope): description

[optional body]

[optional footer]
```

示例：
```
feat(search): add fuzzy search support
fix(ui): resolve theme switching issue
docs(api): update API documentation
```

---

## 📞 获取帮助

如果您在使用过程中遇到问题：

1. 查看 [使用指南](guide/getting-started.md)
2. 搜索 [GitHub Issues](https://github.com/easychen/aideer/issues)
3. 参与 [社区讨论](https://github.com/easychen/aideer/discussions)
4. 查看 [API 文档](api/README.md)

---

**感谢您使用 aiDeer！我们会持续改进产品，为您提供更好的文件管理体验。**