import { app, BrowserWindow, ipcMain, dialog, shell, Menu, screen, Tray } from 'electron';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { spawn } from 'child_process';
import Store from 'electron-store';
import { shellEnv } from 'shell-env';
import fs from 'fs';

// 获取当前文件的目录路径 (ESM 替代 __dirname)
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// 配置存储
const store = new Store();

// 保持对窗口对象的全局引用
let mainWindow = null;
let backendProcess = null;
let appicon = null;

const isDev = process.env.NODE_ENV === 'development';
const BACKEND_PORT = 15543;
const FRONTEND_URL = `http://localhost:${BACKEND_PORT}`;

function createWindow() {
  // 获取屏幕尺寸
  const { width, height } = screen.getPrimaryDisplay().workAreaSize;
  let windowWidth = 1200;
  let windowHeight = 800;
  let windowX = Math.round((width - windowWidth) / 2);
  let windowY = Math.round((height - windowHeight) / 2);

  // 从存储中恢复窗口位置和大小
  const windowBounds = store.get('windowBounds');
  if (windowBounds) {
    const { width: savedWidth, height: savedHeight, x, y } = windowBounds;
    if (savedWidth) windowWidth = savedWidth;
    if (savedHeight) windowHeight = savedHeight;

    const { width: screenWidth, height: screenHeight } = screen.getPrimaryDisplay().workAreaSize;

    // 如果位置超出显示器，重置为居中
    windowX = x + savedWidth > screenWidth ? Math.round((screenWidth - windowWidth) / 2) : x;
    windowY = y + savedHeight > screenHeight ? Math.round((screenHeight - windowHeight) / 2) : y;
  }

  // 创建浏览器窗口
  mainWindow = new BrowserWindow({
    width: windowWidth,
    height: windowHeight,
    x: windowX,
    y: windowY,
    minWidth: 800,
    minHeight: 600,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: join(__dirname, 'preload.js'),
    },
    titleBarStyle: 'hiddenInset',
    show: false, // 先隐藏，等待ready-to-show事件
    autoHideMenuBar: process.platform === 'win32' ? true : false,
  });

  // 加载应用
  mainWindow.loadURL(FRONTEND_URL);

  // 当页面准备好显示时显示窗口
  mainWindow.once('ready-to-show', () => {
    mainWindow?.show();
    
    // 开发模式下打开开发者工具
    if (isDev) {
      mainWindow?.webContents.openDevTools();
    }
  });

  // 当窗口被关闭时
  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  // 当窗口移动或调整大小时，保存位置和大小
  mainWindow.on('move', () => {
    const { width, height, x, y } = mainWindow.getBounds();
    store.set('windowBounds', { width, height, x, y });
  });
  mainWindow.on('resize', () => {
    const { width, height, x, y } = mainWindow.getBounds();
    store.set('windowBounds', { width, height, x, y });
  });

  // 创建应用菜单
  const menu = Menu.buildFromTemplate([
    {
      label: '关于',
      submenu: [
        { label: `AiDeer V${app.getVersion()}`, role: 'about' },
        { label: '退出', role: 'quit', accelerator: 'CmdOrCtrl+Q', click: () => { app.quit(); } },
      ]
    },
    {
      label: '编辑',
      submenu: [
        { label: '撤销', role: 'undo', accelerator: 'CmdOrCtrl+Z' },
        { label: '重做', role: 'redo', accelerator: 'CmdOrCtrl+Y' },
        { type: 'separator' },
        { label: '剪切', role: 'cut', accelerator: 'CmdOrCtrl+X' },
        { label: '复制', role: 'copy', accelerator: 'CmdOrCtrl+C' },
        { label: '粘贴', role: 'paste', accelerator: 'CmdOrCtrl+V' },
        { label: '全选', role: 'selectAll', accelerator: 'CmdOrCtrl+A' },
        { type: 'separator' },
        { label: '查找', role: 'find', accelerator: 'CmdOrCtrl+F' },
        { label: '替换', role: 'replace', accelerator: 'CmdOrCtrl+H' },
        { type: 'separator' },
        { label: '开发者工具', role: 'toggleDevTools', accelerator: 'CmdOrCtrl+Alt+I' },
        { label: '刷新', role: 'reload', accelerator: 'CmdOrCtrl+R' },
      ]
    }
  ]);

  Menu.setApplicationMenu(menu);

  // Windows 下设置系统托盘菜单
  if (process.platform === 'win32') {
    try {
      appicon = new Tray(join(__dirname, '../icon.png'));
      appicon.setToolTip('AiDeer');
      appicon.setContextMenu(menu);
    } catch (error) {
      console.log('Failed to create tray icon:', error);
    }
  }

  // 处理外部链接 - 监听窗口加载完成事件
  mainWindow.webContents.on('did-finish-load', () => {
    mainWindow.webContents.setWindowOpenHandler(({ url }) => {
      // 允许 file: 协议
      if (url.startsWith('file:')) {
        return { action: 'allow' };
      }
      // 其他外部链接用浏览器打开
      shell.openExternal(url);
      return { action: 'deny' };
    });
  });
}

// 启动后端服务器
async function startBackendServer() {
  // 修复环境变量
  const sENV = await shellEnv();
  
  const backendPath = join(__dirname, '../resources/index.js');

  // 日志文件路径
const LOG_FILE = '/tmp/deerlog.log';

// 简单的日志函数
function log(...args) {
  const msg = `[${new Date().toISOString()}] ${args.join(' ')}\n`;
  // fs.appendFileSync(LOG_FILE, msg);
}
  
  backendProcess = spawn(process.execPath, [backendPath], {
  stdio: ['pipe','pipe','pipe'],
  env: { ...sENV, ...process.env, PORT: BACKEND_PORT, ELECTRON_RUN_AS_NODE: '1', AI_DEER_DATA_PATH: join(app.getPath('appData'),'aideer') }
});

backendProcess.stdout.on('data', (data) => log('stdout:', data.toString()));
backendProcess.stderr.on('data', (data) => log('stderr:', data.toString()));

backendProcess.on('exit', (code) => {
  log(`data dir ${join(app.getPath('appData'),'aideer')}`)
  log(`Backend server exited with code ${code}`);
});
}

// 当 Electron 完成初始化并准备创建浏览器窗口时调用此方法
app.whenReady().then(async () => {
  await startBackendServer();
  
  // 等待后端服务器启动后再创建窗口
  setTimeout(() => {
    createWindow();
  }, 1000);

  app.on('activate', () => {
    // 在 macOS 上，当点击 dock 图标并且没有其他窗口打开时，
    // 通常在应用程序中重新创建一个窗口。
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

// 当所有窗口都被关闭时退出应用
app.on('window-all-closed', () => {
  // 关闭后端服务器
  if (backendProcess) {
    backendProcess.kill();
  }
  
  // 在 macOS 上，除非用户用 Cmd + Q 确定地退出，
  // 否则绝大部分应用及其菜单栏会保持激活。
  // if (process.platform !== 'darwin') {
    app.quit();
  // }
});

// 应用退出前清理
app.on('before-quit', () => {
  if (backendProcess) {
    backendProcess.kill();
  }
});

// IPC 处理程序

// 文件选择对话框
ipcMain.handle('dialog:openFile', async () => {
  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ['openFile'],
    filters: [
      { name: 'All Files', extensions: ['*'] },
      { name: 'Images', extensions: ['jpg', 'png', 'gif', 'bmp', 'svg'] },
      { name: 'Documents', extensions: ['pdf', 'doc', 'docx', 'txt'] },
    ],
  });
  return result;
});

// 目录选择对话框
ipcMain.handle('dialog:openDirectory', async () => {
  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ['openDirectory'],
  });
  return result;
});

// 保存文件对话框
ipcMain.handle('dialog:saveFile', async () => {
  const result = await dialog.showSaveDialog(mainWindow, {
    filters: [
      { name: 'All Files', extensions: ['*'] },
    ],
  });
  return result;
});

// 获取应用版本
ipcMain.handle('app:getVersion', () => {
  return app.getVersion();
});

// 存储操作
ipcMain.handle('store:get', (event, key) => {
  return store.get(key);
});

ipcMain.handle('store:set', (event, key, value) => {
  store.set(key, value);
});

ipcMain.handle('store:delete', (event, key) => {
  store.delete(key);
});

// 开发模式配置
if (isDev) {
  // 开发模式下的额外配置
  console.log('Running in development mode');
}