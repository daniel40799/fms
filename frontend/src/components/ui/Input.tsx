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
  const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

  const inputClasses = `block w-full min-w-0 flex-1 border-0 py-1.5 text-gray-900 ring-1 ring-inset placeholder:text-gray-400 focus:ring-2 focus:ring-inset sm:text-sm sm:leading-6 ${
    error
      ? 'ring-red-300 focus:ring-red-500'
      : 'ring-gray-300 focus:ring-indigo-600'
  } ${leadingAddon ? 'rounded-none rounded-r-md' : trailingAddon ? 'rounded-none rounded-l-md' : 'rounded-md'} ${className}`;

  return (
    <div>
      {label && (
        <label
          htmlFor={inputId}
          className="block text-sm font-medium leading-6 text-gray-900"
        >
          {label}
        </label>
      )}
      <div className={`${label ? 'mt-2' : ''} flex rounded-md shadow-sm`}>
        {leadingAddon && (
          <span className="inline-flex items-center rounded-l-md border border-r-0 border-gray-300 px-3 text-gray-500 sm:text-sm">
            {leadingAddon}
          </span>
        )}
        <input id={inputId} className={inputClasses} {...rest} />
        {trailingAddon && (
          <span className="inline-flex items-center rounded-r-md border border-l-0 border-gray-300 px-3 text-gray-500 sm:text-sm">
            {trailingAddon}
          </span>
        )}
      </div>
      {hint && !error && (
        <p className="mt-2 text-sm text-gray-500">{hint}</p>
      )}
      {error && (
        <p className="mt-2 text-sm text-red-600">{error}</p>
      )}
    </div>
  );
}

export default Input;
