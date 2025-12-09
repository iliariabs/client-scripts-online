import { useEffect, useRef, useState } from 'react';
import { LANGUAGE_CONFIG } from '../config/languageConfig';

import SyntaxWorker from '../workers/syntax-worker?worker';

export interface Token {
  start: number;
  end: number;
  type: string;
}

export const useSyntaxWorker = (code: string, languageId: string) => {
  const [tokens, setTokens] = useState<Token[]>([]);
  const workerRef = useRef<Worker | null>(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    workerRef.current = new SyntaxWorker();
    
    workerRef.current.onmessage = (e) => {
      const { type, tokens } = e.data;
      if (type === 'READY') setIsReady(true);
      if (type === 'TOKENS') setTokens(tokens);
    };

    workerRef.current.postMessage({ 
      type: 'INIT', 
      wasmBaseUrl: import.meta.env.BASE_URL + 'wasm/'
    });

    return () => {
      workerRef.current?.terminate();
    };
  }, []);

  useEffect(() => {
    if (!isReady || !workerRef.current) return;
    
    const config = LANGUAGE_CONFIG[languageId];
    if (config) {
      workerRef.current.postMessage({
        type: 'LOAD_LANG',
        langId: languageId,
        wasmUrl: config.wasmUrl
      });
    }
  }, [languageId, isReady]);

  useEffect(() => {
    if (!isReady || !workerRef.current) return;

    const timeoutId = setTimeout(() => {
        workerRef.current?.postMessage({
        type: 'PARSE',
        code,
        langId: languageId
        });
    }, 50);

    return () => clearTimeout(timeoutId);
  }, [code, languageId, isReady]);

  return tokens;
};