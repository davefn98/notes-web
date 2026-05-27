import { useState } from 'react'
import { useAuthStore } from '../store/authStore'

export function AuthPage() {
  const [mode, setMode] = useState<'login' | 'register'>('login')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const loading = useAuthStore((state) => state.loading)
  const error = useAuthStore((state) => state.error)
  const login = useAuthStore((state) => state.login)
  const register = useAuthStore((state) => state.register)
  const clearError = useAuthStore((state) => state.clearError)

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (mode === 'login') await login({ username, password })
    else await register({ name, username, password, email: email.trim() })
  }

  return (
    <main className="grid min-h-screen bg-slate-950 p-4 text-white lg:grid-cols-[1fr_480px] lg:p-8">
      <section className="hidden flex-col justify-between rounded-[2rem] border border-white/10 bg-[radial-gradient(circle_at_top_left,#2563eb,transparent_32%),linear-gradient(135deg,#0f172a,#111827)] p-10 lg:flex">
        <div>
          <p className="text-sm font-bold uppercase tracking-[0.35em] text-blue-200">Notas</p>
          <h1 className="mt-6 max-w-2xl text-6xl font-black leading-none tracking-tight">Notas privadas, rápidas y listas para pantalla compartida.</h1>
        </div>
        <p className="max-w-lg text-lg leading-8 text-slate-300">Organiza grupos, prioridades y fechas límite con una interfaz tipo escritorio que también funciona en móvil.</p>
      </section>

      <section className="mx-auto flex w-full max-w-md items-center">
        <form onSubmit={handleSubmit} className="w-full rounded-[2rem] border border-white/10 bg-white p-6 text-slate-950 shadow-2xl md:p-8">
          <div className="mb-8">
            <p className="text-xs font-bold uppercase tracking-[0.24em] text-blue-600">Bienvenido</p>
            <h2 className="mt-2 text-3xl font-black tracking-tight">{mode === 'login' ? 'Iniciar sesión' : 'Crear cuenta'}</h2>
            <p className="mt-2 text-sm text-slate-500">Usa tus credenciales de la API de notas.</p>
          </div>

          {error ? <div className="mb-4 rounded-2xl bg-rose-50 p-3 text-sm font-semibold text-rose-700">{error}</div> : null}

          <div className="space-y-4">
            {mode === 'register' ? (
              <>
                <label className="grid gap-2 text-sm font-bold text-slate-700">
                  Nombre
                  <input value={name} onChange={(event) => setName(event.target.value)} className="rounded-2xl border border-slate-200 px-4 py-3 font-normal outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100" required />
                </label>
                <label className="grid gap-2 text-sm font-bold text-slate-700">
                  Email
                  <input type="email" value={email} onChange={(event) => setEmail(event.target.value)} className="rounded-2xl border border-slate-200 px-4 py-3 font-normal outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100" required />
                </label>
              </>
            ) : null}

            <label className="grid gap-2 text-sm font-bold text-slate-700">
              Usuario
              <input value={username} onChange={(event) => setUsername(event.target.value)} className="rounded-2xl border border-slate-200 px-4 py-3 font-normal outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100" required />
            </label>

            <label className="grid gap-2 text-sm font-bold text-slate-700">
              Contraseña
              <input type="password" value={password} onChange={(event) => setPassword(event.target.value)} className="rounded-2xl border border-slate-200 px-4 py-3 font-normal outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100" required />
            </label>
          </div>

          <button type="submit" disabled={loading} className="mt-6 w-full rounded-2xl bg-blue-600 px-5 py-3 font-black text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60">
            {loading ? 'Procesando...' : mode === 'login' ? 'Entrar' : 'Registrarme'}
          </button>

          <button
            type="button"
            onClick={() => {
              clearError()
              setMode(mode === 'login' ? 'register' : 'login')
            }}
            className="mt-4 w-full text-sm font-bold text-blue-700"
          >
            {mode === 'login' ? 'Crear una cuenta nueva' : 'Ya tengo cuenta'}
          </button>
        </form>
      </section>
    </main>
  )
}
