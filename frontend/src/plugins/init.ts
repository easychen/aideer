import { registerOfficialPlugins } from './official/index';

let isInitialized = false;

/**
 * 初始化插件系统
 * 注册所有官方插件
 */
export function initializePlugins() {
  if (isInitialized) {
    console.log('插件系统已经初始化过了');
    return;
  }
  
  try {
    // 注册官方插件
    registerOfficialPlugins();
    
    isInitialized = true;
    
    console.log('插件系统初始化完成');
  } catch (error) {
    console.error('插件系统初始化失败:', error);
  }
}