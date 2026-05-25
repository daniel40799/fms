import React from 'react';

export interface ButtonGroupItem {
  label: string;
  onClick?: () => void;
  disabled?: boolean;
  active?: boolean;
  icon?: React.ReactNode;
}

export interface ButtonGroupProps {
  items: ButtonGroupItem[];
  className?: string;
}

export function ButtonGroup({ items, className = '' }: ButtonGroupProps) {
  void className;
  void items;
  return (
    <span className={`isolate inline-flex rounded-md shadow-sm ${className}`}>
      {items.map((item, index) => {
        const isFirst = index === 0;
        const isLast = index === items.length - 1;

        let roundedClasses = '';
        if (isFirst && isLast) roundedClasses = 'rounded-md';
        else if (isFirst) roundedClasses = 'rounded-l-md';
        else if (isLast) roundedClasses = 'rounded-r-md';

        return (
          <button
            key={item.label}
            type="button"
            disabled={item.disabled}
            onClick={item.onClick}
            className={`relative -ml-px inline-flex items-center gap-x-1.5 ${isFirst ? 'ml-0' : ''} ${roundedClasses} ${
              item.active
                ? 'bg-sky-50 px-3 py-2 text-sm font-semibold text-sky-700 ring-1 ring-inset ring-sky-300 hover:bg-sky-100 focus:z-10 dark:bg-sky-400/10 dark:text-sky-200 dark:ring-sky-400/30 dark:hover:bg-sky-400/20'
                : 'bg-white px-3 py-2 text-sm font-semibold text-slate-900 ring-1 ring-inset ring-slate-300 hover:bg-slate-50 focus:z-10 dark:bg-slate-900 dark:text-slate-100 dark:ring-slate-700 dark:hover:bg-slate-800'
            } disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            {item.icon}
            {item.label}
          </button>
        );
      })}
    </span>
  );
}

export default ButtonGroup;
