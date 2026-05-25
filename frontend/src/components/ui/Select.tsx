import type { SelectHTMLAttributes } from 'react'

export interface SelectOption {
  value: string
  label: string
}

export interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string
  hint?: string
  error?: string
  options?: SelectOption[]
  placeholder?: string
}

export function Select({
  label,
  hint,
  error,
  options,
  placeholder,
  className = '',
  id,
  children,
  ...rest
}: SelectProps) {
  void className;
  const selectId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined)

  return (
    <div>
      {label && (
        <label htmlFor={selectId} className="block text-sm font-medium text-slate-800 dark:text-slate-200">
          {label}
        </label>
      )}
      <div className={`${label ? 'mt-1' : ''} relative`}>
        <select
          id={selectId}
          className={`block w-full appearance-none rounded-md border-0 bg-white py-2 pl-3 pr-10 text-sm text-slate-950 shadow-sm ring-1 ring-inset transition-all duration-200 ease-out hover:ring-slate-400 focus:ring-2 focus:ring-inset disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-500 dark:bg-slate-900 dark:text-slate-100 dark:hover:ring-slate-500 dark:disabled:bg-slate-950 dark:disabled:text-slate-500 motion-reduce:transition-none ${
            error ? 'ring-red-300 focus:ring-red-600 dark:ring-red-400/40 dark:focus:ring-red-400' : 'ring-slate-300 focus:ring-sky-700 dark:ring-slate-700 dark:focus:ring-sky-400'
          } ${className}`}
          {...rest}
        >
          {placeholder && (
            <option value="" disabled>
              {placeholder}
            </option>
          )}
          {options?.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
          {children}
        </select>
        <svg
          aria-hidden
          viewBox="0 0 20 20"
          className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500 dark:text-slate-400"
        >
          <path fill="currentColor" d="M5.23 7.21a.75.75 0 0 1 1.06.02L10 11.17l3.71-3.94a.75.75 0 1 1 1.08 1.04l-4.25 4.5a.75.75 0 0 1-1.08 0l-4.25-4.5a.75.75 0 0 1 .02-1.06Z" />
        </svg>
      </div>
      {hint && !error && <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">{hint}</p>}
      {error && <p className="mt-2 text-sm text-red-600 dark:text-red-300">{error}</p>}
    </div>
  )
}

export default Select
