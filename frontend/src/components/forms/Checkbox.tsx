export interface CheckboxOption {
  id: string;
  label: string;
  description?: string;
}

export interface CheckboxProps {
  id?: string;
  label?: string;
  description?: string;
  checked?: boolean;
  defaultChecked?: boolean;
  onChange?: (checked: boolean) => void;
  disabled?: boolean;
  className?: string;
}

export function Checkbox({
  id,
  label,
  description,
  checked,
  defaultChecked,
  onChange,
  disabled = false,
  className = '',
}: CheckboxProps) {
  void className;
  const inputId = id ?? (label ? label.toLowerCase().replace(/\s+/g, '-') : 'checkbox');
  const descriptionId = description ? `${inputId}-description` : undefined;

  return (
    <div className={`relative flex items-start ${className}`}>
      <div className="flex h-6 items-center">
        <input
          id={inputId}
          type="checkbox"
          checked={checked}
          defaultChecked={defaultChecked}
          disabled={disabled}
          aria-describedby={descriptionId}
          onChange={(e) => onChange?.(e.target.checked)}
          className="h-4 w-4 rounded border-slate-300 text-sky-700 focus:ring-sky-700 disabled:opacity-50 dark:border-slate-600 dark:bg-slate-900 dark:focus:ring-sky-400"
        />
      </div>
      {(label || description) && (
        <div className="ml-3 text-sm leading-6">
          {label && (
            <label
              htmlFor={inputId}
              className={`font-medium text-slate-900 dark:text-slate-100 ${disabled ? 'opacity-50' : ''}`}
            >
              {label}
            </label>
          )}
          {description && (
            <p id={descriptionId} className="text-slate-500 dark:text-slate-400">
              {description}
            </p>
          )}
        </div>
      )}
    </div>
  );
}

export interface CheckboxGroupProps {
  legend?: string;
  options: CheckboxOption[];
  values?: string[];
  onChange?: (values: string[]) => void;
  className?: string;
}

export function CheckboxGroup({
  legend,
  options,
  values = [],
  onChange,
  className = '',
}: CheckboxGroupProps) {
  void className;
  const toggle = (id: string) => {
    const next = values.includes(id)
      ? values.filter((v) => v !== id)
      : [...values, id];
    onChange?.(next);
  };

  return (
    <fieldset className={className}>
      {legend && (
        <legend className="text-sm font-semibold leading-6 text-slate-900 dark:text-slate-100">{legend}</legend>
      )}
      <div className="mt-2 divide-y divide-slate-200 border-b border-t border-slate-200 dark:divide-slate-800 dark:border-slate-800">
        {options.map((opt) => (
          <div key={opt.id} className="relative flex items-start py-4">
            <div className="min-w-0 flex-1 text-sm leading-6">
              <label htmlFor={opt.id} className="font-medium text-slate-900 dark:text-slate-100">
                {opt.label}
              </label>
              {opt.description && (
                <p id={`${opt.id}-description`} className="text-slate-500 dark:text-slate-400">
                  {opt.description}
                </p>
              )}
            </div>
            <div className="ml-3 flex h-6 items-center">
              <input
                id={opt.id}
                type="checkbox"
                checked={values.includes(opt.id)}
                onChange={() => toggle(opt.id)}
                aria-describedby={opt.description ? `${opt.id}-description` : undefined}
                className="h-4 w-4 rounded border-slate-300 text-sky-700 focus:ring-sky-700 dark:border-slate-600 dark:bg-slate-900 dark:focus:ring-sky-400"
              />
            </div>
          </div>
        ))}
      </div>
    </fieldset>
  );
}

export default Checkbox;
