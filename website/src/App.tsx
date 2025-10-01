import { Download, Zap, Container, Image, Video, Folder, Github, Search, Package, Puzzle, Hash, Heart } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ImageSlider } from '@/components/ImageSlider'
import { LanguageProvider, useLanguage } from '@/contexts/LanguageContext'
import { LanguageSelector } from '@/components/LanguageSelector'

const AppContent = () => {
  const { t } = useLanguage()

  const screenshotImages = [
    {
      src: '/screen8.png',
      alt: 'AiDeer 主界面',
      title: t('screenshot.main.title'),
      description: t('screenshot.main.description')
    },
    {
      src: '/screen3.png',
      alt: '设置界面',
      title: t('screenshot.settings.title'),
      description: t('screenshot.settings.description')
    },
    {
      src: '/screen2.png',
      alt: '插件管理',
      title: t('screenshot.plugins.title'),
      description: t('screenshot.plugins.description')
    },
    {
      src: '/screen1.png',
      alt: '数据维护',
      title: t('screenshot.maintenance.title'),
      description: t('screenshot.maintenance.description')
    },
    {
      src: '/screen5.png',
      alt: '批量操作',
      title: t('screenshot.batch.title'),
      description: t('screenshot.batch.description')
    },
    {
      src: '/screen6.png',
      alt: '文件详情',
      title: t('screenshot.details.title'),
      description: t('screenshot.details.description')
    }
  ]

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
            <a href="#features" className="text-gray-600 hover:text-gray-900 transition-colors">{t('nav.features')}</a>
            <a href="#docker" className="text-gray-600 hover:text-gray-900 transition-colors">{t('nav.docker')}</a>
            <a href="#download" className="text-gray-600 hover:text-gray-900 transition-colors">{t('nav.download')}</a>
            <a 
              href="https://github.com/easychen/aideer" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-gray-600 hover:text-gray-900 transition-colors flex items-center space-x-1"
            >
              <Github className="w-4 h-4" />
              <span>{t('nav.github')}</span>
            </a>
            <LanguageSelector />
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto text-center">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6">
              {t('hero.title')}
              <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent"> {t('hero.titleHighlight')} </span>
              {t('hero.titleEnd')}
            </h2>
            <p className="text-xl text-gray-600 mb-8 leading-relaxed">
              {t('hero.description')}
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
                {t('hero.downloadBtn')}
              </Button>
              <Button 
                size="lg" 
                variant="outline"
                className="border-gray-300 text-gray-700 hover:bg-gray-50"
                onClick={() => {
                  window.open('https://github.com/easychen/aideer', '_blank', 'noopener,noreferrer')
                }}
              >
                <Github className="w-5 h-5 mr-2" />
                {t('hero.githubBtn')}
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
              {t('features.title')}
            </h2>
            <p className="text-xl text-gray-600">
              {t('features.subtitle')}
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="p-6 rounded-xl border border-gray-200 hover:shadow-lg transition-shadow">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                <Image className="w-6 h-6 text-blue-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">{t('features.multiPlatform.title')}</h3>
              <p className="text-gray-600">
                {t('features.multiPlatform.description')}
              </p>
            </div>
            <div className="p-6 rounded-xl border border-gray-200 hover:shadow-lg transition-shadow">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4">
                <Video className="w-6 h-6 text-purple-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">{t('features.promptManagement.title')}</h3>
              <p className="text-gray-600">
                {t('features.promptManagement.description')}
              </p>
            </div>
            <div className="p-6 rounded-xl border border-gray-200 hover:shadow-lg transition-shadow">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4">
                <Folder className="w-6 h-6 text-green-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">{t('features.characterCard.title')}</h3>
              <p className="text-gray-600">
                {t('features.characterCard.description')}
              </p>
            </div>
            <div className="p-6 rounded-xl border border-gray-200 hover:shadow-lg transition-shadow">
              <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center mb-4">
                <Zap className="w-6 h-6 text-orange-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">{t('features.flexibleDeployment.title')}</h3>
              <p className="text-gray-600">
                {t('features.flexibleDeployment.description')}
              </p>
            </div>
            <div className="p-6 rounded-xl border border-gray-200 hover:shadow-lg transition-shadow">
              <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center mb-4">
                <Search className="w-6 h-6 text-indigo-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">{t('features.quickSearch.title')}</h3>
              <p className="text-gray-600">
                {t('features.quickSearch.description')}
              </p>
            </div>
            <div className="p-6 rounded-xl border border-gray-200 hover:shadow-lg transition-shadow">
              <div className="w-12 h-12 bg-cyan-100 rounded-lg flex items-center justify-center mb-4">
                <Package className="w-6 h-6 text-cyan-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">{t('features.batchImport.title')}</h3>
              <p className="text-gray-600">
                {t('features.batchImport.description')}
              </p>
            </div>
            <div className="p-6 rounded-xl border border-gray-200 hover:shadow-lg transition-shadow">
              <div className="w-12 h-12 bg-pink-100 rounded-lg flex items-center justify-center mb-4">
                <Puzzle className="w-6 h-6 text-pink-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">{t('features.pluginSystem.title')}</h3>
              <p className="text-gray-600">
                {t('features.pluginSystem.description')}
              </p>
            </div>
            <div className="p-6 rounded-xl border border-gray-200 hover:shadow-lg transition-shadow">
              <div className="w-12 h-12 bg-teal-100 rounded-lg flex items-center justify-center mb-4">
                <Hash className="w-6 h-6 text-teal-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">{t('features.smartAnnotation.title')}</h3>
              <p className="text-gray-600">
                {t('features.smartAnnotation.description')}
              </p>
            </div>
            <div className="p-6 rounded-xl border border-gray-200 hover:shadow-lg transition-shadow">
              <div className="w-12 h-12 bg-emerald-100 rounded-lg flex items-center justify-center mb-4">
                <Heart className="w-6 h-6 text-emerald-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">{t('features.openSource.title')}</h3>
              <p className="text-gray-600">
                {t('features.openSource.description')}
              </p>
            </div>
          </div>
        </div>
      </section>

      

      
        {/* Download Section */}
      <section id="download" className="py-20 bg-gradient-to-br from-blue-50 to-purple-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">{t('download.title')}</h2>
          <p className="text-xl text-gray-600 mb-12">
            {t('download.subtitle')}
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-5xl mx-auto">
            {/* Mac Apple Silicon Download */}
             <div className="bg-white p-6 rounded-xl shadow-lg hover:shadow-xl transition-shadow flex flex-col h-full">
               <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                 <svg className="w-8 h-8 text-gray-600" viewBox="0 0 24 24" fill="currentColor">
                   <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
                 </svg>
               </div>
               <h3 className="text-xl font-semibold text-gray-900 mb-2">{t('download.mac.apple.title')}</h3>
               <p className="text-gray-600 mb-4 flex-grow text-sm">{t('download.mac.apple.description')}</p>
               <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white mt-auto">
                 <Download className="w-4 h-4 mr-2" />
                 {t('download.downloadBtn')}
               </Button>
             </div>

             {/* Mac Intel Download */}
             <div className="bg-white p-6 rounded-xl shadow-lg hover:shadow-xl transition-shadow flex flex-col h-full">
               <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                 <svg className="w-8 h-8 text-gray-600" viewBox="0 0 24 24" fill="currentColor">
                   <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
                 </svg>
               </div>
               <h3 className="text-xl font-semibold text-gray-900 mb-2">{t('download.mac.intel.title')}</h3>
               <p className="text-gray-600 mb-4 flex-grow text-sm">{t('download.mac.intel.description')}</p>
               <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white mt-auto">
                 <Download className="w-4 h-4 mr-2" />
                 {t('download.downloadBtn')}
               </Button>
             </div>

             {/* Windows Download */}
             <div className="bg-white p-6 rounded-xl shadow-lg hover:shadow-xl transition-shadow flex flex-col h-full">
               <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                 <svg className="w-8 h-8 text-gray-600" viewBox="0 0 24 24" fill="currentColor">
                   <path d="M3 12V6.75l6-1.32v6.48L3 12zm17-9v8.75l-10 .15V5.21L20 3zM3 13l6 .09v6.81l-6-1.15V13zm17 .25V22l-10-1.91V13.1l10 .15z"/>
                 </svg>
               </div>
               <h3 className="text-xl font-semibold text-gray-900 mb-2">{t('download.windows.title')}</h3>
               <p className="text-gray-600 mb-4 flex-grow text-sm">{t('download.windows.description')}</p>
               <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white mt-auto">
                 <Download className="w-4 h-4 mr-2" />
                 {t('download.downloadBtn')}
               </Button>
             </div>

             {/* Docker Installation */}
             <div className="bg-white p-6 rounded-xl shadow-lg hover:shadow-xl transition-shadow flex flex-col h-full">
               <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                 <Container className="w-8 h-8 text-gray-600" />
               </div>
               <h3 className="text-xl font-semibold text-gray-900 mb-2">{t('download.docker.title')}</h3>
               <p className="text-gray-600 mb-4 flex-grow text-sm">{t('download.docker.description')}</p>
               <Button className="w-full bg-purple-600 hover:bg-purple-700 text-white mt-auto"
                 onClick={() => {
                   document.getElementById('docker')?.scrollIntoView({ 
                     behavior: 'smooth' 
                   })
                 }}
               >
                 <Container className="w-4 h-4 mr-2" />
                 {t('download.dockerBtn')}
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
              {t('docker.title')}
            </h2>
            <p className="text-xl text-gray-600">
              {t('docker.subtitle')}
            </p>
          </div>
          
          <div className="max-w-4xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
              <div className="bg-white rounded-xl p-6 shadow-lg">
                <h3 className="text-xl font-semibold text-gray-900 mb-4">{t('docker.quickStart')}</h3>
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
                <h3 className="text-xl font-semibold text-gray-900 mb-4">{t('docker.compose')}</h3>
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
                {t('footer.description')}
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-4">{t('footer.product')}</h4>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#features" className="hover:text-white transition-colors">{t('nav.features')}</a></li>
                <li><a href="#docker" className="hover:text-white transition-colors">{t('nav.docker')}</a></li>
                <li><a href="#download" className="hover:text-white transition-colors">{t('nav.download')}</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">{t('footer.resources')}</h4>
              <ul className="space-y-2 text-gray-400">
                <li><a href="https://github.com/easychen/aideer" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors flex items-center space-x-1">
                  <Github className="w-4 h-4" />
                  <span>{t('nav.github')}</span>
                </a></li>
                <li><a href="#" className="hover:text-white transition-colors">{t('footer.documentation')}</a></li>
                <li><a href="#" className="hover:text-white transition-colors">{t('footer.api')}</a></li>
                <li><a href="#" className="hover:text-white transition-colors">{t('footer.support')}</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">{t('footer.contact')}</h4>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-white transition-colors">{t('footer.feedback')}</a></li>
                <li><a href="#" className="hover:text-white transition-colors">{t('footer.business')}</a></li>
                <li><a href="#" className="hover:text-white transition-colors">{t('footer.about')}</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
            <p>&copy; 2025 AiDeer. {t('footer.copyright')}</p>
          </div>
        </div>
      </footer>
    </div>
  )
}

function App() {
  return (
    <LanguageProvider>
      <AppContent />
    </LanguageProvider>
  )
}

export default App
