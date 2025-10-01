import React, { useState } from 'react'
import { Globe, ChevronDown } from 'lucide-react'
import { useLanguage, Language } from '@/contexts/LanguageContext'

export const LanguageSelector: React.FC = () => {
  const { language, setLanguage, t } = useLanguage()
  const [isOpen, setIsOpen] = useState(false)

  const languages: { value: Language; label: string }[] = [
    { value: 'zh', label: t('language.chinese') },
    { value: 'en', label: t('language.english') },
    { value: 'system', label: t('language.system') }
  ]

  const currentLabel = languages.find(lang => lang.value === language)?.label || t('language.system')

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-2 px-3 py-2 text-gray-600 hover:text-gray-900 transition-colors rounded-lg hover:bg-gray-100"
      >
        <Globe className="w-4 h-4" />
        <span className="text-sm">{currentLabel}</span>
        <ChevronDown className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>
      
      {isOpen && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 z-10" 
            onClick={() => setIsOpen(false)}
          />
          
          {/* Dropdown */}
          <div className="absolute right-0 mt-2 w-40 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-20">
            {languages.map((lang) => (
              <button
                key={lang.value}
                onClick={() => {
                  setLanguage(lang.value)
                  setIsOpen(false)
                }}
                className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-50 transition-colors ${
                  language === lang.value 
                    ? 'text-blue-600 bg-blue-50' 
                    : 'text-gray-700'
                }`}
              >
                {lang.label}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  )
}