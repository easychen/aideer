import React, { useState } from 'react';
import { ChevronDown, ChevronRight, Copy, Check } from 'lucide-react';

interface JsonTreeViewerProps {
  data: any;
  title?: string;
}

interface JsonNodeProps {
  data: any;
  keyName?: string;
  level?: number;
  onCopy?: (value: any, path: string) => void;
}

const JsonNode: React.FC<JsonNodeProps> = ({ data, keyName, level = 0, onCopy }) => {
  const [isExpanded, setIsExpanded] = useState(level < 2); // 默认展开前两层
  const [copied, setCopied] = useState(false);

  const handleCopy = async (value: any, path: string) => {
    try {
      const textToCopy = typeof value === 'string' ? value : JSON.stringify(value, null, 2);
      await navigator.clipboard.writeText(textToCopy);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      onCopy?.(value, path);
    } catch (error) {
      console.error('复制失败:', error);
    }
  };

  const getValueType = (value: any): string => {
    if (value === null) return 'null';
    if (Array.isArray(value)) return 'array';
    return typeof value;
  };

  const getValuePreview = (value: any): string => {
    const type = getValueType(value);
    switch (type) {
      case 'string':
        return value.length > 500 ? `"${value.substring(0, 500)}..."` : `"${value}"`;
      case 'number':
      case 'boolean':
      case 'null':
        return String(value);
      case 'array':
        return `Array(${value.length})`;
      case 'object':
        const keys = Object.keys(value);
        return `Object(${keys.length})`;
      default:
        return String(value);
    }
  };

  const renderValue = (value: any, key?: string) => {
    const type = getValueType(value);
    const path = keyName ? `${keyName}${key ? `.${key}` : ''}` : key || '';

    if (type === 'object' && value !== null) {
      const keys = Object.keys(value);
      if (keys.length === 0) {
        return (
          <div className="flex items-center gap-2">
            <span className="text-gray-500">{'{}'}</span>
            <button
              onClick={() => handleCopy(value, path)}
              className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
              title="复制对象"
            >
              {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
            </button>
          </div>
        );
      }

      return (
        <div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="flex items-center gap-1 text-gray-600 hover:text-gray-800 transition-colors"
            >
              {isExpanded ? (
                <ChevronDown className="w-4 h-4" />
              ) : (
                <ChevronRight className="w-4 h-4" />
              )}
              <span className="text-sm font-medium">
                {key && <span className="text-blue-600">"{key}": </span>}
                <span className="text-gray-500">Object({keys.length})</span>
              </span>
            </button>
            <button
              onClick={() => handleCopy(value, path)}
              className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
              title="复制对象"
            >
              {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
            </button>
          </div>
          {isExpanded && (
            <div className="ml-4 border-l border-gray-200 pl-4 mt-2">
              {keys.map((objKey) => (
                <div key={objKey} className="mb-2">
                  <JsonNode
                    data={value[objKey]}
                    keyName={`${path}.${objKey}`}
                    level={level + 1}
                    onCopy={onCopy}
                  />
                </div>
              ))}
            </div>
          )}
        </div>
      );
    }

    if (type === 'array') {
      if (value.length === 0) {
        return (
          <div className="flex items-center gap-2">
            <span className="text-gray-500">[]</span>
            <button
              onClick={() => handleCopy(value, path)}
              className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
              title="复制数组"
            >
              {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
            </button>
          </div>
        );
      }

      return (
        <div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="flex items-center gap-1 text-gray-600 hover:text-gray-800 transition-colors"
            >
              {isExpanded ? (
                <ChevronDown className="w-4 h-4" />
              ) : (
                <ChevronRight className="w-4 h-4" />
              )}
              <span className="text-sm font-medium">
                {key && <span className="text-blue-600">"{key}": </span>}
                <span className="text-gray-500">Array({value.length})</span>
              </span>
            </button>
            <button
              onClick={() => handleCopy(value, path)}
              className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
              title="复制数组"
            >
              {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
            </button>
          </div>
          {isExpanded && (
            <div className="ml-4 border-l border-gray-200 pl-4 mt-2">
              {value.map((item: any, index: number) => (
                <div key={index} className="mb-2">
                  <JsonNode
                    data={item}
                    keyName={`${path}[${index}]`}
                    level={level + 1}
                    onCopy={onCopy}
                  />
                </div>
              ))}
            </div>
          )}
        </div>
      );
    }

    // 基本类型值
    return (
      <div className="flex items-center gap-2">
        <span className="text-sm">
          {key && <span className="text-blue-600 font-medium">"{key}": </span>}
          <span className={`${
            type === 'string' ? 'text-green-600' :
            type === 'number' ? 'text-purple-600' :
            type === 'boolean' ? 'text-orange-600' :
            'text-gray-500'
          }`}>
            {getValuePreview(value)}
          </span>
        </span>
        <button
          onClick={() => handleCopy(value, path)}
          className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
          title="复制值"
        >
          {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
        </button>
      </div>
    );
  };

  return renderValue(data, keyName);
};

const JsonTreeViewer: React.FC<JsonTreeViewerProps> = ({ data, title = "JSON 数据" }) => {
  const [globalCopied, setGlobalCopied] = useState(false);

  const handleCopyAll = async () => {
    try {
      const jsonString = JSON.stringify(data, null, 2);
      await navigator.clipboard.writeText(jsonString);
      setGlobalCopied(true);
      setTimeout(() => setGlobalCopied(false), 2000);
    } catch (error) {
      console.error('复制失败:', error);
    }
  };

  const handleNodeCopy = (value: any, path: string) => {
    console.log(`已复制路径 ${path} 的值:`, value);
  };

  if (!data || (typeof data === 'object' && Object.keys(data).length === 0)) {
    return (
      <div className="p-4 bg-gray-50 rounded-lg">
        <p className="text-gray-500 text-center">暂无数据</p>
      </div>
    );
  }

  return (
    <div className="bg-white border border-gray-200 rounded-lg">
      <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-gray-50">
        <h3 className="text-lg font-medium text-gray-900">{title}</h3>
        <button
          onClick={handleCopyAll}
          className="flex items-center gap-2 px-3 py-1.5 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
        >
          {globalCopied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
          {globalCopied ? '已复制' : '复制全部'}
        </button>
      </div>
      <div className="p-4 max-h-96 overflow-y-auto">
        <JsonNode data={data} onCopy={handleNodeCopy} />
      </div>
    </div>
  );
};

export default JsonTreeViewer;