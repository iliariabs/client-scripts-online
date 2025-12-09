import React from 'react';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  theme: 'light' | 'dark';
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose, theme }) => {
  if (!isOpen) return null;

  const isDark = theme === 'dark';
  const modalBg = isDark ? 'bg-gray-800' : 'bg-white';
  const overlay = 'bg-black/50';

  return (
    <div className={`fixed inset-0 ${overlay} flex items-center justify-center z-50`} onClick={onClose}>
      <div
        className={`w-96 max-w-full mx-4 p-8 rounded-xl shadow-2xl ${modalBg} border ${isDark ? 'border-gray-700' : 'border-gray-300'}`}
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-2xl font-bold mb-6">Settings</h2>

        <div className="space-y-5">
          <div>
            <p className="text-sm opacity-70">Theme</p>
            <p className="text-lg font-medium capitalize">{theme} Mode</p>
          </div>

          <div className="pt-4 border-t border-gray-600">
            <p className="text-xs opacity-60">More settings coming soon...</p>
          </div>
        </div>

        <div className="mt-8 flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2.5 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};