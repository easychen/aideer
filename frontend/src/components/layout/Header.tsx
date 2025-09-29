import { Plus, Settings, ChevronRight, Home, Edit2, Trash2, List, CheckSquare, Square, ChevronDown, Search, X } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useProjectStore } from '../../stores/useProjectStore';
import { usePathContext } from '../../contexts/PathContext';
import ImportDialog from '../dialogs/ImportDialog';
import SettingsDialog from '../dialogs/SettingsDialog';
import EditFolderDialog from '../dialogs/EditFolderDialog';
import DeleteFolderDialog from '../dialogs/DeleteFolderDialog';
import BatchDeleteDialog from '../dialogs/BatchDeleteDialog';
import BatchMoveDialog from '../dialogs/BatchMoveDialog';

import { FileItem } from '../../types/index';
import FileDetailModal from '../file-detail/FileDetailModal';
import { apiService } from '../../services/api';

interface SearchResult {
  type: 'file' | 'note';
  id: string;
  name: string;
  path: string;
  relativePath: string;
  projectId: number;
  projectName: string;
  matchType: 'filename' | 'content';
  snippet?: string;
  notes?: string;
  tags?: string[];
  starred?: boolean;
}

interface HeaderProps {
  currentPath?: string;
  onImportComplete?: () => void;
  isManagementMode?: boolean;
  onToggleManagement?: () => void;
  selectedFiles?: string[];
  onSelectAll?: () => void;
  onDeselectAll?: () => void;
  onBatchDelete?: () => void;
  onBatchMove?: () => void;
}

const Header = ({ 
  currentPath = '', 
  onImportComplete,
  isManagementMode = false,
  onToggleManagement,
  selectedFiles = [],
  onSelectAll,
  onDeselectAll
}: HeaderProps) => {
  const { t } = useTranslation();
  const { currentProject } = useProjectStore();
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false);
  const [isSettingsDialogOpen, setIsSettingsDialogOpen] = useState(false);
  const [isHoveringBreadcrumb, setIsHoveringBreadcrumb] = useState(false);
  const [isEditFolderDialogOpen, setIsEditFolderDialogOpen] = useState(false);
  const [isDeleteFolderDialogOpen, setIsDeleteFolderDialogOpen] = useState(false);
  const [isBatchMenuOpen, setIsBatchMenuOpen] = useState(false);
  const [isBatchDeleteDialogOpen, setIsBatchDeleteDialogOpen] = useState(false);
  const [isBatchMoveDialogOpen, setIsBatchMoveDialogOpen] = useState(false);
  
  // 搜索相关状态
  const [isSearchVisible, setIsSearchVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedFile, setSelectedFile] = useState<FileItem | null>(null);
  const [isFileDetailOpen, setIsFileDetailOpen] = useState(false);
  
  const { setCurrentPath } = usePathContext();

  const handleImportClick = () => {
    if (currentProject) {
      setIsImportDialogOpen(true);
    }
  };

  const handleImportComplete = () => {
    setIsImportDialogOpen(false);
    onImportComplete?.();
  };
  
  const handleSettingsClick = () => {
    setIsSettingsDialogOpen(true);
  };
  
  const handleSettingsClose = () => {
    setIsSettingsDialogOpen(false);
  };

  const handleSearchToggle = () => {
    setIsSearchVisible(!isSearchVisible);
    if (!isSearchVisible) {
      setSearchQuery('');
      setSearchResults([]);
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim() || !currentProject) return;
    
    setIsSearching(true);
    try {
      const results = await apiService.search(searchQuery, currentProject.id);
      setSearchResults(results.results);
    } catch (error) {
      console.error('搜索失败:', error);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  const handleSearchResultClick = async (result: SearchResult) => {
    try {
      if (result.type === 'file') {
        const fileInfo = await apiService.getFileById(result.id, result.projectId);
        setSelectedFile(fileInfo);
        setIsFileDetailOpen(true);
      } else if (result.type === 'note') {
        const files = await apiService.getProjectFiles(result.projectId);
        const matchingFile = files.files.find(f => f.relativePath === result.relativePath);
        if (matchingFile) {
          setSelectedFile(matchingFile);
          setIsFileDetailOpen(true);
        }
      }
    } catch (error) {
      console.error('获取文件信息失败:', error);
    }
    
    setSearchResults([]);
    setIsSearchVisible(false);
    setSearchQuery('');
  };
  
  const getBreadcrumbPath = () => {
    if (!currentProject || !currentPath) {
      return [];
    }
    
    const relativePath = currentPath.replace(/^\//, '');
    if (!relativePath) {
      return [];
    }
    
    return relativePath.split('/').filter(segment => segment.length > 0);
  };
  
  const breadcrumbSegments = getBreadcrumbPath();
  
  const handleEditDirectory = () => {
    setIsEditFolderDialogOpen(true);
  };

  const handleFolderRenamed = (newPath?: string) => {
    setIsEditFolderDialogOpen(false);
    if (newPath) {
      setCurrentPath(newPath);
    }
    onImportComplete?.();
  };

  const handleDeleteDirectory = () => {
    setIsDeleteFolderDialogOpen(true);
  };

  const handleFolderDeleted = () => {
    setIsDeleteFolderDialogOpen(false);
    const pathSegments = currentPath.split('/').filter(Boolean);
    if (pathSegments.length > 1) {
      pathSegments.pop();
      setCurrentPath(pathSegments.join('/'));
    } else {
      setCurrentPath('');
    }
    onImportComplete?.();
  };

  const handleBatchDeleteComplete = () => {
    setIsBatchDeleteDialogOpen(false);
    onImportComplete?.();
  };

  const handleBatchMoveComplete = () => {
    setIsBatchMoveDialogOpen(false);
    onImportComplete?.();
  };

  return (
    <div className="h-14 bg-card border-b border-border px-4 flex items-center justify-between">
      {/* 面包屑导航 */}
      <div 
        className="flex items-center space-x-1"
        onMouseEnter={() => setIsHoveringBreadcrumb(true)}
        onMouseLeave={() => setIsHoveringBreadcrumb(false)}
      >
        <button 
          className="flex items-center space-x-1 px-2 py-1 hover:bg-muted/50 rounded transition-colors"
          onClick={() => setCurrentPath('')}
          title="返回项目根目录"
        >
          <Home className="w-4 h-4 text-muted-foreground" />
          {currentProject && (
            <span className="text-sm text-muted-foreground ml-1">{currentProject.name}</span>
          )}
        </button>
        {breadcrumbSegments.map((segment, index) => {
          const targetPath = breadcrumbSegments.slice(0, index + 1).join('/');
          return (
            <div key={index} className="flex items-center space-x-1">
              <ChevronRight className="w-4 h-4 text-muted-foreground" />
              <button 
                className="px-2 py-1 text-sm hover:bg-muted/50 rounded transition-colors"
                onClick={() => setCurrentPath(targetPath)}
                title={`导航到 ${targetPath}`}
              >
                {segment}
              </button>
            </div>
          );
        })}
        
        {isHoveringBreadcrumb && currentPath && (
          <div className="flex items-center space-x-1 ml-2">
            <button
              onClick={handleEditDirectory}
              className="p-1 hover:bg-muted/50 rounded transition-colors"
              title="编辑目录名称"
            >
              <Edit2 className="w-3 h-3 text-muted-foreground" />
            </button>
            <button
              onClick={handleDeleteDirectory}
              className="p-1 hover:bg-muted/50 rounded transition-colors"
              title="删除目录"
            >
              <Trash2 className="w-3 h-3 text-muted-foreground hover:text-destructive" />
            </button>
          </div>
        )}
      </div>
      
      <div className="flex-1"></div>
      
      <div className="flex items-center space-x-2">
        <button 
          onClick={onToggleManagement}
          className={`h-9 px-3 rounded-md transition-colors flex items-center space-x-2 ${
            isManagementMode 
              ? 'bg-primary text-primary-foreground hover:bg-primary/90' 
              : 'bg-muted hover:bg-accent text-muted-foreground hover:text-foreground'
          }`}
          title={t('file.batchManagement')}
        >
          <List className="h-4 w-4" />
          <span className="text-sm">{t('file.management')}</span>
        </button>
        
        {isManagementMode && (
          <>
            <button 
              onClick={onSelectAll}
              className="h-9 px-3 bg-muted hover:bg-accent rounded-md transition-colors flex items-center space-x-2 text-muted-foreground hover:text-foreground"
              title={t('common.selectAll')}
            >
              <CheckSquare className="h-4 w-4" />
              <span className="text-sm">{t('common.selectAll')}</span>
            </button>
            
            <button 
              onClick={onDeselectAll}
              className="h-9 px-3 bg-muted hover:bg-accent rounded-md transition-colors flex items-center space-x-2 text-muted-foreground hover:text-foreground"
              title={t('common.deselectAll')}
            >
              <Square className="h-4 w-4" />
              <span className="text-sm">{t('common.deselectAll')}</span>
            </button>
            
            <div className="relative">
              <button 
                onClick={() => setIsBatchMenuOpen(!isBatchMenuOpen)}
                disabled={selectedFiles.length === 0 || !currentProject}
                className="h-9 px-3 bg-muted hover:bg-accent rounded-md transition-colors flex items-center space-x-2 text-muted-foreground hover:text-foreground disabled:opacity-50 disabled:cursor-not-allowed"
                title={t('file.batchOperations', { count: selectedFiles.length })}
              >
                <span className="text-sm">{t('file.batchOperations', { count: selectedFiles.length })}</span>
                <ChevronDown className="h-4 w-4" />
              </button>
              
              {isBatchMenuOpen && selectedFiles.length > 0 && (
                <div className="absolute right-0 top-full mt-1 w-32 bg-background border border-border rounded-md shadow-lg z-50">
                  <button
                    onClick={() => {
                      setIsBatchDeleteDialogOpen(true);
                      setIsBatchMenuOpen(false);
                    }}
                    className="w-full px-3 py-2 text-left text-sm hover:bg-muted transition-colors text-destructive hover:text-destructive"
                  >
                    {t('file.batchDelete')}
                  </button>
                  <button
                    onClick={() => {
                      setIsBatchMoveDialogOpen(true);
                      setIsBatchMenuOpen(false);
                    }}
                    className="w-full px-3 py-2 text-left text-sm hover:bg-muted transition-colors"
                  >
                    {t('file.batchMove')}
                  </button>
                </div>
              )}
            </div>
          </>
        )}
        
        <div className="relative flex items-center">
          <div className="relative flex items-center">
            {isSearchVisible && (
              <div className="flex items-center mr-2">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      handleSearch();
                    } else if (e.key === 'Escape') {
                      setIsSearchVisible(false);
                      setSearchQuery('');
                      setSearchResults([]);
                    }
                  }}
                  placeholder={t('search.searchFilesAndNotes')}
                  className="h-9 px-3 w-64 border border-border rounded-md bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  autoFocus
                />
                <button
                  onClick={() => {
                    setIsSearchVisible(false);
                    setSearchQuery('');
                    setSearchResults([]);
                  }}
                  className="ml-1 p-2 hover:bg-muted rounded-md transition-colors"
                  title={t('common.close')}
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            )}
            
            <button 
              onClick={isSearchVisible ? handleSearch : handleSearchToggle}
              disabled={!currentProject || (isSearchVisible && !searchQuery.trim())}
              className="h-9 w-9 bg-muted hover:bg-accent rounded-md transition-colors flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
              title={isSearchVisible ? t('common.search') : t('search.openSearch')}
            >
              <Search className="h-4 w-4" />
            </button>
          </div>
          
          {searchResults.length > 0 && (
            <div className="absolute top-full right-0 mt-1 w-80 bg-background border border-border rounded-md shadow-lg z-50 max-h-96 overflow-y-auto">
              <div className="p-2 border-b border-border">
                <div className="text-sm font-medium">{t('search.searchResults')}</div>
              </div>
              {searchResults.map((result) => (
                <button
                  key={`${result.type}-${result.id}`}
                  onClick={() => handleSearchResultClick(result)}
                  className="w-full p-3 text-left hover:bg-muted transition-colors border-b border-border last:border-b-0"
                >
                  <div className="flex items-start space-x-3">
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-sm truncate">{result.name}</div>
                      <div className="text-xs text-muted-foreground mt-1">
                        {result.type === 'file' ? (
                          <span>{t('search.fileResult', { path: result.relativePath })}</span>
                        ) : (
                          <span>{t('search.noteResult', { content: result.snippet || result.notes || t('search.containsMatchingContent') })}</span>
                        )}
                      </div>
                    </div>
                    
                    <div className={`w-2 h-2 rounded-full mt-2 flex-shrink-0 ${
                      result.type === 'file' ? 'bg-blue-500' : 'bg-green-500'
                    }`} />
                  </div>
                </button>
              ))}
            </div>
          )}
          
          {isSearching && (
            <div className="absolute top-full right-0 mt-1 w-80 bg-background border border-border rounded-md shadow-lg z-50 p-4 text-center">
              <div className="text-sm text-muted-foreground">{t('search.searching')}</div>
            </div>
          )}
        </div>
        
        <button 
          onClick={handleImportClick}
          disabled={!currentProject}
          className="h-9 px-3 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
          title={t('file.importFilesToCurrentDirectory')}
        >
          <Plus className="h-4 w-4" />
          <span className="text-sm">{t('file.import')}</span>
        </button>
        
        <button 
          onClick={handleSettingsClick}
          className="h-9 w-9 bg-muted hover:bg-accent rounded-md transition-colors flex items-center justify-center"
          title={t('file.settings')}
        >
          <Settings className="h-4 w-4" />
        </button>
      </div>

      <ImportDialog
        isOpen={isImportDialogOpen}
        onClose={() => setIsImportDialogOpen(false)}
        currentPath={currentPath}
        onImportComplete={handleImportComplete}
      />
      
      <SettingsDialog
        isOpen={isSettingsDialogOpen}
        onClose={handleSettingsClose}
      />
      
      <EditFolderDialog
        isOpen={isEditFolderDialogOpen}
        onClose={() => setIsEditFolderDialogOpen(false)}
        projectId={currentProject?.id || 0}
        currentPath={currentPath}
        onFolderRenamed={handleFolderRenamed}
      />
       
      <DeleteFolderDialog
        isOpen={isDeleteFolderDialogOpen}
        onClose={() => setIsDeleteFolderDialogOpen(false)}
        projectId={currentProject?.id || 0}
        currentPath={currentPath}
        onFolderDeleted={handleFolderDeleted}
      />
       
      <BatchDeleteDialog
        isOpen={isBatchDeleteDialogOpen}
        onClose={() => setIsBatchDeleteDialogOpen(false)}
        projectId={currentProject?.id || 0}
        selectedFiles={selectedFiles}
        currentPath={currentPath}
        onDeleteComplete={handleBatchDeleteComplete}
      />
        
      <BatchMoveDialog
        isOpen={isBatchMoveDialogOpen}
        onClose={() => setIsBatchMoveDialogOpen(false)}
        projectId={currentProject?.id || 0}
        selectedFiles={selectedFiles}
        onMoveComplete={handleBatchMoveComplete}
      />

      <FileDetailModal
        file={selectedFile}
        isOpen={isFileDetailOpen}
        onClose={() => {
          setIsFileDetailOpen(false);
          setSelectedFile(null);
        }}
        projectId={currentProject?.id || 0}
      />
    </div>
  );
};

export default Header;