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
  return (
    <fieldset className={className}>
      {legend && (
        <legend className="text-sm font-semibold leading-6 text-gray-900">{legend}</legend>
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
                  className="h-4 w-4 border-gray-300 text-indigo-600 focus:ring-indigo-600 disabled:opacity-50"
                />
              </div>
              <label
                htmlFor={optId}
                className={`block text-sm font-medium leading-6 text-gray-900 ${
                  opt.disabled ? 'opacity-50' : 'cursor-pointer'
                }`}
              >
                {opt.label}
                {opt.description && (
                  <span className="block font-normal text-gray-500">
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
