import { Download, Zap, Container, Image, Video, Folder } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ImageSlider } from '@/components/ImageSlider'

const screenshotImages = [
  {
    src: '/screen8.png',
    alt: 'AiDeer 主界面',
    title: '文件浏览界面',
    description: '支持多级树状目录、可自定义预览图大小、鼠标滑动预览视频，快速复制图片内容'
  },
  {
    src: '/screen3.png',
    alt: '设置界面',
    title: '设置界面',
    description: '支持明暗主题、多语言切换'
  },
  {
    src: '/screen2.png',
    alt: '插件管理',
    title: '插件管理',
    description: '开放的插件结构，内置角色卡和图片提示词插件'
  },
  {
    src: '/screen1.png',
    alt: '数据维护',
    title: '数据维护',
    description: '快速搜索和索引维护'
  },
  {
    src: '/screen5.png',
    alt: '批量操作',
    title: '批量操作',
    description: '支持多选，对选中项进行批量删除、复制、移动等操作'
  },
  {
    src: '/screen6.png',
    alt: '文件详情',
    title: '文件详情',
    description: '文件详情，支持添加标签、链接和笔记'
  }
]

function App() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      {/* Header */}
      <header className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <img src="/icon.256.png" alt="AiDeer Logo" className="w-8 h-8 rounded-lg" />
            <h1 className="text-xl font-bold text-gray-900">AiDeer</h1>
          </div>
          <nav className="hidden md:flex items-center space-x-6">
            <a href="#features" className="text-gray-600 hover:text-gray-900 transition-colors">功能特色</a>
            <a href="#docker" className="text-gray-600 hover:text-gray-900 transition-colors">Docker</a>
            <a href="#download" className="text-gray-600 hover:text-gray-900 transition-colors">下载</a>
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto text-center">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6">
              AI 创作内容
              <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent"> 统一管理 </span>
              新体验
            </h2>
            <p className="text-xl text-gray-600 mb-8 leading-relaxed">
              AiDeer专注于AI 产管理工，帮你统一收集、整理和管理来自各个生图、生视频网站的AI创作内容。
              让你的AI创作资产井然有序，随时可用。
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button 
                size="lg" 
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white"
                onClick={() => {
                  document.getElementById('download')?.scrollIntoView({ 
                    behavior: 'smooth' 
                  })
                }}
              >
                <Download className="w-5 h-5 mr-2" />
                立刻使用
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Screenshots Section */}
      <section className="py-20 px-4 bg-gradient-to-br from-gray-50 to-blue-50">
        <div className="container mx-auto">
          <ImageSlider images={screenshotImages} />
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 px-4 bg-white">
        <div className="container mx-auto max-w-4xl">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              强大的功能特色
            </h2>
            <p className="text-xl text-gray-600">
              专为 AI 创作者设计的资产管理解决方案
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="p-6 rounded-xl border border-gray-200 hover:shadow-lg transition-shadow">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                <Image className="w-6 h-6 text-blue-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">多平台收集</h3>
              <p className="text-gray-600">
                浏览器插件导入图片、拖动导入批量文件，轻松收集各平台 AI 生成内容
              </p>
            </div>
            <div className="p-6 rounded-xl border border-gray-200 hover:shadow-lg transition-shadow">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4">
                <Video className="w-6 h-6 text-purple-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">提示词管理</h3>
              <p className="text-gray-600">
                查看图片提示词信息，轻松管理和复用你的创作灵感
              </p>
            </div>
            <div className="p-6 rounded-xl border border-gray-200 hover:shadow-lg transition-shadow">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4">
                <Folder className="w-6 h-6 text-green-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">角色卡管理</h3>
              <p className="text-gray-600">
                查看和管理 CharacterCard 的角色卡信息，统一管理你的 AI 角色资产
              </p>
            </div>
            <div className="p-6 rounded-xl border border-gray-200 hover:shadow-lg transition-shadow">
              <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center mb-4">
                <Zap className="w-6 h-6 text-orange-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">灵活部署方式</h3>
              <p className="text-gray-600">
                支持 Self-hosted 私有部署，也可作为客户端使用，满足不同场景需求
              </p>
            </div>
          </div>
        </div>
      </section>

      

      
        {/* Download Section */}
      <section id="download" className="py-20 bg-gradient-to-br from-blue-50 to-purple-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">准备开始使用了吗？</h2>
          <p className="text-xl text-gray-600 mb-12">
            选择适合你的安装方式，立即开始管理你的 AI 资产
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-3xl mx-auto">
            {/* Mac Download */}
             <div className="bg-white p-6 rounded-xl shadow-lg hover:shadow-xl transition-shadow flex flex-col h-full">
               <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                 <svg className="w-8 h-8 text-gray-600" viewBox="0 0 24 24" fill="currentColor">
                   <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
                 </svg>
               </div>
               <h3 className="text-xl font-semibold text-gray-900 mb-3">macOS</h3>
               <p className="text-gray-600 mb-4 flex-grow">支持 macOS 10.15 及以上版本</p>
               <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white mt-auto">
                 <Download className="w-4 h-4 mr-2" />
                 下载 Mac 版本
               </Button>
             </div>

             {/* Windows Download */}
             <div className="bg-white p-6 rounded-xl shadow-lg hover:shadow-xl transition-shadow flex flex-col h-full">
               <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                 <svg className="w-8 h-8 text-gray-600" viewBox="0 0 24 24" fill="currentColor">
                   <path d="M3 12V6.75l6-1.32v6.48L3 12zm17-9v8.75l-10 .15V5.21L20 3zM3 13l6 .09v6.81l-6-1.15V13zm17 .25V22l-10-1.91V13.1l10 .15z"/>
                 </svg>
               </div>
               <h3 className="text-xl font-semibold text-gray-900 mb-3">Windows</h3>
               <p className="text-gray-600 mb-4 flex-grow">支持 Windows 10 及以上版本</p>
               <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white mt-auto">
                 <Download className="w-4 h-4 mr-2" />
                 下载 Windows 版本
               </Button>
             </div>

             {/* Docker Installation */}
             <div className="bg-white p-6 rounded-xl shadow-lg hover:shadow-xl transition-shadow flex flex-col h-full">
               <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                 <Container className="w-8 h-8 text-gray-600" />
               </div>
               <h3 className="text-xl font-semibold text-gray-900 mb-3">Docker</h3>
               <p className="text-gray-600 mb-4 flex-grow">跨平台部署，支持自托管</p>
               <Button className="w-full bg-purple-600 hover:bg-purple-700 text-white mt-auto"
                 onClick={() => {
                   document.getElementById('docker')?.scrollIntoView({ 
                     behavior: 'smooth' 
                   })
                 }}
               >
                 <Container className="w-4 h-4 mr-2" />
                 Docker 部署
               </Button>
             </div>
          </div>

          
        </div>
      </section>

      {/* Docker Section */}
      <section id="docker" className="py-20 px-4 bg-gray-50">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <div className="w-16 h-16 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-6">
              <Container className="w-8 h-8 text-blue-600" />
            </div>
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              简单的 Docker 部署
            </h2>
            <p className="text-xl text-gray-600">
              几分钟内即可通过 Docker 运行 AiDeer
            </p>
          </div>
          
          <div className="max-w-4xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
              <div className="bg-white rounded-xl p-6 shadow-lg">
                <h3 className="text-xl font-semibold text-gray-900 mb-4">Docker 快速启动</h3>
                <div className="bg-gray-900 rounded-lg p-4 text-sm font-mono text-green-400 overflow-x-auto">
                  <div className="mb-2"># 拉取并运行 AiDeer</div>
                  <div className="text-white">docker run -d \</div>
                  <div className="text-white ml-4">--name aideer \</div>
                  <div className="text-white ml-4">-p 3001:3001 \</div>
                  <div className="text-white ml-4">-v aideer_data:/app/data \</div>
                  <div className="text-white ml-4">--restart unless-stopped \</div>
                  <div className="text-white ml-4">easychen/aideer:latest</div>
                </div>
              </div>
              
              <div className="bg-white rounded-xl p-6 shadow-lg">
                <h3 className="text-xl font-semibold text-gray-900 mb-4">Docker Compose</h3>
                <div className="bg-gray-900 rounded-lg p-4 text-sm font-mono text-green-400 overflow-x-auto">
                  <div className="mb-2"># 使用 docker-compose.yml</div>
                  <div className="text-white">version: '3.8'</div>
                  <div className="text-white">services:</div>
                  <div className="text-white ml-4">aideer:</div>
                  <div className="text-white ml-6">image: easychen/aideer:latest</div>
                  <div className="text-white ml-6">ports:</div>
                  <div className="text-white ml-8">- "3001:3001"</div>
                  <div className="text-white ml-6">volumes:</div>
                  <div className="text-white ml-8">- aideer_data:/app/data</div>
                </div>
              </div>
            </div>
            
            
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12 px-4">
        <div className="container mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center space-x-3 mb-4">
                <img src="/icon.256.png" alt="AiDeer Logo" className="w-8 h-8 rounded-lg" />
                <h3 className="text-xl font-bold">AiDeer</h3>
              </div>
              <p className="text-gray-400">
                专业的 AI 资产管理工具，让创作更高效。
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-4">产品</h4>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#features" className="hover:text-white transition-colors">功能特色</a></li>
                <li><a href="#docker" className="hover:text-white transition-colors">Docker</a></li>
                <li><a href="#download" className="hover:text-white transition-colors">下载</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">资源</h4>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-white transition-colors">使用文档</a></li>
                <li><a href="#" className="hover:text-white transition-colors">API 参考</a></li>
                <li><a href="#" className="hover:text-white transition-colors">技术支持</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">联系我们</h4>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-white transition-colors">用户反馈</a></li>
                <li><a href="#" className="hover:text-white transition-colors">商务合作</a></li>
                <li><a href="#" className="hover:text-white transition-colors">关于我们</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
            <p>&copy; 2025 AiDeer. 保留所有权利。</p>
          </div>
        </div>
      </footer>
    </div>
  )
}

export default App
