import { useEffect, useRef, useState } from 'react'
import { KeyRound, ShieldCheck, X } from 'lucide-react'
import { PrivacyText } from './PrivacyText'
import { useAuthStore } from '../store/authStore'
import type { RefreshSession } from '../types/auth'

function formatDate(value?: string | null) {
  if (!value) return 'Sin fecha'
  return new Intl.DateTimeFormat('es', { dateStyle: 'short', timeStyle: 'short' }).format(new Date(value))
}

function sessionLabel(session: RefreshSession) {
  const agent = session.userAgent?.trim()
  if (!agent) return 'Dispositivo desconocido'
  if (agent.includes('Chrome')) return 'Chrome'
  if (agent.includes('Firefox')) return 'Firefox'
  if (agent.includes('Safari')) return 'Safari'
  if (agent.includes('Edg')) return 'Edge'
  return agent.slice(0, 48)
}

export function AccountPanel() {
  const [open, setOpen] = useState(false)
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [message, setMessage] = useState<string | null>(null)
  const panelRef = useRef<HTMLDivElement>(null)
  const user = useAuthStore((state) => state.user)
  const sessions = useAuthStore((state) => state.sessions)
  const loading = useAuthStore((state) => state.accountLoading)
  const error = useAuthStore((state) => state.accountError)
  const loadProfile = useAuthStore((state) => state.loadProfile)
  const loadSessions = useAuthStore((state) => state.loadSessions)
  const changePassword = useAuthStore((state) => state.changePassword)
  const revokeSession = useAuthStore((state) => state.revokeSession)
  const revokeOtherSessions = useAuthStore((state) => state.revokeOtherSessions)

  const initials = (user?.name ?? user?.username ?? 'U').slice(0, 2).toUpperCase()

  useEffect(() => {
    if (!open) return
    void loadProfile()
    void loadSessions()

    function handleClick(event: MouseEvent) {
      if (!panelRef.current?.contains(event.target as Node)) setOpen(false)
    }

    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [loadProfile, loadSessions, open])

  async function handlePasswordSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setMessage(null)
    await changePassword({ currentPassword, newPassword })
    setCurrentPassword('')
    setNewPassword('')
    setMessage('Contraseña actualizada.')
  }

  async function handleRevoke(id: number) {
    await revokeSession(id)
    setMessage('Sesión revocada.')
  }

  async function handleRevokeOthers() {
    await revokeOtherSessions()
    setMessage('Otras sesiones revocadas.')
  }

  return (
    <div ref={panelRef} className="relative ml-2 hidden sm:block">
      <button
        type="button"
        onClick={() => {
          setMessage(null)
          setOpen((value) => !value)
        }}
        className="flex items-center gap-2 rounded-xl px-1.5 py-1 transition hover:bg-slate-100"
        aria-label="Abrir cuenta"
      >
        <span className="flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-blue-700 text-[10px] font-bold text-white shadow-sm">
          <PrivacyText fallback="?">{initials}</PrivacyText>
        </span>
        <span className="max-w-[100px] truncate text-sm font-medium text-slate-700">
          <PrivacyText fallback="••••••">{user?.name ?? user?.username ?? 'Usuario'}</PrivacyText>
        </span>
      </button>

      {open && (
        <div className="absolute right-0 top-full z-50 mt-2 w-[min(360px,calc(100vw-24px))] rounded-2xl border border-slate-200 bg-white shadow-xl shadow-slate-900/10">
          <div className="flex items-center gap-3 border-b border-slate-100 px-4 py-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50 text-sm font-black text-blue-700">
              <PrivacyText fallback="?">{initials}</PrivacyText>
            </div>
            <div className="min-w-0 flex-1">
              <div className="truncate text-sm font-bold text-slate-900"><PrivacyText>{user?.name ?? 'Usuario'}</PrivacyText></div>
              <div className="truncate text-xs text-slate-500"><PrivacyText>{user?.email ?? user?.username ?? ''}</PrivacyText></div>
            </div>
            <button type="button" onClick={() => setOpen(false)} className="rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700" aria-label="Cerrar cuenta">
              <X size={15} />
            </button>
          </div>

          <div className="max-h-[72vh] space-y-4 overflow-y-auto p-4">
            {error ? <div className="rounded-xl bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-700">{error}</div> : null}
            {message ? <div className="rounded-xl bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-700">{message}</div> : null}

            <section className="space-y-2">
              <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-slate-400">
                <ShieldCheck size={12} />
                Perfil
              </div>
              <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-600">
                <div>Usuario: <span className="font-semibold text-slate-800"><PrivacyText>{user?.username}</PrivacyText></span></div>
                <div>Email: <span className="font-semibold text-slate-800"><PrivacyText>{user?.email ?? 'No registrado'}</PrivacyText></span></div>
                <div>Estado: <span className="font-semibold text-slate-800">{user?.status ?? 'active'}</span></div>
              </div>
            </section>

            <section className="space-y-2">
              <div className="flex items-center justify-between gap-2">
                <div className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Sesiones</div>
                <button type="button" onClick={() => void handleRevokeOthers()} disabled={loading || sessions.length <= 1} className="rounded-lg px-2 py-1 text-[11px] font-semibold text-blue-700 transition hover:bg-blue-50 disabled:cursor-not-allowed disabled:opacity-40">
                  Revocar otras
                </button>
              </div>
              <div className="space-y-1.5">
                {sessions.length === 0 ? <div className="rounded-xl border border-dashed border-slate-200 px-3 py-3 text-center text-xs text-slate-400">Sin sesiones cargadas.</div> : null}
                {sessions.map((session) => (
                  <div key={session.id} className="rounded-xl border border-slate-200 px-3 py-2">
                    <div className="flex items-center gap-2">
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-xs font-semibold text-slate-800">{sessionLabel(session)} {session.current ? '· actual' : ''}</div>
                        <div className="text-[11px] text-slate-400">Último uso: {formatDate(session.lastUsedAt)}</div>
                      </div>
                      {!session.current && (
                        <button type="button" onClick={() => void handleRevoke(session.id)} disabled={loading} className="rounded-lg px-2 py-1 text-[11px] font-semibold text-rose-600 transition hover:bg-rose-50 disabled:opacity-40">
                          Revocar
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </section>

            <form onSubmit={handlePasswordSubmit} className="space-y-2">
              <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-slate-400">
                <KeyRound size={12} />
                Cambiar contraseña
              </div>
              <input type="password" value={currentPassword} onChange={(event) => setCurrentPassword(event.target.value)} placeholder="Contraseña actual" className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-blue-300 focus:ring-4 focus:ring-blue-50" required />
              <input type="password" value={newPassword} onChange={(event) => setNewPassword(event.target.value)} placeholder="Nueva contraseña" className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-blue-300 focus:ring-4 focus:ring-blue-50" required minLength={4} />
              <button type="submit" disabled={loading} className="w-full rounded-xl bg-blue-600 px-3 py-2 text-sm font-bold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50">
                {loading ? 'Procesando...' : 'Actualizar contraseña'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
