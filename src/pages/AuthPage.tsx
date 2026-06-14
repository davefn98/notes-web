import { useState } from 'react'
import { useAuthStore } from '../store/authStore'

export function AuthPage() {
  const [mode, setMode] = useState<'login' | 'register' | 'forgot' | 'reset'>('login')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [resetToken, setResetToken] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  const loading = useAuthStore((state) => state.loading)
  const error = useAuthStore((state) => state.error)
  const login = useAuthStore((state) => state.login)
  const register = useAuthStore((state) => state.register)
  const forgotPassword = useAuthStore((state) => state.forgotPassword)
  const resetPassword = useAuthStore((state) => state.resetPassword)
  const clearError = useAuthStore((state) => state.clearError)

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    clearError()
    setSuccessMessage(null)
    try {
      if (mode === 'login') {
        await login({ username, password })
      } else if (mode === 'register') {
        await register({ name: name.trim(), username: username.trim(), password, email: email.trim() })
      } else if (mode === 'forgot') {
        const response = await forgotPassword({ username: username.trim() })
        setSuccessMessage('Solicitud procesada. Si el usuario existe, se ha generado un token de recuperación.')
        if (response?.resetToken) {
          // Pre-completar el token si la API lo devuelve en el cuerpo (modo desarrollo/testing)
          setResetToken(response.resetToken)
        }
        setMode('reset')
      } else if (mode === 'reset') {
        await resetPassword({ token: resetToken.trim(), newPassword })
        setSuccessMessage('Contraseña restablecida correctamente. Ya puedes iniciar sesión.')
        setResetToken('')
        setNewPassword('')
        setMode('login')
      }
    } catch {
      // El error ya se gestiona y muestra en el store/estado
    }
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
            <p className="text-xs font-bold uppercase tracking-[0.24em] text-blue-600">Autenticación</p>
            <h2 className="mt-2 text-3xl font-black tracking-tight">
              {mode === 'login' ? 'Iniciar sesión' : mode === 'register' ? 'Crear cuenta' : mode === 'forgot' ? 'Recuperar acceso' : 'Nueva contraseña'}
            </h2>
            <p className="mt-2 text-sm text-slate-500">
              {mode === 'login'
                ? 'Usa tus credenciales de la API de notas.'
                : mode === 'register'
                ? 'Completa los campos para registrar tu cuenta.'
                : mode === 'forgot'
                ? 'Ingresa tu usuario para obtener el token de recuperación.'
                : 'Ingresa el token recibido y tu nueva contraseña.'}
            </p>
          </div>

          {successMessage ? (
            <div className="mb-4 rounded-2xl bg-emerald-50 p-3 text-sm font-semibold text-emerald-700">
              {successMessage}
            </div>
          ) : null}

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

            {mode !== 'reset' ? (
              <label className="grid gap-2 text-sm font-bold text-slate-700">
                Usuario
                <input value={username} onChange={(event) => setUsername(event.target.value)} className="rounded-2xl border border-slate-200 px-4 py-3 font-normal outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100" required />
              </label>
            ) : null}

            {mode === 'login' || mode === 'register' ? (
              <label className="grid gap-2 text-sm font-bold text-slate-700">
                <div className="flex justify-between items-center">
                  <span>Contraseña</span>
                  {mode === 'login' ? (
                    <button
                      type="button"
                      onClick={() => {
                        clearError()
                        setSuccessMessage(null)
                        setMode('forgot')
                      }}
                      className="text-xs font-bold text-blue-600 hover:underline"
                    >
                      ¿Olvidaste tu contraseña?
                    </button>
                  ) : null}
                </div>
                <input type="password" value={password} onChange={(event) => setPassword(event.target.value)} className="rounded-2xl border border-slate-200 px-4 py-3 font-normal outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100" required />
              </label>
            ) : null}

            {mode === 'reset' ? (
              <>
                <label className="grid gap-2 text-sm font-bold text-slate-700">
                  Token de recuperación
                  <input value={resetToken} onChange={(event) => setResetToken(event.target.value)} className="rounded-2xl border border-slate-200 px-4 py-3 font-normal outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100" required placeholder="Ingresa el token" />
                </label>
                <label className="grid gap-2 text-sm font-bold text-slate-700">
                  Nueva contraseña
                  <input type="password" value={newPassword} onChange={(event) => setNewPassword(event.target.value)} className="rounded-2xl border border-slate-200 px-4 py-3 font-normal outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100" required placeholder="Mínimo 4 caracteres" minLength={4} />
                </label>
              </>
            ) : null}
          </div>

          <button type="submit" disabled={loading} className="mt-6 w-full rounded-2xl bg-blue-600 px-5 py-3 font-black text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60">
            {loading ? 'Procesando...' : mode === 'login' ? 'Entrar' : mode === 'register' ? 'Registrarme' : mode === 'forgot' ? 'Enviar token de recuperación' : 'Restablecer contraseña'}
          </button>

          {mode === 'login' || mode === 'register' ? (
            <button
              type="button"
              onClick={() => {
                clearError()
                setSuccessMessage(null)
                setMode(mode === 'login' ? 'register' : 'login')
              }}
              className="mt-4 w-full text-sm font-bold text-blue-700"
            >
              {mode === 'login' ? 'Crear una cuenta nueva' : 'Ya tengo cuenta'}
            </button>
          ) : (
            <button
              type="button"
              onClick={() => {
                clearError()
                setSuccessMessage(null)
                setMode('login')
              }}
              className="mt-4 w-full text-sm font-bold text-blue-700"
            >
              Volver al inicio de sesión
            </button>
          )}
        </form>
      </section>
    </main>
  )
}
