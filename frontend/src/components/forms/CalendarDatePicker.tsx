import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

type CalendarDatePickerProps = {
  value: string
  onChange: (value: string) => void
  min?: string
  placeholder?: string
  disabled?: boolean
}

type CalendarView = 'days' | 'months' | 'years'

const weekdayLabels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const monthLabels = Array.from({ length: 12 }, (_, month) =>
  new Intl.DateTimeFormat(undefined, { month: 'long' }).format(new Date(2026, month, 1)),
)
const shortMonthLabels = Array.from({ length: 12 }, (_, month) =>
  new Intl.DateTimeFormat(undefined, { month: 'short' }).format(new Date(2026, month, 1)),
)
const displayFormatter = new Intl.DateTimeFormat(undefined, {
  month: 'short',
  day: 'numeric',
  year: 'numeric',
})
const motionDurationMs = 160

export function CalendarDatePicker({
  value,
  onChange,
  min,
  placeholder = 'Select date',
  disabled = false,
}: CalendarDatePickerProps) {
  const selectedDate = parseDate(value)
  const minDate = parseDate(min ?? '')
  const initialMonth = selectedDate ?? new Date()
  const [open, setOpen] = useState(false)
  const [closing, setClosing] = useState(false)
  const [view, setView] = useState<CalendarView>('days')
  const [visibleMonth, setVisibleMonth] = useState(() => startOfMonth(initialMonth))
  const [yearRangeStart, setYearRangeStart] = useState(() => getYearRangeStart(initialMonth.getFullYear()))
  const containerRef = useRef<HTMLDivElement>(null)
  const closeTimerRef = useRef<number | null>(null)

  const closePopover = useCallback(() => {
    if (!open) {
      return
    }

    setClosing(true)
    closeTimerRef.current = window.setTimeout(() => {
      setOpen(false)
      setClosing(false)
    }, motionDurationMs)
  }, [open])

  useEffect(() => {
    if (!open) {
      return
    }

    const handlePointerDown = (event: PointerEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) {
        closePopover()
      }
    }

    document.addEventListener('pointerdown', handlePointerDown)
    return () => document.removeEventListener('pointerdown', handlePointerDown)
  }, [closePopover, open])

  useEffect(() => {
    return () => {
      if (closeTimerRef.current) {
        window.clearTimeout(closeTimerRef.current)
      }
    }
  }, [])

  const calendarDays = useMemo(() => buildCalendarDays(visibleMonth), [visibleMonth])
  const yearOptions = useMemo(() => buildYearOptions(visibleMonth, minDate, yearRangeStart), [minDate, visibleMonth, yearRangeStart])
  const showPopover = open || closing
  const selectedLabel = selectedDate ? displayFormatter.format(selectedDate) : placeholder
  const visibleYear = visibleMonth.getFullYear()
  const visibleMonthIndex = visibleMonth.getMonth()

  const selectDate = (date: Date) => {
    if (minDate && isBefore(date, minDate)) {
      return
    }

    onChange(formatIsoDate(date))
    closePopover()
  }

  const openPopover = () => {
    if (selectedDate) {
      setVisibleMonth(startOfMonth(selectedDate))
      setYearRangeStart(getYearRangeStart(selectedDate.getFullYear()))
    } else {
      setYearRangeStart(getYearRangeStart(new Date().getFullYear()))
    }
    setView('days')
    setClosing(false)
    setOpen(true)
  }

  const togglePopover = () => {
    if (open) {
      closePopover()
      return
    }

    openPopover()
  }

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        disabled={disabled}
        onClick={togglePopover}
        className={`flex w-full items-center justify-between rounded-md bg-white px-3 py-2 text-left text-sm ring-1 ring-inset ring-slate-300 transition-colors duration-150 ease-out focus:outline-none focus:ring-2 focus:ring-inset focus:ring-teal-700 dark:bg-slate-900 dark:ring-slate-700 dark:focus:ring-teal-400 motion-reduce:transition-none ${
          disabled ? 'cursor-not-allowed opacity-50' : ''
        }`}
      >
        <span className={selectedDate ? 'text-slate-950 dark:text-slate-100' : 'text-slate-500 dark:text-slate-400'}>{selectedLabel}</span>
        <span aria-hidden="true" className="text-slate-400 dark:text-slate-500">
          Calendar
        </span>
      </button>

      {showPopover && (
        <div
          className={`calendar-popover absolute left-0 top-full z-50 mt-2 w-80 max-w-[calc(100vw-2rem)] rounded-lg border border-slate-200 bg-white p-3 text-slate-950 shadow-xl dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 ${
            closing ? 'motion-popover-out' : 'motion-popover-in'
          }`}
        >
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setVisibleMonth(addMonths(visibleMonth, -1))}
              className="rounded-md px-2 py-1 text-sm font-semibold text-slate-700 transition-colors duration-150 ease-out hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800 motion-reduce:transition-none"
              aria-label="Previous month"
            >
              &lt;
            </button>
            <div className="flex min-w-0 flex-1 justify-center gap-1">
              <button
                type="button"
                onClick={() => setView(view === 'months' ? 'days' : 'months')}
                className={`rounded-md px-2 py-1.5 text-sm font-semibold ${
                  view === 'months' ? 'bg-teal-50 text-teal-800 dark:bg-teal-400/10 dark:text-teal-200' : 'text-slate-950 hover:bg-slate-100 dark:text-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                {monthLabels[visibleMonthIndex]}
              </button>
              <button
                type="button"
                onClick={() => {
                  setYearRangeStart(getYearRangeStart(visibleYear))
                  setView(view === 'years' ? 'days' : 'years')
                }}
                className={`rounded-md px-2 py-1.5 text-sm font-semibold ${
                  view === 'years' ? 'bg-teal-50 text-teal-800 dark:bg-teal-400/10 dark:text-teal-200' : 'text-slate-950 hover:bg-slate-100 dark:text-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                {visibleYear}
              </button>
            </div>
            <button
              type="button"
              onClick={() => setVisibleMonth(addMonths(visibleMonth, 1))}
              className="rounded-md px-2 py-1 text-sm font-semibold text-slate-700 transition-colors duration-150 ease-out hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800 motion-reduce:transition-none"
              aria-label="Next month"
            >
              &gt;
            </button>
          </div>

          {view === 'days' && (
            <div className="mt-3 grid grid-cols-7 gap-1 text-center">
              {weekdayLabels.map((weekday) => (
                <div key={weekday} className="py-1 text-xs font-medium text-slate-500 dark:text-slate-400">
                  {weekday}
                </div>
              ))}
              {calendarDays.map((date) => {
                const inactive = date.getMonth() !== visibleMonth.getMonth()
                const selected = selectedDate ? isSameDay(date, selectedDate) : false
                const today = isSameDay(date, new Date())
                const blocked = minDate ? isBefore(date, minDate) : false

                return (
                  <button
                    key={formatIsoDate(date)}
                    type="button"
                    disabled={blocked}
                    onClick={() => selectDate(date)}
                    className={`aspect-square rounded-md text-sm font-medium transition ${
                      selected
                        ? 'bg-teal-700 text-white'
                        : today
                          ? 'bg-teal-50 text-teal-800 ring-1 ring-inset ring-teal-200 dark:bg-teal-400/10 dark:text-teal-200 dark:ring-teal-400/20'
                          : inactive
                            ? 'text-slate-300 hover:bg-slate-50 dark:text-slate-600 dark:hover:bg-slate-800'
                            : 'text-slate-800 hover:bg-slate-100 dark:text-slate-100 dark:hover:bg-slate-800'
                    } ${blocked ? 'cursor-not-allowed text-slate-300 hover:bg-transparent dark:text-slate-700 dark:hover:bg-transparent' : ''}`}
                  >
                    {date.getDate()}
                  </button>
                )
              })}
            </div>
          )}

          {view === 'months' && (
            <div className="motion-page-enter mt-3 grid grid-cols-3 gap-2">
              {shortMonthLabels.map((month, index) => {
                const monthDate = new Date(visibleYear, index, 1)
                const blocked = minDate ? isMonthBefore(monthDate, minDate) : false
                const selected = selectedDate?.getFullYear() === visibleYear && selectedDate.getMonth() === index

                return (
                  <button
                    key={month}
                    type="button"
                    disabled={blocked}
                    onClick={() => {
                      setVisibleMonth(monthDate)
                      setView('days')
                    }}
                    className={`rounded-md px-3 py-3 text-sm font-semibold ${
                      selected
                        ? 'bg-teal-700 text-white'
                        : 'bg-slate-50 text-slate-800 hover:bg-teal-50 hover:text-teal-800 dark:bg-slate-800 dark:text-slate-100 dark:hover:bg-teal-400/10 dark:hover:text-teal-200'
                    } ${blocked ? 'cursor-not-allowed bg-slate-50 text-slate-300 hover:bg-slate-50 hover:text-slate-300 dark:bg-slate-800 dark:text-slate-600 dark:hover:bg-slate-800 dark:hover:text-slate-600' : ''}`}
                  >
                    {month}
                  </button>
                )
              })}
            </div>
          )}

          {view === 'years' && (
            <div className="motion-page-enter mt-3">
              <div className="mb-2 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setYearRangeStart((current) => current - 12)}
                  className="rounded-md px-2 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800"
                >
                  Earlier
                </button>
                <p className="text-xs font-semibold uppercase text-slate-500 dark:text-slate-400">
                  {yearRangeStart} - {yearRangeStart + 11}
                </p>
                <button
                  type="button"
                  onClick={() => setYearRangeStart((current) => current + 12)}
                  className="rounded-md px-2 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800"
                >
                  Later
                </button>
              </div>
              <div className="max-h-52 overflow-y-auto pr-1">
                <div className="grid grid-cols-3 gap-2">
                  {yearOptions.map((year) => {
                    const blocked = minDate ? year < minDate.getFullYear() : false
                    const selected = selectedDate?.getFullYear() === year

                    return (
                      <button
                        key={year}
                        type="button"
                        disabled={blocked}
                        onClick={() => {
                          setVisibleMonth(new Date(year, visibleMonthIndex, 1))
                          setView('months')
                        }}
                        className={`rounded-md px-3 py-3 text-sm font-semibold ${
                          selected
                            ? 'bg-teal-700 text-white'
                            : 'bg-slate-50 text-slate-800 hover:bg-teal-50 hover:text-teal-800 dark:bg-slate-800 dark:text-slate-100 dark:hover:bg-teal-400/10 dark:hover:text-teal-200'
                        } ${blocked ? 'cursor-not-allowed bg-slate-50 text-slate-300 hover:bg-slate-50 hover:text-slate-300 dark:bg-slate-800 dark:text-slate-600 dark:hover:bg-slate-800 dark:hover:text-slate-600' : ''}`}
                      >
                        {year}
                      </button>
                    )
                  })}
                </div>
              </div>
            </div>
          )}

          <div className="mt-3 flex items-center justify-between border-t border-slate-200 pt-3 dark:border-slate-700">
            <button
              type="button"
              onClick={() => selectDate(new Date())}
              className="rounded-md px-2 py-1 text-sm font-medium text-teal-800 hover:bg-teal-50 dark:text-teal-200 dark:hover:bg-teal-400/10"
            >
              Today
            </button>
            <button
              type="button"
              onClick={() => {
                onChange('')
                closePopover()
              }}
              className="rounded-md px-2 py-1 text-sm font-medium text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
            >
              Clear
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

function buildCalendarDays(month: Date) {
  const firstDay = startOfMonth(month)
  const start = new Date(firstDay)
  start.setDate(firstDay.getDate() - firstDay.getDay())

  return Array.from({ length: 42 }, (_, index) => {
    const date = new Date(start)
    date.setDate(start.getDate() + index)
    return date
  })
}

function parseDate(value: string) {
  if (!value) {
    return null
  }

  const [year, month, day] = value.split('-').map(Number)
  if (!year || !month || !day) {
    return null
  }

  return new Date(year, month - 1, day)
}

function formatIsoDate(date: Date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function startOfMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), 1)
}

function addMonths(date: Date, months: number) {
  return new Date(date.getFullYear(), date.getMonth() + months, 1)
}

function buildYearOptions(visibleMonth: Date, minDate: Date | null, yearRangeStart: number) {
  const currentYear = new Date().getFullYear()
  const minimumYear = minDate?.getFullYear() ?? currentYear - 5
  const visibleYear = visibleMonth.getFullYear()
  const startYear = Math.min(minimumYear, visibleYear, yearRangeStart)
  const endYear = Math.max(yearRangeStart + 23, currentYear + 10, visibleYear + 2)

  return Array.from({ length: endYear - startYear + 1 }, (_, index) => startYear + index)
}

function getYearRangeStart(year: number) {
  return Math.floor(year / 12) * 12
}

function isSameDay(left: Date, right: Date) {
  return formatIsoDate(left) === formatIsoDate(right)
}

function isBefore(left: Date, right: Date) {
  return formatIsoDate(left) < formatIsoDate(right)
}

function isMonthBefore(left: Date, right: Date) {
  return left.getFullYear() < right.getFullYear()
    || (left.getFullYear() === right.getFullYear() && left.getMonth() < right.getMonth())
}
