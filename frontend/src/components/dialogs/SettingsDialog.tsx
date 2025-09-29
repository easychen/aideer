import { useState, useEffect } from 'react';
import { X, Monitor, Sun, Moon, Eye, EyeOff, Info, Puzzle, Database, RefreshCw, Globe, Check, ChevronDown } from 'lucide-react';
import { useTheme, ThemeMode } from '../../hooks/useTheme';
import { useSettings } from '../../hooks/useSettings';
import { useTranslation } from 'react-i18next';
import { pluginManager } from '../../plugins/manager/PluginManager';
import apiService from '../../services/api';
import { Project } from '../../types';

interface SettingsDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

type ActiveTab = 'interface' | 'api' | 'plugins' | 'maintenance' | 'about';

const SettingsDialog = ({ isOpen, onClose }: SettingsDialogProps) => {
  const { t, i18n } = useTranslation();
  const [activeTab, setActiveTab] = useState<ActiveTab>('interface');
  const [showApiKey, setShowApiKey] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProjectIds, setSelectedProjectIds] = useState<number[]>([]);
  const [isLanguageDropdownOpen, setIsLanguageDropdownOpen] = useState(false);
  
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

  const handleLanguageChange = (languageCode: string) => {
    i18n.changeLanguage(languageCode);
    setIsLanguageDropdownOpen(false);
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
          <h2 className="text-lg font-semibold">{t('settings.settings')}</h2>
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
                {t('settings.interface')}
              </button>
              <button
                onClick={() => setActiveTab('api')}
                className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors ${
                  activeTab === 'api'
                    ? 'bg-primary text-primary-foreground'
                    : 'hover:bg-accent'
                }`}
              >
                {t('settings.api')}
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
                  <span>{t('settings.plugins')}</span>
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
                  <span>{t('settings.maintenance')}</span>
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
                {t('settings.about')}
              </button>
            </nav>
          </div>

          {/* 右侧内容区域 */}
          <div className="flex-1 p-6 overflow-y-auto">
            {/* 界面设置 */}
            {activeTab === 'interface' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-medium mb-4">{t('settings.interface')}</h3>
                  
                  {/* 主题设置 */}
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm font-medium">{t('settings.theme')}</label>
                      <div className="mt-2 flex space-x-2">
                        <button
                          onClick={() => handleThemeChange('light')}
                          className={`flex items-center space-x-2 px-3 py-2 rounded-md text-sm transition-colors ${
                            themeMode === 'light'
                              ? 'bg-primary text-primary-foreground'
                              : 'bg-secondary hover:bg-secondary/80'
                          }`}
                        >
                          <Sun className="w-4 h-4" />
                          <span>{t('settings.lightMode')}</span>
                        </button>
                        <button
                          onClick={() => handleThemeChange('dark')}
                          className={`flex items-center space-x-2 px-3 py-2 rounded-md text-sm transition-colors ${
                            themeMode === 'dark'
                              ? 'bg-primary text-primary-foreground'
                              : 'bg-secondary hover:bg-secondary/80'
                          }`}
                        >
                          <Moon className="w-4 h-4" />
                          <span>{t('settings.darkMode')}</span>
                        </button>
                        <button
                          onClick={() => handleThemeChange('system')}
                          className={`flex items-center space-x-2 px-3 py-2 rounded-md text-sm transition-colors ${
                            themeMode === 'system'
                              ? 'bg-primary text-primary-foreground'
                              : 'bg-secondary hover:bg-secondary/80'
                          }`}
                        >
                          <Monitor className="w-4 h-4" />
                          <span>{t('settings.systemMode')}</span>
                        </button>
                      </div>
                    </div>

                    {/* 语言设置 */}
                    <div>
                      <label className="text-sm font-medium">{t('settings.language')}</label>
                      <div className="mt-2 relative">
                        <button
                          onClick={() => setIsLanguageDropdownOpen(!isLanguageDropdownOpen)}
                          className="flex items-center justify-between w-48 px-3 py-2 bg-secondary hover:bg-secondary/80 rounded-md text-sm transition-colors"
                        >
                          <div className="flex items-center space-x-2">
                            <Globe className="w-4 h-4" />
                            <span>
                              {i18n.language === 'zh' ? '中文' : 
                               i18n.language === 'en' ? 'English' : 
                               t('settings.followSystem')}
                            </span>
                          </div>
                          <ChevronDown className={`w-4 h-4 transition-transform ${isLanguageDropdownOpen ? 'rotate-180' : ''}`} />
                        </button>
                        
                        {isLanguageDropdownOpen && (
                          <div className="absolute top-full left-0 mt-1 w-48 bg-popover border border-border rounded-md shadow-lg z-50">
                            <div className="py-1">
                              <button
                                onClick={() => handleLanguageChange('system')}
                                className="flex items-center justify-between w-full px-3 py-2 text-sm hover:bg-accent transition-colors"
                              >
                                <div className="flex items-center space-x-2">
                                  <Monitor className="w-4 h-4" />
                                  <span>{t('settings.followSystem')}</span>
                                </div>
                                {i18n.language === 'system' && <Check className="w-4 h-4" />}
                              </button>
                              <button
                                onClick={() => handleLanguageChange('zh')}
                                className="flex items-center justify-between w-full px-3 py-2 text-sm hover:bg-accent transition-colors"
                              >
                                <div className="flex items-center space-x-2">
                                  <Globe className="w-4 h-4" />
                                  <span>中文</span>
                                </div>
                                {i18n.language === 'zh' && <Check className="w-4 h-4" />}
                              </button>
                              <button
                                onClick={() => handleLanguageChange('en')}
                                className="flex items-center justify-between w-full px-3 py-2 text-sm hover:bg-accent transition-colors"
                              >
                                <div className="flex items-center space-x-2">
                                  <Globe className="w-4 h-4" />
                                  <span>English</span>
                                </div>
                                {i18n.language === 'en' && <Check className="w-4 h-4" />}
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* API设置 */}
            {activeTab === 'api' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-base font-medium mb-4">{t('settings.api')}</h3>
                  <div className="space-y-4">
                    {/* API Key */}
                    <div>
                      <label className="block text-sm font-medium mb-2">
                        {t('settings.apiKey')}
                      </label>
                      <div className="relative">
                        <input
                          type={showApiKey ? 'text' : 'password'}
                          value={localApiSettings.apiKey}
                          onChange={(e) => handleApiSettingChange('apiKey', e.target.value)}
                          placeholder={t('settings.enterApiKey')}
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
                        {t('settings.baseUrl')}
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
                        {t('settings.model')}
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
                      {t('settings.saveSettings')}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* 插件管理 */}
            {activeTab === 'plugins' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-medium mb-4">{t('settings.plugins')}</h3>
                  <div className="text-center py-12 text-muted-foreground">
                    <Puzzle className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>{t('settings.pluginsComingSoon')}</p>
                  </div>
                </div>
              </div>
            )}

            {/* 数据维护 */}
            {activeTab === 'maintenance' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-medium mb-4">{t('settings.maintenance')}</h3>
                  <div className="space-y-4">
                    {/* 项目选择 */}
                    <div className="p-4 border border-border rounded-lg bg-muted/50">
                      <div className="flex items-start space-x-3">
                        <Database className="w-5 h-5 text-primary mt-0.5" />
                        <div className="flex-1">
                          <h4 className="font-medium mb-2">{t('maintenance.selectProjects')}</h4>
                          <p className="text-sm text-muted-foreground mb-4">
                            {t('maintenance.selectProjectsDescription')}
                          </p>
                          
                          {/* 全选/取消全选按钮 */}
                          <div className="flex items-center space-x-2 mb-3">
                            <button
                              onClick={handleSelectAllProjects}
                              className="text-sm text-primary hover:text-primary/80 transition-colors"
                            >
                              {t('maintenance.selectAll')}
                            </button>
                            <span className="text-muted-foreground">|</span>
                            <button
                              onClick={handleDeselectAllProjects}
                              className="text-sm text-primary hover:text-primary/80 transition-colors"
                            >
                              {t('maintenance.deselectAll')}
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
                              {t('maintenance.noProjects')}
                            </div>
                          )}
                          
                          {/* 选择状态提示 */}
                          <div className="mt-3 text-sm text-muted-foreground">
                            {t('maintenance.selectedCount', { selected: selectedProjectIds.length, total: projects.length })}
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    {/* 同步操作 */}
                    <div className="p-4 border border-border rounded-lg bg-muted/50">
                      <div className="flex items-start space-x-3">
                        <RefreshCw className="w-5 h-5 text-primary mt-0.5" />
                        <div className="flex-1">
                          <h4 className="font-medium mb-2">{t('maintenance.syncFileInfo')}</h4>
                          <p className="text-sm text-muted-foreground mb-4">
                            {t('maintenance.syncFileInfoDescription')}
                          </p>
                          <button
                            onClick={handleSyncFileInfo}
                            disabled={isSyncing || selectedProjectIds.length === 0}
                            className="flex items-center space-x-2 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                          >
                            <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
                            <span>{isSyncing ? t('maintenance.syncing') : t('maintenance.startSync')}</span>
                          </button>
                        </div>
                      </div>
                    </div>
                    
                    <div className="text-sm text-muted-foreground">
                      <h4 className="font-medium mb-2">{t('maintenance.notes')}：</h4>
                      <ul className="space-y-1 list-disc list-inside">
                        <li>{t('maintenance.note1')}</li>
                        <li>{t('maintenance.note2')}</li>
                        <li>{t('maintenance.note3')}</li>
                        <li>{t('maintenance.note4')}</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* 关于 */}
            {activeTab === 'about' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-medium mb-4">{t('settings.about')}</h3>
                  <div className="space-y-4">
                    <div className="text-center py-8">
                      <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Info className="w-8 h-8 text-primary" />
                      </div>
                      <h4 className="text-lg font-semibold mb-2">{t('about.appName')}</h4>
                      <p className="text-muted-foreground mb-4">{t('about.version')}: 1.0.0</p>
                      <p className="text-sm text-muted-foreground max-w-md mx-auto">
                        {t('about.description')}
                      </p>
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