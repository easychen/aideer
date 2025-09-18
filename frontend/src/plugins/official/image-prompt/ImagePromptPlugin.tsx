import React, { useState, useEffect } from 'react';
import { Loader2, Image, MessageSquare, Settings, X, FileText, Zap, History, Hash, Copy, Download, Eye, EyeOff } from 'lucide-react';
import { PngPromptProcessor, PromptData } from './utils/pngPromptProcessor';
import JsonTreeViewer from './components/JsonTreeViewer';
import type { PluginComponentProps } from '../../types';

// 插件配置常量
const PLUGIN_CONFIG = {
  APP_NAME: 'Aideer',
  PLUGIN_NAME: 'Image Prompt',
  PLUGIN_SHORT_NAME: '图片提示词',
  DESCRIPTION: '显示PNG文件中的AI生成提示词信息',
  VERSION: '1.0.0',
  AUTHOR: 'Aideer Team',
  SUPPORTED_EXTENSIONS: ['.png'],
  CATEGORY: 'viewer'
};

interface ImagePromptPluginState {
  loading: boolean;
  error: string | null;
  promptData: PromptData | null;
  showRawData: boolean;
  expandedSections: Set<string>;
  activeTab: 'structured' | 'raw';
}

/**
 * ImagePrompt插件组件
 * 用于显示PNG文件中的AI生成提示词信息
 */
export const ImagePromptPlugin: React.FC<PluginComponentProps> = ({ file, projectId, api, onShouldHide }) => {
  const [state, setState] = useState<ImagePromptPluginState>({
    loading: true,
    error: null,
    promptData: null,
    showRawData: false,
    expandedSections: new Set(['prompt', 'parameters']),
    activeTab: 'structured'
  });

  useEffect(() => {
    loadPromptData();
  }, [file]);

  const loadPromptData = async () => {
    try {
      setState(prev => ({ ...prev, loading: true, error: null }));

      // 检查文件类型
      if (!file.name.toLowerCase().endsWith('.png')) {
        throw new Error('此插件仅支持PNG文件');
      }

      // 使用API获取正确的文件URL
      const fileUrl = api?.file.getUrl(file.relativePath, projectId);
      if (!fileUrl) {
        throw new Error('无法获取文件URL');
      }
      
      const response = await fetch(fileUrl);
      
      if (!response.ok) {
        throw new Error(`无法读取文件内容: ${response.status}`);
      }
      
      const arrayBuffer = await response.arrayBuffer();
      
      if (!arrayBuffer) {
        throw new Error('无法读取文件内容');
      }
      
      // 验证PNG文件
      if (!PngPromptProcessor.isValidPng(arrayBuffer)) {
        throw new Error('无效的PNG文件格式');
      }

      // 提取提示词数据
      const promptData = await PngPromptProcessor.extractPromptData(arrayBuffer);
      
      if (!promptData) {
        // 当PNG文件中未找到提示词数据时，请求隐藏tab
        onShouldHide?.(true, 'PNG文件中未找到提示词数据');
        throw new Error('PNG文件中未找到提示词数据');
      }

      setState(prev => ({
        ...prev,
        loading: false,
        error: null,
        promptData
      }));
      
      // 成功加载提示词数据时，确保tab是可见的
      onShouldHide?.(false);
    } catch (error) {
      console.error('加载提示词数据失败:', error);
      
      // 如果是因为没有找到提示词数据而出错，隐藏tab
      const errorMessage = (error as Error).message;
      if (errorMessage.includes('未找到提示词数据') || errorMessage.includes('无效的PNG文件格式')) {
        onShouldHide?.(true, errorMessage);
      }
      
      setState(prev => ({
        ...prev,
        loading: false,
        error: errorMessage,
        promptData: null
      }));
    }
  };

  const toggleSection = (section: string) => {
    setState(prev => {
      const newExpanded = new Set(prev.expandedSections);
      if (newExpanded.has(section)) {
        newExpanded.delete(section);
      } else {
        newExpanded.add(section);
      }
      return { ...prev, expandedSections: newExpanded };
    });
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      api?.ui.showNotification('已复制到剪贴板', 'success');
    } catch (error) {
      console.error('复制失败:', error);
      api?.ui.showNotification('复制失败', 'error');
    }
  };

  const downloadAsText = () => {
    if (!state.promptData) return;

    let content = '';
    
    if (state.promptData.prompt) {
      content += `Prompt:\n${state.promptData.prompt}\n\n`;
    }
    
    if (state.promptData.negative_prompt) {
      content += `Negative Prompt:\n${state.promptData.negative_prompt}\n\n`;
    }
    
    if (state.promptData.parameters) {
      content += `Parameters:\n${state.promptData.parameters}\n\n`;
    }
    
    if (state.promptData.workflow) {
      content += `Workflow:\n${JSON.stringify(state.promptData.workflow, null, 2)}\n\n`;
    }

    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${file.name.replace(/\.png$/i, '')}_prompt.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    api?.ui.showNotification('提示词文件已下载', 'success');
  };

  const prepareStructuredData = () => {
    if (!state.promptData) return {};

    const structuredData: any = {};

    // 基本信息
    if (state.promptData.prompt || state.promptData.negative_prompt) {
      structuredData.prompts = {};
      if (state.promptData.prompt) {
        structuredData.prompts.positive = state.promptData.prompt;
      }
      if (state.promptData.negative_prompt) {
        structuredData.prompts.negative = state.promptData.negative_prompt;
      }
    }

    // 生成参数
    const parameters: any = {};
    const paramFields = [
      'steps', 'sampler', 'cfg_scale', 'seed', 'size', 'width', 'height',
      'model', 'model_hash', 'denoising_strength', 'clip_skip', 'software'
    ];
    
    paramFields.forEach(field => {
      if (state.promptData![field] !== undefined && state.promptData![field] !== null) {
        parameters[field] = state.promptData![field];
      }
    });

    if (Object.keys(parameters).length > 0) {
      structuredData.parameters = parameters;
    }

    // XMP 元数据
    const xmpData: any = {};
    const xmpFields = [
      'xmp_data', 'creator_tool', 'description', 'user_comment'
    ];
    
    xmpFields.forEach(field => {
      if (state.promptData![field] !== undefined && state.promptData![field] !== null) {
        xmpData[field] = state.promptData![field];
      }
    });

    if (Object.keys(xmpData).length > 0) {
      structuredData.xmp_metadata = xmpData;
    }

    // 工作流
    if (state.promptData.workflow) {
      structuredData.workflow = state.promptData.workflow;
    }

    // 其他元数据
    const otherFields = [
      'data_type', 'software_version', 'creation_time', 'format_version'
    ];
    
    const otherData: any = {};
    otherFields.forEach(field => {
      if (state.promptData![field] !== undefined && state.promptData![field] !== null) {
        otherData[field] = state.promptData![field];
      }
    });

    if (Object.keys(otherData).length > 0) {
      structuredData.metadata = otherData;
    }

    return structuredData;
  };

  const renderLoadingState = () => (
    <div className="flex items-center justify-center p-8">
      <Loader2 className="h-8 w-8 animate-spin" />
      <span className="ml-2">正在加载提示词数据...</span>
    </div>
  );

  const renderErrorState = () => (
    <div className="m-4 p-4 bg-red-50 border border-red-200 rounded-md">
      <p className="text-red-800">{state.error}</p>
    </div>
  );

  const renderPromptSection = () => {
    if (!state.promptData?.prompt) return null;

    const isExpanded = state.expandedSections.has('prompt');
    
    return (
      <div className="border border-gray-200 rounded-lg mb-4">
        <div 
          className="flex items-center justify-between p-3 bg-gray-50 cursor-pointer hover:bg-gray-100"
          onClick={() => toggleSection('prompt')}
        >
          <div className="flex items-center">
            <MessageSquare className="h-4 w-4 mr-2" />
            <span className="font-medium">正面提示词</span>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={(e) => {
                e.stopPropagation();
                copyToClipboard(state.promptData!.prompt!);
              }}
              className="p-1 hover:bg-gray-200 rounded"
              title="复制"
            >
              <Copy className="h-3 w-3" />
            </button>
            {isExpanded ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </div>
        </div>
        {isExpanded && (
          <div className="p-3 border-t border-gray-200">
            <div className="bg-white p-3 rounded border text-sm whitespace-pre-wrap">
              {state.promptData.prompt}
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderNegativePromptSection = () => {
    if (!state.promptData?.negative_prompt) return null;
    
    return (
      <div className="border border-gray-200 rounded-lg mb-4">
        <div className="flex items-center justify-between p-3 bg-gray-50">
          <div className="flex items-center">
            <X className="h-4 w-4 mr-2" />
            <span className="font-medium">负面提示词</span>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={(e) => {
                e.stopPropagation();
                copyToClipboard(state.promptData!.negative_prompt!);
              }}
              className="p-1 hover:bg-gray-200 rounded"
              title="复制"
            >
              <Copy className="h-3 w-3" />
            </button>
          </div>
        </div>
        <div className="p-3 border-t border-gray-200">
          <div className="bg-white p-3 rounded border text-sm whitespace-pre-wrap max-h-32 overflow-y-auto">
            {state.promptData.negative_prompt}
          </div>
        </div>
      </div>
    );
  };

  const renderParametersSection = () => {
    if (!state.promptData) return null;

    const parameters = [
      { key: 'steps', label: '步数', icon: Zap },
      { key: 'sampler', label: '采样器', icon: Settings },
      { key: 'cfg_scale', label: 'CFG Scale', icon: Settings },
      { key: 'seed', label: '种子', icon: Hash },
      { key: 'size', label: '尺寸', icon: Image },
      { key: 'width', label: '宽度', icon: Image },
      { key: 'height', label: '高度', icon: Image },
      { key: 'model', label: '模型', icon: FileText },
      { key: 'model_hash', label: '模型哈希', icon: Hash },
      { key: 'denoising_strength', label: '去噪强度', icon: Settings },
      { key: 'clip_skip', label: 'Clip Skip', icon: Settings },
      { key: 'software', label: '软件', icon: Settings }
    ];

    const availableParams = parameters.filter(param => 
      state.promptData![param.key] !== undefined && state.promptData![param.key] !== null
    );

    if (availableParams.length === 0) return null;

    const isExpanded = state.expandedSections.has('parameters');
    
    return (
      <div className="border border-gray-200 rounded-lg mb-4">
        <div 
          className="flex items-center justify-between p-3 bg-gray-50 cursor-pointer hover:bg-gray-100"
          onClick={() => toggleSection('parameters')}
        >
          <div className="flex items-center">
            <Settings className="h-4 w-4 mr-2" />
            <span className="font-medium">生成参数</span>
          </div>
          <div className="flex items-center space-x-2">
            {isExpanded ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </div>
        </div>
        {isExpanded && (
          <div className="p-3 border-t border-gray-200">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {availableParams.map(param => {
                const Icon = param.icon;
                const value = state.promptData![param.key];
                return (
                  <div key={param.key} className="group flex items-center justify-between p-2 bg-white rounded border relative">
                    <div className="flex items-center">
                      <Icon className="h-3 w-3 mr-2 text-gray-500" />
                      <span className="text-sm font-medium">{param.label}:</span>
                    </div>
                    <div className="flex items-center">
                      <span className="text-sm text-gray-700 ml-2 break-all">{String(value)}</span>
                      <button
                        onClick={() => copyToClipboard(String(value))}
                        className="ml-2 p-1 opacity-0 group-hover:opacity-100 hover:bg-gray-200 rounded transition-opacity"
                        title="复制"
                      >
                        <Copy className="h-3 w-3" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderWorkflowSection = () => {
    if (!state.promptData?.workflow) return null;

    const isExpanded = state.expandedSections.has('workflow');
    
    return (
      <div className="border border-gray-200 rounded-lg mb-4">
        <div 
          className="flex items-center justify-between p-3 bg-gray-50 cursor-pointer hover:bg-gray-100"
          onClick={() => toggleSection('workflow')}
        >
          <div className="flex items-center">
            <History className="h-4 w-4 mr-2" />
            <span className="font-medium">工作流</span>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={(e) => {
                e.stopPropagation();
                copyToClipboard(JSON.stringify(state.promptData!.workflow, null, 2));
              }}
              className="p-1 hover:bg-gray-200 rounded"
              title="复制工作流JSON"
            >
              <Copy className="h-3 w-3" />
            </button>
            {isExpanded ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </div>
        </div>
        {isExpanded && (
          <div className="p-3 border-t border-gray-200">
            <div className="bg-gray-900 text-green-400 p-3 rounded text-xs font-mono overflow-auto max-h-96">
              <pre>{JSON.stringify(state.promptData.workflow, null, 2)}</pre>
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderRawDataSection = () => {
    if (!state.promptData?.raw_data || Object.keys(state.promptData.raw_data).length === 0) return null;

    const isExpanded = state.expandedSections.has('raw_data');
    
    return (
      <div className="border border-gray-200 rounded-lg mb-4">
        <div 
          className="flex items-center justify-between p-3 bg-gray-50 cursor-pointer hover:bg-gray-100"
          onClick={() => toggleSection('raw_data')}
        >
          <div className="flex items-center">
            <FileText className="h-4 w-4 mr-2" />
            <span className="font-medium">原始数据</span>
          </div>
          <div className="flex items-center space-x-2">
            {isExpanded ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </div>
        </div>
        {isExpanded && (
          <div className="p-3 border-t border-gray-200">
            <div className="space-y-2">
              {Object.entries(state.promptData.raw_data).map(([key, value]) => (
                <div key={key} className="bg-white p-3 rounded border">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium text-sm">{key}</span>
                    <button
                      onClick={() => copyToClipboard(String(value))}
                      className="p-1 hover:bg-gray-200 rounded"
                      title="复制"
                    >
                      <Copy className="h-3 w-3" />
                    </button>
                  </div>
                  <div className="text-xs text-gray-600 break-all">
                    {String(value)}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderActions = () => (
    <div className="flex items-center justify-between p-3 bg-gray-50 border-t border-gray-200">
      <div className="flex items-center space-x-2">
        <button
          onClick={() => setState(prev => ({ ...prev, activeTab: 'structured' }))}
          className={`px-3 py-1 text-sm rounded ${
            state.activeTab === 'structured'
              ? 'bg-blue-500 text-white'
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          结构化数据
        </button>
        <button
          onClick={() => setState(prev => ({ ...prev, activeTab: 'raw' }))}
          className={`px-3 py-1 text-sm rounded ${
            state.activeTab === 'raw'
              ? 'bg-blue-500 text-white'
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          原始数据
        </button>
      </div>
      <div className="flex items-center space-x-2">
        <button
          onClick={downloadAsText}
          className="flex items-center px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 text-sm"
        >
          <Download className="h-3 w-3 mr-1" />
          下载文本
        </button>
     </div>
    </div>
  );

  if (state.loading) {
    return renderLoadingState();
  }

  if (state.error) {
    return renderErrorState();
  }

  if (!state.promptData) {
    return (
      <div className="m-4 p-4 bg-gray-50 border border-gray-200 rounded-md">
        <p className="text-gray-600">未找到提示词数据</p>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      <div className="flex-1 overflow-auto p-4">
        <div className="max-w-4xl mx-auto">
          {state.activeTab === 'structured' ? (
            <div className="space-y-4">
              <JsonTreeViewer 
                data={prepareStructuredData()} 
                title="解析后的元数据"
              />
            </div>
          ) : (
            <div className="space-y-4">
              {renderPromptSection()}
              {renderNegativePromptSection()}
              {renderParametersSection()}
              {renderWorkflowSection()}
              {state.showRawData && renderRawDataSection()}
            </div>
          )}
        </div>
      </div>
      
      {renderActions()}
    </div>
  );
};

// 插件元数据
export const imagePromptPluginMetadata = {
  id: 'image-prompt',
  name: PLUGIN_CONFIG.PLUGIN_SHORT_NAME,
  description: PLUGIN_CONFIG.DESCRIPTION,
  version: PLUGIN_CONFIG.VERSION,
  author: PLUGIN_CONFIG.AUTHOR,
  supportedExtensions: PLUGIN_CONFIG.SUPPORTED_EXTENSIONS,
  category: PLUGIN_CONFIG.CATEGORY
};

// 插件导出
export default {
  metadata: imagePromptPluginMetadata,
  component: ImagePromptPlugin,
  isEnabled: true
};