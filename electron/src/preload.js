const { contextBridge, ipcRenderer } = require('electron');

// 暴露受保护的方法给渲染进程
const electronAPI = {
  // 对话框
  openFileDialog: () => ipcRenderer.invoke('dialog:openFile'),
  openDirectoryDialog: () => ipcRenderer.invoke('dialog:openDirectory'),
  saveFileDialog: () => ipcRenderer.invoke('dialog:saveFile'),
  
  // 应用信息
  getAppVersion: () => ipcRenderer.invoke('app:getVersion'),
  
  // 存储
  store: {
    get: (key) => ipcRenderer.invoke('store:get', key),
    set: (key, value) => ipcRenderer.invoke('store:set', key, value),
    delete: (key) => ipcRenderer.invoke('store:delete', key),
  },
  
  // 平台信息
  platform: process.platform,
  isElectron: true,
};

// 将API暴露给渲染进程
contextBridge.exposeInMainWorld('electronAPI', electronAPI);