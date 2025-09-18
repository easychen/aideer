// 默认API地址和保存路径
const DEFAULT_API_URL = 'http://localhost:3001';
const DEFAULT_SAVE_PATH = '/downloads/images';

// DOM元素
const apiUrlInput = document.getElementById('apiUrl') as HTMLInputElement;
const savePathInput = document.getElementById('savePath') as HTMLInputElement;
const saveBtn = document.getElementById('saveBtn') as HTMLButtonElement;
const testBtn = document.getElementById('testBtn') as HTMLButtonElement;
const collectBtn = document.getElementById('collectBtn') as HTMLButtonElement;
const statusDiv = document.getElementById('status') as HTMLDivElement;

// 显示状态消息
function showStatus(message: string, type: 'success' | 'error') {
  statusDiv.textContent = message;
  statusDiv.className = `status ${type}`;
  statusDiv.style.display = 'block';
  
  // 3秒后自动隐藏
  setTimeout(() => {
    statusDiv.style.display = 'none';
  }, 3000);
}

// 获取API地址
async function getApiUrl(): Promise<string> {
  const result = await chrome.storage.sync.get(['apiUrl']);
  return result.apiUrl || DEFAULT_API_URL;
}

// 获取保存路径
async function getSavePath(): Promise<string> {
  const result = await chrome.storage.sync.get(['savePath']);
  return result.savePath || DEFAULT_SAVE_PATH;
}

// 保存API地址
async function saveApiUrl(url: string): Promise<void> {
  await chrome.storage.sync.set({ apiUrl: url });
}

// 保存保存路径
async function saveSavePath(path: string): Promise<void> {
  await chrome.storage.sync.set({ savePath: path });
}

// 测试API连接
async function testConnection(url: string): Promise<boolean> {
  try {
    const response = await fetch(`${url}/api/health`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    return response.ok;
  } catch (error) {
    console.error('Connection test failed:', error);
    return false;
  }
}

// 初始化页面
async function init() {
  const currentApiUrl = await getApiUrl();
  const currentSavePath = await getSavePath();
  apiUrlInput.value = currentApiUrl;
  savePathInput.value = currentSavePath;
}

// 保存设置
saveBtn.addEventListener('click', async () => {
  const url = apiUrlInput.value.trim();
  const path = savePathInput.value.trim();
  
  if (!url) {
    showStatus('请输入API地址', 'error');
    return;
  }
  
  if (!path) {
    showStatus('请输入保存路径', 'error');
    return;
  }
  
  // 验证URL格式
  try {
    new URL(url);
  } catch {
    showStatus('请输入有效的URL地址', 'error');
    return;
  }
  
  try {
    await saveApiUrl(url);
    await saveSavePath(path);
    showStatus('设置保存成功', 'success');
  } catch (error) {
    console.error('Save failed:', error);
    showStatus('保存失败，请重试', 'error');
  }
});

// 测试连接
testBtn.addEventListener('click', async () => {
  const url = apiUrlInput.value.trim();
  
  if (!url) {
    showStatus('请输入API地址', 'error');
    return;
  }
  
  testBtn.disabled = true;
  testBtn.textContent = '测试中...';
  
  try {
    const isConnected = await testConnection(url);
    if (isConnected) {
      showStatus('连接成功', 'success');
    } else {
      showStatus('连接失败，请检查地址和服务状态', 'error');
    }
  } catch (error) {
    console.error('Test failed:', error);
    showStatus('测试失败', 'error');
  } finally {
    testBtn.disabled = false;
    testBtn.textContent = '测试连接';
  }
});

// 开始收集媒体
collectBtn.addEventListener('click', async () => {
  try {
    // 获取当前活动标签页
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    
    if (!tab.id) {
      showStatus('无法获取当前标签页', 'error');
      return;
    }
    
    // 向content script发送消息
    await chrome.tabs.sendMessage(tab.id, { action: 'show-media-collector' });
    
    // 关闭popup
    window.close();
  } catch (error) {
    console.error('Failed to start media collection:', error);
    showStatus('启动失败，请刷新页面后重试', 'error');
  }
});

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', init);