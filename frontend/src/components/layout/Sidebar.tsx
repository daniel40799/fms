import React from 'react';

export interface NavItem {
  name: string;
  href: string;
  icon?: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  current?: boolean;
  badge?: string | number;
}

export interface SidebarProps {
  navigation?: NavItem[];
  logo?: React.ReactNode;
  footer?: React.ReactNode;
  className?: string;
}

function classNames(...classes: string[]) {
  return classes.filter(Boolean).join(' ');
}

export function Sidebar({ navigation = [], logo, footer, className = '' }: SidebarProps) {
  void className;
  return (
    <div className={`flex grow flex-col gap-y-5 overflow-y-auto border-r border-slate-200 bg-white px-6 pb-4 dark:border-slate-800 dark:bg-slate-900 ${className}`}>
      {logo && (
        <div className="flex h-16 shrink-0 items-center">{logo}</div>
      )}
      <nav className="flex flex-1 flex-col">
        <ul role="list" className="flex flex-1 flex-col gap-y-7">
          <li>
            <ul role="list" className="-mx-2 space-y-1">
              {navigation.map((item) => (
                <li key={item.name}>
                  <a
                    href={item.href}
                    className={classNames(
                      item.current
                        ? 'bg-sky-50 text-sky-700 dark:bg-sky-400/10 dark:text-sky-200'
                        : 'text-slate-700 hover:bg-slate-50 hover:text-sky-700 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-sky-200',
                      'group flex gap-x-3 rounded-md p-2 text-sm font-semibold leading-6'
                    )}
                  >
                    {item.icon && (
                      <item.icon
                        aria-hidden="true"
                        className={classNames(
                          item.current ? 'text-sky-700 dark:text-sky-200' : 'text-slate-400 group-hover:text-sky-700 dark:text-slate-500 dark:group-hover:text-sky-200',
                          'h-6 w-6 shrink-0'
                        )}
                      />
                    )}
                    {item.name}
                    {item.badge !== undefined && (
                      <span className="ml-auto w-9 min-w-max whitespace-nowrap rounded-full bg-white px-2.5 py-0.5 text-center text-xs font-medium leading-5 text-slate-600 ring-1 ring-inset ring-slate-200 dark:bg-slate-950 dark:text-slate-300 dark:ring-slate-700">
                        {item.badge}
                      </span>
                    )}
                  </a>
                </li>
              ))}
            </ul>
          </li>
          {footer && (
            <li className="mt-auto">{footer}</li>
          )}
        </ul>
      </nav>
    </div>
  );
}

export default Sidebar;
