import { 
  Plugin, 
  IPluginManager, 
  PluginRegistrationOptions, 
  PluginEvent, 
  PluginEventType, 
  PluginEventListener,
  PluginAPI
} from '../types/index';
import { pluginRegistry } from '../registry/PluginRegistry';

/**
 * 插件管理器实现
 * 负责插件的生命周期管理、事件处理和API提供
 */
export class PluginManager implements IPluginManager {
  private eventListeners: Map<PluginEventType, Set<PluginEventListener>> = new Map();
  private pluginStorage: Map<string, Record<string, any>> = new Map();
  private apiCache: Map<string, PluginAPI> = new Map();

  constructor() {
    this.initializeEventListeners();
  }

  /**
   * 注册插件
   * @param plugin 插件对象
   * @param options 注册选项
   */
  register(plugin: Plugin, options?: PluginRegistrationOptions): void {
    try {
      // 使用注册器注册插件
      pluginRegistry.register(plugin, options);
      
      // 触发注册事件
      this.emit({
        type: 'plugin:registered',
        pluginId: plugin.metadata.id,
        data: { plugin, options },
        timestamp: Date.now()
      });

      // 如果插件默认启用，触发启用事件
      if (plugin.isEnabled) {
        this.emit({
          type: 'plugin:enabled',
          pluginId: plugin.metadata.id,
          timestamp: Date.now()
        });
      }

    } catch (error) {
      this.handlePluginError(plugin.metadata.id, error as Error);
      throw error;
    }
  }

  /**
   * 注销插件
   * @param pluginId 插件ID
   */
  unregister(pluginId: string): void {
    try {
      const plugin = pluginRegistry.get(pluginId);
      if (!plugin) {
        throw new Error(`Plugin '${pluginId}' not found`);
      }

      // 清理插件数据
      this.pluginStorage.delete(pluginId);
      this.apiCache.delete(pluginId);

      // 从注册器中删除
      pluginRegistry.delete(pluginId);

      // 触发卸载事件
      this.emit({
        type: 'plugin:unloaded',
        pluginId,
        timestamp: Date.now()
      });

    } catch (error) {
      this.handlePluginError(pluginId, error as Error);
      throw error;
    }
  }

  /**
   * 启用插件
   * @param pluginId 插件ID
   */
  enable(pluginId: string): void {
    try {
      pluginRegistry.enable(pluginId);
      
      this.emit({
        type: 'plugin:enabled',
        pluginId,
        timestamp: Date.now()
      });

    } catch (error) {
      this.handlePluginError(pluginId, error as Error);
      throw error;
    }
  }

  /**
   * 禁用插件
   * @param pluginId 插件ID
   */
  disable(pluginId: string): void {
    try {
      pluginRegistry.disable(pluginId);
      
      this.emit({
        type: 'plugin:disabled',
        pluginId,
        timestamp: Date.now()
      });

    } catch (error) {
      this.handlePluginError(pluginId, error as Error);
      throw error;
    }
  }

  /**
   * 获取插件
   * @param pluginId 插件ID
   * @returns 插件对象或undefined
   */
  getPlugin(pluginId: string): Plugin | undefined {
    return pluginRegistry.get(pluginId);
  }

  /**
   * 获取所有插件
   * @returns 所有插件的数组
   */
  getAllPlugins(): Plugin[] {
    return pluginRegistry.getAll();
  }

  /**
   * 获取支持指定扩展名的插件
   * @param extension 文件扩展名
   * @returns 支持该扩展名的插件数组
   */
  getPluginsForExtension(extension: string): Plugin[] {
    return pluginRegistry.getByExtension(extension);
  }

  /**
   * 获取支持指定文件的插件
   * @param fileName 文件名
   * @returns 支持该文件的插件数组
   */
  getPluginsForFile(fileName: string): Plugin[] {
    const extension = this.extractFileExtension(fileName);
    return extension ? this.getPluginsForExtension(extension) : [];
  }

  /**
   * 添加事件监听器
   * @param type 事件类型
   * @param listener 监听器函数
   */
  addEventListener(type: PluginEventType, listener: PluginEventListener): void {
    if (!this.eventListeners.has(type)) {
      this.eventListeners.set(type, new Set());
    }
    this.eventListeners.get(type)!.add(listener);
  }

  /**
   * 移除事件监听器
   * @param type 事件类型
   * @param listener 监听器函数
   */
  removeEventListener(type: PluginEventType, listener: PluginEventListener): void {
    const listeners = this.eventListeners.get(type);
    if (listeners) {
      listeners.delete(listener);
      if (listeners.size === 0) {
        this.eventListeners.delete(type);
      }
    }
  }

  /**
   * 触发事件
   * @param event 事件对象
   */
  emit(event: PluginEvent): void {
    const listeners = this.eventListeners.get(event.type);
    if (listeners) {
      listeners.forEach(listener => {
        try {
          listener(event);
        } catch (error) {
          console.error(`Error in plugin event listener for ${event.type}:`, error);
        }
      });
    }
  }

  /**
   * 为插件创建API接口
   * @param pluginId 插件ID
   * @returns 插件API对象
   */
  createPluginAPI(pluginId: string): PluginAPI {
    // 检查缓存
    if (this.apiCache.has(pluginId)) {
      return this.apiCache.get(pluginId)!;
    }

    const api: PluginAPI = {
      // 文件操作
      file: {
        getUrl: (relativePath: string, projectId?: number): string => {
          const pid = projectId || 4; // 默认使用mybook项目
          // 根据项目ID映射到正确的项目名称
          const projectNameMap: Record<number, string> = {
            2: 'test-project',
            3: 'new-test-project', 
            4: 'mybook'
          };
          const projectName = projectNameMap[pid] || 'mybook';
          return `http://localhost:3001/data/${projectName}/${relativePath}`;
        },
        
        updateFile: async (relativePath: string, content: ArrayBuffer | string, projectId?: number): Promise<boolean> => {
          try {
            const pid = projectId || 4; // 默认使用mybook项目
            
            // 首先需要获取文件信息来获取文件ID
            const response = await fetch(`/api/files?projectId=${pid}`, {
              method: 'GET',
              headers: {
                'Content-Type': 'application/json'
              }
            });
            
            if (!response.ok) {
              console.error('Failed to fetch files list');
              return false;
            }
            
            const result = await response.json();
            const files = result.data?.files || [];
            
            // 查找匹配的文件
            const targetFile = files.find((file: any) => file.relativePath === relativePath);
            
            if (!targetFile) {
              console.error('File not found:', relativePath);
              return false;
            }
            
            // 根据内容类型选择不同的API
            let updateResponse: Response;
            
            if (content instanceof ArrayBuffer) {
              // 使用新的二进制接口，直接传输二进制数据
              const formData = new FormData();
              formData.append('projectId', pid.toString());
              formData.append('file', new Blob([content]));
              
              updateResponse = await fetch(`/api/files/${targetFile.id}/content/binary`, {
                method: 'PUT',
                body: formData
              });
            } else {
              // 字符串内容使用原有的JSON接口
              updateResponse = await fetch(`/api/files/${targetFile.id}/content`, {
                method: 'PUT',
                headers: {
                  'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                  projectId: pid,
                  content: content
                })
              });
            }
            
            if (!updateResponse.ok) {
              console.error('Failed to update file:', await updateResponse.text());
              return false;
            }
            
            const updateResult = await updateResponse.json();
             return updateResult.success;
           } catch (error) {
             console.error('Error updating file:', error);
             return false;
           }
         },
         
         createFile: async (relativePath: string, content: ArrayBuffer | string, projectId?: number): Promise<boolean> => {
           try {
             const pid = projectId || 4; // 默认使用mybook项目
             
             let createResponse: Response;
             
             if (content instanceof ArrayBuffer) {
               // 使用上传接口直接传输二进制数据
               const formData = new FormData();
               formData.append('projectId', pid.toString());
               formData.append('targetPath', '');
               formData.append('filePaths', JSON.stringify([relativePath]));
               formData.append('files', new Blob([content]), relativePath.split('/').pop() || 'file');
               
               createResponse = await fetch('/api/files/upload', {
                 method: 'POST',
                 body: formData
               });
             } else {
               // 字符串内容使用原有的JSON接口
               createResponse = await fetch('/api/files', {
                 method: 'POST',
                 headers: {
                   'Content-Type': 'application/json'
                 },
                 body: JSON.stringify({
                   projectId: pid.toString(),
                   relativePath: relativePath,
                   content: content
                 })
               });
             }
             
             if (!createResponse.ok) {
               console.error('Failed to create file:', await createResponse.text());
               return false;
             }
             
             const createResult = await createResponse.json();
             return createResult.success;
           } catch (error) {
             console.error('Error creating file:', error);
             return false;
           }
         }
       },

       // UI操作
       ui: {
         showNotification: (message: string, type: 'info' | 'success' | 'warning' | 'error' = 'info'): void => {
           console.log(`[${type.toUpperCase()}] ${message}`);
         },
         
         showConfirm: async (message: string, title?: string): Promise<boolean> => {
           return window.confirm(title ? `${title}\n\n${message}` : message);
         },
         
         showPrompt: async (message: string, defaultValue?: string, title?: string): Promise<string | null> => {
           return window.prompt(title ? `${title}\n\n${message}` : message, defaultValue);
         }
       },

       // 存储操作
       storage: {
        get: async (key: string): Promise<any> => {
          const pluginData = this.pluginStorage.get(pluginId) || {};
          return pluginData[key];
        },
        
        set: async (key: string, value: any): Promise<void> => {
          const pluginData = this.pluginStorage.get(pluginId) || {};
          pluginData[key] = value;
          this.pluginStorage.set(pluginId, pluginData);
        },
        
        remove: async (key: string): Promise<void> => {
          const pluginData = this.pluginStorage.get(pluginId) || {};
          delete pluginData[key];
          this.pluginStorage.set(pluginId, pluginData);
        },
        
        clear: async (): Promise<void> => {
          this.pluginStorage.set(pluginId, {});
        }
      }
    };

    // 缓存API对象
    this.apiCache.set(pluginId, api);
    return api;
  }

  /**
   * 初始化事件监听器
   */
  private initializeEventListeners(): void {
    // 监听插件错误事件，进行日志记录
    this.addEventListener('plugin:error', (event) => {
      console.error(`Plugin error in '${event.pluginId}':`, event.data);
    });

    // 监听插件状态变化，进行日志记录
    this.addEventListener('plugin:enabled', (event) => {
      console.log(`Plugin '${event.pluginId}' enabled`);
    });

    this.addEventListener('plugin:disabled', (event) => {
      console.log(`Plugin '${event.pluginId}' disabled`);
    });
  }

  /**
   * 处理插件错误
   * @param pluginId 插件ID
   * @param error 错误对象
   */
  private handlePluginError(pluginId: string, error: Error): void {
    this.emit({
      type: 'plugin:error',
      pluginId,
      data: {
        message: error.message,
        stack: error.stack,
        timestamp: Date.now()
      },
      timestamp: Date.now()
    });
  }

  /**
   * 提取文件扩展名
   * @param fileName 文件名
   * @returns 扩展名（不包含点号）或null
   */
  private extractFileExtension(fileName: string): string | null {
    const lastDotIndex = fileName.lastIndexOf('.');
    if (lastDotIndex === -1 || lastDotIndex === fileName.length - 1) {
      return null;
    }
    return fileName.substring(lastDotIndex + 1).toLowerCase();
  }

  // /**
  //  * 持久化插件存储数据
  //  * @param pluginId 插件ID
  //  */
  // private persistPluginStorage(pluginId: string): void {
  //   try {
  //     const pluginData = this.pluginStorage.get(pluginId);
  //     if (pluginData) {
  //       const storageKey = `plugin_storage_${pluginId}`;
  //       localStorage.setItem(storageKey, JSON.stringify(pluginData));
  //     }
  //   } catch (error) {
  //     console.warn(`Failed to persist storage for plugin '${pluginId}':`, error);
  //   }
  // }

  /**
   * 加载插件存储数据
   * @param pluginId 插件ID
   */
  private loadPluginStorage(pluginId: string): void {
    try {
      const storageKey = `plugin_storage_${pluginId}`;
      const storedData = localStorage.getItem(storageKey);
      if (storedData) {
        const pluginData = JSON.parse(storedData);
        this.pluginStorage.set(pluginId, pluginData);
      }
    } catch (error) {
      console.warn(`Failed to load storage for plugin '${pluginId}':`, error);
    }
  }

  /**
   * 初始化插件存储
   */
  initializeStorage(): void {
    const plugins = this.getAllPlugins();
    plugins.forEach(plugin => {
      this.loadPluginStorage(plugin.metadata.id);
    });
  }
}

// 创建全局插件管理器实例
export const pluginManager = new PluginManager();