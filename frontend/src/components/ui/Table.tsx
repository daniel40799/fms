import { AnimatePresence, motion } from 'framer-motion'
import { isValidElement, useMemo, useState, type ReactNode } from 'react'
import { listItemMotion } from '../../lib/motion'
import { AnimatedDialog } from '../modals/AnimatedDialog'

function cellText(cell: ReactNode): string {
  if (cell == null || typeof cell === 'boolean') return ''
  if (typeof cell === 'string' || typeof cell === 'number') return String(cell)
  if (Array.isArray(cell)) return cell.map(cellText).join(' ')

  if (isValidElement<{ children?: ReactNode; value?: unknown; registration?: { status?: string } }>(cell)) {
    const value = typeof cell.props.value === 'string' || typeof cell.props.value === 'number'
      ? String(cell.props.value)
      : ''
    const registrationStatus = cell.props.registration?.status ?? ''
    return `${value} ${registrationStatus} ${cellText(cell.props.children)}`.trim()
  }

  return ''
}

function getMobileSummaryIndexes(columns: string[]) {
  const indexes: number[] = []
  const firstColumn = columns.length ? 0 : -1
  const secondColumn = columns.length > 1 ? 1 : -1
  const statusColumn = columns.findIndex((column) => column.toLowerCase() === 'status')

  for (const index of [firstColumn, secondColumn, statusColumn]) {
    if (index >= 0 && !indexes.includes(index)) indexes.push(index)
  }

  return indexes.slice(0, 3)
}

export function Table({
  columns,
  rows,
  empty,
  filterableColumns = [],
  pageSize,
}: {
  columns: string[]
  rows: ReactNode[][]
  empty: string
  filterableColumns?: boolean[]
  pageSize?: number
}) {
  const [filters, setFilters] = useState(() => columns.map(() => ''))
  const [page, setPage] = useState(1)
  const [selectedRowIndex, setSelectedRowIndex] = useState<number | null>(null)
  const hasFilters = columns.some((_, index) => filterableColumns[index])
  const filteredRows = useMemo(() => rows.filter((row) => filters.every((filter, index) => {
    if (!filterableColumns[index] || !filter.trim()) return true
    return cellText(row[index]).toLocaleLowerCase().includes(filter.trim().toLocaleLowerCase())
  })), [filterableColumns, filters, rows])
  const effectivePageSize = pageSize && pageSize > 0 ? pageSize : Math.max(filteredRows.length, 1)
  const pageCount = Math.max(Math.ceil(filteredRows.length / effectivePageSize), 1)
  const activePage = Math.min(page, pageCount)
  const visibleRows = filteredRows.slice((activePage - 1) * effectivePageSize, activePage * effectivePageSize)
  const mobileSummaryIndexes = useMemo(() => getMobileSummaryIndexes(columns), [columns])
  const statusColumnIndex = columns.findIndex((column) => column.toLowerCase() === 'status')
  const selectedRow = selectedRowIndex === null ? null : visibleRows[selectedRowIndex] ?? null
  const selectedTitle = selectedRow ? cellText(selectedRow[0]) || 'Record details' : 'Record details'

  return (
    <div>
      {hasFilters ? (
        <div className="mb-3 grid gap-2 sm:hidden">
          {columns.map((column, index) => filterableColumns[index] ? (
            <input
              key={`${column}-mobile-filter`}
              aria-label={`Filter ${column}`}
              className="input py-2 text-sm font-normal"
              placeholder={`Filter ${column}`}
              value={filters[index] ?? ''}
              onChange={(event) => {
                setPage(1)
                setFilters((current) => current.map((filter, filterIndex) => filterIndex === index ? event.target.value : filter))
              }}
            />
          ) : null)}
        </div>
      ) : null}

      <div className="sm:hidden">
        <AnimatePresence initial={false}>
          {visibleRows.length ? (
            <motion.ul
              key="mobile-rows"
              layout
              className="overflow-hidden rounded-lg border border-slate-200 bg-white dark:border-white/10 dark:bg-slate-900"
            >
              {visibleRows.map((row, index) => {
                const visibleDetailCount = Math.max(columns.length - mobileSummaryIndexes.length, 0)

                return (
                  <motion.li
                    key={`${activePage}-${index}-mobile`}
                    layout
                    {...listItemMotion}
                    className="border-b border-slate-100 last:border-b-0 dark:border-white/10"
                  >
                    <button
                      type="button"
                      onClick={() => setSelectedRowIndex(index)}
                      className="block w-full px-3 py-3 text-left transition-colors duration-150 ease-out hover:bg-slate-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-inset focus-visible:outline-sky-700 dark:hover:bg-white/5 dark:focus-visible:outline-sky-400 motion-reduce:transition-none"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0 flex-1 space-y-1">
                          {mobileSummaryIndexes[0] !== undefined ? (
                            <div className="line-clamp-2 text-sm font-semibold leading-5 text-slate-950 dark:text-white">
                              {row[mobileSummaryIndexes[0]]}
                            </div>
                          ) : null}
                          {mobileSummaryIndexes.slice(1).filter((summaryIndex) => summaryIndex !== statusColumnIndex).map((summaryIndex) => (
                            <div key={summaryIndex} className="line-clamp-2 text-xs leading-5 text-slate-600 dark:text-slate-300">
                              <span className="font-medium text-slate-500 dark:text-slate-400">{columns[summaryIndex]}: </span>
                              {row[summaryIndex]}
                            </div>
                          ))}
                        </div>
                        {statusColumnIndex >= 0 && mobileSummaryIndexes.includes(statusColumnIndex) ? (
                          <div className="shrink-0">{row[statusColumnIndex]}</div>
                        ) : null}
                      </div>
                      <div className="mt-2 flex items-center justify-between gap-3 text-xs">
                        <span className="truncate text-slate-500 dark:text-slate-400">
                          {visibleDetailCount ? `${visibleDetailCount} more detail${visibleDetailCount === 1 ? '' : 's'}` : 'View record'}
                        </span>
                        <span className="font-semibold text-sky-700 dark:text-sky-300">Details</span>
                      </div>
                    </button>
                  </motion.li>
                )
              })}
            </motion.ul>
          ) : (
            <motion.div
              key="mobile-empty"
              {...listItemMotion}
              className="rounded-lg border border-slate-200 bg-white px-3 py-8 text-center text-sm text-slate-500 dark:border-white/10 dark:bg-slate-900 dark:text-slate-400"
            >
              {empty}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="hidden max-w-full overflow-x-auto sm:block">
        <table className="min-w-full divide-y divide-slate-200 text-left text-sm dark:divide-white/10">
          <thead>
            <tr>
              {columns.map((column) => <th key={column} className="whitespace-nowrap px-3 py-3 font-semibold text-slate-700 dark:text-slate-300">{column}</th>)}
            </tr>
            {hasFilters ? (
              <tr className="border-t border-slate-100 dark:border-white/10">
                {columns.map((column, index) => (
                  <th key={`${column}-filter`} className="px-3 pb-3 align-top">
                    {filterableColumns[index] ? (
                      <input
                        aria-label={`Filter ${column}`}
                        className="input min-w-32 py-2 text-sm font-normal"
                        placeholder={`Filter ${column}`}
                        value={filters[index] ?? ''}
                        onChange={(event) => {
                          setPage(1)
                          setFilters((current) => current.map((filter, filterIndex) => filterIndex === index ? event.target.value : filter))
                        }}
                      />
                    ) : null}
                  </th>
                ))}
              </tr>
            ) : null}
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-white/10">
            <AnimatePresence initial={false}>
              {visibleRows.length ? visibleRows.map((row, index) => (
                <motion.tr key={`${activePage}-${index}`} layout {...listItemMotion} className="transition-colors duration-150 ease-out hover:bg-slate-50 dark:hover:bg-white/5 motion-reduce:transition-none">
                  {row.map((cell, cellIndex) => <td key={cellIndex} className="max-w-[18rem] break-words px-3 py-3 align-top text-slate-700 transition-colors duration-150 ease-out dark:text-slate-300 motion-reduce:transition-none">{cell}</td>)}
                </motion.tr>
              )) : (
                <motion.tr key="empty" {...listItemMotion}>
                  <td className="px-3 py-8 text-center text-slate-500 dark:text-slate-400" colSpan={columns.length}>{empty}</td>
                </motion.tr>
              )}
            </AnimatePresence>
          </tbody>
        </table>
      </div>
      {pageSize && pageCount > 1 ? (
        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 px-2 py-2 text-xs text-slate-600 dark:border-white/10 dark:text-slate-400 sm:gap-3 sm:px-3 sm:py-3 sm:text-sm">
          <p>{filteredRows.length} rows | Page {activePage} of {pageCount}</p>
          <div className="flex gap-2">
            <button className="rounded-md border border-slate-200 px-2.5 py-1.5 font-medium text-slate-700 transition-colors duration-150 ease-out hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40 dark:border-white/10 dark:text-slate-300 dark:hover:bg-white/10 motion-reduce:transition-none sm:px-3 sm:py-2" type="button" disabled={activePage === 1} onClick={() => setPage((current) => Math.max(current - 1, 1))}>Previous</button>
            <button className="rounded-md border border-slate-200 px-2.5 py-1.5 font-medium text-slate-700 transition-colors duration-150 ease-out hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40 dark:border-white/10 dark:text-slate-300 dark:hover:bg-white/10 motion-reduce:transition-none sm:px-3 sm:py-2" type="button" disabled={activePage === pageCount} onClick={() => setPage((current) => Math.min(current + 1, pageCount))}>Next</button>
          </div>
        </div>
      ) : null}
      <AnimatedDialog
        isOpen={Boolean(selectedRow)}
        onClose={() => setSelectedRowIndex(null)}
        title={selectedTitle}
        size="lg"
      >
        {selectedRow ? (
          <dl className="grid gap-3">
            {selectedRow.map((cell, index) => (
              <div key={`${columns[index]}-${index}`} className="rounded-lg border border-slate-200 bg-slate-50 p-3 dark:border-white/10 dark:bg-slate-950">
                <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">{columns[index]}</dt>
                <dd className="mt-1 min-w-0 break-words text-sm text-slate-800 dark:text-slate-100">{cell}</dd>
              </div>
            ))}
          </dl>
        ) : null}
      </AnimatedDialog>
    </div>
  )
}
