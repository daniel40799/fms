import React from 'react';

export interface DescriptionItem {
  term: string;
  detail: React.ReactNode;
}

export interface DescriptionListProps {
  title?: string;
  subtitle?: string;
  items: DescriptionItem[];
  columns?: 1 | 2;
  striped?: boolean;
  className?: string;
}

export function DescriptionList({
  title,
  subtitle,
  items,
  columns = 1,
  striped = false,
  className = '',
}: DescriptionListProps) {
  return (
    <div className={className}>
      {(title || subtitle) && (
        <div className="px-4 sm:px-0">
          {title && (
            <h3 className="text-base font-semibold leading-7 text-gray-900">{title}</h3>
          )}
          {subtitle && (
            <p className="mt-1 max-w-2xl text-sm leading-6 text-gray-500">{subtitle}</p>
          )}
        </div>
      )}
      <div className="mt-6 border-t border-gray-100">
        <dl className="divide-y divide-gray-100">
          {items.map((item, i) => (
            <div
              key={i}
              className={`px-4 py-6 sm:px-0 ${
                striped && i % 2 === 1 ? 'bg-gray-50' : ''
              } ${
                columns === 2
                  ? 'sm:grid sm:grid-cols-3 sm:gap-4'
                  : ''
              }`}
            >
              <dt className="text-sm font-medium leading-6 text-gray-900">{item.term}</dt>
              <dd
                className={`mt-1 text-sm leading-6 text-gray-700 ${
                  columns === 2 ? 'sm:col-span-2 sm:mt-0' : ''
                }`}
              >
                {item.detail}
              </dd>
            </div>
          ))}
        </dl>
      </div>
    </div>
  );
}

export default DescriptionList;
