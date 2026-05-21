import { AnimatePresence, motion } from 'framer-motion'
import { isValidElement, useMemo, useState, type ReactNode } from 'react'
import { listItemMotion } from '../../lib/motion'

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
  const hasFilters = columns.some((_, index) => filterableColumns[index])
  const filteredRows = useMemo(() => rows.filter((row) => filters.every((filter, index) => {
    if (!filterableColumns[index] || !filter.trim()) return true
    return cellText(row[index]).toLocaleLowerCase().includes(filter.trim().toLocaleLowerCase())
  })), [filterableColumns, filters, rows])
  const effectivePageSize = pageSize && pageSize > 0 ? pageSize : Math.max(filteredRows.length, 1)
  const pageCount = Math.max(Math.ceil(filteredRows.length / effectivePageSize), 1)
  const activePage = Math.min(page, pageCount)
  const visibleRows = filteredRows.slice((activePage - 1) * effectivePageSize, activePage * effectivePageSize)

  return (
    <div>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
          <thead>
            <tr>
              {columns.map((column) => <th key={column} className="whitespace-nowrap px-3 py-3 font-semibold text-slate-700">{column}</th>)}
            </tr>
            {hasFilters ? (
              <tr className="border-t border-slate-100">
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
          <tbody className="divide-y divide-slate-100">
            <AnimatePresence initial={false}>
              {visibleRows.length ? visibleRows.map((row, index) => (
                <motion.tr key={`${activePage}-${index}`} layout {...listItemMotion} className="transition-colors duration-150 ease-out hover:bg-slate-50 motion-reduce:transition-none">
                  {row.map((cell, cellIndex) => <td key={cellIndex} className="px-3 py-3 align-top text-slate-700 transition-colors duration-150 ease-out motion-reduce:transition-none">{cell}</td>)}
                </motion.tr>
              )) : (
                <motion.tr key="empty" {...listItemMotion}>
                  <td className="px-3 py-8 text-center text-slate-500" colSpan={columns.length}>{empty}</td>
                </motion.tr>
              )}
            </AnimatePresence>
          </tbody>
        </table>
      </div>
      {pageSize && pageCount > 1 ? (
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 px-3 py-3 text-sm text-slate-600">
          <p>{filteredRows.length} rows | Page {activePage} of {pageCount}</p>
          <div className="flex gap-2">
            <button className="rounded-md border border-slate-200 px-3 py-2 font-medium text-slate-700 disabled:cursor-not-allowed disabled:opacity-40" type="button" disabled={activePage === 1} onClick={() => setPage((current) => Math.max(current - 1, 1))}>Previous</button>
            <button className="rounded-md border border-slate-200 px-3 py-2 font-medium text-slate-700 disabled:cursor-not-allowed disabled:opacity-40" type="button" disabled={activePage === pageCount} onClick={() => setPage((current) => Math.min(current + 1, pageCount))}>Next</button>
          </div>
        </div>
      ) : null}
    </div>
  )
}
