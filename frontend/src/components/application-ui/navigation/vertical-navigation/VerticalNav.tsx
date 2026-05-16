// @ts-nocheck
import React from 'react';

export interface NavItem {
  name: string;
  href: string;
  current: boolean;
}

export interface VerticalNavProps {
  navigation?: NavItem[];
  className?: string;
}

export function VerticalNav({
  navigation = [],
  className,
}: VerticalNavProps) {
  function classNames(...classes: string[]): string {
    return classes.filter(Boolean).join(' ');
  }

  return (
    <nav aria-label="Sidebar" className="flex flex-1 flex-col">
      <ul role="list" className="-mx-2 space-y-1">
        {navigation.map((item) => (
          <li key={item.name}>
            <a
              href={item.href}
              className={classNames(
                item.current ? 'bg-gray-50 text-indigo-600' : 'text-gray-700 hover:bg-gray-50 hover:text-indigo-600',
                'group flex gap-x-3 rounded-md p-2 pl-3 text-sm font-semibold leading-6',
              )}
            >
              {item.name}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}

export default VerticalNav;