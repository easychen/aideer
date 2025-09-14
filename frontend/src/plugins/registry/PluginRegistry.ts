import { Plugin, IPluginRegistry, PluginRegistrationOptions } from '../types/index';

/**
 * 插件注册器实现
 * 负责管理所有已注册的插件
 */
export class PluginRegistry implements IPluginRegistry {
  private plugins: Map<string, Plugin> = new Map();
  private extensionMap: Map<string, Set<string>> = new Map();
  private priorities: Map<string, number> = new Map();
  private dependencies: Map<string, string[]> = new Map();

  /**
   * 注册插件
   * @param plugin 插件对象
   * @param options 注册选项
   */
  register(plugin: Plugin, options: PluginRegistrationOptions = {}): void {
    const { defaultEnabled = true, priority = 0, dependencies = [] } = options;
    
    // 检查插件ID是否已存在
    if (this.plugins.has(plugin.metadata.id)) {
      throw new Error(`Plugin with id '${plugin.metadata.id}' is already registered`);
    }

    // 验证插件元数据
    this.validatePlugin(plugin);

    // 检查依赖
    this.validateDependencies(plugin.metadata.id, dependencies);

    // 设置默认启用状态
    const pluginWithDefaults: Plugin = {
      ...plugin,
      isEnabled: defaultEnabled,
      config: plugin.config || {}
    };

    // 注册插件
    this.plugins.set(plugin.metadata.id, pluginWithDefaults);
    this.priorities.set(plugin.metadata.id, priority);
    this.dependencies.set(plugin.metadata.id, dependencies);

    // 更新扩展名映射
    this.updateExtensionMap(plugin.metadata.id, plugin.metadata.supportedExtensions);

    console.log(`Plugin '${plugin.metadata.name}' (${plugin.metadata.id}) registered successfully`);
  }

  /**
   * 获取插件
   * @param pluginId 插件ID
   * @returns 插件对象或undefined
   */
  get(pluginId: string): Plugin | undefined {
    return this.plugins.get(pluginId);
  }

  /**
   * 获取所有插件
   * @returns 所有插件的数组
   */
  getAll(): Plugin[] {
    return Array.from(this.plugins.values())
      .sort((a, b) => {
        const priorityA = this.priorities.get(a.metadata.id) || 0;
        const priorityB = this.priorities.get(b.metadata.id) || 0;
        return priorityB - priorityA; // 优先级高的排在前面
      });
  }

  /**
   * 根据文件扩展名获取支持的插件
   * @param extension 文件扩展名（不包含点号）
   * @returns 支持该扩展名的插件数组
   */
  getByExtension(extension: string): Plugin[] {
    const normalizedExt = extension.toLowerCase();
    const pluginIds = this.extensionMap.get(normalizedExt);
    
    if (!pluginIds) {
      return [];
    }

    return Array.from(pluginIds)
      .map(id => this.plugins.get(id))
      .filter((plugin): plugin is Plugin => plugin !== undefined && plugin.isEnabled)
      .sort((a, b) => {
        const priorityA = this.priorities.get(a.metadata.id) || 0;
        const priorityB = this.priorities.get(b.metadata.id) || 0;
        return priorityB - priorityA;
      });
  }

  /**
   * 检查插件是否存在
   * @param pluginId 插件ID
   * @returns 是否存在
   */
  has(pluginId: string): boolean {
    return this.plugins.has(pluginId);
  }

  /**
   * 删除插件
   * @param pluginId 插件ID
   * @returns 是否删除成功
   */
  delete(pluginId: string): boolean {
    const plugin = this.plugins.get(pluginId);
    if (!plugin) {
      return false;
    }

    // 检查是否有其他插件依赖于此插件
    const dependentPlugins = this.findDependentPlugins(pluginId);
    if (dependentPlugins.length > 0) {
      throw new Error(
        `Cannot delete plugin '${pluginId}' because it is required by: ${dependentPlugins.join(', ')}`
      );
    }

    // 从扩展名映射中移除
    this.removeFromExtensionMap(pluginId, plugin.metadata.supportedExtensions);

    // 删除插件及其相关数据
    this.plugins.delete(pluginId);
    this.priorities.delete(pluginId);
    this.dependencies.delete(pluginId);

    console.log(`Plugin '${plugin.metadata.name}' (${pluginId}) unregistered successfully`);
    return true;
  }

  /**
   * 清空所有插件
   */
  clear(): void {
    this.plugins.clear();
    this.extensionMap.clear();
    this.priorities.clear();
    this.dependencies.clear();
    console.log('All plugins cleared');
  }

  /**
   * 启用插件
   * @param pluginId 插件ID
   */
  enable(pluginId: string): void {
    const plugin = this.plugins.get(pluginId);
    if (!plugin) {
      throw new Error(`Plugin '${pluginId}' not found`);
    }

    // 检查依赖是否满足
    const dependencies = this.dependencies.get(pluginId) || [];
    const missingDeps = dependencies.filter(depId => {
      const depPlugin = this.plugins.get(depId);
      return !depPlugin || !depPlugin.isEnabled;
    });

    if (missingDeps.length > 0) {
      throw new Error(
        `Cannot enable plugin '${pluginId}' because the following dependencies are not enabled: ${missingDeps.join(', ')}`
      );
    }

    plugin.isEnabled = true;
    console.log(`Plugin '${plugin.metadata.name}' (${pluginId}) enabled`);
  }

  /**
   * 禁用插件
   * @param pluginId 插件ID
   */
  disable(pluginId: string): void {
    const plugin = this.plugins.get(pluginId);
    if (!plugin) {
      throw new Error(`Plugin '${pluginId}' not found`);
    }

    // 检查是否有启用的插件依赖于此插件
    const enabledDependents = this.findDependentPlugins(pluginId)
      .filter(depId => {
        const depPlugin = this.plugins.get(depId);
        return depPlugin && depPlugin.isEnabled;
      });

    if (enabledDependents.length > 0) {
      throw new Error(
        `Cannot disable plugin '${pluginId}' because the following enabled plugins depend on it: ${enabledDependents.join(', ')}`
      );
    }

    plugin.isEnabled = false;
    console.log(`Plugin '${plugin.metadata.name}' (${pluginId}) disabled`);
  }

  /**
   * 获取插件的优先级
   * @param pluginId 插件ID
   * @returns 优先级数值
   */
  getPriority(pluginId: string): number {
    return this.priorities.get(pluginId) || 0;
  }

  /**
   * 获取插件的依赖列表
   * @param pluginId 插件ID
   * @returns 依赖插件ID数组
   */
  getDependencies(pluginId: string): string[] {
    return this.dependencies.get(pluginId) || [];
  }

  /**
   * 验证插件对象
   * @param plugin 插件对象
   */
  private validatePlugin(plugin: Plugin): void {
    if (!plugin.metadata) {
      throw new Error('Plugin metadata is required');
    }

    const { id, name, version, supportedExtensions } = plugin.metadata;

    if (!id || typeof id !== 'string') {
      throw new Error('Plugin id is required and must be a string');
    }

    if (!name || typeof name !== 'string') {
      throw new Error('Plugin name is required and must be a string');
    }

    if (!version || typeof version !== 'string') {
      throw new Error('Plugin version is required and must be a string');
    }

    if (!Array.isArray(supportedExtensions) || supportedExtensions.length === 0) {
      throw new Error('Plugin must support at least one file extension');
    }

    if (!plugin.component || typeof plugin.component !== 'function') {
      throw new Error('Plugin component is required and must be a React component');
    }
  }

  /**
   * 验证插件依赖
   * @param pluginId 插件ID
   * @param dependencies 依赖列表
   */
  private validateDependencies(pluginId: string, dependencies: string[]): void {
    // 检查循环依赖
    const visited = new Set<string>();
    const recursionStack = new Set<string>();

    const hasCycle = (id: string): boolean => {
      if (recursionStack.has(id)) {
        return true;
      }
      if (visited.has(id)) {
        return false;
      }

      visited.add(id);
      recursionStack.add(id);

      const deps = id === pluginId ? dependencies : (this.dependencies.get(id) || []);
      for (const depId of deps) {
        if (hasCycle(depId)) {
          return true;
        }
      }

      recursionStack.delete(id);
      return false;
    };

    if (hasCycle(pluginId)) {
      throw new Error(`Circular dependency detected for plugin '${pluginId}'`);
    }
  }

  /**
   * 更新扩展名映射
   * @param pluginId 插件ID
   * @param extensions 支持的扩展名列表
   */
  private updateExtensionMap(pluginId: string, extensions: string[]): void {
    for (const ext of extensions) {
      // 规范化扩展名：去掉点号并转为小写
      const normalizedExt = ext.toLowerCase().replace(/^\./, '');
      if (!this.extensionMap.has(normalizedExt)) {
        this.extensionMap.set(normalizedExt, new Set());
      }
      this.extensionMap.get(normalizedExt)!.add(pluginId);
    }
  }

  /**
   * 从扩展名映射中移除插件
   * @param pluginId 插件ID
   * @param extensions 支持的扩展名列表
   */
  private removeFromExtensionMap(pluginId: string, extensions: string[]): void {
    for (const ext of extensions) {
      // 规范化扩展名：去掉点号并转为小写
      const normalizedExt = ext.toLowerCase().replace(/^\./, '');
      const pluginSet = this.extensionMap.get(normalizedExt);
      if (pluginSet) {
        pluginSet.delete(pluginId);
        if (pluginSet.size === 0) {
          this.extensionMap.delete(normalizedExt);
        }
      }
    }
  }

  /**
   * 查找依赖于指定插件的其他插件
   * @param pluginId 插件ID
   * @returns 依赖插件ID数组
   */
  private findDependentPlugins(pluginId: string): string[] {
    const dependents: string[] = [];
    
    for (const [id, deps] of this.dependencies.entries()) {
      if (deps.includes(pluginId)) {
        dependents.push(id);
      }
    }
    
    return dependents;
  }
}

// 创建全局插件注册器实例
export const pluginRegistry = new PluginRegistry();