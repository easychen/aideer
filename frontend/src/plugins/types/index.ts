import React from 'react';
import { FileItem } from '../../types/index';

/**
 * 插件元数据接口
 */
export interface PluginMetadata {
  /** 插件唯一标识 */
  id: string;
  /** 插件显示名称 */
  name: string;
  /** 插件版本 */
  version: string;
  /** 插件描述 */
  description: string;
  /** 插件作者 */
  author: string;
  /** 支持的文件扩展名（小写，不包含点号） */
  supportedExtensions: string[];
  /** 插件图标组件 */
  icon?: React.ComponentType<{ className?: string }>;
  /** 插件分类 */
  category?: 'viewer' | 'editor' | 'analyzer' | 'converter' | 'other';
  /** 插件标签 */
  tags?: string[];
}

/**
 * 插件组件属性接口
 */
export interface PluginComponentProps {
  /** 当前文件信息 */
  file: FileItem;
  /** 项目ID */
  projectId: number;
  /** 错误处理回调 */
  onError?: (error: Error) => void;
  /** 插件API接口 */
  api?: PluginAPI;
  /** 插件隐藏回调 - 插件可以调用此函数来请求隐藏自己的tab */
  onShouldHide?: (shouldHide: boolean, reason?: string) => void;
}

/**
 * 插件API接口
 */
export interface PluginAPI {
  /** 文件操作 */
  file: {
    /** 获取文件静态URL */
    getUrl: (relativePath: string, projectId?: number) => string;
    /** 更新文件内容 */
    updateFile: (relativePath: string, content: ArrayBuffer | string, projectId?: number) => Promise<boolean>;
    /** 创建新文件 */
    createFile: (relativePath: string, content: ArrayBuffer | string, projectId?: number) => Promise<boolean>;
  };
  
  /** UI交互 */
  ui: {
    /** 显示通知 */
    showNotification: (message: string, type?: 'info' | 'success' | 'error' | 'warning') => void;
    /** 显示确认对话框 */
    showConfirm: (message: string, title?: string) => Promise<boolean>;
    /** 显示输入对话框 */
    showPrompt: (message: string, defaultValue?: string, title?: string) => Promise<string | null>;
  };
  
  /** 数据存储 */
  storage: {
    /** 获取插件数据 */
    get: (key: string) => any;
    /** 设置插件数据 */
    set: (key: string, value: any) => void;
    /** 删除插件数据 */
    remove: (key: string) => void;
    /** 清空插件数据 */
    clear: () => void;
  };
}

/**
 * 插件定义接口
 */
export interface Plugin {
  /** 插件元数据 */
  metadata: PluginMetadata;
  /** 插件组件 */
  component: React.ComponentType<PluginComponentProps>;
  /** 插件是否启用 */
  isEnabled: boolean;
  /** 插件配置 */
  config?: Record<string, any>;
}

/**
 * 插件注册选项
 */
export interface PluginRegistrationOptions {
  /** 是否默认启用 */
  defaultEnabled?: boolean;
  /** 插件优先级（数字越大优先级越高） */
  priority?: number;
  /** 插件依赖 */
  dependencies?: string[];
}

/**
 * 插件状态
 */
export type PluginStatus = 'loading' | 'ready' | 'error' | 'disabled';

/**
 * 插件错误信息
 */
export interface PluginError {
  pluginId: string;
  message: string;
  stack?: string;
  timestamp: number;
}

/**
 * 插件事件类型
 */
export type PluginEventType = 
  | 'plugin:registered'
  | 'plugin:enabled'
  | 'plugin:disabled'
  | 'plugin:error'
  | 'plugin:loaded'
  | 'plugin:unloaded';

/**
 * 插件事件数据
 */
export interface PluginEvent {
  type: PluginEventType;
  pluginId: string;
  data?: any;
  timestamp: number;
}

/**
 * 插件事件监听器
 */
export type PluginEventListener = (event: PluginEvent) => void;

/**
 * 插件容器属性
 */
export interface PluginContainerProps {
  /** 当前文件 */
  file: FileItem;
  /** 项目ID */
  projectId: number;
  /** 默认激活的插件ID */
  defaultActivePlugin?: string;
  /** 插件切换回调 */
  onPluginChange?: (pluginId: string | null) => void;
}

/**
 * 插件标签页属性
 */
export interface PluginTabProps {
  /** 插件信息 */
  plugin: Plugin;
  /** 是否激活 */
  isActive: boolean;
  /** 点击回调 */
  onClick: () => void;
}

/**
 * 插件设置项
 */
export interface PluginSetting {
  /** 设置键 */
  key: string;
  /** 设置标签 */
  label: string;
  /** 设置描述 */
  description?: string;
  /** 设置类型 */
  type: 'boolean' | 'string' | 'number' | 'select' | 'multiselect';
  /** 默认值 */
  defaultValue?: any;
  /** 选项（用于select和multiselect类型） */
  options?: Array<{ label: string; value: any }>;
  /** 验证函数 */
  validate?: (value: any) => boolean | string;
}

/**
 * 插件配置接口
 */
export interface PluginConfig {
  /** 插件ID */
  pluginId: string;
  /** 配置项 */
  settings: PluginSetting[];
  /** 当前配置值 */
  values: Record<string, any>;
}

/**
 * 插件管理器接口
 */
export interface IPluginManager {
  /** 注册插件 */
  register(plugin: Plugin, options?: PluginRegistrationOptions): void;
  
  /** 注销插件 */
  unregister(pluginId: string): void;
  
  /** 启用插件 */
  enable(pluginId: string): void;
  
  /** 禁用插件 */
  disable(pluginId: string): void;
  
  /** 获取插件 */
  getPlugin(pluginId: string): Plugin | undefined;
  
  /** 获取所有插件 */
  getAllPlugins(): Plugin[];
  
  /** 获取支持指定扩展名的插件 */
  getPluginsForExtension(extension: string): Plugin[];
  
  /** 获取支持指定文件的插件 */
  getPluginsForFile(fileName: string): Plugin[];
  
  /** 添加事件监听器 */
  addEventListener(type: PluginEventType, listener: PluginEventListener): void;
  
  /** 移除事件监听器 */
  removeEventListener(type: PluginEventType, listener: PluginEventListener): void;
  
  /** 触发事件 */
  emit(event: PluginEvent): void;
}

/**
 * 插件注册器接口
 */
export interface IPluginRegistry {
  /** 注册插件 */
  register(plugin: Plugin, options?: PluginRegistrationOptions): void;
  
  /** 获取插件 */
  get(pluginId: string): Plugin | undefined;
  
  /** 获取所有插件 */
  getAll(): Plugin[];
  
  /** 获取支持指定扩展名的插件 */
  getByExtension(extension: string): Plugin[];
  
  /** 检查插件是否存在 */
  has(pluginId: string): boolean;
  
  /** 删除插件 */
  delete(pluginId: string): boolean;
  
  /** 清空所有插件 */
  clear(): void;
}