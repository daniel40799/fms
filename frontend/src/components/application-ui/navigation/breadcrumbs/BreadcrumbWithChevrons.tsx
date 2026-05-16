// @ts-nocheck
import React from 'react';
import { ChevronRightIcon, HomeIcon } from '@heroicons/react/20/solid'

export interface PageItem {
  name: string;
  href: string;
  current: boolean;
}

export interface BreadcrumbWithChevronsProps {
  pages?: PageItem[];
  className?: string;
}

export function BreadcrumbWithChevrons({
  pages = [],
  className,
}: BreadcrumbWithChevronsProps) {
  return (
    <nav aria-label="Breadcrumb" className="flex">
      <ol role="list" className="flex items-center space-x-4">
        <li>
          <div>
            <a href="#" className="text-gray-400 hover:text-gray-500">
              <HomeIcon aria-hidden="true" className="h-5 w-5 flex-shrink-0" />
              <span className="sr-only">Home</span>
            </a>
          </div>
        </li>
        {pages.map((page) => (
          <li key={page.name}>
            <div className="flex items-center">
              <ChevronRightIcon aria-hidden="true" className="h-5 w-5 flex-shrink-0 text-gray-400" />
              <a
                href={page.href}
                aria-current={page.current ? 'page' : undefined}
                className="ml-4 text-sm font-medium text-gray-500 hover:text-gray-700"
              >
                {page.name}
              </a>
            </div>
          </li>
        ))}
      </ol>
    </nav>
  );
}

export default BreadcrumbWithChevrons;