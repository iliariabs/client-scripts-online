import React, { useEffect, useRef } from 'react';

interface Props {
  output: string;
  onClear: () => void;
  theme: 'light' | 'dark';
  inputPrompt: string | null;
  onInputSubmit: (value: string) => void;
  onCancel?: () => void;
}

export const OutputConsole: React.FC<Props> = ({
  output,
  onClear,
  theme,
  inputPrompt,
  onInputSubmit,
}) => {
  const isDark = theme === 'dark';
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [output, inputPrompt]);

  useEffect(() => {
    if (inputPrompt && inputRef.current) {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 10);
    }
  }, [inputPrompt]);
    
  const handleSubmit = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      const value = e.currentTarget.value;
      onInputSubmit(value);
      e.currentTarget.value = '';
    }
  };

  const styles = {
    container: `flex flex-col h-full border-t ${isDark ? 'bg-gray-900 border-gray-700' : 'bg-white border-gray-300'}`,
    header: `flex items-center justify-between px-4 py-2 ${isDark ? 'bg-gray-800' : 'bg-gray-100'}`,
    headerText: `font-semibold text-sm ${isDark ? 'text-gray-200' : 'text-gray-700'}`,
    clearBtn: `text-xs opacity-70 hover:opacity-100 transition ${isDark ? 'text-gray-400 hover:text-gray-200' : 'text-gray-600 hover:text-gray-900'}`,
    body: `flex-1 overflow-y-auto p-4 font-mono text-sm min-h-0`,
    text: isDark ? 'text-gray-300' : 'text-gray-700',
    prompt: isDark ? 'text-gray-300' : 'text-gray-700',
    input: `bg-transparent outline-none border-none flex-1 min-w-32 ${isDark ? 'text-gray-100 caret-gray-100' : 'text-gray-900 caret-gray-900'}`,
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <span className={styles.headerText}>Output</span>
        <button onClick={onClear} className={styles.clearBtn}>
          Clear
        </button>
      </div>

      <div ref={containerRef} className={styles.body}>
        <div className={`whitespace-pre-wrap break-words ${styles.text}`}>
          {output}
        </div>

        {inputPrompt !== null && (
          <div className="flex items-baseline mt-1 font-mono">
            <span className={styles.prompt}>{inputPrompt}</span>
            <input
              ref={inputRef}
              type="text"
              autoFocus
              spellCheck={false}
              autoComplete="off"
              autoCorrect="off"
              autoCapitalize="off"
              className={styles.input}
              style={{ caretColor: isDark ? '#e5e7eb' : '#1f2937' }}
              onKeyDown={handleSubmit}
              onBlur={() => setTimeout(() => inputRef.current?.focus(), 10)}
            />
          </div>
        )}

        <div ref={bottomRef} />
      </div>
    </div>
  );
};