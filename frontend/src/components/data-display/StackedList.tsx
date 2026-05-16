import React from 'react';

export interface StackedListItem {
  id: string | number;
  primary: string;
  secondary?: string;
  meta?: string;
  metaDetail?: string;
  avatar?: string;
  avatarAlt?: string;
  avatarInitials?: string;
  badge?: React.ReactNode;
  action?: React.ReactNode;
  href?: string;
}

export interface StackedListProps {
  items: StackedListItem[];
  className?: string;
}

export function StackedList({ items, className = '' }: StackedListProps) {
  return (
    <ul role="list" className={`divide-y divide-gray-100 ${className}`}>
      {items.map((item) => {
        const inner = (
          <div className="flex justify-between gap-x-6 py-5">
            <div className="flex min-w-0 gap-x-4">
              {item.avatar ? (
                <img
                  alt={item.avatarAlt ?? item.primary}
                  src={item.avatar}
                  className="h-12 w-12 flex-none rounded-full bg-gray-50 object-cover"
                />
              ) : item.avatarInitials ? (
                <span className="flex h-12 w-12 flex-none items-center justify-center rounded-full bg-indigo-100 text-sm font-medium text-indigo-700">
                  {item.avatarInitials.slice(0, 2).toUpperCase()}
                </span>
              ) : null}
              <div className="min-w-0 flex-auto">
                <p className="text-sm font-semibold leading-6 text-gray-900">{item.primary}</p>
                {item.secondary && (
                  <p className="mt-1 truncate text-xs leading-5 text-gray-500">{item.secondary}</p>
                )}
              </div>
            </div>
            <div className="hidden shrink-0 sm:flex sm:flex-col sm:items-end">
              {item.badge && <div>{item.badge}</div>}
              {item.meta && (
                <p className="text-sm leading-6 text-gray-900">{item.meta}</p>
              )}
              {item.metaDetail && (
                <p className="mt-1 text-xs leading-5 text-gray-500">{item.metaDetail}</p>
              )}
              {item.action && <div className="mt-1">{item.action}</div>}
            </div>
          </div>
        );

        return (
          <li key={item.id}>
            {item.href ? (
              <a href={item.href} className="block hover:bg-gray-50">
                {inner}
              </a>
            ) : (
              inner
            )}
          </li>
        );
      })}
    </ul>
  );
}

export default StackedList;
