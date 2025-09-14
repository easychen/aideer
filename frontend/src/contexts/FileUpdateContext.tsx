import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';

interface FileUpdateContextType {
  // 触发全局文件更新
  triggerFileUpdate: (projectId?: number) => void;
  // 文件更新触发器，用于监听变化
  fileUpdateTrigger: number;
  // 注册文件更新监听器
  onFileUpdate: (callback: (projectId?: number) => void) => () => void;
}

const FileUpdateContext = createContext<FileUpdateContextType | undefined>(undefined);

export const useFileUpdate = () => {
  const context = useContext(FileUpdateContext);
  if (!context) {
    throw new Error('useFileUpdate must be used within a FileUpdateProvider');
  }
  return context;
};

interface FileUpdateProviderProps {
  children: ReactNode;
}

export const FileUpdateProvider: React.FC<FileUpdateProviderProps> = ({ children }) => {
  const [fileUpdateTrigger, setFileUpdateTrigger] = useState(0);
  const [listeners, setListeners] = useState<Array<(projectId?: number) => void>>([]);

  const triggerFileUpdate = useCallback((projectId?: number) => {
    // 更新触发器
    setFileUpdateTrigger(prev => prev + 1);
    
    // 通知所有监听器
    listeners.forEach(callback => {
      try {
        callback(projectId);
      } catch (error) {
        console.error('File update listener error:', error);
      }
    });
  }, [listeners]);

  const onFileUpdate = useCallback((callback: (projectId?: number) => void) => {
    setListeners(prev => [...prev, callback]);
    
    // 返回取消监听的函数
    return () => {
      setListeners(prev => prev.filter(cb => cb !== callback));
    };
  }, []);

  const value: FileUpdateContextType = {
    triggerFileUpdate,
    fileUpdateTrigger,
    onFileUpdate,
  };

  return (
    <FileUpdateContext.Provider value={value}>
      {children}
    </FileUpdateContext.Provider>
  );
};

export default FileUpdateProvider;