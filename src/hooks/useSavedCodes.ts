import { useCallback } from 'react';
import { getLanguageById, type Language } from '../data/languages';

const STORAGE_KEY = 'savedCodes';

interface SavedCodes {
  [langId: string]: string;
}

const getSavedCodes = (): SavedCodes => {
  const item = sessionStorage.getItem(STORAGE_KEY);
  return item ? JSON.parse(item) : {};
};

const saveCodes = (codes: SavedCodes) => {
  sessionStorage.setItem(STORAGE_KEY, JSON.stringify(codes));
};

export const useSavedCodes = (
  currentLanguage: Language,
  defaultLanguage: Language
) => {
  const getCodeForLanguage = useCallback((langId: string): string => {
    const saved = getSavedCodes();
    return saved[langId] ?? getLanguageById(langId)?.defaultCode ?? '';
  }, []);

  const saveCodeForCurrentLanguage = useCallback(
    (code: string) => {
      const saved = getSavedCodes();
      saved[currentLanguage.id] = code;
      saveCodes(saved);
    },
    [currentLanguage.id]
  );

  const loadCodeForLanguage = useCallback(
    (lang: Language): string => {
      return getCodeForLanguage(lang.id);
    },
    [getCodeForLanguage]
  );

  const initialCode =
    currentLanguage.id === defaultLanguage.id
      ? getCodeForLanguage(defaultLanguage.id)
      : loadCodeForLanguage(currentLanguage);

  return {
    initialCode,
    loadCodeForLanguage,
    saveCodeForCurrentLanguage,
  };
};
