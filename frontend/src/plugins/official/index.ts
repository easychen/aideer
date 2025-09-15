import { pluginRegistry } from '../registry/PluginRegistry';
import CharacterCardPlugin from './character-card/CharacterCardPlugin';

// 注册官方插件
export function registerOfficialPlugins() {
  // 确保插件的category字段符合类型定义
  const plugin = {
    ...CharacterCardPlugin,
    metadata: {
      ...CharacterCardPlugin.metadata,
      category: 'viewer' as const
    }
  };
  pluginRegistry.register(plugin);
  console.log('官方插件注册完成');
  console.log('API URL:', import.meta.env.VITE_API_URL);
  console.log('RESOURCE HOST:', import.meta.env.VITE_RESOURCE_HOST);
}

// 导出所有官方插件
export {
  CharacterCardPlugin,
};