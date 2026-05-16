import React from 'react';

export interface CardProps {
  className?: string;
  children?: React.ReactNode;
  header?: React.ReactNode;
  footer?: React.ReactNode;
  padding?: boolean;
}

export function Card({ className = '', children, header, footer, padding = true }: CardProps) {
  return (
    <div className={`overflow-hidden rounded-lg bg-white shadow ${className}`}>
      {header && (
        <div className="border-b border-gray-200 bg-white px-4 py-5 sm:px-6">{header}</div>
      )}
      <div className={padding ? 'px-4 py-5 sm:p-6' : ''}>{children}</div>
      {footer && (
        <div className="border-t border-gray-200 bg-gray-50 px-4 py-4 sm:px-6">{footer}</div>
      )}
    </div>
  );
}

export default Card;
