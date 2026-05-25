export function statusTone(value: string) {
  const status = value.toUpperCase()

  if (['CONFIRMED', 'ACTIVE', 'PUBLISHED'].some((item) => status.includes(item))) {
    return 'bg-emerald-50 text-emerald-700 ring-emerald-200 dark:bg-emerald-400/10 dark:text-emerald-200 dark:ring-emerald-400/20'
  }

  if (['PENDING', 'DRAFT', 'PAYMENT_UPLOADED'].some((item) => status.includes(item))) {
    return 'bg-amber-50 text-amber-800 ring-amber-200 dark:bg-amber-400/10 dark:text-amber-200 dark:ring-amber-400/20'
  }

  if (['ARCHIVED', 'CANCELLED', 'DISABLED'].some((item) => status.includes(item))) {
    return 'bg-slate-100 text-slate-700 ring-slate-300 dark:bg-slate-800 dark:text-slate-300 dark:ring-white/10'
  }

  if (['ERROR', 'REJECTED', 'FAILED'].some((item) => status.includes(item))) {
    return 'bg-red-50 text-red-700 ring-red-200 dark:bg-red-400/10 dark:text-red-200 dark:ring-red-400/20'
  }

  return 'bg-sky-50 text-sky-700 ring-sky-200 dark:bg-sky-400/10 dark:text-sky-200 dark:ring-sky-400/20'
}

export function alertTone(value = 'INFORMATION') {
  const status = value.toUpperCase()
  if (['ERROR', 'REJECTED', 'FAILED'].some((item) => status.includes(item))) {
    return 'border-red-200 bg-red-50 text-red-800 dark:border-red-400/20 dark:bg-red-400/10 dark:text-red-200'
  }
  if (['CONFIRMED', 'ACTIVE', 'PUBLISHED'].some((item) => status.includes(item))) {
    return 'border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-400/20 dark:bg-emerald-400/10 dark:text-emerald-200'
  }
  if (['PENDING', 'DRAFT', 'PAYMENT_UPLOADED'].some((item) => status.includes(item))) {
    return 'border-amber-200 bg-amber-50 text-amber-900 dark:border-amber-400/20 dark:bg-amber-400/10 dark:text-amber-200'
  }
  return 'border-sky-200 bg-sky-50 text-sky-800 dark:border-sky-400/20 dark:bg-sky-400/10 dark:text-sky-200'
}
