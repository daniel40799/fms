import React from 'react';

export interface CardProps {
  className?: string;
  children?: React.ReactNode;
  header?: React.ReactNode;
  footer?: React.ReactNode;
  padding?: boolean;
}

export function Card({ className = '', children, header, footer, padding = true }: CardProps) {
  void className;
  return (
    <div className={`overflow-hidden rounded-lg border border-slate-200 bg-white shadow dark:border-slate-800 dark:bg-slate-900 ${className}`}>
      {header && (
        <div className="border-b border-slate-200 bg-white px-4 py-5 dark:border-slate-800 dark:bg-slate-900 sm:px-6">{header}</div>
      )}
      <div className={padding ? 'px-4 py-5 sm:p-6' : ''}>{children}</div>
      {footer && (
        <div className="border-t border-slate-200 bg-slate-50 px-4 py-4 dark:border-slate-800 dark:bg-slate-950 sm:px-6">{footer}</div>
      )}
    </div>
  );
}

export default Card;
