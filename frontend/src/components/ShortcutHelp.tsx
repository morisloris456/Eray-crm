import React from 'react';
import { KeyboardShortcut } from '../hooks/useKeyboardShortcuts';

interface ShortcutHelpProps {
  shortcuts: KeyboardShortcut[];
}

export const ShortcutHelp: React.FC<ShortcutHelpProps> = ({ shortcuts }) => {
  return (
    <div className="space-y-2">
      <h3 className="text-sm font-semibold text-gray-800 mb-3">Raccourcis clavier</h3>
      
      <div className="grid grid-cols-1 gap-2">
        {shortcuts
          .filter(s => s.enabled !== false)
          .map((shortcut, index) => (
            <div key={index} className="flex items-center justify-between text-xs">
              <span className="text-gray-600">{shortcut.description}</span>
              <kbd className="flex items-center gap-1 bg-gray-100 px-2 py-1 rounded border border-gray-300 text-gray-700">
                {shortcut.ctrlKey && <span>Ctrl</span>}
                {shortcut.shiftKey && <span>Shift</span>}
                {shortcut.altKey && <span>Alt</span>}
                {shortcut.ctrlKey && '+'}
                {shortcut.shiftKey && '+'}
                {shortcut.altKey && '+'}
                <span className="font-semibold">{shortcut.key.toUpperCase()}</span>
              </kbd>
            </div>
          ))}
      </div>
    </div>
  );
};
