import { useState, useRef, useCallback, useEffect } from 'react';
import { Header } from './components/layout/Header';
import { Sidebar } from './components/layout/Sidebar';
import { SettingsModal } from './components/layout/SettingsModal';
import { CodeEditor } from './components/editor/CodeEditor';
import { OutputConsole } from './components/console/OutputConsole';
import type { EditorRef } from './types';
import { cancelExecution, cleanupAllRunners, safeEval } from './lib/evalCode';
import { useTheme } from './hooks/useTheme';
import { LANGUAGES, getLanguageById, type Language } from './data/languages';
import { useSavedCodes } from './hooks/useSavedCodes';

const SESSION_LANGUAGE_KEY = 'selected-language';

export default function App() {
  const { theme, toggle: toggleTheme } = useTheme();

  const savedLangId = sessionStorage.getItem(SESSION_LANGUAGE_KEY);
  const savedLanguage = savedLangId ? getLanguageById(savedLangId) : null;
  const initialLanguage = savedLanguage || LANGUAGES[0];

  const [currentLanguage, setCurrentLanguage] = useState<Language>(initialLanguage);

  const {
    initialCode,
    loadCodeForLanguage,
    saveCodeForCurrentLanguage
  } = useSavedCodes(currentLanguage, initialLanguage);

  const [code, setCode] = useState(initialCode);
  const [output, setOutput] = useState('> Ready...\n');
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [isRunning, setIsRunning] = useState(false);
  const [inputPrompt, setInputPrompt] = useState<string | null>(null);

  const resolveInputRef = useRef<((value: string) => void) | null>(null);
  const editorRef = useRef<EditorRef>(null);

  useEffect(() => {
    sessionStorage.setItem(SESSION_LANGUAGE_KEY, currentLanguage.id);
  }, [currentLanguage]);

  const handleLanguageChange = (lang: Language) => {
    if (isRunning || lang.id === currentLanguage.id) return;

    setCurrentLanguage(lang);
    const loaded = loadCodeForLanguage(lang);
    setCode(loaded);
    setOutput('> Ready...\n');
  };

  useEffect(() => {
    saveCodeForCurrentLanguage(code);
  }, [code]);

  const handleInputRequest = useCallback((_?: string): Promise<string> => {
    return new Promise((resolve) => {
      setInputPrompt('');
      resolveInputRef.current = (value: string) => {
        resolve(value.trim());
        setInputPrompt(null);
        resolveInputRef.current = null;
      };
    });
  }, []);

  const runCode = async (): Promise<void> => {
    if (isRunning) {
      cancelExecution();
      setOutput(prev => prev + '^C\n> Interrupted by user\n');
      setIsRunning(false);
      setInputPrompt(null);
      resolveInputRef.current?.('');
      return;
    }

    if (!code.trim()) return;

    setIsRunning(true);
    setOutput('> Ready...\n> Running ' + currentLanguage.name + '...\n');

    await safeEval(
      currentLanguage.id,
      code,
      handleInputRequest,
      (text: string) => setOutput(prev => prev + text)
    );

    setIsRunning(false);
  };

  const handleCancel = () => {
    cleanupAllRunners();
    setIsRunning(false);
    setInputPrompt(null);
    resolveInputRef.current?.('');
    setOutput(prev => prev + '^C\n> Interrupted\n');
  };

  const handleInputSubmit = (value: string) => {
    setOutput(prev => prev + value + '\n');
    resolveInputRef.current?.(value);
  };

  const isDark = theme === 'dark';
  const baseClasses = isDark ? 'bg-gray-900 text-white' : 'bg-white text-black';

  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = '';
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, []);

  return (
    <div className={`min-h-screen w-screen flex flex-col overflow-hidden ${baseClasses}`}>
      <Header
        onRun={runCode}
        isRunning={isRunning}
        onSettings={() => setSettingsOpen(true)}
        theme={theme}
        toggleTheme={toggleTheme}
        currentLanguage={currentLanguage}
      />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar
          theme={theme}
          selectedLanguage={currentLanguage}
          onLanguageChange={handleLanguageChange}
        />
        <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
          <div className="flex-1 relative overflow-hidden">
            <CodeEditor
              ref={editorRef}
              value={code}
              onChange={setCode}
              theme={theme}
              languageId={currentLanguage.id}
            />
          </div>
          <div
            className="overflow-hidden border-t border-gray-700"
            style={{ height: '240px', minHeight: '120px', maxHeight: '80vh' }}
          >
            <OutputConsole
              output={output}
              onClear={() => setOutput('> Ready...\n')}
              theme={theme}
              inputPrompt={inputPrompt}
              onInputSubmit={handleInputSubmit}
              onCancel={handleCancel}
            />
          </div>
        </div>
      </div>
      <SettingsModal
        isOpen={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        theme={theme}
      />
    </div>
  );
}