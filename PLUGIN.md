# 插件系统设计文档

## 概述

本文档描述了为文件浏览工具设计的插件系统架构。该系统允许开发者创建针对特定文件类型的插件，并在文件详情页面中展示相关功能。

## 系统架构

### 核心组件

1. **插件注册器 (PluginRegistry)**
   - 管理所有已注册的插件
   - 根据文件扩展名匹配对应插件
   - 提供插件的启用/禁用状态管理

2. **插件接口 (Plugin Interface)**
   - 定义插件的标准接口
   - 包含插件元数据和组件定义

3. **插件管理器 (PluginManager)**
   - 处理插件的加载和卸载
   - 管理插件的生命周期

4. **设置管理 (Settings Management)**
   - 在设置页面提供插件开关控制
   - 持久化插件配置

### 文件结构

```
frontend/src/
├── plugins/
│   ├── types/
│   │   └── index.ts                 # 插件类型定义
│   ├── registry/
│   │   └── PluginRegistry.ts        # 插件注册器
│   ├── manager/
│   │   └── PluginManager.ts         # 插件管理器
│   ├── components/
│   │   └── PluginContainer.tsx      # 插件容器组件
│   └── builtin/
│       └── character-card/
│           ├── CharacterCardPlugin.tsx
│           ├── components/
│           │   └── CharacterCardView.tsx
│           └── utils/
│               └── pngProcessor.ts
├── components/
│   ├── settings/
│   │   └── PluginSettings.tsx       # 插件设置页面
│   └── file-detail/
│       └── FileDetailModal.tsx      # 修改后的文件详情模态框
└── stores/
    └── pluginStore.ts               # 插件状态管理
```

## 插件接口定义

### 基础类型

```typescript
// 插件元数据
interface PluginMetadata {
  id: string;                    // 插件唯一标识
  name: string;                  // 插件显示名称
  version: string;               // 插件版本
  description: string;           // 插件描述
  author: string;                // 插件作者
  supportedExtensions: string[]; // 支持的文件扩展名
  icon?: React.ComponentType;    // 插件图标组件
}

// 插件组件属性
interface PluginComponentProps {
  file: FileItem;               // 当前文件信息
  projectId: number;            // 项目ID
  onError?: (error: Error) => void; // 错误处理回调
}

// 插件定义
interface Plugin {
  metadata: PluginMetadata;
  component: React.ComponentType<PluginComponentProps>;
  isEnabled: boolean;           // 插件是否启用
}
```

### 插件注册

```typescript
class PluginRegistry {
  private plugins: Map<string, Plugin> = new Map();
  private extensionMap: Map<string, string[]> = new Map();

  // 注册插件
  register(plugin: Plugin): void;
  
  // 获取支持指定扩展名的插件
  getPluginsForExtension(extension: string): Plugin[];
  
  // 获取所有插件
  getAllPlugins(): Plugin[];
  
  // 启用/禁用插件
  setPluginEnabled(pluginId: string, enabled: boolean): void;
}
```

## 文件详情页面集成

### 修改 FileDetailModal 组件

1. **移除中栏编辑器**
   - 删除现有的编辑器占位内容
   - 替换为插件标签页系统

2. **添加插件标签页**
   - 根据文件扩展名加载对应插件
   - 每个插件显示为一个标签页
   - 点击标签页切换到对应插件组件

3. **插件容器组件**
   ```typescript
   interface PluginContainerProps {
     file: FileItem;
     projectId: number;
     plugins: Plugin[];
   }
   
   const PluginContainer: React.FC<PluginContainerProps> = ({ file, projectId, plugins }) => {
     const [activePlugin, setActivePlugin] = useState<string | null>(null);
     
     // 渲染插件标签页和内容
   };
   ```

## CharacterCard 插件实现

### 插件功能

- **目标文件类型**: PNG 图片文件
- **功能描述**: 读取 PNG 文件中的 CharacterCard 扩展数据并展示角色信息
- **数据格式支持**: 
  - `chara` 格式 (Base64 编码的 JSON)
  - `ccv3` 格式 (CharacterCardV3)

### 组件结构

```typescript
// CharacterCard 数据接口
interface CharacterData {
  name: string;
  gender?: string;
  description?: string;
  fullDescription?: string;
  personality?: string;
  scenario?: string;
  exampleDialogue?: string;
  creatorNotes?: string;
  systemPrompt?: string;
  postHistoryInstructions?: string;
  alternateGreetings?: string[];
  tags?: string[];
  creator?: string;
  characterVersion?: string;
  firstMes?: string;
  [key: string]: any;
}

// CharacterCard 插件组件
const CharacterCardPlugin: React.FC<PluginComponentProps> = ({ file, projectId, onError }) => {
  const [characterData, setCharacterData] = useState<CharacterData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 加载和解析 PNG 文件中的角色数据
  useEffect(() => {
    loadCharacterData();
  }, [file]);

  // 渲染角色信息界面
};
```

### 数据处理流程

1. **文件加载**
   - 通过 API 获取 PNG 文件的二进制数据
   - 转换为 ArrayBuffer 格式

2. **数据解析**
   - 使用 PNG 解析器提取 tEXt 块
   - 识别 `chara` 或 `ccv3` 关键字
   - 解码 Base64 数据并解析 JSON

3. **数据展示**
   - 角色基本信息 (姓名、性别、描述)
   - 角色设定 (性格、场景、对话示例)
   - 创作信息 (作者、版本、标签)
   - 系统提示和指令

### UI 设计

```typescript
const CharacterCardView: React.FC<{ data: CharacterData }> = ({ data }) => {
  return (
    <div className="character-card-view p-4 space-y-6">
      {/* 角色头像和基本信息 */}
      <div className="character-header">
        <div className="character-avatar">
          {/* 显示原始图片作为头像 */}
        </div>
        <div className="character-info">
          <h2 className="text-2xl font-bold">{data.name}</h2>
          {data.gender && <p className="text-muted-foreground">{data.gender}</p>}
          {data.creator && <p className="text-sm text-muted-foreground">by {data.creator}</p>}
        </div>
      </div>

      {/* 角色描述 */}
      <div className="character-description">
        <h3 className="text-lg font-semibold mb-2">角色描述</h3>
        <p className="text-sm leading-relaxed">{data.description}</p>
      </div>

      {/* 详细信息标签页 */}
      <div className="character-details">
        <Tabs defaultValue="personality">
          <TabsList>
            <TabsTrigger value="personality">性格</TabsTrigger>
            <TabsTrigger value="scenario">场景</TabsTrigger>
            <TabsTrigger value="dialogue">对话示例</TabsTrigger>
            <TabsTrigger value="system">系统设定</TabsTrigger>
          </TabsList>
          
          <TabsContent value="personality">
            <div className="space-y-4">
              {data.personality && (
                <div>
                  <h4 className="font-medium mb-2">性格特征</h4>
                  <p className="text-sm">{data.personality}</p>
                </div>
              )}
              {data.tags && data.tags.length > 0 && (
                <div>
                  <h4 className="font-medium mb-2">标签</h4>
                  <div className="flex flex-wrap gap-2">
                    {data.tags.map((tag, index) => (
                      <span key={index} className="px-2 py-1 bg-muted rounded-md text-xs">
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </TabsContent>
          
          {/* 其他标签页内容 */}
        </Tabs>
      </div>
    </div>
  );
};
```

## 设置页面集成

### 插件管理界面

```typescript
const PluginSettings: React.FC = () => {
  const plugins = usePluginStore(state => state.plugins);
  const togglePlugin = usePluginStore(state => state.togglePlugin);

  return (
    <div className="plugin-settings space-y-4">
      <h2 className="text-xl font-semibold">插件管理</h2>
      
      {plugins.map(plugin => (
        <div key={plugin.metadata.id} className="plugin-item border rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              {plugin.metadata.icon && <plugin.metadata.icon />}
              <div>
                <h3 className="font-medium">{plugin.metadata.name}</h3>
                <p className="text-sm text-muted-foreground">{plugin.metadata.description}</p>
                <p className="text-xs text-muted-foreground">
                  支持: {plugin.metadata.supportedExtensions.join(', ')}
                </p>
              </div>
            </div>
            <Switch
              checked={plugin.isEnabled}
              onCheckedChange={(enabled) => togglePlugin(plugin.metadata.id, enabled)}
            />
          </div>
        </div>
      ))}
    </div>
  );
};
```

## 状态管理

### Zustand Store

```typescript
interface PluginStore {
  plugins: Plugin[];
  settings: Record<string, any>;
  
  // Actions
  registerPlugin: (plugin: Plugin) => void;
  togglePlugin: (pluginId: string, enabled: boolean) => void;
  getPluginsForFile: (fileName: string) => Plugin[];
  updateSettings: (settings: Record<string, any>) => void;
}

const usePluginStore = create<PluginStore>((set, get) => ({
  plugins: [],
  settings: {},
  
  registerPlugin: (plugin) => {
    set(state => ({
      plugins: [...state.plugins, plugin]
    }));
  },
  
  togglePlugin: (pluginId, enabled) => {
    set(state => ({
      plugins: state.plugins.map(plugin => 
        plugin.metadata.id === pluginId 
          ? { ...plugin, isEnabled: enabled }
          : plugin
      )
    }));
  },
  
  getPluginsForFile: (fileName) => {
    const extension = fileName.split('.').pop()?.toLowerCase() || '';
    return get().plugins.filter(plugin => 
      plugin.isEnabled && 
      plugin.metadata.supportedExtensions.includes(extension)
    );
  },
  
  updateSettings: (newSettings) => {
    set(state => ({
      settings: { ...state.settings, ...newSettings }
    }));
  }
}));
```

## 实现步骤

1. **第一阶段**: 核心架构
   - 创建插件类型定义
   - 实现插件注册器和管理器
   - 创建插件容器组件

2. **第二阶段**: UI 集成
   - 修改 FileDetailModal 组件
   - 实现插件标签页系统
   - 创建设置页面的插件管理界面

3. **第三阶段**: CharacterCard 插件
   - 移植 PNG 处理逻辑
   - 实现角色数据解析
   - 创建角色信息展示组件

4. **第四阶段**: 测试和优化
   - 单元测试
   - 集成测试
   - 性能优化

## 扩展性考虑

### 未来插件示例

1. **Markdown 编辑器插件**
   - 支持 `.md` 文件
   - 提供实时预览和编辑功能

2. **图片编辑插件**
   - 支持常见图片格式
   - 提供基础的图片编辑功能

3. **音频播放器插件**
   - 支持音频文件
   - 提供波形显示和播放控制

4. **代码编辑器插件**
   - 支持各种编程语言
   - 提供语法高亮和代码格式化

### 插件 API 扩展

```typescript
// 未来可能的插件 API 扩展
interface PluginAPI {
  // 文件操作
  readFile: (fileId: string) => Promise<ArrayBuffer>;
  writeFile: (fileId: string, data: ArrayBuffer) => Promise<void>;
  
  // UI 交互
  showNotification: (message: string, type: 'info' | 'success' | 'error') => void;
  showDialog: (options: DialogOptions) => Promise<boolean>;
  
  // 数据存储
  getPluginData: (key: string) => any;
  setPluginData: (key: string, value: any) => void;
}
```

## 总结

本插件系统设计提供了一个灵活、可扩展的架构，允许开发者为不同文件类型创建专门的查看和编辑工具。通过标准化的插件接口和统一的管理机制，系统可以轻松地添加新功能，同时保持良好的用户体验和代码组织结构。

CharacterCard 插件作为第一个内置插件，展示了如何利用这个系统来处理复杂的文件格式和数据解析需求，为后续插件开发提供了良好的参考模板。