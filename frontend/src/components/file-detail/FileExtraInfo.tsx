import React, { useState, useEffect } from 'react';
import { Star, Tag, Link, FileText, Save, X, Plus } from 'lucide-react';
import { FileItem } from '../../types/index';
import apiService from '../../services/api';

interface FileExtraInfo {
  id?: number;
  blake3Hash: string;
  filePaths: string[];
  links: string[];
  tags: string[];
  starred: boolean;
  notes: string;
  extraJson: Record<string, any>;
  createdAt?: string;
  updatedAt?: string;
}

interface FileExtraInfoProps {
  file: FileItem;
  projectId: number;
}

const FileExtraInfoComponent: React.FC<FileExtraInfoProps> = ({ file, projectId }) => {
  const [extraInfo, setExtraInfo] = useState<FileExtraInfo>({
    blake3Hash: '',
    filePaths: [],
    links: [],
    tags: [],
    starred: false,
    notes: '',
    extraJson: {}
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [newLink, setNewLink] = useState('');
  const [newTag, setNewTag] = useState('');
  const [isAddingLink, setIsAddingLink] = useState(false);
  const [isAddingTag, setIsAddingTag] = useState(false);

  // 获取文件额外信息
  const fetchExtraInfo = async () => {
    setIsLoading(true);
    try {
      const data = await apiService.getFileExtraInfo(file.relativePath, projectId);
      if (data) {
        // 确保所有数组字段都有默认值
        setExtraInfo({
          ...data,
          links: data.links || [],
          tags: data.tags || [],
          filePaths: data.filePaths || [file.relativePath],
          notes: data.notes || '',
          extraJson: data.extraJson || {}
        });
      } else {
        // 文件没有额外信息，保持默认状态
        setExtraInfo(prev => ({
          ...prev,
          filePaths: [file.relativePath]
        }));
      }
    } catch (error) {
      console.error('获取文件额外信息失败:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // 保存文件额外信息
  const saveExtraInfo = async () => {
    setIsSaving(true);
    try {
      const updatedData = await apiService.saveFileExtraInfo(file.relativePath, extraInfo, projectId);
      // 确保返回的数据包含所有必要的默认值
      setExtraInfo({
        ...updatedData,
        links: updatedData.links || [],
        tags: updatedData.tags || [],
        filePaths: updatedData.filePaths || [file.relativePath],
        notes: updatedData.notes || '',
        extraJson: updatedData.extraJson || {}
      });
      setIsEditing(false);
      // 可以添加成功提示
    } catch (error) {
      console.error('保存文件额外信息失败:', error);
      console.error('保存失败');
    } finally {
      setIsSaving(false);
    }
  };

  // 取消编辑
  const cancelEdit = () => {
    setIsEditing(false);
    setIsAddingLink(false);
    setIsAddingTag(false);
    setNewLink('');
    setNewTag('');
    // 重新获取数据，恢复到保存的状态
    fetchExtraInfo();
  };

  // 开始编辑
  const startEdit = () => {
    setIsEditing(true);
  };

  // 添加链接
  const addLink = () => {
    if (newLink.trim()) {
      setExtraInfo(prev => ({
        ...prev,
        links: [...prev.links, newLink.trim()]
      }));
      setNewLink('');
      setIsAddingLink(false);
    }
  };

  // 删除链接
  const removeLink = (index: number) => {
    setExtraInfo(prev => ({
      ...prev,
      links: prev.links.filter((_, i) => i !== index)
    }));
  };

  // 添加标签
  const addTag = () => {
    if (newTag.trim() && !extraInfo.tags.includes(newTag.trim())) {
      setExtraInfo(prev => ({
        ...prev,
        tags: [...prev.tags, newTag.trim()]
      }));
      setNewTag('');
      setIsAddingTag(false);
    }
  };

  // 删除标签
  const removeTag = (index: number) => {
    setExtraInfo(prev => ({
      ...prev,
      tags: prev.tags.filter((_, i) => i !== index)
    }));
  };

  // 切换星标状态
  const toggleStar = () => {
    setExtraInfo(prev => ({
      ...prev,
      starred: !prev.starred
    }));
  };

  // 更新笔记
  const updateNotes = (notes: string) => {
    setExtraInfo(prev => ({
      ...prev,
      notes
    }));
  };

  useEffect(() => {
    fetchExtraInfo();
  }, [file.relativePath]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-muted-foreground">加载中...</div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* 头部 */}
      <div className="p-4 border-b border-border">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <FileText className="w-4 h-4" />
            <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
              文件信息
            </h3>
          </div>
          {!isEditing ? (
            <button
              onClick={startEdit}
              className="flex items-center space-x-1 px-3 py-1 bg-secondary text-secondary-foreground rounded-md text-sm hover:bg-secondary/80"
            >
              <FileText className="w-3 h-3" />
              <span>编辑</span>
            </button>
          ) : (
            <div className="flex items-center space-x-2">
              <button
                onClick={saveExtraInfo}
                disabled={isSaving}
                className="flex items-center space-x-1 px-3 py-1 bg-primary text-primary-foreground rounded-md text-sm hover:bg-primary/90 disabled:opacity-50"
              >
                <Save className="w-3 h-3" />
                <span>{isSaving ? '保存中...' : '保存'}</span>
              </button>
              <button
                onClick={cancelEdit}
                disabled={isSaving}
                className="flex items-center space-x-1 px-3 py-1 bg-secondary text-secondary-foreground rounded-md text-sm hover:bg-secondary/80 disabled:opacity-50"
              >
                <X className="w-3 h-3" />
                <span>取消</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* 内容区域 */}
      <div className="flex-1 p-4 overflow-y-auto space-y-4">
        {/* 星标 */}
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">星标</span>
          <button
            onClick={toggleStar}
            disabled={!isEditing}
            className={`p-1 rounded transition-colors ${
              !isEditing 
                ? 'text-muted-foreground/50 cursor-not-allowed'
                : extraInfo.starred 
                  ? 'text-yellow-500 hover:text-yellow-600' 
                  : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <Star className={`w-5 h-5 ${extraInfo.starred ? 'fill-current' : ''}`} />
          </button>
        </div>

        {/* 标签 */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">标签</span>
            <button
              onClick={() => setIsAddingTag(true)}
              disabled={!isEditing}
              className={`p-1 rounded transition-colors ${
                !isEditing 
                  ? 'text-muted-foreground/50 cursor-not-allowed'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>
          
          {isAddingTag && (
            <div className="flex items-center space-x-2 mb-2">
              <input
                type="text"
                value={newTag}
                onChange={(e) => setNewTag(e.target.value)}
                placeholder="输入标签"
                className="flex-1 px-2 py-1 border border-border rounded text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === 'Enter') addTag();
                  if (e.key === 'Escape') setIsAddingTag(false);
                }}
              />
              <button
                onClick={addTag}
                className="p-1 text-green-600 hover:text-green-700"
              >
                <Save className="w-4 h-4" />
              </button>
              <button
                onClick={() => setIsAddingTag(false)}
                className="p-1 text-muted-foreground hover:text-foreground"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}
          
          <div className="flex flex-wrap gap-1">
            {(extraInfo.tags || []).map((tag, index) => (
              <span
                key={index}
                className="inline-flex items-center px-2 py-1 bg-secondary text-secondary-foreground rounded-full text-xs"
              >
                <Tag className="w-3 h-3 mr-1" />
                {tag}
                <button
                  onClick={() => removeTag(index)}
                  disabled={!isEditing}
                  className={`ml-1 ${
                    !isEditing 
                      ? 'text-muted-foreground/50 cursor-not-allowed'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}
          </div>
        </div>

        {/* 链接 */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">链接</span>
            <button
              onClick={() => setIsAddingLink(true)}
              disabled={!isEditing}
              className={`p-1 rounded transition-colors ${
                !isEditing 
                  ? 'text-muted-foreground/50 cursor-not-allowed'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>
          
          {isAddingLink && (
            <div className="flex items-center space-x-2 mb-2">
              <input
                type="url"
                value={newLink}
                onChange={(e) => setNewLink(e.target.value)}
                placeholder="输入链接URL"
                className="flex-1 px-2 py-1 border border-border rounded text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === 'Enter') addLink();
                  if (e.key === 'Escape') setIsAddingLink(false);
                }}
              />
              <button
                onClick={addLink}
                className="p-1 text-green-600 hover:text-green-700"
              >
                <Save className="w-4 h-4" />
              </button>
              <button
                onClick={() => setIsAddingLink(false)}
                className="p-1 text-muted-foreground hover:text-foreground"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}
          
          <div className="space-y-1">
            {(extraInfo.links || []).map((link, index) => (
              <div key={index} className="flex items-center space-x-2 p-2 bg-muted rounded">
                <Link className="w-4 h-4 text-blue-500 flex-shrink-0" />
                <a
                  href={link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 text-sm text-blue-600 hover:text-blue-800 truncate"
                  title={link}
                >
                  {link}
                </a>
                <button
                  onClick={() => removeLink(index)}
                  disabled={!isEditing}
                  className={`${
                    !isEditing 
                      ? 'text-muted-foreground/50 cursor-not-allowed'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* 笔记 */}
        <div>
          <span className="text-sm font-medium mb-2 block">笔记</span>
          <textarea
            value={extraInfo.notes}
            onChange={(e) => updateNotes(e.target.value)}
            disabled={!isEditing}
            placeholder="添加笔记..."
            className={`w-full h-32 px-3 py-2 border border-border rounded text-sm resize-none focus:outline-none focus:ring-1 focus:ring-primary ${
              !isEditing ? 'bg-muted cursor-not-allowed' : ''
            }`}
          />
        </div>
      </div>
    </div>
  );
};

export default FileExtraInfoComponent;