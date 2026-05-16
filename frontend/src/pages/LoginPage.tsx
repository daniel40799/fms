import { api } from '../lib/api'
import { useAsyncAction } from '../hooks/useAsyncAction'
import { Button } from '../components/ui/Button'
import { Field } from '../components/ui/Field'
import { useState } from 'react'

export function LoginPage({ loading, notice, onLoggedIn }: { loading: boolean; notice: string; onLoggedIn: (token: string) => void }) {
  const [email, setEmail] = useState('daniel@fapor7.org')
  const [password, setPassword] = useState('')
  const login = useAsyncAction(async () => {
    const response = await api.auth.login(email, password)
    onLoggedIn(response.token)
  })

  return (
    <main className="grid min-h-screen bg-slate-50 lg:grid-cols-[1fr_520px]">
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
          className="w-full max-w-md rounded-lg border border-slate-200 bg-white p-6 shadow-sm transition-shadow duration-200 ease-out hover:shadow-md motion-reduce:transition-none"
          onSubmit={(event) => {
            event.preventDefault()
            void login.run()
          }}
        >
          <p className="text-sm font-semibold uppercase tracking-wide text-sky-700">FAPOR7</p>
          <h2 className="mt-2 text-2xl font-semibold text-slate-950">Sign in</h2>
          <p className="mt-2 text-sm text-slate-600">Use your email and password to access the event management workspace.</p>
          {(notice || login.error) && <div className="mt-4 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{login.error || notice}</div>}
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
        </form>
      </section>
    </main>
  )
}
