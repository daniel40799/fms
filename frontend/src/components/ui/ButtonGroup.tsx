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
                ? 'bg-indigo-50 px-3 py-2 text-sm font-semibold text-indigo-600 ring-1 ring-inset ring-indigo-300 hover:bg-indigo-100 focus:z-10'
                : 'bg-white px-3 py-2 text-sm font-semibold text-gray-900 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-10'
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
