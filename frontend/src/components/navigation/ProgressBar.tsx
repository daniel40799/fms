export interface ProgressBarProps {
  value: number;
  max?: number;
  label?: string;
  showPercentage?: boolean;
  color?: 'indigo' | 'green' | 'yellow' | 'red' | 'blue';
  size?: 'xs' | 'sm' | 'md';
  className?: string;
}

const colorClasses: Record<string, string> = {
  indigo: 'bg-indigo-600',
  green: 'bg-green-500',
  yellow: 'bg-yellow-400',
  red: 'bg-red-500',
  blue: 'bg-blue-500',
};

const sizeClasses: Record<string, string> = {
  xs: 'h-1',
  sm: 'h-2',
  md: 'h-4',
};

export function ProgressBar({
  value,
  max = 100,
  label,
  showPercentage = false,
  color = 'indigo',
  size = 'sm',
  className = '',
}: ProgressBarProps) {
  const percentage = Math.min(100, Math.max(0, (value / max) * 100));

  return (
    <div className={className}>
      {(label || showPercentage) && (
        <div className="mb-2 flex items-center justify-between">
          {label && <span className="text-sm font-medium text-gray-900">{label}</span>}
          {showPercentage && (
            <span className="text-sm font-medium text-gray-500">{Math.round(percentage)}%</span>
          )}
        </div>
      )}
      <div
        className={`overflow-hidden rounded-full bg-gray-200 ${sizeClasses[size]}`}
        role="progressbar"
        aria-valuenow={value}
        aria-valuemin={0}
        aria-valuemax={max}
      >
        <div
          className={`${sizeClasses[size]} rounded-full ${colorClasses[color]} transition-all duration-300`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}

export interface StepProgressBarProps {
  steps: string[];
  currentStep: number;
  className?: string;
}

const stepGridCols: Record<number, string> = {
  1: 'grid-cols-1',
  2: 'grid-cols-2',
  3: 'grid-cols-3',
  4: 'grid-cols-4',
  5: 'grid-cols-5',
  6: 'grid-cols-6',
};

export function StepProgressBar({ steps, currentStep, className = '' }: StepProgressBarProps) {
  const gridColsClass = stepGridCols[steps.length] ?? 'grid-cols-4';
  return (
    <div className={className}>
      <div className="overflow-hidden rounded-full bg-gray-200 h-2">
        <div
          className="h-2 rounded-full bg-indigo-600 transition-all duration-500"
          style={{ width: `${((currentStep) / steps.length) * 100}%` }}
        />
      </div>
      {steps.length > 0 && (
        <div className={`mt-6 hidden ${gridColsClass} text-sm font-medium text-gray-600 sm:grid`}>
          {steps.map((step, i) => (
            <div
              key={step}
              className={`${i === 0 ? '' : i === steps.length - 1 ? 'text-right' : 'text-center'} ${
                i < currentStep ? 'text-indigo-600' : ''
              }`}
            >
              {step}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default ProgressBar;
