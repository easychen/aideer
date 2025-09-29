import React, { useState, useEffect } from 'react';
import { Star, Tag, Link, FileText, Save, X, Plus, Edit3 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { FileItem } from '../../types/index';
import apiService from '../../services/api';

interface FileExtraInfo {
  id?: number;
  blake3Hash: string;
  projectId: number;
  relativePaths: string[];
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
  const { t } = useTranslation();
  const [extraInfo, setExtraInfo] = useState<FileExtraInfo>({
    blake3Hash: '',
    projectId: projectId,
    relativePaths: [],
    links: [],
    tags: [],
    starred: false,
    notes: '',
    extraJson: {}
  });
  const [isLoading, setIsLoading] = useState(false);
  const [newLink, setNewLink] = useState('');
  const [newTag, setNewTag] = useState('');
  const [isAddingLink, setIsAddingLink] = useState(false);
  const [isAddingTag, setIsAddingTag] = useState(false);
  
  // 笔记编辑状态
  const [isEditingNotes, setIsEditingNotes] = useState(false);
  const [notesValue, setNotesValue] = useState('');
  const [isSavingNotes, setIsSavingNotes] = useState(false);

  // 获取文件额外信息
  const fetchExtraInfo = async () => {
    setIsLoading(true);
    try {
      const data = await apiService.getFileExtraInfo(file.relativePath, projectId);
      if (data) {
        // 确保所有数组字段都有默认值
        setExtraInfo({
          ...data,
          relativePaths: data.relativePaths || [file.relativePath],
          links: data.links || [],
          tags: data.tags || [],
          notes: data.notes || '',
          extraJson: data.extraJson || {}
        });
        setNotesValue(data.notes || '');
      } else {
        // 如果没有数据，设置默认值
        setExtraInfo(prev => ({
          ...prev,
          relativePaths: [file.relativePath]
        }));
      }
    } catch (error) {
      console.error('获取文件额外信息失败:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // 保存单个字段的更改
  const saveFieldChange = async (fieldName: string, value: any) => {
    try {
      const updatedData = await apiService.saveFileExtraInfo(file.relativePath, {
        ...extraInfo,
        [fieldName]: value
      }, projectId);
      
      // 更新本地状态
      setExtraInfo({
        ...updatedData,
        links: updatedData.links || [],
        tags: updatedData.tags || [],
        relativePaths: updatedData.relativePaths || [file.relativePath],
        notes: updatedData.notes || '',
        extraJson: updatedData.extraJson || {}
      });
      
      if (fieldName === 'notes') {
        setNotesValue(updatedData.notes || '');
      }
    } catch (error) {
      console.error(`保存${fieldName}失败:`, error);
    }
  };

  // 切换星标
  const toggleStar = async () => {
    const newStarred = !extraInfo.starred;
    // 立即更新UI
    setExtraInfo(prev => ({ ...prev, starred: newStarred }));
    // 保存到后端
    await saveFieldChange('starred', newStarred);
  };

  // 添加标签
  const addTag = async () => {
    if (newTag.trim()) {
      const newTags = [...extraInfo.tags, newTag.trim()];
      setExtraInfo(prev => ({ ...prev, tags: newTags }));
      await saveFieldChange('tags', newTags);
      setNewTag('');
      setIsAddingTag(false);
    }
  };

  // 删除标签
  const removeTag = async (index: number) => {
    const newTags = extraInfo.tags.filter((_, i) => i !== index);
    setExtraInfo(prev => ({ ...prev, tags: newTags }));
    await saveFieldChange('tags', newTags);
  };

  // 添加链接
  const addLink = async () => {
    if (newLink.trim()) {
      const newLinks = [...extraInfo.links, newLink.trim()];
      setExtraInfo(prev => ({ ...prev, links: newLinks }));
      await saveFieldChange('links', newLinks);
      setNewLink('');
      setIsAddingLink(false);
    }
  };

  // 删除链接
  const removeLink = async (index: number) => {
    const newLinks = extraInfo.links.filter((_, i) => i !== index);
    setExtraInfo(prev => ({ ...prev, links: newLinks }));
    await saveFieldChange('links', newLinks);
  };

  // 开始编辑笔记
  const startEditingNotes = () => {
    setIsEditingNotes(true);
    setNotesValue(extraInfo.notes);
  };

  // 保存笔记
  const saveNotes = async () => {
    setIsSavingNotes(true);
    await saveFieldChange('notes', notesValue);
    setIsEditingNotes(false);
    setIsSavingNotes(false);
  };

  // 取消编辑笔记
  const cancelEditingNotes = () => {
    setNotesValue(extraInfo.notes);
    setIsEditingNotes(false);
  };

  useEffect(() => {
    fetchExtraInfo();
  }, [file.relativePath, projectId]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-muted-foreground">{t('file.extraInfo.loading')}</div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* 头部 */}
      <div className="p-4 border-b border-border">
        <div className="flex items-center space-x-2">
          <FileText className="w-4 h-4" />
          <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
            {t('file.detail.fileInfo')}
          </h3>
        </div>
      </div>

      {/* 内容区域 */}
      <div className="flex-1 p-4 overflow-y-auto space-y-4">
        {/* 星标 */}
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">
            {extraInfo.starred ? t('file.extraInfo.starred') : t('file.extraInfo.notStarred')}
          </span>
          <button
            onClick={toggleStar}
            className={`p-1 rounded transition-colors ${
              extraInfo.starred 
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
            <span className="text-sm font-medium">{t('file.extraInfo.tags')}</span>
            <button
              onClick={() => setIsAddingTag(true)}
              className="p-1 text-muted-foreground hover:text-foreground rounded transition-colors"
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
                placeholder={t('file.extraInfo.tagPlaceholder')}
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
                  className="ml-1 text-muted-foreground hover:text-foreground"
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
            <span className="text-sm font-medium">{t('file.extraInfo.links')}</span>
            <button
              onClick={() => setIsAddingLink(true)}
              className="p-1 text-muted-foreground hover:text-foreground rounded transition-colors"
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
                placeholder={t('file.extraInfo.linkPlaceholder')}
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
                  className="text-muted-foreground hover:text-foreground"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* 笔记 */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">{t('file.extraInfo.notes')}</span>
            {!isEditingNotes && (
              <button
                onClick={startEditingNotes}
                className="p-1 text-muted-foreground hover:text-foreground rounded transition-colors"
              >
                <Edit3 className="w-4 h-4" />
              </button>
            )}
          </div>
          
          {isEditingNotes ? (
            <div className="space-y-2">
              <textarea
                value={notesValue}
                onChange={(e) => setNotesValue(e.target.value)}
                placeholder={t('file.extraInfo.notePlaceholder')}
                className="w-full h-32 px-3 py-2 border border-border rounded text-sm resize-none focus:outline-none focus:ring-1 focus:ring-primary"
                autoFocus
              />
              <div className="flex items-center space-x-2">
                <button
                  onClick={saveNotes}
                  disabled={isSavingNotes}
                  className="flex items-center space-x-1 px-3 py-1 bg-primary text-primary-foreground rounded-md text-sm hover:bg-primary/90 disabled:opacity-50"
                >
                  <Save className="w-3 h-3" />
                  <span>{isSavingNotes ? t('common.loading') : t('common.save')}</span>
                </button>
                <button
                  onClick={cancelEditingNotes}
                  disabled={isSavingNotes}
                  className="flex items-center space-x-1 px-3 py-1 bg-secondary text-secondary-foreground rounded-md text-sm hover:bg-secondary/80 disabled:opacity-50"
                >
                  <X className="w-3 h-3" />
                  <span>{t('common.cancel')}</span>
                </button>
              </div>
            </div>
          ) : (
            <div 
              onClick={startEditingNotes}
              className="w-full min-h-[80px] px-3 py-2 border border-border rounded text-sm cursor-pointer hover:bg-muted/50 transition-colors"
            >
              {extraInfo.notes || (
                <span className="text-muted-foreground">{t('file.extraInfo.addNote')}</span>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default FileExtraInfoComponent;