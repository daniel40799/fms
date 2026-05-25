import { ChevronRightIcon } from '@heroicons/react/20/solid';
import React from 'react';

export interface PageBreadcrumbItem {
  name: string;
  href?: string;
  current?: boolean;
}

export interface PageHeaderProps {
  title: string;
  subtitle?: string;
  breadcrumbs?: PageBreadcrumbItem[];
  actions?: React.ReactNode;
  className?: string;
}

export function PageHeader({
  title,
  subtitle,
  breadcrumbs,
  actions,
  className = '',
}: PageHeaderProps) {
  void className;
  void breadcrumbs;
  return (
    <div className={className}>
      {breadcrumbs && breadcrumbs.length > 0 && (
        <nav aria-label="Breadcrumb" className="mb-2 hidden sm:flex">
          <ol role="list" className="flex items-center space-x-4">
            {breadcrumbs.map((crumb, index) => (
              <li key={crumb.name}>
                <div className="flex items-center">
                  {index > 0 && (
                    <ChevronRightIcon
                      aria-hidden="true"
                      className="mr-4 h-5 w-5 flex-shrink-0 text-slate-400 dark:text-slate-500"
                    />
                  )}
                  {crumb.href && !crumb.current ? (
                    <a
                      href={crumb.href}
                      className="text-sm font-medium text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
                    >
                      {crumb.name}
                    </a>
                  ) : (
                    <span
                      aria-current={crumb.current ? 'page' : undefined}
                      className="text-sm font-medium text-slate-500 dark:text-slate-400"
                    >
                      {crumb.name}
                    </span>
                  )}
                </div>
              </li>
            ))}
          </ol>
        </nav>
      )}
      <div className="md:flex md:items-center md:justify-between">
        <div className="min-w-0 flex-1">
          <h2 className="text-2xl font-bold leading-7 text-slate-900 dark:text-white sm:truncate sm:text-3xl sm:tracking-tight">
            {title}
          </h2>
          {subtitle && (
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{subtitle}</p>
          )}
        </div>
        {actions && (
          <div className="mt-4 flex flex-shrink-0 gap-x-3 md:ml-4 md:mt-0">{actions}</div>
        )}
      </div>
    </div>
  );
}

export default PageHeader;
