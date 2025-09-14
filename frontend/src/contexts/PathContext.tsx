import { createContext, useContext, useState, ReactNode } from 'react';

interface PathContextType {
  currentPath: string;
  setCurrentPath: (path: string) => void;
}

const PathContext = createContext<PathContextType | undefined>(undefined);

export const usePathContext = () => {
  const context = useContext(PathContext);
  if (context === undefined) {
    throw new Error('usePathContext must be used within a PathProvider');
  }
  return context;
};

interface PathProviderProps {
  children: ReactNode;
}

export const PathProvider = ({ children }: PathProviderProps) => {
  const [currentPath, setCurrentPath] = useState<string>('');

  return (
    <PathContext.Provider value={{ currentPath, setCurrentPath }}>
      {children}
    </PathContext.Provider>
  );
};