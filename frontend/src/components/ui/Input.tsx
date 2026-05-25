import React from 'react';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  hint?: string;
  error?: string;
  leadingAddon?: string;
  trailingAddon?: string;
  className?: string;
}

export function Input({
  label,
  hint,
  error,
  leadingAddon,
  trailingAddon,
  className = '',
  id,
  ...rest
}: InputProps) {
  void className;
  const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

  const inputClasses = `block w-full min-w-0 flex-1 border-0 bg-white py-1.5 text-slate-950 ring-1 ring-inset placeholder:text-slate-400 focus:ring-2 focus:ring-inset dark:bg-slate-900 dark:text-slate-100 dark:placeholder:text-slate-500 sm:text-sm sm:leading-6 ${
    error
      ? 'ring-red-300 focus:ring-red-500 dark:ring-red-400/40 dark:focus:ring-red-400'
      : 'ring-slate-300 focus:ring-sky-700 dark:ring-slate-700 dark:focus:ring-sky-400'
  } ${leadingAddon ? 'rounded-none rounded-r-md' : trailingAddon ? 'rounded-none rounded-l-md' : 'rounded-md'} ${className}`;

  return (
    <div>
      {label && (
        <label
          htmlFor={inputId}
          className="block text-sm font-medium leading-6 text-slate-900 dark:text-slate-200"
        >
          {label}
        </label>
      )}
      <div className={`${label ? 'mt-2' : ''} flex rounded-md shadow-sm`}>
        {leadingAddon && (
          <span className="inline-flex items-center rounded-l-md border border-r-0 border-slate-300 bg-slate-50 px-3 text-slate-500 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-400 sm:text-sm">
            {leadingAddon}
          </span>
        )}
        <input id={inputId} className={inputClasses} {...rest} />
        {trailingAddon && (
          <span className="inline-flex items-center rounded-r-md border border-l-0 border-slate-300 bg-slate-50 px-3 text-slate-500 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-400 sm:text-sm">
            {trailingAddon}
          </span>
        )}
      </div>
      {hint && !error && (
        <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">{hint}</p>
      )}
      {error && (
        <p className="mt-2 text-sm text-red-600 dark:text-red-300">{error}</p>
      )}
    </div>
  );
}

export default Input;
