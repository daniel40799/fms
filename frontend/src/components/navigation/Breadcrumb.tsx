import { HomeIcon, ChevronRightIcon } from '@heroicons/react/20/solid';

export interface BreadcrumbItem {
  name: string;
  href?: string;
  current?: boolean;
}

export interface BreadcrumbProps {
  items: BreadcrumbItem[];
  homeHref?: string;
  showHome?: boolean;
  className?: string;
}

export function Breadcrumb({
  items,
  homeHref = '#',
  showHome = true,
  className = '',
}: BreadcrumbProps) {
  return (
    <nav aria-label="Breadcrumb" className={`flex ${className}`}>
      <ol role="list" className="flex items-center space-x-4">
        {showHome && (
          <li>
            <div>
              <a href={homeHref} className="text-gray-400 hover:text-gray-500">
                <HomeIcon aria-hidden="true" className="h-5 w-5 flex-shrink-0" />
                <span className="sr-only">Home</span>
              </a>
            </div>
          </li>
        )}
        {items.map((item) => (
          <li key={item.name}>
            <div className="flex items-center">
              <ChevronRightIcon
                aria-hidden="true"
                className="h-5 w-5 flex-shrink-0 text-gray-400"
              />
              {item.href && !item.current ? (
                <a
                  href={item.href}
                  className="ml-4 text-sm font-medium text-gray-500 hover:text-gray-700"
                >
                  {item.name}
                </a>
              ) : (
                <span
                  aria-current={item.current ? 'page' : undefined}
                  className="ml-4 text-sm font-medium text-gray-500"
                >
                  {item.name}
                </span>
              )}
            </div>
          </li>
        ))}
      </ol>
    </nav>
  );
}

export default Breadcrumb;
