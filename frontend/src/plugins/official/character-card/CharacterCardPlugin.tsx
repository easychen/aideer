import React, { useState, useEffect } from 'react';
import { Loader2, User, MessageSquare, Settings, Tag, Edit, Save, X, Plus, Book, FileText, Zap, History, MessageCircle, Hash, UserCheck, GitBranch, Puzzle, BookOpen } from 'lucide-react';
import { PngProcessor, CharacterData } from './utils/pngProcessor';
import type { PluginComponentProps } from '../../types';

// 插件配置常量
const PLUGIN_CONFIG = {
  APP_NAME: 'Aideer',
  PLUGIN_NAME: 'Character Card',
  PLGUIN_SHORT_NAME: '角色卡',
  TAG_NAME: '标签', 
  DESCRIPTION: '显示PNG文件中的角色卡片信息',
  VERSION: '1.0.0',
  AUTHOR: 'Aideer Team',
  SUPPORTED_EXTENSIONS: ['.png'],
  CATEGORY: 'viewer'
};

interface CharacterCardPluginState {
  loading: boolean;
  error: string | null;
  characterData: CharacterData | null;
  isEditing: boolean;
  editData: CharacterData | null;
  showSaveDialog: boolean;
}

/**
 * CharacterCard插件组件
 * 用于显示PNG文件中的角色卡片信息
 */
export const CharacterCardPlugin: React.FC<PluginComponentProps> = ({ file, projectId, api }) => {
  const [state, setState] = useState<CharacterCardPluginState>({
    loading: true,
    error: null,
    characterData: null,
    isEditing: false,
    editData: null,
    showSaveDialog: false
  });

  useEffect(() => {
    loadCharacterData();
  }, [file]);

  const loadCharacterData = async () => {
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
      if (!PngProcessor.isValidPng(arrayBuffer)) {
        throw new Error('无效的PNG文件格式');
      }

      // 提取角色数据
      const characterData = await PngProcessor.extractCharacterData(arrayBuffer);
      
      if (!characterData) {
        throw new Error('PNG文件中未找到角色卡片数据');
      }

      setState(prev => ({
        ...prev,
        loading: false,
        error: null,
        characterData
      }));
    } catch (error) {
      console.error('加载角色数据失败:', error);
      setState(prev => ({
        ...prev,
        loading: false,
        error: (error as Error).message,
        characterData: null
      }));
    }
  };

  const renderLoadingState = () => (
    <div className="flex items-center justify-center p-8">
      <Loader2 className="h-8 w-8 animate-spin" />
      <span className="ml-2">正在加载角色数据...</span>
    </div>
  );

  const renderErrorState = () => (
    <div className="m-4 p-4 bg-red-50 border border-red-200 rounded-md">
      <p className="text-red-800">{state.error}</p>
    </div>
  );

  // 编辑相关函数
  const startEditing = () => {
    setState(prev => ({
      ...prev,
      isEditing: true,
      editData: { ...prev.characterData! }
    }));
  };

  const cancelEditing = () => {
    setState(prev => ({
      ...prev,
      isEditing: false,
      editData: null,
      showSaveDialog: false
    }));
  };

  const updateEditData = (field: keyof CharacterData, value: any) => {
    setState(prev => ({
      ...prev,
      editData: {
        ...prev.editData!,
        [field]: value
      }
    }));
  };

  const showSaveOptions = () => {
    setState(prev => ({ ...prev, showSaveDialog: true }));
  };

  const hideSaveOptions = () => {
    setState(prev => ({ ...prev, showSaveDialog: false }));
  };

  const saveAsNewFile = async () => {
    if (!state.editData) {
      console.error('缺少编辑数据');
      return;
    }

    try {
      // 获取原始文件内容
      const fileUrl = api?.file.getUrl(file.relativePath, projectId);
      if (!fileUrl) {
        console.error('无法获取文件URL');
        return;
      }
      
      const response = await fetch(fileUrl);
      const originalBuffer = await response.arrayBuffer();
      
      // 生成包含新数据的PNG文件
      const newPngBuffer = PngProcessor.embedCharacterData(originalBuffer, state.editData);
      
      // 创建新文件名
      const originalName = file.name.replace(/\.png$/i, '');
      const newFileName = `${originalName}_edited_${Date.now()}.png`;
      
      // 使用新的API接口创建文件
      const newFilePath = file.relativePath.replace(file.name, newFileName);
      const success = await api?.file.createFile(newFilePath, newPngBuffer, projectId);
      
      if (success) {
        api?.ui.showNotification('新文件已创建成功', 'success');
      } else {
        // 如果API创建失败，回退到下载方式
        const blob = new Blob([newPngBuffer], { type: 'image/png' });
        const downloadUrl = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = downloadUrl;
        link.download = newFileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(downloadUrl);
        
        api?.ui.showNotification('新文件已保存到下载文件夹', 'success');
      }
      
      hideSaveOptions();
      cancelEditing();
    } catch (error) {
      console.error('保存新文件时出错:', error);
      api?.ui.showNotification('保存文件失败', 'error');
    }
  };

  const overwriteFile = async () => {
    if (!state.editData) {
      console.error('缺少编辑数据');
      return;
    }

    try {
      // 获取原始文件内容
      const fileUrl = api?.file.getUrl(file.relativePath, projectId);
      if (!fileUrl) {
        console.error('无法获取文件URL');
        return;
      }
      
      const response = await fetch(fileUrl);
      const originalBuffer = await response.arrayBuffer();
      
      // 生成包含更新数据的PNG文件
      const newPngBuffer = PngProcessor.embedCharacterData(originalBuffer, state.editData);
      
      // 使用新的API接口更新文件内容
      const success = await api?.file.updateFile(file.relativePath, newPngBuffer, projectId);
      
      if (success) {
        // 更新本地状态
        setState(prev => ({
          ...prev,
          characterData: state.editData,
          editData: null,
          isEditing: false,
          showSaveDialog: false
        }));
        
        api?.ui.showNotification('文件已成功更新', 'success');
      } else {
        // 如果API更新失败，回退到下载方式
        const confirmed = await api?.ui.showConfirm(
          'API更新失败，是否下载更新后的文件？',
          '覆盖文件'
        );
        
        if (confirmed) {
          const blob = new Blob([newPngBuffer], { type: 'image/png' });
          const downloadUrl = URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = downloadUrl;
          link.download = file.name;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          URL.revokeObjectURL(downloadUrl);
          
          // 更新本地状态
          setState(prev => ({
            ...prev,
            characterData: state.editData,
            editData: null,
            isEditing: false,
            showSaveDialog: false
          }));
          
          api?.ui.showNotification('文件已下载，请手动替换原文件', 'success');
        }
      }
    } catch (error) {
      console.error('覆盖文件时出错:', error);
      api?.ui.showNotification('处理文件失败', 'error');
    }
  };

  // 渲染保存选项对话框
  const renderSaveDialog = () => {
    if (!state.showSaveDialog) return null;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4">
          <h3 className="text-lg font-semibold mb-4">保存选项</h3>
          <p className="text-gray-600 dark:text-gray-400 mb-6">请选择保存方式：</p>
          <div className="space-y-3">
            <button
              onClick={overwriteFile}
              className="w-full flex items-center gap-3 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors"
            >
              <Save className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              <div className="text-left">
                <div className="font-medium text-blue-900 dark:text-blue-100">覆盖原文件</div>
                <div className="text-sm text-blue-600 dark:text-blue-400">直接更新当前PNG文件</div>
              </div>
            </button>
            <button
              onClick={saveAsNewFile}
              className="w-full flex items-center gap-3 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg hover:bg-green-100 dark:hover:bg-green-900/30 transition-colors"
            >
              <Plus className="h-5 w-5 text-green-600 dark:text-green-400" />
              <div className="text-left">
                <div className="font-medium text-green-900 dark:text-green-100">保存为新文件</div>
                <div className="text-sm text-green-600 dark:text-green-400">创建新的PNG文件</div>
              </div>
            </button>
            <button
              onClick={hideSaveOptions}
              className="w-full flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
            >
              <X className="h-5 w-5 text-gray-600 dark:text-gray-400" />
              <div className="text-left">
                <div className="font-medium text-gray-900 dark:text-gray-100">取消</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">不保存更改</div>
              </div>
            </button>
          </div>
        </div>
      </div>
    );
  };

  const renderCharacterInfo = () => {
    if (!state.characterData) return null;

    const { characterData, isEditing, editData } = state;
    const displayData = isEditing ? editData! : characterData;

    return (
      <div className="h-full overflow-auto">
        {renderSaveDialog()}
        <div className="p-6 space-y-6">
          {/* 编辑控制按钮 */}
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <User className="h-5 w-5 text-blue-600" />
              <h2 className="text-xl font-bold">角色卡片 - CCv2</h2>
              {displayData.character_version && (
                <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 text-xs rounded-full">
                  v{displayData.character_version}
                </span>
              )}
            </div>
            <div className="flex gap-2">
              {!isEditing ? (
                <button
                  onClick={startEditing}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                >
                  <Edit className="h-4 w-4" />
                  编辑
                </button>
              ) : (
                <div className="flex gap-2">
                  <button
                    onClick={showSaveOptions}
                    className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
                  >
                    <Save className="h-4 w-4" />
                    保存
                  </button>
                  <button
                    onClick={cancelEditing}
                    className="flex items-center gap-2 px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors"
                  >
                    <X className="h-4 w-4" />
                    取消
                  </button>
                </div>
              )}
            </div>
          </div>
          {/* 基本信息 */}
          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg">
            <div className="p-4 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <UserCheck className="h-5 w-5" />
                基本信息
              </h3>
            </div>
            <div className="p-4 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">角色名称 *</label>
                  {isEditing ? (
                    <input
                      type="text"
                      value={displayData.name || ''}
                      onChange={(e) => updateEditData('name', e.target.value)}
                      className="w-full mt-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                      placeholder="输入角色名称"
                      required
                    />
                  ) : (
                    <p className="text-lg font-semibold">{displayData.name || '未知'}</p>
                  )}
                </div>
                
                <div>
                  <label className="text-sm font-medium text-muted-foreground">创作者</label>
                  {isEditing ? (
                    <input
                      type="text"
                      value={displayData.creator || ''}
                      onChange={(e) => updateEditData('creator', e.target.value)}
                      className="w-full mt-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                      placeholder="输入创作者"
                    />
                  ) : (
                    <p>{displayData.creator || '未知'}</p>
                  )}
                </div>
                
                <div>
                  <label className="text-sm font-medium text-muted-foreground">角色版本</label>
                  {isEditing ? (
                    <input
                      type="text"
                      value={displayData.character_version || displayData.characterVersion || ''}
                      onChange={(e) => updateEditData('character_version', e.target.value)}
                      className="w-full mt-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                      placeholder="输入版本号"
                    />
                  ) : (
                    <p>{displayData.character_version || displayData.characterVersion || '1.0'}</p>
                  )}
                </div>
                
                <div>
                  <label className="text-sm font-medium text-muted-foreground">性别</label>
                  {isEditing ? (
                    <input
                      type="text"
                      value={displayData.gender || ''}
                      onChange={(e) => updateEditData('gender', e.target.value)}
                      className="w-full mt-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                      placeholder="输入性别"
                    />
                  ) : (
                    displayData.gender && <p>{displayData.gender}</p>
                  )}
                </div>
              </div>
              
              {/* 标签 */}
              <div>
                <label className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                  <Hash className="h-4 w-4" />
                  标签
                </label>
                {isEditing ? (
                  <input
                    type="text"
                    value={(displayData.tags || []).join(', ')}
                    onChange={(e) => updateEditData('tags', e.target.value.split(',').map(tag => tag.trim()).filter(tag => tag))}
                    className="w-full mt-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                    placeholder="输入标签，用逗号分隔"
                  />
                ) : (
                  <div className="flex flex-wrap gap-2 mt-1">
                    {(displayData.tags || []).map((tag, index) => (
                      <span key={index} className="px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 text-xs rounded-full">
                        {tag}
                      </span>
                    ))}
                    {(!displayData.tags || displayData.tags.length === 0) && (
                      <span className="text-gray-500 text-sm">无标签</span>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* 角色描述 */}
          {(isEditing || displayData.description || displayData.fullDescription) && (
            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg">
              <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  角色描述
                </h3>
              </div>
              <div className="p-4">
                {isEditing ? (
                  <textarea
                    value={displayData.fullDescription || displayData.description || ''}
                    onChange={(e) => updateEditData('fullDescription', e.target.value)}
                    className="w-full h-32 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 resize-vertical"
                    placeholder="输入角色描述"
                    required
                  />
                ) : (
                  <p className="whitespace-pre-wrap break-words overflow-wrap-anywhere">
                    {displayData.fullDescription || displayData.description}
                  </p>
                )}
              </div>
            </div>
          )}

          {/* 性格特征 */}
          {(isEditing || displayData.personality) && (
            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg">
              <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <Zap className="h-5 w-5" />
                  性格特征
                </h3>
              </div>
              <div className="p-4">
                {isEditing ? (
                  <textarea
                    value={displayData.personality || ''}
                    onChange={(e) => updateEditData('personality', e.target.value)}
                    className="w-full h-24 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 resize-vertical"
                    placeholder="输入性格特征"
                    required
                  />
                ) : (
                  <p className="whitespace-pre-wrap break-words overflow-wrap-anywhere">{displayData.personality}</p>
                )}
              </div>
            </div>
          )}

          {/* 场景设定 */}
          {(isEditing || displayData.scenario) && (
            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg">
              <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <Book className="h-5 w-5" />
                  场景设定
                </h3>
              </div>
              <div className="p-4">
                {isEditing ? (
                  <textarea
                    value={displayData.scenario || ''}
                    onChange={(e) => updateEditData('scenario', e.target.value)}
                    className="w-full h-24 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 resize-vertical"
                    placeholder="输入场景设定"
                    required
                  />
                ) : (
                  <p className="whitespace-pre-wrap break-words overflow-wrap-anywhere">{displayData.scenario}</p>
                )}
              </div>
            </div>
          )}

          {/* 对话示例 */}
          {characterData.exampleDialogue && (
            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg">
              <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <MessageSquare className="h-5 w-5" />
                  对话示例
                </h3>
              </div>
              <div className="p-4">
                <p className="whitespace-pre-wrap break-words overflow-wrap-anywhere font-mono text-sm">
                  {characterData.exampleDialogue}
                </p>
              </div>
            </div>
          )}

          {/* 首次问候 */}
          {(isEditing || displayData.firstMes) && (
            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg">
              <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <MessageCircle className="h-5 w-5" />
                  首次问候
                </h3>
              </div>
              <div className="p-4">
                {isEditing ? (
                  <textarea
                    value={displayData.firstMes || ''}
                    onChange={(e) => updateEditData('firstMes', e.target.value)}
                    className="w-full h-24 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 resize-vertical"
                    placeholder="输入首次问候"
                    required
                  />
                ) : (
                  <p className="whitespace-pre-wrap break-words overflow-wrap-anywhere">{displayData.firstMes}</p>
                )}
              </div>
            </div>
          )}

          {/* 备用问候语 */}
          {(isEditing || (characterData.alternateGreetings && characterData.alternateGreetings.length > 0)) && (
            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg">
              <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <GitBranch className="h-5 w-5" />
                  备用问候语
                </h3>
              </div>
              <div className="p-4 space-y-3">
                {isEditing ? (
                  <div>
                    <textarea
                      value={(displayData.alternateGreetings || []).join('\n---\n')}
                      onChange={(e) => updateEditData('alternateGreetings', e.target.value.split('\n---\n').filter(g => g.trim()))}
                      className="w-full h-32 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 resize-vertical"
                      placeholder="输入备用问候语，用 ---（三个短横线）分隔多个问候语"
                    />
                    <p className="text-xs text-gray-500 mt-1">使用 --- 分隔多个问候语</p>
                  </div>
                ) : (
                  characterData.alternateGreetings && characterData.alternateGreetings.map((greeting, index) => (
                    <div key={index} className="p-3 bg-gray-100 dark:bg-gray-700 rounded-md">
                      <p className="whitespace-pre-wrap break-words overflow-wrap-anywhere">{greeting}</p>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* 系统提示 */}
          {(isEditing || characterData.systemPrompt) && (
            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg">
              <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  系统提示
                </h3>
              </div>
              <div className="p-4">
                {isEditing ? (
                  <textarea
                    value={displayData.systemPrompt || ''}
                    onChange={(e) => updateEditData('systemPrompt', e.target.value)}
                    className="w-full h-24 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 resize-vertical font-mono text-sm"
                    placeholder="输入系统提示"
                  />
                ) : (
                  <p className="whitespace-pre-wrap break-words overflow-wrap-anywhere font-mono text-sm bg-gray-100 dark:bg-gray-700 p-3 rounded-md">
                    {characterData.systemPrompt}
                  </p>
                )}
              </div>
            </div>
          )}

          {/* 创作者备注 */}
          {(isEditing || characterData.creatorNotes || characterData.creator_notes) && (
            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg">
              <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <Puzzle className="h-5 w-5" />
                  创作者备注
                </h3>
              </div>
              <div className="p-4">
                {isEditing ? (
                  <textarea
                    value={displayData.creatorNotes || displayData.creator_notes || ''}
                    onChange={(e) => updateEditData('creator_notes', e.target.value)}
                    className="w-full h-24 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 resize-vertical"
                    placeholder="输入创作者备注"
                  />
                ) : (
                  <p className="whitespace-pre-wrap break-words overflow-wrap-anywhere">{characterData.creatorNotes || characterData.creator_notes}</p>
                )}
              </div>
            </div>
          )}

          {/* 历史指令 */}
           {(isEditing || characterData.post_history_instructions) && (
             <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg">
               <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                 <h3 className="text-lg font-semibold flex items-center gap-2">
                   <History className="h-5 w-5" />
                   历史指令
                 </h3>
               </div>
               <div className="p-4">
                 {isEditing ? (
                   <textarea
                     value={displayData.post_history_instructions || ''}
                     onChange={(e) => updateEditData('post_history_instructions', e.target.value)}
                     className="w-full h-24 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 resize-vertical font-mono text-sm"
                     placeholder="输入历史指令"
                   />
                 ) : (
                   <p className="whitespace-pre-wrap break-words overflow-wrap-anywhere font-mono text-sm bg-gray-100 dark:bg-gray-700 p-3 rounded-md">
                     {characterData.post_history_instructions}
                   </p>
                 )}
               </div>
             </div>
           )}

           {/* 世界书 */}
           {(isEditing || (characterData.character_book && characterData.character_book.entries && characterData.character_book.entries.length > 0)) && (
             <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg">
               <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                 <h3 className="text-lg font-semibold flex items-center gap-2">
                   <BookOpen className="h-5 w-5" />
                   世界书 (Character Book)
                 </h3>
               </div>
               <div className="p-4 space-y-4">
                 {/* 世界书基本设置 */}
                 {isEditing && (
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                     <div>
                       <label className="text-sm font-medium text-muted-foreground">世界书名称</label>
                       <input
                         type="text"
                         value={displayData.character_book?.name || ''}
                         onChange={(e) => updateEditData('character_book', {
                           ...displayData.character_book,
                           name: e.target.value
                         })}
                         className="w-full mt-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                         placeholder="输入世界书名称"
                       />
                     </div>
                     <div>
                       <label className="text-sm font-medium text-muted-foreground">扫描深度</label>
                       <input
                         type="number"
                         value={displayData.character_book?.scan_depth || 100}
                         onChange={(e) => updateEditData('character_book', {
                           ...displayData.character_book,
                           scan_depth: parseInt(e.target.value) || 100
                         })}
                         className="w-full mt-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                         placeholder="100"
                       />
                     </div>
                     <div>
                       <label className="text-sm font-medium text-muted-foreground">Token预算</label>
                       <input
                         type="number"
                         value={displayData.character_book?.token_budget || 500}
                         onChange={(e) => updateEditData('character_book', {
                           ...displayData.character_book,
                           token_budget: parseInt(e.target.value) || 500
                         })}
                         className="w-full mt-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                         placeholder="500"
                       />
                     </div>
                     <div className="flex items-center">
                       <label className="flex items-center">
                         <input
                           type="checkbox"
                           checked={displayData.character_book?.recursive_scanning || false}
                           onChange={(e) => updateEditData('character_book', {
                             ...displayData.character_book,
                             recursive_scanning: e.target.checked
                           })}
                           className="mr-2"
                         />
                         <span className="text-sm font-medium text-muted-foreground">递归扫描</span>
                       </label>
                     </div>
                   </div>
                 )}
                 
                 {/* 世界书条目 */}
                 <div className="space-y-3">
                   {(displayData.character_book?.entries || []).map((entry, index) => (
                     <div key={index} className="border border-gray-200 dark:border-gray-600 rounded-lg p-4">
                       {isEditing ? (
                         <div className="space-y-3">
                           <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                             <div>
                               <label className="text-sm font-medium text-muted-foreground">关键词</label>
                               <input
                                 type="text"
                                 value={(entry.keys || []).join(', ')}
                                 onChange={(e) => {
                                   const newEntries = [...(displayData.character_book?.entries || [])];
                                   newEntries[index] = {
                                     ...entry,
                                     keys: e.target.value.split(',').map(k => k.trim()).filter(k => k)
                                   };
                                   updateEditData('character_book', {
                                     ...displayData.character_book,
                                     entries: newEntries
                                   });
                                 }}
                                 className="w-full mt-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                                 placeholder="输入关键词，用逗号分隔"
                               />
                             </div>
                             <div>
                               <label className="text-sm font-medium text-muted-foreground">插入顺序</label>
                               <input
                                 type="number"
                                 value={entry.insertion_order || 0}
                                 onChange={(e) => {
                                   const newEntries = [...(displayData.character_book?.entries || [])];
                                   newEntries[index] = {
                                     ...entry,
                                     insertion_order: parseInt(e.target.value) || 0
                                   };
                                   updateEditData('character_book', {
                                     ...displayData.character_book,
                                     entries: newEntries
                                   });
                                 }}
                                 className="w-full mt-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                               />
                             </div>
                           </div>
                           <div>
                             <label className="text-sm font-medium text-muted-foreground">内容</label>
                             <textarea
                               value={entry.content || ''}
                               onChange={(e) => {
                                 const newEntries = [...(displayData.character_book?.entries || [])];
                                 newEntries[index] = {
                                   ...entry,
                                   content: e.target.value
                                 };
                                 updateEditData('character_book', {
                                   ...displayData.character_book,
                                   entries: newEntries
                                 });
                               }}
                               className="w-full mt-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 min-h-[80px]"
                               placeholder="输入条目内容"
                             />
                           </div>
                           <div className="flex items-center justify-between">
                             <label className="flex items-center">
                               <input
                                 type="checkbox"
                                 checked={entry.enabled !== false}
                                 onChange={(e) => {
                                   const newEntries = [...(displayData.character_book?.entries || [])];
                                   newEntries[index] = {
                                     ...entry,
                                     enabled: e.target.checked
                                   };
                                   updateEditData('character_book', {
                                     ...displayData.character_book,
                                     entries: newEntries
                                   });
                                 }}
                                 className="mr-2"
                               />
                               <span className="text-sm font-medium text-muted-foreground">启用</span>
                             </label>
                             <button
                               onClick={() => {
                                 const newEntries = [...(displayData.character_book?.entries || [])];
                                 newEntries.splice(index, 1);
                                 updateEditData('character_book', {
                                   ...displayData.character_book,
                                   entries: newEntries
                                 });
                               }}
                               className="px-3 py-1 text-sm bg-red-500 text-white rounded hover:bg-red-600"
                             >
                               删除
                             </button>
                           </div>
                         </div>
                       ) : (
                         <div>
                           <div className="flex items-center justify-between mb-2">
                             <div className="flex flex-wrap gap-1">
                               {(entry.keys || []).map((key, keyIndex) => (
                                 <span key={keyIndex} className="px-2 py-1 bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 text-xs rounded">
                                   {key}
                                 </span>
                               ))}
                             </div>
                             <span className={`px-2 py-1 text-xs rounded ${entry.enabled !== false ? 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200' : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400'}`}>
                               {entry.enabled !== false ? '启用' : '禁用'}
                             </span>
                           </div>
                           <p className="whitespace-pre-wrap text-sm">{entry.content}</p>
                         </div>
                       )}
                     </div>
                   ))}
                   
                   {isEditing && (
                     <button
                       onClick={() => {
                         const newEntry = {
                           keys: [],
                           content: '',
                           enabled: true,
                           insertion_order: (displayData.character_book?.entries?.length || 0),
                           extensions: {}
                         };
                         updateEditData('character_book', {
                           ...displayData.character_book,
                           entries: [...(displayData.character_book?.entries || []), newEntry]
                         });
                       }}
                       className="w-full p-3 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg text-gray-500 hover:text-gray-700 hover:border-gray-400 transition-colors"
                     >
                       + 添加新条目
                     </button>
                   )}
                 </div>
               </div>
             </div>
           )}

          {/* 标签 */}
          {characterData.tags && characterData.tags.length > 0 && (
            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg">
              <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <Tag className="h-5 w-5" />
                  {PLUGIN_CONFIG.TAG_NAME}
                </h3>
              </div>
              <div className="p-4">
                <div className="flex flex-wrap gap-2">
                  {characterData.tags.map((tag, index) => (
                    <span key={index} className="px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 text-sm rounded">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  if (state.loading) {
    return renderLoadingState();
  }

  if (state.error) {
    return renderErrorState();
  }

  return renderCharacterInfo();
};

// 插件元数据
export const characterCardPluginMetadata = {
  id: 'character-card',
  name: PLUGIN_CONFIG.PLGUIN_SHORT_NAME,
  description: PLUGIN_CONFIG.DESCRIPTION,
  version: PLUGIN_CONFIG.VERSION,
  author: PLUGIN_CONFIG.AUTHOR,
  supportedExtensions: PLUGIN_CONFIG.SUPPORTED_EXTENSIONS,
  category: PLUGIN_CONFIG.CATEGORY
};

// 默认导出插件配置
export default {
  metadata: characterCardPluginMetadata,
  component: CharacterCardPlugin,
  isEnabled: true
};