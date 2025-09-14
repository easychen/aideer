import { useState } from 'react';
import { X, Monitor, Sun, Moon, Eye, EyeOff, Info } from 'lucide-react';
import { useTheme, ThemeMode } from '../../hooks/useTheme';
import { useSettings } from '../../hooks/useSettings';

interface SettingsDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

type ActiveTab = 'interface' | 'api' | 'about';

const SettingsDialog = ({ isOpen, onClose }: SettingsDialogProps) => {
  const [activeTab, setActiveTab] = useState<ActiveTab>('interface');
  const [showApiKey, setShowApiKey] = useState(false);
  
  const { themeMode, setTheme } = useTheme();
  const { settings, updateApiSettings } = useSettings();
  
  const [localApiSettings, setLocalApiSettings] = useState({
    apiKey: settings.api.apiKey,
    apiBaseUrl: settings.api.apiBaseUrl,
    model: settings.api.model
  });

  const handleClose = () => {
    onClose();
  };

  const handleThemeChange = (mode: ThemeMode) => {
    setTheme(mode);
  };

  const handleSaveApiSettings = () => {
    updateApiSettings(localApiSettings);
  };
  
  const handleApiSettingChange = (key: keyof typeof localApiSettings, value: string) => {
    setLocalApiSettings(prev => ({
      ...prev,
      [key]: value
    }));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-card border border-border rounded-lg shadow-lg w-full max-w-2xl mx-4 max-h-[80vh] flex flex-col">
        {/* 头部 */}
        <div className="flex items-center justify-between p-6 border-b border-border">
          <h2 className="text-lg font-semibold">设置</h2>
          <button
            onClick={handleClose}
            className="p-1 hover:bg-accent rounded transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex flex-1 overflow-hidden">
          {/* 左侧标签页导航 */}
          <div className="w-48 border-r border-border p-4">
            <nav className="space-y-1">
              <button
                onClick={() => setActiveTab('interface')}
                className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors ${
                  activeTab === 'interface'
                    ? 'bg-primary text-primary-foreground'
                    : 'hover:bg-accent'
                }`}
              >
                界面设置
              </button>
              <button
                onClick={() => setActiveTab('api')}
                className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors ${
                  activeTab === 'api'
                    ? 'bg-primary text-primary-foreground'
                    : 'hover:bg-accent'
                }`}
              >
                API 设置
              </button>
              <button
                onClick={() => setActiveTab('about')}
                className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors ${
                  activeTab === 'about'
                    ? 'bg-primary text-primary-foreground'
                    : 'hover:bg-accent'
                }`}
              >
                关于
              </button>
            </nav>
          </div>

          {/* 右侧内容区域 */}
          <div className="flex-1 p-6 overflow-y-auto">
            {/* 界面设置 */}
            {activeTab === 'interface' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-base font-medium mb-4">主题设置</h3>
                  <div className="flex space-x-4">
                    <label className="flex items-center space-x-3 cursor-pointer">
                      <input
                        type="radio"
                        name="theme"
                        value="system"
                        checked={themeMode === 'system'}
                        onChange={() => handleThemeChange('system')}
                        className="w-4 h-4 text-primary"
                      />
                      <div className="flex items-center space-x-2">
                        <Monitor className="w-4 h-4" />
                        <span>跟随系统</span>
                      </div>
                    </label>
                    <label className="flex items-center space-x-3 cursor-pointer">
                      <input
                        type="radio"
                        name="theme"
                        value="light"
                        checked={themeMode === 'light'}
                        onChange={() => handleThemeChange('light')}
                        className="w-4 h-4 text-primary"
                      />
                      <div className="flex items-center space-x-2">
                        <Sun className="w-4 h-4" />
                        <span>浅色模式</span>
                      </div>
                    </label>
                    <label className="flex items-center space-x-3 cursor-pointer">
                      <input
                        type="radio"
                        name="theme"
                        value="dark"
                        checked={themeMode === 'dark'}
                        onChange={() => handleThemeChange('dark')}
                        className="w-4 h-4 text-primary"
                      />
                      <div className="flex items-center space-x-2">
                        <Moon className="w-4 h-4" />
                        <span>深色模式</span>
                      </div>
                    </label>
                  </div>
                </div>
              </div>
            )}

            {/* API设置 */}
            {activeTab === 'api' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-base font-medium mb-4">API 配置</h3>
                  <div className="space-y-4">
                    {/* API Key */}
                    <div>
                      <label className="block text-sm font-medium mb-2">
                        API Key
                      </label>
                      <div className="relative">
                        <input
                          type={showApiKey ? 'text' : 'password'}
                          value={localApiSettings.apiKey}
                          onChange={(e) => handleApiSettingChange('apiKey', e.target.value)}
                          placeholder="请输入您的 API Key"
                          className="w-full px-3 py-2 pr-10 border border-border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                        />
                        <button
                          type="button"
                          onClick={() => setShowApiKey(!showApiKey)}
                          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
                        >
                          {showApiKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>

                    {/* API Base URL */}
                    <div>
                      <label className="block text-sm font-medium mb-2">
                        API Base URL
                      </label>
                      <input
                        type="text"
                        value={localApiSettings.apiBaseUrl}
                        onChange={(e) => handleApiSettingChange('apiBaseUrl', e.target.value)}
                        placeholder="https://api.openai.com/v1"
                        className="w-full px-3 py-2 border border-border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                      />
                    </div>

                    {/* Model */}
                    <div>
                      <label className="block text-sm font-medium mb-2">
                        模型
                      </label>
                      <input
                        type="text"
                        value={localApiSettings.model}
                        onChange={(e) => handleApiSettingChange('model', e.target.value)}
                        placeholder="gpt-3.5-turbo"
                        className="w-full px-3 py-2 border border-border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                      />
                    </div>

                    <button
                      onClick={handleSaveApiSettings}
                      className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
                    >
                      保存设置
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* 关于 */}
            {activeTab === 'about' && (
              <div className="space-y-6">
                <div className="text-center">
                  <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Info className="w-8 h-8 text-primary" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2">AiDeer</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    智能文件管理系统
                  </p>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">版本:</span>
                      <span>1.0.0</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">构建时间:</span>
                      <span>{new Date().toLocaleDateString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">技术栈:</span>
                      <span>React + TypeScript + Electron</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsDialog;