import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Plugin, PluginContainerProps, PluginTabProps } from '../types/index';
import { pluginManager } from '../manager/PluginManager';
import { FileText, AlertCircle, Loader2 } from 'lucide-react';

/**
 * 插件标签页组件
 */
const PluginTab: React.FC<PluginTabProps> = ({ plugin, isActive, onClick }) => {
  const IconComponent = plugin.metadata.icon;
  
  return (
    <button
      onClick={onClick}
      className={`
        flex items-center space-x-2 px-4 py-2 text-sm font-medium rounded-t-lg border-b-2 transition-colors
        ${isActive 
          ? 'bg-background text-foreground border-primary' 
          : 'bg-muted/50 text-muted-foreground border-transparent hover:bg-muted hover:text-foreground'
        }
      `}
      title={plugin.metadata.description}
    >
      {IconComponent ? (
        <IconComponent className="w-4 h-4" />
      ) : (
        <FileText className="w-4 h-4" />
      )}
      <span>{plugin.metadata.name}</span>
    </button>
  );
};

/**
 * 插件错误显示组件
 */
const PluginError: React.FC<{ error: Error; pluginName: string }> = ({ error, pluginName }) => {
  return (
    <div className="flex flex-col items-center justify-center h-full p-8 text-center">
      <AlertCircle className="w-16 h-16 text-destructive mb-4" />
      <h3 className="text-lg font-semibold mb-2">插件加载失败</h3>
      <p className="text-muted-foreground mb-4">
        插件 "{pluginName}" 遇到错误
      </p>
      <div className="bg-muted p-4 rounded-lg max-w-md">
        <p className="text-sm text-muted-foreground font-mono">
          {error.message}
        </p>
      </div>
    </div>
  );
};

/**
 * 插件加载中组件
 */
const PluginLoading: React.FC<{ pluginName: string }> = ({ pluginName }) => {
  return (
    <div className="flex flex-col items-center justify-center h-full p-8">
      <Loader2 className="w-8 h-8 animate-spin text-primary mb-4" />
      <p className="text-muted-foreground">正在加载插件 "{pluginName}"...</p>
    </div>
  );
};

/**
 * 无插件可用组件
 */
const NoPluginsAvailable: React.FC<{ fileName: string }> = ({ fileName }) => {
  const extension = fileName.split('.').pop()?.toLowerCase() || '';
  
  return (
    <div className="flex flex-col items-center justify-center h-full p-8 text-center">
      <FileText className="w-16 h-16 text-muted-foreground mb-4 opacity-50" />
      <h3 className="text-lg font-semibold mb-2">暂无可用插件</h3>
      <p className="text-muted-foreground mb-4">
        没有找到支持 ".{extension}" 文件的插件
      </p>
      <div className="bg-muted p-4 rounded-lg max-w-md">
        <p className="text-sm text-muted-foreground">
          您可以在设置中启用更多插件，或者等待开发者为此文件类型添加支持。
        </p>
      </div>
    </div>
  );
};

/**
 * 插件容器主组件
 */
const PluginContainer: React.FC<PluginContainerProps> = ({
  file,
  projectId,
  defaultActivePlugin,
  onPluginChange
}) => {
  const [activePluginId, setActivePluginId] = useState<string | null>(null);
  const [pluginErrors, setPluginErrors] = useState<Map<string, Error>>(new Map());
  const [loadingPlugins, setLoadingPlugins] = useState<Set<string>>(new Set());
  const [hiddenPlugins, setHiddenPlugins] = useState<Set<string>>(new Set());

  // 获取支持当前文件类型的插件
  const enabledPlugins = useMemo(() => {
    const fileExtension = file.name.split('.').pop()?.toLowerCase() || '';
    const plugins = pluginManager.getPluginsForExtension(fileExtension);
    // 过滤掉被隐藏的插件
    return plugins.filter(plugin => !hiddenPlugins.has(plugin.metadata.id));
  }, [file.name, hiddenPlugins]);

  // 初始化活动插件
  useEffect(() => {
    if (enabledPlugins.length > 0) {
      const initialPlugin = defaultActivePlugin && enabledPlugins.find(p => p.metadata.id === defaultActivePlugin)
        ? defaultActivePlugin
        : enabledPlugins[0].metadata.id;
      
      setActivePluginId(initialPlugin);
      onPluginChange?.(initialPlugin);
    } else {
      setActivePluginId(null);
      onPluginChange?.(null);
    }
  }, [enabledPlugins, defaultActivePlugin]);

  // 处理插件隐藏请求
  const handlePluginShouldHide = useCallback((pluginId: string, shouldHide: boolean, reason?: string) => {
    console.log(`插件 ${pluginId} 请求${shouldHide ? '隐藏' : '显示'} tab${reason ? `, 原因: ${reason}` : ''}`);
    
    setHiddenPlugins(prev => {
      const newSet = new Set(prev);
      const wasHidden = newSet.has(pluginId);
      
      // 只有状态真正发生变化时才更新
      if (shouldHide && !wasHidden) {
        newSet.add(pluginId);
        return newSet;
      } else if (!shouldHide && wasHidden) {
        newSet.delete(pluginId);
        return newSet;
      }
      
      // 状态没有变化，返回原来的Set
      return prev;
    });

    // 如果当前活动的插件被隐藏，切换到第一个可用插件
    if (shouldHide && activePluginId === pluginId) {
      const fileExtension = file.name.split('.').pop()?.toLowerCase() || '';
      const allPlugins = pluginManager.getPluginsForExtension(fileExtension);
      const visiblePlugins = allPlugins.filter(plugin => 
        plugin.metadata.id !== pluginId && !hiddenPlugins.has(plugin.metadata.id)
      );
      
      if (visiblePlugins.length > 0) {
        setActivePluginId(visiblePlugins[0].metadata.id);
        onPluginChange?.(visiblePlugins[0].metadata.id);
      } else {
        setActivePluginId(null);
        onPluginChange?.(null);
      }
    }
  }, [activePluginId, file.name, hiddenPlugins]);

  // 处理插件切换
  const handlePluginChange = (pluginId: string) => {
    setActivePluginId(pluginId);
    onPluginChange?.(pluginId);
  };

  // 处理插件错误
  const handlePluginError = (pluginId: string, error: Error) => {
    setPluginErrors(prev => new Map(prev).set(pluginId, error));
    setLoadingPlugins(prev => {
      const newSet = new Set(prev);
      newSet.delete(pluginId);
      return newSet;
    });
  };

  // 处理插件加载开始
  const handlePluginLoadStart = useCallback((pluginId: string) => {
    setLoadingPlugins(prev => new Set(prev).add(pluginId));
    setPluginErrors(prev => {
      const newMap = new Map(prev);
      newMap.delete(pluginId);
      return newMap;
    });
  }, []);

  // 处理插件加载完成
  const handlePluginLoadEnd = useCallback((pluginId: string) => {
    setLoadingPlugins(prev => {
      const newSet = new Set(prev);
      newSet.delete(pluginId);
      return newSet;
    });
  }, []);

  // 获取当前活动插件
  const activePlugin = enabledPlugins.find(plugin => plugin.metadata.id === activePluginId);

  // 如果没有可用插件
  if (enabledPlugins.length === 0) {
    return <NoPluginsAvailable fileName={file.name} />;
  }

  return (
    <div className="flex flex-col h-full">
      {/* 插件标签页 */}
      <div className="flex border-b border-border bg-muted/30">
        <div className="flex space-x-1 px-2 pt-2">
          {enabledPlugins.map(plugin => (
            <PluginTab
              key={plugin.metadata.id}
              plugin={plugin}
              isActive={plugin.metadata.id === activePluginId}
              onClick={() => handlePluginChange(plugin.metadata.id)}
            />
          ))}
        </div>
      </div>

      {/* 插件内容区域 */}
      <div className="flex-1 overflow-hidden">
        {activePlugin && (
          <PluginContentWrapper
            plugin={activePlugin}
            file={file}
            projectId={projectId}
            isLoading={loadingPlugins.has(activePlugin.metadata.id)}
            error={pluginErrors.get(activePlugin.metadata.id)}
            onError={(error) => handlePluginError(activePlugin.metadata.id, error)}
            onLoadStart={() => handlePluginLoadStart(activePlugin.metadata.id)}
            onLoadEnd={() => handlePluginLoadEnd(activePlugin.metadata.id)}
            onShouldHide={(shouldHide, reason) => handlePluginShouldHide(activePlugin.metadata.id, shouldHide, reason)}
          />
        )}
      </div>
    </div>
  );
};

/**
 * 插件内容包装器组件
 */
interface PluginContentWrapperProps {
  plugin: Plugin;
  file: any;
  projectId: number;
  isLoading: boolean;
  error?: Error;
  onError: (error: Error) => void;
  onLoadStart: () => void;
  onLoadEnd: () => void;
  onShouldHide: (shouldHide: boolean, reason?: string) => void;
}

const PluginContentWrapper: React.FC<PluginContentWrapperProps> = ({
  plugin,
  file,
  projectId,
  isLoading,
  error,
  onError,
  onLoadStart,
  onLoadEnd,
  onShouldHide
}) => {
  const [api] = useState(() => pluginManager.createPluginAPI(plugin.metadata.id));
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    if (!isInitialized) {
      onLoadStart();
      // 模拟插件加载时间
      const timer = setTimeout(() => {
        onLoadEnd();
        setIsInitialized(true);
      }, 100);

      return () => clearTimeout(timer);
    }
  }, [plugin.metadata.id, isInitialized]);

  // 如果有错误，显示错误信息
  if (error) {
    return <PluginError error={error} pluginName={plugin.metadata.name} />;
  }

  // 如果正在加载，显示加载状态
  if (isLoading) {
    return <PluginLoading pluginName={plugin.metadata.name} />;
  }

  // 渲染插件组件
  try {
    const PluginComponent = plugin.component;
    return (
      <div className="h-full overflow-auto">
        <PluginComponent
          file={file}
          projectId={projectId}
          api={api}
          onError={onError}
          onShouldHide={onShouldHide}
        />
      </div>
    );
  } catch (error) {
    // 如果插件组件渲染出错，显示错误信息
    onError(error as Error);
    return <PluginError error={error as Error} pluginName={plugin.metadata.name} />;
  }
};

export default PluginContainer;