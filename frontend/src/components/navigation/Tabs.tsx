
export interface Tab {
  name: string;
  href?: string;
  current?: boolean;
  onClick?: () => void;
  badge?: string | number;
}

export interface TabsProps {
  tabs: Tab[];
  className?: string;
}

export function Tabs({ tabs, className = '' }: TabsProps) {
  return (
    <div className={className}>
      <div className="sm:hidden">
        <label htmlFor="tabs" className="sr-only">
          Select a tab
        </label>
        <select
          id="tabs"
          defaultValue={tabs.find((t) => t.current)?.name}
          className="block w-full rounded-md border-gray-300 py-2 pl-3 pr-10 text-base focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 sm:text-sm"
        >
          {tabs.map((tab) => (
            <option key={tab.name}>{tab.name}</option>
          ))}
        </select>
      </div>
      <div className="hidden sm:block">
        <div className="border-b border-gray-200">
          <nav aria-label="Tabs" className="-mb-px flex space-x-8">
            {tabs.map((tab) => (
              <a
                key={tab.name}
                href={tab.href ?? '#'}
                onClick={tab.onClick}
                aria-current={tab.current ? 'page' : undefined}
                className={`${
                  tab.current
                    ? 'border-indigo-500 text-indigo-600'
                    : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                } whitespace-nowrap border-b-2 px-1 py-4 text-sm font-medium`}
              >
                {tab.name}
                {tab.badge !== undefined && (
                  <span
                    className={`${
                      tab.current ? 'bg-indigo-100 text-indigo-600' : 'bg-gray-100 text-gray-900'
                    } ml-2 hidden rounded-full px-2.5 py-0.5 text-xs font-medium md:inline-block`}
                  >
                    {tab.badge}
                  </span>
                )}
              </a>
            ))}
          </nav>
        </div>
      </div>
    </div>
  );
}

export default Tabs;
