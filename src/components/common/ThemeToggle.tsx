import React from 'react';
import { useTheme } from '../../context/ThemeContext';
import { Sun, Moon } from 'lucide-react';

interface ThemeToggleProps {
  showLabel?: boolean;
  className?: string;
  size?: 'sm' | 'md';
}

export const ThemeToggle: React.FC<ThemeToggleProps> = ({
  showLabel = false,
  className = '',
  size = 'md',
}) => {
  const { theme, isDark, toggleTheme } = useTheme();

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className={`relative inline-flex items-center gap-1.5 rounded-full transition-all duration-200 focus:outline-hidden focus:ring-2 focus:ring-[#FF5A5F]/40 active:scale-95 select-none ${
        isDark
          ? 'bg-slate-800 text-amber-300 border border-slate-700 hover:bg-slate-700'
          : 'bg-gray-100 text-gray-700 border border-gray-200 hover:bg-gray-200'
      } ${
        size === 'sm' ? 'p-1.5 text-xs' : 'px-2.5 py-1.5 text-xs font-bold'
      } ${className}`}
      title={isDark ? 'Switch to Day Mode (Light)' : 'Switch to Night Shift Mode (Dark)'}
      aria-label={isDark ? 'Switch to Day Mode' : 'Switch to Night Shift Mode'}
    >
      <div className="relative w-4 h-4 flex items-center justify-center">
        {isDark ? (
          <Moon className="w-4 h-4 text-amber-300 animate-fadeIn" />
        ) : (
          <Sun className="w-4 h-4 text-amber-500 animate-fadeIn" />
        )}
      </div>

      {showLabel && (
        <span className="text-[11px] font-bold tracking-tight whitespace-nowrap">
          {isDark ? 'Night Shift' : 'Day Shift'}
        </span>
      )}
    </button>
  );
};
