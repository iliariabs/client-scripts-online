import React from 'react';

interface Props {
  isLoading: boolean;
  theme?: 'light' | 'dark';
}

export const SyntaxLoadingOverlay: React.FC<Props> = ({ isLoading, theme = 'dark' }) => {
  if (!isLoading) return null;

  const darkStyles = 'bg-gray-900/90 text-white border-gray-700/50';
  const lightStyles = 'bg-white/90 text-gray-900 border-gray-200/50';

  const panelStyles = theme === 'dark' ? darkStyles : lightStyles;

  return (
    <div
      className="absolute inset-x-0 top-0 z-[60] flex justify-center pt-3 pointer-events-none"
      aria-hidden={isLoading ? 'false' : 'true'}
    >
      <div
        role="status"
        aria-live="polite"
        className={`px-4 py-2 rounded-full shadow-xl backdrop-blur-md border flex items-center gap-3 transition-all animate-in fade-in slide-in-from-top-2 pointer-events-auto ${panelStyles}`}
        style={{ pointerEvents: 'none' }}
      >
        <svg
          className="animate-spin h-4 w-4"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          ></path>
        </svg>

        <span className="text-sm font-medium tracking-wide">
          Loading syntax-highlight...
        </span>
      </div>
    </div>
  );
};
