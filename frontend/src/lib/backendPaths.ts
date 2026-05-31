const backendBaseUrl = (import.meta.env.VITE_API_BASE_URL ?? '').trim().replace(/\/+$/, '')

const backendPathPrefixes = ['/api', '/uploads', '/oauth2', '/login/oauth2']

function hasUrlScheme(value: string) {
  return /^[a-z][a-z\d+\-.]*:/i.test(value)
}

function isBackendPath(value: string) {
  return backendPathPrefixes.some(
    (prefix) =>
      value === prefix ||
      value.startsWith(`${prefix}/`) ||
      value.startsWith(`${prefix}?`) ||
      value.startsWith(`${prefix}#`),
  )
}

export function backendUrl(path: string | null | undefined) {
  if (!path || hasUrlScheme(path) || !isBackendPath(path)) {
    return path ?? ''
  }

  if (!backendBaseUrl) {
    return path
  }

  return `${backendBaseUrl}/${path.replace(/^\/+/, '')}`
}
