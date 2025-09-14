import { ChevronDown, Folder, File, ChevronRight, RefreshCw, FilePlus, FolderPlus, Minimize2 } from 'lucide-react';
import { useState } from 'react';

interface FileNode {
  id: string;
  name: string;
  type: 'file' | 'folder';
  children?: FileNode[];
}

const FileTreeItem = ({ node, level = 0 }: { node: FileNode; level?: number }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const hasChildren = node.children && node.children.length > 0;
  
  return (
    <div>
      <div 
        className="flex items-center py-1 px-2 hover:bg-muted/50 rounded cursor-pointer transition-colors"
        style={{ paddingLeft: `${level * 16 + 8}px` }}
        onClick={() => node.type === 'folder' && setIsExpanded(!isExpanded)}
      >
        {node.type === 'folder' && hasChildren && (
          <ChevronRight 
            className={`w-4 h-4 text-muted-foreground transition-transform mr-1 ${
              isExpanded ? 'rotate-90' : ''
            }`} 
          />
        )}
        {node.type === 'folder' && !hasChildren && (
          <div className="w-4 h-4 mr-1" />
        )}
        {node.type === 'folder' ? (
          <Folder className="w-4 h-4 text-muted-foreground mr-2" />
        ) : (
          <File className="w-4 h-4 text-muted-foreground mr-2" />
        )}
        <span className="text-sm truncate">{node.name}</span>
      </div>
      
      {node.type === 'folder' && isExpanded && hasChildren && (
        <div>
          {node.children!.map((child) => (
            <FileTreeItem key={child.id} node={child} level={level + 1} />
          ))}
        </div>
      )}
    </div>
  );
};

const FileTree = () => {
  const fileTreeData: FileNode[] = [
    {
      id: '1',
      name: 'src',
      type: 'folder',
      children: [
        {
          id: '2',
          name: 'components',
          type: 'folder',
          children: [
            { id: '3', name: 'Header.tsx', type: 'file' },
            { id: '4', name: 'Sidebar.tsx', type: 'file' },
            { id: '5', name: 'Layout.tsx', type: 'file' }
          ]
        },
        {
          id: '6',
          name: 'pages',
          type: 'folder',
          children: [
            { id: '7', name: 'HomePage.tsx', type: 'file' },
            { id: '8', name: 'ProjectPage.tsx', type: 'file' }
          ]
        },
        { id: '9', name: 'App.tsx', type: 'file' },
        { id: '10', name: 'main.tsx', type: 'file' }
      ]
    },
    {
      id: '11',
      name: 'public',
      type: 'folder',
      children: [
        { id: '12', name: 'index.html', type: 'file' },
        { id: '13', name: 'favicon.ico', type: 'file' }
      ]
    },
    { id: '14', name: 'package.json', type: 'file' },
    { id: '15', name: 'vite.config.ts', type: 'file' },
    { id: '16', name: 'tailwind.config.js', type: 'file' }
  ];
  
  return (
    <div className="space-y-1">
      {fileTreeData.map((node) => (
        <FileTreeItem key={node.id} node={node} />
      ))}
    </div>
  );
};

const Sidebar = () => {
  const [selectedProject, setSelectedProject] = useState('当前项目');
  const [isProjectDropdownOpen, setIsProjectDropdownOpen] = useState(false);
  
  const projects = [
    { id: '1', name: '当前项目', path: '/Users/easy/Code/gitcode/aideer' },
    { id: '2', name: '示例项目1', path: '/Users/easy/Documents/project1' },
    { id: '3', name: '示例项目2', path: '/Users/easy/Documents/project2' }
  ];

  return (
    <div className="h-full bg-card flex flex-col">
      {/* 项目选择器 */}
      <div className="p-4 border-b border-border">
        <div className="relative">
          <button 
            className="w-full flex items-center justify-between p-2 bg-background border border-border rounded-md hover:bg-muted/50 transition-colors"
            onClick={() => setIsProjectDropdownOpen(!isProjectDropdownOpen)}
          >
            <div className="flex items-center space-x-2">
              <Folder className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm truncate">{selectedProject}</span>
            </div>
            <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform ${isProjectDropdownOpen ? 'rotate-180' : ''}`} />
          </button>
          
          {isProjectDropdownOpen && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-popover border border-border rounded-md shadow-lg z-10">
              {projects.map((project) => (
                <button
                  key={project.id}
                  className="w-full flex items-center space-x-2 p-2 text-left hover:bg-muted/50 transition-colors first:rounded-t-md last:rounded-b-md"
                  onClick={() => {
                    setSelectedProject(project.name);
                    setIsProjectDropdownOpen(false);
                  }}
                >
                  <Folder className="w-4 h-4 text-muted-foreground" />
                  <div>
                    <div className="text-sm font-medium">{project.name}</div>
                    <div className="text-xs text-muted-foreground truncate">{project.path}</div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
      
      {/* 文件树 */}
      <div className="flex-1 p-4 overflow-y-auto">
        <FileTree />
      </div>
      
      {/* 底部工具栏 */}
      <div className="p-4 border-t border-border">
        <div className="flex items-center justify-between">
          <div className="flex space-x-2">
            <button 
              className="p-2 hover:bg-muted/50 rounded-md transition-colors"
              title="刷新文件树"
            >
              <RefreshCw className="w-4 h-4 text-muted-foreground" />
            </button>
            <button 
              className="p-2 hover:bg-muted/50 rounded-md transition-colors"
              title="新建文件"
            >
              <FilePlus className="w-4 h-4 text-muted-foreground" />
            </button>
            <button 
              className="p-2 hover:bg-muted/50 rounded-md transition-colors"
              title="新建文件夹"
            >
              <FolderPlus className="w-4 h-4 text-muted-foreground" />
            </button>
          </div>
          <button 
            className="p-2 hover:bg-muted/50 rounded-md transition-colors"
            title="折叠所有"
          >
            <Minimize2 className="w-4 h-4 text-muted-foreground" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;