import React from 'react';

export interface TopbarProps {
  onMenuClick?: () => void;
  logo?: React.ReactNode;
  actions?: React.ReactNode;
  className?: string;
}

export function Topbar({ onMenuClick, logo, actions, className = '' }: TopbarProps) {
  void className;
  return (
    <div
      className={`sticky top-0 z-40 flex h-16 shrink-0 items-center gap-x-4 border-b border-slate-200 bg-white px-4 shadow-sm dark:border-slate-800 dark:bg-slate-950 sm:gap-x-6 sm:px-6 lg:px-8 ${className}`}
    >
      {onMenuClick && (
        <button
          type="button"
          onClick={onMenuClick}
          className="-m-2.5 p-2.5 text-slate-700 dark:text-slate-200 lg:hidden"
          aria-label="Open sidebar"
        >
          <svg
            className="h-6 w-6"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth="1.5"
            stroke="currentColor"
            aria-hidden="true"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
          </svg>
        </button>
      )}

      {logo && (
        <div className="flex h-16 shrink-0 items-center">{logo}</div>
      )}

      {/* Separator */}
      <div className="h-6 w-px bg-slate-200 dark:bg-slate-800 lg:hidden" aria-hidden="true" />

      <div className="flex flex-1 gap-x-4 self-stretch lg:gap-x-6">
        <div className="flex flex-1" />
        <div className="flex items-center gap-x-4 lg:gap-x-6">{actions}</div>
      </div>
    </div>
  );
}

export default Topbar;
