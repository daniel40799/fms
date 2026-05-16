'use client';

import { useState } from 'react';
import { Switch } from '@headlessui/react';

export interface ToggleProps {
  label?: string;
  description?: string;
  checked?: boolean;
  defaultChecked?: boolean;
  onChange?: (checked: boolean) => void;
  disabled?: boolean;
  size?: 'sm' | 'md';
  className?: string;
}

export function Toggle({
  label,
  description,
  checked,
  defaultChecked = false,
  onChange,
  disabled = false,
  size = 'md',
  className = '',
}: ToggleProps) {
  const [internalEnabled, setInternalEnabled] = useState(defaultChecked);
  const isControlled = checked !== undefined;
  const enabled = isControlled ? checked : internalEnabled;

  const handleChange = (val: boolean) => {
    if (!isControlled) setInternalEnabled(val);
    onChange?.(val);
  };

  const switchSizeClasses = size === 'sm' ? 'h-5 w-9' : 'h-6 w-11';
  const thumbSizeClasses =
    size === 'sm'
      ? 'h-4 w-4 group-data-[checked]:translate-x-4'
      : 'h-5 w-5 group-data-[checked]:translate-x-5';

  if (!label && !description) {
    return (
      <Switch
        checked={enabled}
        onChange={handleChange}
        disabled={disabled}
        className={`group relative inline-flex flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent bg-gray-200 transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:ring-offset-2 data-[checked]:bg-indigo-600 disabled:opacity-50 ${switchSizeClasses} ${className}`}
      >
        <span className="sr-only">Toggle</span>
        <span
          aria-hidden="true"
          className={`pointer-events-none inline-block transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${thumbSizeClasses}`}
        />
      </Switch>
    );
  }

  return (
    <div className={`flex items-center justify-between ${className}`}>
      {(label || description) && (
        <span className="flex flex-grow flex-col">
          {label && (
            <span className="text-sm font-medium leading-6 text-gray-900">{label}</span>
          )}
          {description && (
            <span className="text-sm text-gray-500">{description}</span>
          )}
        </span>
      )}
      <Switch
        checked={enabled}
        onChange={handleChange}
        disabled={disabled}
        className={`group relative inline-flex flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent bg-gray-200 transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:ring-offset-2 data-[checked]:bg-indigo-600 disabled:opacity-50 ${switchSizeClasses}`}
      >
        <span className="sr-only">{label ?? 'Toggle'}</span>
        <span
          aria-hidden="true"
          className={`pointer-events-none inline-block transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${thumbSizeClasses}`}
        />
      </Switch>
    </div>
  );
}

export default Toggle;
