import React from 'react';

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  hint?: string;
  error?: string;
  className?: string;
}

export function Textarea({
  label,
  hint,
  error,
  className = '',
  id,
  rows = 4,
  ...rest
}: TextareaProps) {
  void className;
  const textareaId = id ?? (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

  return (
    <div>
      {label && (
        <label
          htmlFor={textareaId}
          className="block text-sm font-medium leading-6 text-slate-900 dark:text-slate-200"
        >
          {label}
        </label>
      )}
      <div className={label ? 'mt-2' : ''}>
        <textarea
          id={textareaId}
          rows={rows}
          className={`block w-full rounded-md border-0 bg-white py-1.5 text-slate-950 shadow-sm ring-1 ring-inset placeholder:text-slate-400 focus:ring-2 focus:ring-inset dark:bg-slate-900 dark:text-slate-100 dark:placeholder:text-slate-500 sm:text-sm sm:leading-6 ${
            error
              ? 'ring-red-300 focus:ring-red-500 dark:ring-red-400/40 dark:focus:ring-red-400'
              : 'ring-slate-300 focus:ring-sky-700 dark:ring-slate-700 dark:focus:ring-sky-400'
          } ${className}`}
          {...rest}
        />
      </div>
      {hint && !error && <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">{hint}</p>}
      {error && <p className="mt-2 text-sm text-red-600 dark:text-red-300">{error}</p>}
    </div>
  );
}

export default Textarea;
