import { useState } from 'react';
import { Button, Field } from '../components/ui';
import { useAsyncAction } from '../hooks/useAsyncAction';
import { api } from '../lib/api';

export function LoginPage({
  loading,
  notice,
  noticeTone = 'INFORMATION',
  onCreateAccount,
  onLoggedIn,
}: {
  loading: boolean
  notice: string
  noticeTone?: string
  onCreateAccount: () => void
  onLoggedIn: (token: string) => void
}) {
  const [email, setEmail] = useState('daniel@fapor7.org')
  const [password, setPassword] = useState('')
  const login = useAsyncAction(async () => {
    const response = await api.auth.login(email, password)
    onLoggedIn(response.token)
  })

  return (
    <main className="grid min-h-screen bg-slate-50 text-slate-950 dark:bg-slate-950 dark:text-slate-100 lg:grid-cols-[1fr_520px]">
      <section className="hidden bg-slate-950 px-12 py-10 text-white lg:flex lg:flex-col lg:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-sky-300">FAPOR7 Phase 1</p>
          <h1 className="mt-4 max-w-2xl text-5xl font-semibold leading-tight">
            Integrated event operations for registration, payment review, QR attendance, and administration.
          </h1>
        </div>
        <div className="grid grid-cols-2 gap-4 text-sm text-slate-300">
          {['Role-based access', 'Event lifecycle', 'Manual payment validation', 'QR check-in logs'].map((item) => (
            <div key={item} className="rounded-lg border border-white/10 bg-white/5 p-4 transition-all duration-200 ease-out hover:border-white/20 hover:bg-white/10 motion-reduce:transition-none">{item}</div>
          ))}
        </div>
      </section>
      <section className="flex items-center justify-center px-4 py-10">
        <form
          className="w-full max-w-md rounded-lg border border-slate-200 bg-white p-6 shadow-sm transition-shadow duration-200 ease-out hover:shadow-md dark:border-slate-800 dark:bg-slate-900 motion-reduce:transition-none"
          onSubmit={(event) => {
            event.preventDefault()
            void login.run()
          }}
        >
          <p className="text-sm font-semibold uppercase tracking-wide text-sky-700">FAPOR7</p>
          <h2 className="mt-2 text-2xl font-semibold text-slate-950 dark:text-white">Sign in</h2>
          <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">Use your email and password to access the event management workspace.</p>
          {(notice || login.error) && (
            <div className={`mt-4 rounded-md px-3 py-2 text-sm ${login.error || noticeTone === 'ERROR' ? 'bg-red-50 text-red-700 dark:bg-red-400/10 dark:text-red-200' : 'bg-emerald-50 text-emerald-700 dark:bg-emerald-400/10 dark:text-emerald-200'}`}>
              {login.error || notice}
            </div>
          )}
          <div className="mt-6 space-y-4">
            <Field label="Email">
              <input className="input" value={email} onChange={(event) => setEmail(event.target.value)} type="email" required />
            </Field>
            <Field label="Password">
              <input className="input" value={password} onChange={(event) => setPassword(event.target.value)} type="password" required />
            </Field>
          </div>
          <Button className="mt-6 w-full justify-center" loading={loading || login.loading}>
            {login.loading ? 'Signing in...' : 'Sign in'}
          </Button>
          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            <Button type="button" variant="secondary" onClick={() => window.location.assign('/oauth2/authorization/entra')}>
              Microsoft
            </Button>
            <Button type="button" variant="secondary" onClick={() => window.location.assign('/oauth2/authorization/google')}>
              Google
            </Button>
          </div>
          <button
            type="button"
            className="mt-4 w-full rounded-md px-3 py-2 text-sm font-semibold text-sky-700 transition-colors duration-150 ease-out hover:bg-sky-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-700 dark:text-sky-300 dark:hover:bg-sky-400/10 dark:focus-visible:outline-sky-400 motion-reduce:transition-none"
            onClick={onCreateAccount}
          >
            Create an account
          </button>
        </form>
      </section>
    </main>
  )
}
