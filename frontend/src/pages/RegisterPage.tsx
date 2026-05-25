import { useEffect, useState } from 'react'
import { Button, Field, InlineError, Select } from '../components/ui'
import { useAsyncAction } from '../hooks/useAsyncAction'
import { api } from '../lib/api'
import { getErrorMessage } from '../lib/errors'
import type { Organization } from '../types'

export function RegisterPage({ onBackToLogin, onRegistered }: { onBackToLogin: () => void; onRegistered: () => void }) {
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [organizationId, setOrganizationId] = useState('')
  const [organizations, setOrganizations] = useState<Organization[]>([])
  const [loadingOrganizations, setLoadingOrganizations] = useState(true)
  const [organizationError, setOrganizationError] = useState('')

  useEffect(() => {
    let active = true

    async function loadOrganizations() {
      setLoadingOrganizations(true)
      setOrganizationError('')
      try {
        const response = await api.organizations.list()
        if (active) setOrganizations(response)
      } catch (error) {
        if (active) setOrganizationError(getErrorMessage(error))
      } finally {
        if (active) setLoadingOrganizations(false)
      }
    }

    void loadOrganizations()

    return () => {
      active = false
    }
  }, [])

  const register = useAsyncAction(async () => {
    await api.auth.register({
      fullName,
      email,
      password,
      organizationId: organizationId || null,
    })
    onRegistered()
  })

  return (
    <main className="grid min-h-screen bg-slate-50 text-slate-950 dark:bg-slate-950 dark:text-slate-100 lg:grid-cols-[1fr_520px]">
      <section className="hidden bg-slate-950 px-12 py-10 text-white lg:flex lg:flex-col lg:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-sky-300">FAPOR7 Phase 1</p>
          <h1 className="mt-4 max-w-2xl text-5xl font-semibold leading-tight">
            Create an event participant account for registration, payment upload, and QR attendance.
          </h1>
        </div>
        <div className="grid grid-cols-2 gap-4 text-sm text-slate-300">
          {['Self-registration', 'Organization affiliation', 'Payment proof upload', 'QR event check-in'].map((item) => (
            <div key={item} className="rounded-lg border border-white/10 bg-white/5 p-4 transition-all duration-200 ease-out hover:border-white/20 hover:bg-white/10 motion-reduce:transition-none">{item}</div>
          ))}
        </div>
      </section>
      <section className="flex items-center justify-center px-4 py-10">
        <form
          className="w-full max-w-md rounded-lg border border-slate-200 bg-white p-6 shadow-sm transition-shadow duration-200 ease-out hover:shadow-md dark:border-slate-800 dark:bg-slate-900 motion-reduce:transition-none"
          onSubmit={(event) => {
            event.preventDefault()
            void register.run()
          }}
        >
          <p className="text-sm font-semibold uppercase tracking-wide text-sky-700">FAPOR7</p>
          <h2 className="mt-2 text-2xl font-semibold text-slate-950 dark:text-white">Create an account</h2>
          <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">Register as an end user to join events and manage your submissions.</p>
          {(register.error || organizationError) && <InlineError message={register.error || organizationError} />}
          <div className="mt-6 space-y-4">
            <Field label="Full name">
              <input className="input" value={fullName} onChange={(event) => setFullName(event.target.value)} required />
            </Field>
            <Field label="Email">
              <input className="input" value={email} onChange={(event) => setEmail(event.target.value)} type="email" required />
            </Field>
            <Field label="Password">
              <input className="input" value={password} onChange={(event) => setPassword(event.target.value)} type="password" required />
            </Field>
            <Field label="Organization">
              <Select
                value={organizationId}
                onChange={(event) => setOrganizationId(event.target.value)}
                disabled={loadingOrganizations || organizations.length === 0}
                required
              >
                <option value="">{loadingOrganizations ? 'Loading organizations...' : 'Select organization'}</option>
                {organizations.map((organization) => (
                  <option key={organization.id} value={organization.id}>
                    {organization.name}
                  </option>
                ))}
              </Select>
            </Field>
          </div>
          <Button className="mt-6 w-full justify-center" loading={register.loading || loadingOrganizations}>
            {register.loading ? 'Creating account...' : 'Create account'}
          </Button>
          <button
            type="button"
            className="mt-4 w-full rounded-md px-3 py-2 text-sm font-semibold text-sky-700 transition-colors duration-150 ease-out hover:bg-sky-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-700 dark:text-sky-300 dark:hover:bg-sky-400/10 dark:focus-visible:outline-sky-400 motion-reduce:transition-none"
            onClick={onBackToLogin}
          >
            Back to sign in
          </button>
        </form>
      </section>
    </main>
  )
}
