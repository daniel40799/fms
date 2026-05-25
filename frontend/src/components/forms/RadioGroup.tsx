export interface RadioOption {
  value: string;
  label: string;
  description?: string;
  disabled?: boolean;
}

export interface RadioGroupProps {
  name: string;
  legend?: string;
  options: RadioOption[];
  value?: string;
  defaultValue?: string;
  onChange?: (value: string) => void;
  orientation?: 'vertical' | 'horizontal';
  className?: string;
}

export function RadioGroup({
  name,
  legend,
  options,
  value,
  defaultValue,
  onChange,
  orientation = 'vertical',
  className = '',
}: RadioGroupProps) {
  void className;
  return (
    <fieldset className={className}>
      {legend && (
        <legend className="text-sm font-semibold leading-6 text-slate-900 dark:text-slate-100">{legend}</legend>
      )}
      <div
        className={`mt-2 ${
          orientation === 'horizontal' ? 'flex flex-wrap gap-4' : 'space-y-3'
        }`}
      >
        {options.map((opt) => {
          const optId = `${name}-${opt.value}`;
          const isChecked = value !== undefined ? value === opt.value : undefined;

          return (
            <div key={opt.value} className="flex items-start gap-x-3">
              <div className="flex h-6 items-center">
                <input
                  id={optId}
                  name={name}
                  type="radio"
                  value={opt.value}
                  checked={isChecked}
                  defaultChecked={
                    isChecked === undefined ? defaultValue === opt.value : undefined
                  }
                  disabled={opt.disabled}
                  onChange={() => onChange?.(opt.value)}
                  className="h-4 w-4 border-slate-300 text-sky-700 focus:ring-sky-700 disabled:opacity-50 dark:border-slate-600 dark:bg-slate-900 dark:focus:ring-sky-400"
                />
              </div>
              <label
                htmlFor={optId}
                className={`block text-sm font-medium leading-6 text-slate-900 dark:text-slate-100 ${
                  opt.disabled ? 'opacity-50' : 'cursor-pointer'
                }`}
              >
                {opt.label}
                {opt.description && (
                  <span className="block font-normal text-slate-500 dark:text-slate-400">
                    {opt.description}
                  </span>
                )}
              </label>
            </div>
          );
        })}
      </div>
    </fieldset>
  );
}

export default RadioGroup;
