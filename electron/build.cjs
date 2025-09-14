#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// 颜色输出函数
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logStep(step, message) {
  log(`[${step}] ${message}`, 'cyan');
}

function logSuccess(message) {
  log(`✓ ${message}`, 'green');
}

function logError(message) {
  log(`✗ ${message}`, 'red');
}

function logWarning(message) {
  log(`⚠ ${message}`, 'yellow');
}

// 项目路径
const rootDir = path.resolve(__dirname, '..');
const electronDir = __dirname;
const frontendDir = path.join(rootDir, 'frontend');
const backendDir = path.join(rootDir, 'backend');
const distDir = path.join(electronDir, 'dist');
const resourcesDir = path.join(electronDir, 'resources');

// 清理函数
function cleanDirectory(dir) {
  if (fs.existsSync(dir)) {
    fs.rmSync(dir, { recursive: true, force: true });
  }
  fs.mkdirSync(dir, { recursive: true });
}

// 复制目录函数
function copyDirectory(src, dest) {
  if (!fs.existsSync(src)) {
    logWarning(`源目录不存在: ${src}`);
    return;
  }
  
  fs.mkdirSync(dest, { recursive: true });
  
  const entries = fs.readdirSync(src, { withFileTypes: true });
  
  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    
    if (entry.isDirectory()) {
      // 跳过 node_modules 和其他不需要的目录
      if (['node_modules', '.git', 'dist', 'build', '.next'].includes(entry.name)) {
        continue;
      }
      copyDirectory(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

// 执行命令函数
function runCommand(command, cwd = process.cwd()) {
  try {
    logStep('CMD', `执行: ${command}`);
    execSync(command, { cwd, stdio: 'inherit' });
    return true;
  } catch (error) {
    logError(`命令执行失败: ${command}`);
    logError(error.message);
    return false;
  }
}

// 主构建流程
async function build() {
  log('开始构建 Electron 应用...', 'bright');
  
  try {
    // 步骤 1: 构建前端
    logStep('1', '构建前端应用');
    if (!runCommand('npm run build', frontendDir)) {
      throw new Error('前端构建失败');
    }
    logSuccess('前端构建完成');
    
    // 步骤 2: 构建后端
    logStep('2', '构建后端应用');
    if (!runCommand('npm run build', backendDir)) {
      throw new Error('后端构建失败');
    }
    logSuccess('后端构建完成');
    
    // 步骤 3: 清理资源目录
    logStep('3', '清理资源目录');
    cleanDirectory(resourcesDir);
    logSuccess('资源目录清理完成');
    
    // 步骤 4: 复制前端构建产物
    logStep('4', '复制前端构建产物');
    const frontendBuildDir = path.join(frontendDir, 'dist');
    const frontendDestDir = path.join(resourcesDir, 'frontend');
    copyDirectory(frontendBuildDir, frontendDestDir);
    logSuccess('前端文件复制完成');
    
    // 步骤 5: 复制后端构建产物和源码
    logStep('5', '复制后端文件');
    const backendDestDir = path.join(resourcesDir, 'backend');
    
    // 复制后端构建产物
    const backendBuildDir = path.join(backendDir, 'dist');
    if (fs.existsSync(backendBuildDir)) {
      copyDirectory(backendBuildDir, path.join(backendDestDir, 'dist'));
    }
    
    // 复制后端 package.json 和必要文件
    const backendPackageJson = path.join(backendDir, 'package.json');
    if (fs.existsSync(backendPackageJson)) {
      fs.copyFileSync(backendPackageJson, path.join(backendDestDir, 'package.json'));
    }
    
    // 复制后端源码（用于生产环境）
    const backendSrcDir = path.join(backendDir, 'src');
    if (fs.existsSync(backendSrcDir)) {
      copyDirectory(backendSrcDir, path.join(backendDestDir, 'src'));
    }
    
    logSuccess('后端文件复制完成');
    
    // 步骤 6: 构建 Electron 主进程
    logStep('6', '构建 Electron 主进程');
    if (!runCommand('npm run build', electronDir)) {
      throw new Error('Electron 构建失败');
    }
    logSuccess('Electron 主进程构建完成');
    
    // 步骤 7: 安装后端生产依赖
    logStep('7', '安装后端生产依赖');
    const backendResourceDir = path.join(resourcesDir, 'backend');
    if (fs.existsSync(path.join(backendResourceDir, 'package.json'))) {
      if (!runCommand('npm install --production', backendResourceDir)) {
        logWarning('后端依赖安装失败，但继续构建');
      } else {
        logSuccess('后端依赖安装完成');
      }
    }
    
    // 步骤 8: 打包 Electron 应用
    logStep('8', '打包 Electron 应用');
    if (!runCommand('npm run dist', electronDir)) {
      throw new Error('Electron 打包失败');
    }
    logSuccess('Electron 应用打包完成');
    
    log('\n🎉 构建完成！', 'green');
    log('打包文件位于: electron/dist/', 'cyan');
    
  } catch (error) {
    logError(`构建失败: ${error.message}`);
    process.exit(1);
  }
}

// 如果直接运行此脚本
if (require.main === module) {
  build();
}

module.exports = { build };