import React from 'react';
import { Play, Settings, Loader2 } from 'lucide-react';
import type { Language } from '../../data/languages';

interface HeaderProps {
  onRun: () => void;
  isRunning: boolean;
  onSettings: () => void;
  theme: 'light' | 'dark';
  toggleTheme: () => void;
  currentLanguage: Language;
}

export const Header: React.FC<HeaderProps> = ({
  onRun,
  isRunning,
  onSettings,
  theme,
  toggleTheme,
  currentLanguage,
}) => {
  const isDark = theme === 'dark';

  return (
    <header
      className={`flex items-center justify-between px-4 py-3 border-b ${
        isDark ? 'bg-gray-800 border-gray-700' : 'bg-gray-100 border-gray-300'
      }`}
    >
      <div className="flex items-center gap-4">
        <h1 className="text-xl font-bold">Client-side Scripts</h1>
        
        <div className="flex items-center gap-2 text-sm font-medium opacity-75">
          <span>{currentLanguage.name}</span>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <button
          onClick={onRun}
          disabled={false}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${
            isRunning
              ? 'bg-red-600 hover:bg-red-700 text-white'
              : 'bg-green-600 hover:bg-green-700 text-white'
          }`}
        >
          {isRunning ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Stop
            </>
          ) : (
            <>
              <Play className="w-4 h-4" fill="currentColor" />
              Run
            </>
          )}
        </button>

        <button
          onClick={toggleTheme}
          className={`p-2 rounded transition-colors ${
            isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-300'
          }`}
          title={`Switch to ${isDark ? 'light' : 'dark'} theme`}
        >
          {isDark ? '☀️' : '🌙'}
        </button>

        <button
          onClick={onSettings}
          className={`p-2 rounded transition-colors ${
            isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-300'
          }`}
        >
          <Settings className="w-5 h-5" />
        </button>
      </div>
    </header>
  );
};