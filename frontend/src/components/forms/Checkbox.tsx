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
          className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-600 disabled:opacity-50"
        />
      </div>
      {(label || description) && (
        <div className="ml-3 text-sm leading-6">
          {label && (
            <label
              htmlFor={inputId}
              className={`font-medium text-gray-900 ${disabled ? 'opacity-50' : ''}`}
            >
              {label}
            </label>
          )}
          {description && (
            <p id={descriptionId} className="text-gray-500">
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
  const toggle = (id: string) => {
    const next = values.includes(id)
      ? values.filter((v) => v !== id)
      : [...values, id];
    onChange?.(next);
  };

  return (
    <fieldset className={className}>
      {legend && (
        <legend className="text-sm font-semibold leading-6 text-gray-900">{legend}</legend>
      )}
      <div className="mt-2 divide-y divide-gray-200 border-b border-t border-gray-200">
        {options.map((opt) => (
          <div key={opt.id} className="relative flex items-start py-4">
            <div className="min-w-0 flex-1 text-sm leading-6">
              <label htmlFor={opt.id} className="font-medium text-gray-900">
                {opt.label}
              </label>
              {opt.description && (
                <p id={`${opt.id}-description`} className="text-gray-500">
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
                className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-600"
              />
            </div>
          </div>
        ))}
      </div>
    </fieldset>
  );
}

export default Checkbox;
