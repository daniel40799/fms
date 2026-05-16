export function statusTone(value: string) {
  const status = value.toUpperCase()

  if (['CONFIRMED', 'ACTIVE', 'PUBLISHED'].some((item) => status.includes(item))) {
    return 'bg-emerald-50 text-emerald-700 ring-emerald-200'
  }

  if (['PENDING', 'DRAFT', 'PAYMENT_UPLOADED'].some((item) => status.includes(item))) {
    return 'bg-amber-50 text-amber-800 ring-amber-200'
  }

  if (['ARCHIVED', 'CANCELLED', 'DISABLED'].some((item) => status.includes(item))) {
    return 'bg-slate-100 text-slate-700 ring-slate-300'
  }

  if (['ERROR', 'REJECTED', 'FAILED'].some((item) => status.includes(item))) {
    return 'bg-red-50 text-red-700 ring-red-200'
  }

  return 'bg-sky-50 text-sky-700 ring-sky-200'
}

export function alertTone(value = 'INFORMATION') {
  const status = value.toUpperCase()
  if (['ERROR', 'REJECTED', 'FAILED'].some((item) => status.includes(item))) {
    return 'border-red-200 bg-red-50 text-red-800'
  }
  if (['CONFIRMED', 'ACTIVE', 'PUBLISHED'].some((item) => status.includes(item))) {
    return 'border-emerald-200 bg-emerald-50 text-emerald-800'
  }
  if (['PENDING', 'DRAFT', 'PAYMENT_UPLOADED'].some((item) => status.includes(item))) {
    return 'border-amber-200 bg-amber-50 text-amber-900'
  }
  return 'border-sky-200 bg-sky-50 text-sky-800'
}
