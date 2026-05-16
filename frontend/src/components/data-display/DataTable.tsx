import React from 'react';

export interface Column<T> {
  key: keyof T | string;
  header: string;
  render?: (value: unknown, row: T) => React.ReactNode;
  className?: string;
}

export interface DataTableProps<T extends Record<string, unknown>> {
  columns: Column<T>[];
  data: T[];
  title?: string;
  description?: string;
  action?: React.ReactNode;
  emptyMessage?: string;
  className?: string;
  getRowKey?: (row: T, index: number) => string | number;
}

export function DataTable<T extends Record<string, unknown>>({
  columns,
  data,
  title,
  description,
  action,
  emptyMessage = 'No data available.',
  className = '',
  getRowKey,
}: DataTableProps<T>) {
  return (
    <div className={`px-4 sm:px-6 lg:px-8 ${className}`}>
      {(title || action) && (
        <div className="sm:flex sm:items-center">
          <div className="sm:flex-auto">
            {title && (
              <h1 className="text-base font-semibold leading-6 text-gray-900">{title}</h1>
            )}
            {description && (
              <p className="mt-2 text-sm text-gray-700">{description}</p>
            )}
          </div>
          {action && (
            <div className="mt-4 sm:ml-16 sm:mt-0 sm:flex-none">{action}</div>
          )}
        </div>
      )}
      <div className="mt-8 flow-root">
        <div className="-mx-4 -my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
          <div className="inline-block min-w-full py-2 align-middle sm:px-6 lg:px-8">
            <table className="min-w-full divide-y divide-gray-300">
              <thead>
                <tr>
                  {columns.map((col) => (
                    <th
                      key={String(col.key)}
                      scope="col"
                      className={`py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-0 ${col.className ?? ''}`}
                    >
                      {col.header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {data.length === 0 ? (
                  <tr>
                    <td
                      colSpan={columns.length}
                      className="py-8 text-center text-sm text-gray-500"
                    >
                      {emptyMessage}
                    </td>
                  </tr>
                ) : (
                  data.map((row, index) => (
                    <tr key={getRowKey ? getRowKey(row, index) : index}>
                      {columns.map((col) => (
                        <td
                          key={String(col.key)}
                          className={`whitespace-nowrap py-4 pl-4 pr-3 text-sm text-gray-900 sm:pl-0 ${col.className ?? ''}`}
                        >
                          {col.render
                            ? col.render(row[col.key as keyof T], row)
                            : String(row[col.key as keyof T] ?? '')}
                        </td>
                      ))}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

export default DataTable;
