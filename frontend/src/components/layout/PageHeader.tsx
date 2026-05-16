import React from 'react';
import { ChevronRightIcon } from '@heroicons/react/20/solid';

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
                      className="mr-4 h-5 w-5 flex-shrink-0 text-gray-400"
                    />
                  )}
                  {crumb.href && !crumb.current ? (
                    <a
                      href={crumb.href}
                      className="text-sm font-medium text-gray-500 hover:text-gray-700"
                    >
                      {crumb.name}
                    </a>
                  ) : (
                    <span
                      aria-current={crumb.current ? 'page' : undefined}
                      className="text-sm font-medium text-gray-500"
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
          <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:truncate sm:text-3xl sm:tracking-tight">
            {title}
          </h2>
          {subtitle && (
            <p className="mt-1 text-sm text-gray-500">{subtitle}</p>
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
