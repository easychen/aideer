import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'

export type Language = 'zh' | 'en' | 'system'

interface LanguageContextType {
  language: Language
  currentLanguage: 'zh' | 'en'
  setLanguage: (lang: Language) => void
  t: (key: string) => string
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined)

// 翻译数据
const translations: Record<'zh' | 'en', Record<string, string>> = {
  zh: {
    // Header
    'nav.features': '功能特色',
    'nav.docker': 'Docker',
    'nav.download': '下载',
    'nav.github': 'GitHub',
    
    // Hero Section
    'hero.title': 'AI 创作内容',
    'hero.titleHighlight': '统一管理',
    'hero.titleEnd': '新体验',
    'hero.description': 'AiDeer专注于AI 产管理工，帮你统一收集、整理和管理来自各个生图、生视频网站的AI创作内容。让你的AI创作资产井然有序，随时可用。',
    'hero.downloadBtn': '立刻使用',
    'hero.githubBtn': '查看源码',
    
    // Screenshots
    'screenshot.main.title': '文件浏览界面',
    'screenshot.main.description': '支持多级树状目录、可自定义预览图大小、鼠标滑动预览视频，快速复制图片内容',
    'screenshot.settings.title': '设置界面',
    'screenshot.settings.description': '支持明暗主题、多语言切换',
    'screenshot.plugins.title': '插件管理',
    'screenshot.plugins.description': '开放的插件结构，内置角色卡和图片提示词插件',
    'screenshot.maintenance.title': '数据维护',
    'screenshot.maintenance.description': '快速搜索和索引维护',
    'screenshot.batch.title': '批量操作',
    'screenshot.batch.description': '支持多选，对选中项进行批量删除、复制、移动等操作',
    'screenshot.details.title': '文件详情',
    'screenshot.details.description': '文件详情，支持添加标签、链接和笔记',
    
    // Features Section
    'features.title': '强大的功能特色',
    'features.subtitle': '专为 AI 创作者设计的资产管理解决方案',
    'features.multiPlatform.title': '多平台收集',
    'features.multiPlatform.description': '浏览器插件导入图片、拖动导入批量文件，轻松收集各平台 AI 生成内容',
    'features.promptManagement.title': '提示词管理',
    'features.promptManagement.description': '查看图片提示词信息，轻松管理和复用你的创作灵感',
    'features.characterCard.title': '角色卡管理',
    'features.characterCard.description': '查看和管理 CharacterCard 的角色卡信息，统一管理你的 AI 角色资产',
    'features.flexibleDeployment.title': '灵活部署方式',
    'features.flexibleDeployment.description': '支持 Self-hosted 私有部署，也可作为客户端使用，满足不同场景需求',
    'features.quickSearch.title': '快速搜索定位',
    'features.quickSearch.description': '强大的搜索功能，支持按文件名、标签、提示词等多维度快速定位资产',
    'features.batchImport.title': '批量导入管理',
    'features.batchImport.description': '支持批量导入文件和批量操作，提高资产管理效率，节省宝贵时间',
    'features.pluginSystem.title': '插件扩展系统',
    'features.pluginSystem.description': '基于文件扩展名动态加载插件，支持自定义处理逻辑，扩展性强',
    'features.smartAnnotation.title': '智能标注系统',
    'features.smartAnnotation.description': '基于文件 Hash 的笔记和标签系统，确保标注信息永不丢失',
    'features.openSource.title': '开源免费',
    'features.openSource.description': '完全开源免费，AGPL-3.0 许可证，社区驱动开发，持续改进优化',
    
    // Download Section
    'download.title': '准备开始使用了吗？',
    'download.subtitle': '选择适合你的安装方式，立即开始管理你的 AI 资产',
    'download.mac.title': 'macOS',
    'download.mac.apple.title': 'Apple 芯片',
    'download.mac.apple.description': '适用于 M1/M2/M3 芯片的 Mac',
    'download.mac.intel.title': 'Intel 芯片',
    'download.mac.intel.description': '适用于 Intel 芯片的 Mac',
    'download.windows.title': 'Windows',
    'download.windows.description': '支持 Windows 10 及以上版本',
    'download.docker.title': 'Docker',
    'download.docker.description': '跨平台部署，支持自托管',
    'download.downloadBtn': '下载',
    'download.dockerBtn': 'Docker 部署',
    
    // Docker Section
    'docker.title': '简单的 Docker 部署',
    'docker.subtitle': '几分钟内即可通过 Docker 运行 AiDeer',
    'docker.quickStart': 'Docker 快速启动',
    'docker.compose': 'Docker Compose',
    
    // Footer
    'footer.description': '专业的 AI 资产管理工具，让创作更高效。',
    'footer.product': '产品',
    'footer.resources': '资源',
    'footer.contact': '联系我们',
    'footer.documentation': '使用文档',
    'footer.api': 'API 参考',
    'footer.support': '技术支持',
    'footer.feedback': '用户反馈',
    'footer.business': '商务合作',
    'footer.about': '关于我们',
    'footer.copyright': '保留所有权利。',
    
    // Language Selector
    'language.chinese': '中文',
    'language.english': 'English',
    'language.system': '跟随系统'
  },
  en: {
    // Header
    'nav.features': 'Features',
    'nav.docker': 'Docker',
    'nav.download': 'Download',
    'nav.github': 'GitHub',
    
    // Hero Section
    'hero.title': 'AI Content',
    'hero.titleHighlight': 'Unified Management',
    'hero.titleEnd': 'Experience',
    'hero.description': 'AiDeer focuses on AI asset management tools, helping you collect, organize and manage AI-generated content from various image and video generation websites. Keep your AI creative assets organized and ready to use.',
    'hero.downloadBtn': 'Get Started',
    'hero.githubBtn': 'View Source',
    
    // Screenshots
    'screenshot.main.title': 'File Browser Interface',
    'screenshot.main.description': 'Support multi-level tree directory, customizable preview size, mouse scroll video preview, quick copy image content',
    'screenshot.settings.title': 'Settings Interface',
    'screenshot.settings.description': 'Support light/dark theme, multi-language switching',
    'screenshot.plugins.title': 'Plugin Management',
    'screenshot.plugins.description': 'Open plugin architecture with built-in character card and image prompt plugins',
    'screenshot.maintenance.title': 'Data Maintenance',
    'screenshot.maintenance.description': 'Quick search and index maintenance',
    'screenshot.batch.title': 'Batch Operations',
    'screenshot.batch.description': 'Support multi-selection for batch delete, copy, move operations',
    'screenshot.details.title': 'File Details',
    'screenshot.details.description': 'File details with support for adding tags, links and notes',
    
    // Features Section
    'features.title': 'Powerful Features',
    'features.subtitle': 'Asset management solution designed for AI creators',
    'features.multiPlatform.title': 'Multi-Platform Collection',
    'features.multiPlatform.description': 'Browser extension for image import, drag-and-drop batch file import, easily collect AI-generated content from various platforms',
    'features.promptManagement.title': 'Prompt Management',
    'features.promptManagement.description': 'View image prompt information, easily manage and reuse your creative inspiration',
    'features.characterCard.title': 'Character Card Management',
    'features.characterCard.description': 'View and manage CharacterCard information, unified management of your AI character assets',
    'features.flexibleDeployment.title': 'Flexible Deployment',
    'features.flexibleDeployment.description': 'Support self-hosted private deployment or use as client, meeting different scenario needs',
    'features.quickSearch.title': 'Quick Search & Locate',
    'features.quickSearch.description': 'Powerful search functionality, support multi-dimensional quick asset location by filename, tags, prompts',
    'features.batchImport.title': 'Batch Import Management',
    'features.batchImport.description': 'Support batch file import and operations, improve asset management efficiency, save valuable time',
    'features.pluginSystem.title': 'Plugin Extension System',
    'features.pluginSystem.description': 'Dynamic plugin loading based on file extensions, support custom processing logic, highly extensible',
    'features.smartAnnotation.title': 'Smart Annotation System',
    'features.smartAnnotation.description': 'File hash-based notes and tag system, ensuring annotation information never gets lost',
    'features.openSource.title': 'Open Source & Free',
    'features.openSource.description': 'Completely open source and free, AGPL-3.0 license, community-driven development, continuous improvement',
    
    // Download Section
    'download.title': 'Ready to Get Started?',
    'download.subtitle': 'Choose the installation method that suits you and start managing your AI assets immediately',
    'download.mac.title': 'macOS',
    'download.mac.apple.title': 'Apple Silicon',
    'download.mac.apple.description': 'For M1/M2/M3 chip Macs',
    'download.mac.intel.title': 'Intel Chip',
    'download.mac.intel.description': 'For Intel chip Macs',
    'download.windows.title': 'Windows',
    'download.windows.description': 'Support Windows 10 and above',
    'download.docker.title': 'Docker',
    'download.docker.description': 'Cross-platform deployment, self-hosting support',
    'download.downloadBtn': 'Download',
    'download.dockerBtn': 'Docker Deploy',
    
    // Docker Section
    'docker.title': 'Simple Docker Deployment',
    'docker.subtitle': 'Run AiDeer with Docker in minutes',
    'docker.quickStart': 'Docker Quick Start',
    'docker.compose': 'Docker Compose',
    
    // Footer
    'footer.description': 'Professional AI asset management tool for more efficient creation.',
    'footer.product': 'Product',
    'footer.resources': 'Resources',
    'footer.contact': 'Contact',
    'footer.documentation': 'Documentation',
    'footer.api': 'API Reference',
    'footer.support': 'Technical Support',
    'footer.feedback': 'User Feedback',
    'footer.business': 'Business Cooperation',
    'footer.about': 'About Us',
    'footer.copyright': 'All rights reserved.',
    
    // Language Selector
    'language.chinese': '中文',
    'language.english': 'English',
    'language.system': 'Follow System'
  }
}

// 检测系统语言
const getSystemLanguage = (): 'zh' | 'en' => {
  const browserLang = navigator.language || navigator.languages[0]
  return browserLang.startsWith('zh') ? 'zh' : 'en'
}

interface LanguageProviderProps {
  children: ReactNode
}

export const LanguageProvider: React.FC<LanguageProviderProps> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>(() => {
    const saved = localStorage.getItem('aideer-language')
    return (saved as Language) || 'system'
  })

  const currentLanguage: 'zh' | 'en' = language === 'system' ? getSystemLanguage() : language

  const setLanguage = (lang: Language) => {
    setLanguageState(lang)
    localStorage.setItem('aideer-language', lang)
  }

  const t = (key: string): string => {
    return translations[currentLanguage][key] || key
  }

  useEffect(() => {
    // 监听系统语言变化
    const handleLanguageChange = () => {
      if (language === 'system') {
        // 触发重新渲染
        setLanguageState('system')
      }
    }

    window.addEventListener('languagechange', handleLanguageChange)
    return () => window.removeEventListener('languagechange', handleLanguageChange)
  }, [language])

  return (
    <LanguageContext.Provider value={{ language, currentLanguage, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  )
}

export const useLanguage = () => {
  const context = useContext(LanguageContext)
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider')
  }
  return context
}