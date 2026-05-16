import React from 'react';

export interface StatCardItem {
  name: string;
  stat: string | number;
  previousStat?: string | number;
  change?: string;
  changeType?: 'increase' | 'decrease';
  icon?: React.ComponentType<React.SVGProps<SVGSVGElement>>;
}

export interface StatCardProps extends StatCardItem {
  className?: string;
}

export function StatCard({
  name,
  stat,
  previousStat,
  change,
  changeType,
  icon: Icon,
  className = '',
}: StatCardProps) {
  return (
    <div className={`overflow-hidden rounded-lg bg-white px-4 py-5 shadow sm:p-6 ${className}`}>
      <div className="flex items-center">
        {Icon && (
          <div className="flex-shrink-0">
            <Icon aria-hidden="true" className="h-8 w-8 text-indigo-600" />
          </div>
        )}
        <div className={Icon ? 'ml-4' : ''}>
          <dt className="truncate text-sm font-medium text-gray-500">{name}</dt>
          <dd className="mt-1 text-3xl font-semibold tracking-tight text-gray-900">
            {stat}
          </dd>
        </div>
      </div>
      {(change || previousStat !== undefined) && (
        <div className="mt-4 flex items-baseline">
          {change && (
            <span
              className={`text-sm font-semibold ${
                changeType === 'increase' ? 'text-green-600' : 'text-red-600'
              }`}
            >
              {changeType === 'increase' ? '↑' : '↓'} {change}
            </span>
          )}
          {previousStat !== undefined && (
            <span className="ml-2 text-sm text-gray-500">from {previousStat}</span>
          )}
        </div>
      )}
    </div>
  );
}

export interface StatGridProps {
  stats: StatCardItem[];
  columns?: 1 | 2 | 3 | 4;
  title?: string;
  className?: string;
}

export function StatGrid({ stats, columns = 3, title, className = '' }: StatGridProps) {
  const gridCols: Record<number, string> = {
    1: 'sm:grid-cols-1',
    2: 'sm:grid-cols-2',
    3: 'sm:grid-cols-3',
    4: 'sm:grid-cols-4',
  };

  return (
    <div className={className}>
      {title && (
        <h3 className="text-base font-semibold leading-6 text-gray-900">{title}</h3>
      )}
      <dl className={`mt-5 grid grid-cols-1 gap-5 ${gridCols[columns]}`}>
        {stats.map((item) => (
          <StatCard key={item.name} {...item} />
        ))}
      </dl>
    </div>
  );
}

export default StatCard;
