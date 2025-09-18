export default defineBackground(() => {
  console.log('AiDeer Importer background script loaded');

  // 检查Chrome API是否可用
  if (typeof chrome !== 'undefined' && chrome.runtime) {
    // 创建右键菜单
    if (chrome.contextMenus) {
      // 先清除可能存在的旧菜单项
      chrome.contextMenus.removeAll(() => {
        // 批量收集媒体文件菜单
        chrome.contextMenus.create({
          id: 'aideer-collect-media',
          title: '收集页面媒体文件',
          contexts: ['page']
        });

        // 保存单个图片/视频菜单
        chrome.contextMenus.create({
          id: 'aideer-save-single-media',
          title: '保存到 AiDeer',
          contexts: ['image', 'video']
        });
      });

      // 处理右键菜单点击
      chrome.contextMenus.onClicked.addListener((info, tab) => {
        if (!tab?.id) return;

        if (info.menuItemId === 'aideer-collect-media') {
          chrome.tabs.sendMessage(tab.id, { action: 'show-media-collector' });
        } else if (info.menuItemId === 'aideer-save-single-media') {
          chrome.tabs.sendMessage(tab.id, { 
            action: 'save-single-media',
            mediaUrl: info.srcUrl,
            pageUrl: info.pageUrl
          });
        }
      });
    }

    // 处理插件图标点击
    if (chrome.action) {
      chrome.action.onClicked.addListener((tab) => {
        if (tab.id) {
          chrome.tabs.sendMessage(tab.id, { action: 'show-media-collector' });
        }
      });
    }
  }
});