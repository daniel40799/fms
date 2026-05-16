import { useState } from 'react'
import { getErrorMessage } from '../lib/errors'

export function useAsyncAction<Args extends unknown[]>(action: (...args: Args) => Promise<void>) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function run(...args: Args) {
    setLoading(true)
    setError('')
    try {
      await action(...args)
    } catch (caught) {
      setError(getErrorMessage(caught))
    } finally {
      setLoading(false)
    }
  }

  return { loading, error, setError, run }
}
