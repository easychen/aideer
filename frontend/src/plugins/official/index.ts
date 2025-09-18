import { pluginRegistry } from '../registry/PluginRegistry';
import CharacterCardPlugin from './character-card/CharacterCardPlugin';
import ImagePromptPlugin from './image-prompt/ImagePromptPlugin';

// 注册官方插件
export function registerOfficialPlugins() {
  // 注册角色卡插件
  const characterCardPlugin = {
    ...CharacterCardPlugin,
    metadata: {
      ...CharacterCardPlugin.metadata,
      category: 'viewer' as const
    }
  };
  pluginRegistry.register(characterCardPlugin);

  // 注册图片提示词插件
  const imagePromptPlugin = {
    ...ImagePromptPlugin,
    metadata: {
      ...ImagePromptPlugin.metadata,
      category: 'viewer' as const
    }
  };
  pluginRegistry.register(imagePromptPlugin);

  console.log('官方插件注册完成');
  console.log('API URL:', import.meta.env.VITE_API_URL);
  console.log('RESOURCE HOST:', import.meta.env.VITE_RESOURCE_HOST);
}

// 导出所有官方插件
export {
  CharacterCardPlugin,
  ImagePromptPlugin,
};