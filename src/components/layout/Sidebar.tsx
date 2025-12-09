import React from 'react';
import { LANGUAGES, type Language } from '../../data/languages';

interface SidebarProps {
  theme: 'light' | 'dark';
  selectedLanguage: Language;
  onLanguageChange: (lang: Language) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ theme, selectedLanguage, onLanguageChange }) => {
  const isDark = theme === 'dark';
  const bg = isDark ? 'bg-gray-800' : 'bg-gray-50';
  const border = isDark ? 'border-gray-700' : 'border-gray-200';
  const hover = isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-200';
  const selectedBg = isDark ? 'bg-gray-700' : 'bg-white';
  const selectedText = isDark ? 'text-white font-bold' : 'text-gray-900 font-bold';

  return (
    <div className={`w-12 border-r flex flex-col flex-shrink-0 ${bg} ${border}`}>
      {LANGUAGES.map((lang) => (
        <button
          key={lang.id}
          onClick={() => onLanguageChange(lang)}
          className={`w-full p-3 text-xs transition-all ${hover} ${
            selectedLanguage.id === lang.id ? selectedBg : ''
          }`}
          title={lang.name}
        >
          <span className={selectedLanguage.id === lang.id ? selectedText : isDark ? 'text-gray-400' : 'text-gray-600'}>
            {lang.short}
          </span>
        </button>
      ))}
    </div>
  );
};