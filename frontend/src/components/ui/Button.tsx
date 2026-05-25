import type { ButtonHTMLAttributes, ReactNode } from 'react'

export type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'ghost'

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  loading?: boolean
  leftIcon?: ReactNode
  rightIcon?: ReactNode
}

export function Button({
  children,
  variant = 'primary',
  className = '',
  disabled,
  loading = false,
  leftIcon,
  rightIcon,
  ...props
}: ButtonProps) {
  void className;
  const styles: Record<ButtonVariant, string> = {
    primary: 'bg-sky-700 text-white shadow-sm hover:bg-sky-800 hover:shadow-md focus-visible:outline-sky-700 dark:bg-sky-600 dark:hover:bg-sky-500 dark:focus-visible:outline-sky-400',
    secondary: 'border border-slate-300 bg-white text-slate-800 shadow-sm hover:border-slate-400 hover:bg-slate-50 hover:shadow-md focus-visible:outline-sky-700 dark:border-white/10 dark:bg-slate-900 dark:text-slate-100 dark:hover:border-white/20 dark:hover:bg-white/10 dark:focus-visible:outline-sky-400',
    danger: 'bg-red-600 text-white shadow-sm hover:bg-red-700 hover:shadow-md focus-visible:outline-red-600 dark:bg-red-500 dark:hover:bg-red-400 dark:focus-visible:outline-red-400',
    ghost: 'text-slate-700 hover:bg-slate-100 focus-visible:outline-slate-600 dark:text-slate-200 dark:hover:bg-white/10 dark:focus-visible:outline-slate-300',
  }

  return (
    <button
      type="submit"
      {...props}
      disabled={disabled || loading}
      className={`inline-flex min-h-9 items-center justify-center gap-2 rounded-md px-3 py-2 text-sm font-semibold transition-all duration-200 ease-out hover:scale-[1.02] active:scale-[0.98] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:scale-100 disabled:hover:shadow-sm motion-reduce:transition-none motion-reduce:hover:scale-100 motion-reduce:active:scale-100 ${styles[variant]} ${className}`}
    >
      {loading && <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-r-transparent motion-reduce:animate-none" aria-hidden />}
      {!loading && leftIcon}
      {children}
      {!loading && rightIcon}
    </button>
  )
}

export default Button
