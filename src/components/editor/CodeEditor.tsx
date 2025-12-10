import React, {
  forwardRef,
  useImperativeHandle,
  useRef,
  useLayoutEffect,
  useState,
  useEffect,
} from 'react';
import type { EditorRef } from '../../types/index';
import { useSyntaxWorker } from './hooks/useSyntaxWorker';
import { HighlightOverlay } from './HighlightOverlay';
import { SyntaxLoadingOverlay } from '../layout/SyntaxLoadingOverlay';

interface Props {
  value: string;
  onChange: (value: string) => void;
  theme: 'light' | 'dark';
  languageId: string;
}

export const CodeEditor = forwardRef<EditorRef, Props>(({ value, onChange, theme, languageId }, ref) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);
  const [minLines, setMinLines] = useState(1);
  const [currentLine, setCurrentLine] = useState(1);

  const { tokens, isLoading } = useSyntaxWorker(value, languageId);

  const LINE_HEIGHT = 24;
  const PADDING_TOP = 12;
  const FONT_FAMILY = '"Menlo", "Consolas", "Monaco", "Liberation Mono", "Lucida Console", monospace';

  const handleScroll = (e: React.UIEvent<HTMLTextAreaElement>) => {
    const { scrollTop, scrollLeft } = e.currentTarget;

    if (overlayRef.current) {
      overlayRef.current.scrollTop = scrollTop;
      overlayRef.current.scrollLeft = scrollLeft;
    }

    const gutterInfo = containerRef.current?.querySelector('.gutter-content') as HTMLElement;
    if (gutterInfo) {
      gutterInfo.style.transform = `translateY(-${scrollTop}px)`;
    }
  };

  useImperativeHandle(ref, () => ({
    focus: () => textareaRef.current?.focus(),
    getValue: () => value,
    setValue: (v: string) => onChange(v),
  }));

  useLayoutEffect(() => {
    const updateMinLines = () => {
      if (containerRef.current) {
        const height = containerRef.current.clientHeight;
        const availableHeight = height - PADDING_TOP * 2;
        setMinLines(Math.max(1, Math.ceil(availableHeight / LINE_HEIGHT)));
      }
    };
    updateMinLines();
    window.addEventListener('resize', updateMinLines);
    return () => window.removeEventListener('resize', updateMinLines);
  }, []);

  const updateCurrentLine = () => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    const pos = textarea.selectionStart;
    const textBefore = value.slice(0, pos);
    const line = textBefore.split('\n').length;
    setCurrentLine(line);
  };

  useEffect(() => {
    updateCurrentLine();
  }, [value]);

  useEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const handleSelectionChange = () => updateCurrentLine();
    const handleKeyUp = () => updateCurrentLine();
    const handleClick = () => updateCurrentLine();

    document.addEventListener('selectionchange', handleSelectionChange);
    textarea.addEventListener('keyup', handleKeyUp);
    textarea.addEventListener('click', handleClick);

    return () => {
      document.removeEventListener('selectionchange', handleSelectionChange);
      textarea.removeEventListener('keyup', handleKeyUp);
      textarea.removeEventListener('click', handleClick);
    };
  }, [value]);

  useEffect(() => {
    const textarea = textareaRef.current;
    const container = containerRef.current;
    if (!textarea || !container) return;

    const scrollToCaret = () => {
      const { selectionStart } = textarea;
      const linesBeforeCaret = value.slice(0, selectionStart).split('\n').length - 1;
      const caretTopOffset = linesBeforeCaret * LINE_HEIGHT + PADDING_TOP;
      const { scrollTop, clientHeight } = container;

      if (caretTopOffset >= scrollTop + clientHeight - LINE_HEIGHT) {
        container.scrollTop = caretTopOffset - clientHeight + LINE_HEIGHT * 2;
      } else if (caretTopOffset < scrollTop) {
        container.scrollTop = caretTopOffset - LINE_HEIGHT;
      }
    };
    scrollToCaret();
  }, [value]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    const textarea = textareaRef.current!;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;

    if (e.key === 'Tab') {
      e.preventDefault();
      const lines = value.split('\n');
      const startLineIndex = value.slice(0, start).split('\n').length - 1;
      const endLineIndex = value.slice(0, end).split('\n').length - 1;

      if (startLineIndex === endLineIndex && start === end) {
        const spaces = '  ';
        const newValue = value.slice(0, start) + spaces + value.slice(end);
        onChange(newValue);
        requestAnimationFrame(() => {
          textarea.selectionStart = textarea.selectionEnd = start + spaces.length;
        });
      } else {
        if (e.shiftKey) {
          let charsRemoved = 0;
          const newLines = lines.map((line, index) => {
            if (index >= startLineIndex && index <= endLineIndex && line.startsWith('  ')) {
              if (index === startLineIndex) charsRemoved = 2;
              return line.slice(2);
            }
            return line;
          });
          const newValue = newLines.join('\n');
          onChange(newValue);
          requestAnimationFrame(() => {
            textarea.selectionStart = start - charsRemoved;
            textarea.selectionEnd = end - charsRemoved;
          });
        } else {
          const newLines = lines.map((line, index) => {
            if (index >= startLineIndex && index <= endLineIndex) {
              return '  ' + line;
            }
            return line;
          });
          const newValue = newLines.join('\n');
          onChange(newValue);
          requestAnimationFrame(() => {
            const addedSpaces = 2 * (endLineIndex - startLineIndex + 1);
            textarea.selectionStart = start + 2;
            textarea.selectionEnd = end + addedSpaces;
          });
        }
      }

    }

    if (e.key === 'Enter') {
      e.preventDefault();
      const currentLineText = value.slice(0, start).split('\n').pop() || '';
      const indent = currentLineText.match(/^\s*/)![0];
      const newValue = value.slice(0, start) + '\n' + indent + value.slice(end);
      onChange(newValue);
      requestAnimationFrame(() => {
        const newPos = start + 1 + indent.length;
        textarea.selectionStart = textarea.selectionEnd = newPos;
      });
    }
  };

  const contentLineCount = value.split('\n').length;
  const totalLines = Math.max(contentLineCount, minLines);

  const themeStyles = theme === 'dark'
    ? {
        bg: 'bg-gray-900',
        gutter: 'bg-gray-900',
        gutterBorder: 'border-gray-700',
        text: '#e5e7eb',
        gutterText: '#6b7280',
        caret: '#a3e635',
        activeLineNumber: '#a3e635',
        activeLineNumberBg: '#374151',
      }
    : {
        bg: 'bg-white',
        gutter: 'bg-white',
        gutterBorder: 'border-gray-200',
        text: '#111827',
        gutterText: '#9ca3af',
        caret: '#000000',
        activeLineNumber: '#16a34a',
        activeLineNumberBg: '#f0fdf4',
      };

  return (
    <div
      ref={containerRef}
      className={`absolute inset-0 overflow-hidden ${themeStyles.bg}`}
    >
      <SyntaxLoadingOverlay isLoading={isLoading} theme={theme}/>

      <div className="flex min-h-full min-w-max relative h-full">
        <div
          className={`flex-shrink-0 select-none text-right border-r h-full overflow-hidden ${themeStyles.gutter} ${themeStyles.gutterBorder}`}
          style={{
            width: '3.5rem',
            paddingTop: `${PADDING_TOP}px`,
            fontFamily: FONT_FAMILY,
            fontSize: '14px',
          }}
        >
           <div 
             className="gutter-content"
             style={{ transform: `translateY(-${(textareaRef.current?.scrollTop || 0)}px)` }}
           >
              {Array.from({ length: totalLines }, (_, i) => {
                const lineNumber = i + 1;
                const isActive = lineNumber === currentLine;
                return (
                  <div
                    key={i}
                    style={{
                      height: `${LINE_HEIGHT}px`,
                      lineHeight: `${LINE_HEIGHT}px`,
                      paddingRight: '12px',
                      backgroundColor: isActive ? themeStyles.activeLineNumberBg : 'transparent',
                      color: isActive ? themeStyles.activeLineNumber : themeStyles.gutterText,
                      fontWeight: isActive ? 'bold' : 'normal',
                    }}
                  >
                    {lineNumber}
                  </div>
                );
              })}
           </div>
        </div>

        <div className="relative flex-1 h-full">
            <div 
                ref={overlayRef}
                className="syntax-overlay absolute inset-0 overflow-hidden pointer-events-none"
            >
                <HighlightOverlay 
                    code={value} 
                    tokens={tokens} 
                    theme={theme}
                    fontFamily={FONT_FAMILY}
                    lineHeight={LINE_HEIGHT}
                    paddingTop={PADDING_TOP}
                />
            </div>

            <textarea
              ref={textareaRef}
              value={value}
              onKeyDown={handleKeyDown}
              onChange={(e) => onChange(e.target.value)}
              onScroll={handleScroll}
              spellCheck={false}
              className={`block w-full h-full resize-none outline-none bg-transparent whitespace-pre absolute inset-0 z-10`}
              style={{
                fontFamily: FONT_FAMILY,
                fontSize: '14px',
                lineHeight: `${LINE_HEIGHT}px`,
                paddingTop: `${PADDING_TOP}px`,
                paddingBottom: `${PADDING_TOP}px`,
                paddingLeft: '12px',
                paddingRight: '12px',
                tabSize: 2,
                color: 'transparent',
                caretColor: themeStyles.caret,
              }}
            />

        </div>
      </div>
    </div>
  );
});

CodeEditor.displayName = 'CodeEditor';