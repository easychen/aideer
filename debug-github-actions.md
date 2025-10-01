# 本地调试 GitHub Actions 指南

## 方法一：使用 act 工具

### 安装 act
```bash
# macOS
brew install act

# 或者使用 curl
curl https://raw.githubusercontent.com/nektos/act/master/install.sh | sudo bash
```

### 使用 act 运行 workflow
```bash
# 在项目根目录运行
cd /Users/easy/Code/gitcode/aideer

# 运行特定的 workflow
act -W .github/workflows/debug-local.yml

# 运行所有 workflows
act

# 使用特定的 runner 镜像
act -P ubuntu-latest=catthehacker/ubuntu:act-latest
```

### act 配置文件 (.actrc)
在项目根目录创建 `.actrc` 文件：
```
-P ubuntu-latest=catthehacker/ubuntu:act-latest
--container-architecture linux/amd64
```

## 方法二：Docker 模拟

### 创建 Dockerfile 模拟 CI 环境
```dockerfile
FROM ubuntu:latest

# 安装 Node.js 和 npm
RUN apt-get update && apt-get install -y curl
RUN curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
RUN apt-get install -y nodejs

WORKDIR /workspace
COPY . .

# 模拟 CI 步骤
RUN cd website && npm ci
RUN cd website && npm run build
```

### 运行 Docker 测试
```bash
# 构建镜像
docker build -t aideer-ci-test .

# 运行测试
docker run --rm aideer-ci-test
```

## 方法三：本地模拟 CI 环境

### 使用 nvm 切换 Node.js 版本
```bash
# 安装 Node.js 20 (与 CI 环境一致)
nvm install 20
nvm use 20

# 清理并重新安装依赖
cd website
rm -rf node_modules package-lock.json
npm install --legacy-peer-deps
npm run build
```

### 使用环境变量测试
```bash
# 模拟 CI 环境变量
export NODE_ENV=production
export VITE_BASE_PATH=/aideer/

cd website
npm run build
```

## 调试技巧

### 1. 检查依赖版本
```bash
cd website
npm list typescript vite @vitejs/plugin-react
```

### 2. 清理缓存
```bash
cd website
npm cache clean --force
rm -rf node_modules package-lock.json
npm install --legacy-peer-deps
```

### 3. 检查 TypeScript 配置
```bash
cd website
npx tsc --noEmit --listFiles
```

### 4. 详细构建日志
```bash
cd website
DEBUG=* npm run build
```

## 常见问题解决

### 问题：Cannot find type definition file for 'vite/client'
**解决方案：**
1. 确保 `vite` 包已安装在 devDependencies
2. 检查 `tsconfig.app.json` 中的 `types` 配置
3. 确保 `vite-env.d.ts` 文件存在

### 问题：ERESOLVE unable to resolve dependency tree
**解决方案：**
1. 使用 `npm install --legacy-peer-deps` 安装依赖
2. 或者使用 `npm install --force` 强制安装
3. 检查 `package.json` 中的依赖版本兼容性

### 问题：Cannot find module 'vite' or '@vitejs/plugin-react'
**解决方案：**
1. 确保在正确的工作目录中运行命令
2. 检查 `package.json` 中的依赖配置
3. 使用 `defaults.run.working-directory` 设置工作目录

## 注意事项

- website 目录现在使用 npm 而不是 pnpm
- 需要使用 `--legacy-peer-deps` 标志来解决 React 19 的依赖冲突
- GitHub Actions workflow 已更新为使用 npm ci 和 npm run build