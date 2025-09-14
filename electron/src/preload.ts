import { contextBridge, ipcRenderer } from 'electron';

// 定义API接口
interface ElectronAPI {
  // 对话框API
  openFileDialog: () => Promise<Electron.OpenDialogReturnValue>;
  openDirectoryDialog: () => Promise<Electron.OpenDialogReturnValue>;
  saveFileDialog: () => Promise<Electron.SaveDialogReturnValue>;
  
  // 应用信息API
  getAppVersion: () => Promise<string>;
  
  // 存储API
  store: {
    get: (key: string) => Promise<any>;
    set: (key: string, value: any) => Promise<void>;
    delete: (key: string) => Promise<void>;
  };
  
  // 平台信息
  platform: string;
  isElectron: boolean;
}

// 暴露受保护的方法给渲染进程
const electronAPI: ElectronAPI = {
  // 对话框
  openFileDialog: () => ipcRenderer.invoke('dialog:openFile'),
  openDirectoryDialog: () => ipcRenderer.invoke('dialog:openDirectory'),
  saveFileDialog: () => ipcRenderer.invoke('dialog:saveFile'),
  
  // 应用信息
  getAppVersion: () => ipcRenderer.invoke('app:getVersion'),
  
  // 存储
  store: {
    get: (key: string) => ipcRenderer.invoke('store:get', key),
    set: (key: string, value: any) => ipcRenderer.invoke('store:set', key, value),
    delete: (key: string) => ipcRenderer.invoke('store:delete', key),
  },
  
  // 平台信息
  platform: process.platform,
  isElectron: true,
};

// 将API暴露给渲染进程
contextBridge.exposeInMainWorld('electronAPI', electronAPI);

// 类型声明，供TypeScript使用
declare global {
  interface Window {
    electronAPI: ElectronAPI;
  }
}

export {};