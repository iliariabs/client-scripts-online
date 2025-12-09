import React, { useMemo } from 'react';
import type { Token } from './hooks/useSyntaxWorker';

interface Props {
  code: string;
  tokens: Token[];
  theme: 'light' | 'dark';
  fontFamily: string;
  lineHeight: number;
  paddingTop: number;
  tabSize?: number;
}

const getTokenColor = (type: string | null, theme: 'light' | 'dark') => {
  const isDark = theme === 'dark';
  switch (type) {
    case 'string': return isDark ? '#a5d6ff' : '#0a3069';
    case 'comment': return isDark ? '#8b949e' : '#6e7781';
    case 'function': return isDark ? '#d2a8ff' : '#8250df';
    case 'keyword': return isDark ? '#ff7b72' : '#cf222e';
    case 'number': return isDark ? '#79c0ff' : '#0550ae';
    default: return isDark ? '#c9d1d9' : '#24292f'; 
  }
};

const getLineStyle = (height: number, fontFamily: string, color: string): React.CSSProperties => ({
  height: `${height}px`,
  lineHeight: `${height}px`,
  fontFamily,
  fontSize: '14px',
  whiteSpace: 'pre',
  paddingLeft: '12px',
  paddingRight: '12px',
  boxSizing: 'border-box',
  overflow: 'hidden',
  color: color,
});

export const HighlightOverlay: React.FC<Props> = ({
  code,
  tokens,
  theme,
  fontFamily,
  lineHeight,
  paddingTop,
  tabSize = 2,
}) => {
  const lines = useMemo(() => code.split('\n'), [code]);

  const lineStartOffsets = useMemo(() => {
    const res: number[] = [];
    let offset = 0;
    for (let i = 0; i < lines.length; i++) {
      res.push(offset);
      offset += lines[i].length + 1;
    }
    return res;
  }, [lines]);

  const tokensByLine = useMemo(() => {
    const map = new Map<number, Token[]>();
    if (!tokens || tokens.length === 0) return map;

    for (const t of tokens) {
      for (let i = 0; i < lines.length; i++) {
        const lineStart = lineStartOffsets[i];
        const lineEnd = lineStart + lines[i].length;
        
        if (t.end <= lineStart) break; 

        if (t.start > lineEnd) continue;

        if (!map.has(i)) map.set(i, []);
        map.get(i)!.push(t);
      }
    }
    return map;
  }, [tokens, lineStartOffsets, lines]);

  const renderedLines = useMemo(() => {
    return lines.map((lineText, lineIndex) => {
      const lineStart = lineStartOffsets[lineIndex];
      
      let lineTokens = tokensByLine.get(lineIndex) || [];

      if (lineTokens.length === 0) {
         return (
          <div key={lineIndex} style={getLineStyle(lineHeight, fontFamily, getTokenColor(null, theme))}>
            {lineText || '\u00a0'}
          </div>
        );
      }

      lineTokens = [...lineTokens].sort((a, b) => (b.end - b.start) - (a.end - a.start));

      const charTypes = new Array(lineText.length).fill(null);

      lineTokens.forEach(t => {
        const startInLine = Math.max(0, t.start - lineStart);
        const endInLine = Math.min(lineText.length, t.end - lineStart);

        for (let i = startInLine; i < endInLine; i++) {
          charTypes[i] = t.type;
        }
      });

      const parts: React.ReactNode[] = [];
      let currentType = charTypes[0];
      let buffer = '';

      for (let i = 0; i < lineText.length; i++) {
        if (charTypes[i] !== currentType) {
          if (buffer) {
            parts.push(
              <span key={`${lineIndex}-${i}`} style={{ color: getTokenColor(currentType, theme) }}>
                {buffer}
              </span>
            );
          }
          buffer = lineText[i];
          currentType = charTypes[i];
        } else {
          buffer += lineText[i];
        }
      }

      if (buffer) {
        parts.push(
          <span key={`${lineIndex}-last`} style={{ color: getTokenColor(currentType, theme) }}>
            {buffer}
          </span>
        );
      }
      
      if (parts.length === 0) parts.push('\u00a0');

      return (
        <div key={lineIndex} style={getLineStyle(lineHeight, fontFamily, getTokenColor(null, theme))}>
          {parts}
        </div>
      );
    });
  }, [lines, tokensByLine, lineStartOffsets, code, fontFamily, lineHeight, theme]);

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none"
      style={{
        paddingTop: `${paddingTop}px`,
        paddingBottom: `${paddingTop}px`,
        tabSize: tabSize,
        minWidth: '100%',
        width: 'max-content' 
      }}
    >
      {renderedLines}
    </div>
  );
};