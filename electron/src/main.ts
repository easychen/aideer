import { app, BrowserWindow, ipcMain, dialog, shell } from 'electron';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import Store from 'electron-store';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// 配置存储
const store = new Store();

// 保持对窗口对象的全局引用
let mainWindow: BrowserWindow | null = null;

const isDev = process.env.NODE_ENV === 'development';
const FRONTEND_URL = isDev ? 'http://localhost:3000' : `file://${join(__dirname, '../frontend/dist/index.html')}`;

function createWindow(): void {
  // 创建浏览器窗口
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: join(__dirname, 'preload.js'),
    },
    titleBarStyle: 'hiddenInset',
    show: false, // 先隐藏，等待ready-to-show事件
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

  // 处理外部链接
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });
}

// 当 Electron 完成初始化并准备创建浏览器窗口时调用此方法
app.whenReady().then(() => {
  createWindow();

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
  // 在 macOS 上，除非用户用 Cmd + Q 确定地退出，
  // 否则绝大部分应用及其菜单栏会保持激活。
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// IPC 处理程序

// 文件选择对话框
ipcMain.handle('dialog:openFile', async () => {
  const result = await dialog.showOpenDialog(mainWindow!, {
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
  const result = await dialog.showOpenDialog(mainWindow!, {
    properties: ['openDirectory'],
  });
  return result;
});

// 保存文件对话框
ipcMain.handle('dialog:saveFile', async () => {
  const result = await dialog.showSaveDialog(mainWindow!, {
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
ipcMain.handle('store:get', (event, key: string) => {
  return store.get(key);
});

ipcMain.handle('store:set', (event, key: string, value: any) => {
  store.set(key, value);
});

ipcMain.handle('store:delete', (event, key: string) => {
  store.delete(key);
});

// 开发模式配置
if (isDev) {
  // 可以在这里添加开发模式特定的配置
  console.log('Running in development mode');
}

export {};