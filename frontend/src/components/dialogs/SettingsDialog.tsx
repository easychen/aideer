import { useState, useEffect } from 'react';
import { X, Monitor, Sun, Moon, Eye, EyeOff, Info, Puzzle, Database, RefreshCw } from 'lucide-react';
import { useTheme, ThemeMode } from '../../hooks/useTheme';
import { useSettings } from '../../hooks/useSettings';
import { pluginManager } from '../../plugins/manager/PluginManager';
import apiService from '../../services/api';
import { Project } from '../../types';

interface SettingsDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

type ActiveTab = 'interface' | 'api' | 'plugins' | 'maintenance' | 'about';

const SettingsDialog = ({ isOpen, onClose }: SettingsDialogProps) => {
  const [activeTab, setActiveTab] = useState<ActiveTab>('interface');
  const [showApiKey, setShowApiKey] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProjectIds, setSelectedProjectIds] = useState<number[]>([]);
  
  const { themeMode, setTheme } = useTheme();
  const { settings, updateApiSettings } = useSettings();
  
  const [localApiSettings, setLocalApiSettings] = useState({
    apiKey: settings.api.apiKey,
    apiBaseUrl: settings.api.apiBaseUrl,
    model: settings.api.model
  });

  // 加载项目列表
  useEffect(() => {
    const loadProjects = async () => {
      try {
        const projectList = await apiService.getProjects();
        setProjects(projectList);
        // 默认选中所有项目
        setSelectedProjectIds(projectList.map(p => p.id));
      } catch (error) {
        console.error('加载项目列表失败:', error);
      }
    };

    if (isOpen) {
      loadProjects();
    }
  }, [isOpen]);

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

  const handleProjectToggle = (projectId: number) => {
    setSelectedProjectIds(prev => 
      prev.includes(projectId) 
        ? prev.filter(id => id !== projectId)
        : [...prev, projectId]
    );
  };

  const handleSelectAllProjects = () => {
    setSelectedProjectIds(projects.map(p => p.id));
  };

  const handleDeselectAllProjects = () => {
    setSelectedProjectIds([]);
  };

  const handleSyncFileInfo = async () => {
    if (selectedProjectIds.length === 0) {
      alert('请至少选择一个项目进行同步');
      return;
    }

    setIsSyncing(true);
    try {
      const result = await apiService.syncFileInfo(selectedProjectIds);
      
      let message = `同步完成！更新了 ${result.updatedCount} 条记录`;
      if (result.errorCount && result.errorCount > 0) {
        message += `\n遇到 ${result.errorCount} 个错误`;
        if (result.errors && result.errors.length > 0) {
          message += `\n错误详情：\n${result.errors.slice(0, 3).join('\n')}`;
          if (result.errors.length > 3) {
            message += `\n...还有 ${result.errors.length - 3} 个错误`;
          }
        }
      }
      
      alert(message);
    } catch (error) {
      console.error('同步文件信息失败:', error);
      alert('同步失败，请稍后重试');
    } finally {
      setIsSyncing(false);
    }
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
                onClick={() => setActiveTab('plugins')}
                className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors ${
                  activeTab === 'plugins'
                    ? 'bg-primary text-primary-foreground'
                    : 'hover:bg-accent'
                }`}
              >
                <div className="flex items-center space-x-2">
                  <Puzzle className="w-4 h-4" />
                  <span>插件管理</span>
                </div>
              </button>
              <button
                onClick={() => setActiveTab('maintenance')}
                className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors ${
                  activeTab === 'maintenance'
                    ? 'bg-primary text-primary-foreground'
                    : 'hover:bg-accent'
                }`}
              >
                <div className="flex items-center space-x-2">
                  <Database className="w-4 h-4" />
                  <span>数据维护</span>
                </div>
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

            {/* 插件管理 */}
            {activeTab === 'plugins' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-base font-medium mb-4">已安装插件</h3>
                  <div className="space-y-3">
                    {pluginManager.getAllPlugins().map((plugin) => (
                      <div key={plugin.metadata.id} className="flex items-center justify-between p-3 border border-border rounded-lg">
                        <div className="flex-1">
                          <div className="flex items-center space-x-3">
                            <div className="w-8 h-8 bg-primary/10 rounded-md flex items-center justify-center">
                              <Puzzle className="w-4 h-4 text-primary" />
                            </div>
                            <div>
                              <h4 className="font-medium">{plugin.metadata.name}</h4>
                              <p className="text-sm text-muted-foreground">{plugin.metadata.description}</p>
                              <div className="flex items-center space-x-2 mt-1">
                                <span className="text-xs text-muted-foreground">版本: {plugin.metadata.version}</span>
                                <span className="text-xs text-muted-foreground">•</span>
                                <span className="text-xs text-muted-foreground">作者: {plugin.metadata.author}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <label className="flex items-center space-x-2 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={plugin.isEnabled}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  pluginManager.enable(plugin.metadata.id);
                                } else {
                                  pluginManager.disable(plugin.metadata.id);
                                }
                              }}
                              className="w-4 h-4 text-primary"
                            />
                            <span className="text-sm">{plugin.isEnabled ? '已启用' : '已禁用'}</span>
                          </label>
                        </div>
                      </div>
                    ))}
                  </div>
                  {pluginManager.getAllPlugins().length === 0 && (
                    <div className="text-center py-8 text-muted-foreground">
                      <Puzzle className="w-12 h-12 mx-auto mb-3 opacity-50" />
                      <p>暂无已安装的插件</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* 数据维护 */}
            {activeTab === 'maintenance' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-base font-medium mb-4">文件信息同步</h3>
                  <div className="space-y-4">
                    {/* 项目选择 */}
                    <div className="p-4 border border-border rounded-lg bg-muted/50">
                      <div className="flex items-start space-x-3">
                        <Database className="w-5 h-5 text-primary mt-0.5" />
                        <div className="flex-1">
                          <h4 className="font-medium mb-2">选择要同步的项目</h4>
                          <p className="text-sm text-muted-foreground mb-4">
                            选择需要同步文件信息的项目。可以选择单个或多个项目进行同步。
                          </p>
                          
                          {/* 全选/取消全选按钮 */}
                          <div className="flex items-center space-x-2 mb-3">
                            <button
                              onClick={handleSelectAllProjects}
                              className="text-sm text-primary hover:text-primary/80 transition-colors"
                            >
                              全选
                            </button>
                            <span className="text-muted-foreground">|</span>
                            <button
                              onClick={handleDeselectAllProjects}
                              className="text-sm text-primary hover:text-primary/80 transition-colors"
                            >
                              取消全选
                            </button>
                          </div>
                          
                          {/* 项目列表 */}
                          <div className="space-y-2 max-h-36 overflow-y-auto">
                            {projects.map((project) => (
                              <label key={project.id} className="flex items-center space-x-3 cursor-pointer p-2 rounded hover:bg-background/50 transition-colors">
                                <input
                                  type="checkbox"
                                  checked={selectedProjectIds.includes(project.id)}
                                  onChange={() => handleProjectToggle(project.id)}
                                  className="w-4 h-4 text-primary"
                                />
                                <div className="flex-1 flex flex-row justify-between">
                                  <div className="font-medium text-sm">{project.name}</div>
                                  <div className="text-xs text-muted-foreground">{project.path}</div>
                                </div>
                              </label>
                            ))}
                          </div>
                          
                          {projects.length === 0 && (
                            <div className="text-center py-4 text-muted-foreground text-sm">
                              暂无项目
                            </div>
                          )}
                          
                          {/* 选择状态提示 */}
                          <div className="mt-3 text-sm text-muted-foreground">
                            已选择 {selectedProjectIds.length} / {projects.length} 个项目
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    {/* 同步操作 */}
                    <div className="p-4 border border-border rounded-lg bg-muted/50">
                      <div className="flex items-start space-x-3">
                        <RefreshCw className="w-5 h-5 text-primary mt-0.5" />
                        <div className="flex-1">
                          <h4 className="font-medium mb-2">同步文件路径信息</h4>
                          <p className="text-sm text-muted-foreground mb-4">
                            扫描选中项目目录中的所有文件，并更新数据库中文件额外信息的路径字段。
                            这个操作会确保文件移动或重命名后，相关的额外信息仍然能够正确关联。
                          </p>
                          <button
                            onClick={handleSyncFileInfo}
                            disabled={isSyncing || selectedProjectIds.length === 0}
                            className="flex items-center space-x-2 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                          >
                            <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
                            <span>{isSyncing ? '同步中...' : '开始同步'}</span>
                          </button>
                        </div>
                      </div>
                    </div>
                    
                    <div className="text-sm text-muted-foreground">
                      <h4 className="font-medium mb-2">注意事项：</h4>
                      <ul className="space-y-1 list-disc list-inside">
                        <li>同步过程可能需要一些时间，请耐心等待</li>
                        <li>建议在文件结构发生较大变化后执行同步</li>
                        <li>同步过程中请不要关闭应用程序</li>
                        <li>请至少选择一个项目才能开始同步</li>
                      </ul>
                    </div>
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
                    AI资产管理系统
                  </p>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">版本:</span>
                      <span>1.0.0</span>
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