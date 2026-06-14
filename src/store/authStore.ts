import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import {
  changePassword as changePasswordRequest,
  getProfile,
  getSessions,
  login as loginRequest,
  logout as logoutRequest,
  register as registerRequest,
  revokeOtherSessions as revokeOtherSessionsRequest,
  revokeSession as revokeSessionRequest,
  forgotPassword as forgotPasswordRequest,
  resetPassword as resetPasswordRequest,
} from '../api/auth'
import type { ChangePasswordPayload, LoginPayload, LoginResponse, RefreshSession, RegisterPayload, User, ForgotPasswordPayload, ResetPasswordPayload } from '../types/auth'

type AuthState = {
  token: string | null
  user: User | null
  sessions: RefreshSession[]
  refreshTokenExpiresAt: string | null
  loading: boolean
  accountLoading: boolean
  error: string | null
  accountError: string | null
  setSession: (session: LoginResponse) => void
  clearSession: () => void
  loadProfile: () => Promise<void>
  loadSessions: () => Promise<void>
  changePassword: (payload: ChangePasswordPayload) => Promise<void>
  revokeSession: (id: number) => Promise<void>
  revokeOtherSessions: () => Promise<void>
  login: (payload: LoginPayload) => Promise<void>
  register: (payload: RegisterPayload) => Promise<void>
  logout: () => Promise<void>
  forgotPassword: (payload: ForgotPasswordPayload) => Promise<{ message: string; resetToken?: string; resetTokenExpiresAt?: string }>
  resetPassword: (payload: ResetPasswordPayload) => Promise<{ message: string }>
  clearError: () => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      token: null,
      user: null,
      sessions: [],
      refreshTokenExpiresAt: null,
      loading: false,
      accountLoading: false,
      error: null,
      accountError: null,
      setSession: (session) => set({ token: session.token, user: session.user, refreshTokenExpiresAt: session.refreshTokenExpiresAt ?? null, error: null }),
      clearSession: () => set({ token: null, user: null, sessions: [], refreshTokenExpiresAt: null, error: null, accountError: null, loading: false, accountLoading: false }),
      loadProfile: async () => {
        set({ accountLoading: true, accountError: null })
        try {
          const data = await getProfile()
          set({ user: data.user, accountLoading: false })
        } catch (error) {
          set({ accountError: error instanceof Error ? error.message : 'No se pudo cargar el perfil', accountLoading: false })
        }
      },
      loadSessions: async () => {
        set({ accountLoading: true, accountError: null })
        try {
          const data = await getSessions()
          set({ sessions: data.sessions, accountLoading: false })
        } catch (error) {
          set({ accountError: error instanceof Error ? error.message : 'No se pudieron cargar las sesiones', accountLoading: false })
        }
      },
      changePassword: async (payload) => {
        set({ accountLoading: true, accountError: null })
        try {
          await changePasswordRequest(payload)
          set({ accountLoading: false })
        } catch (error) {
          set({ accountError: error instanceof Error ? error.message : 'No se pudo cambiar la contraseña', accountLoading: false })
          throw error
        }
      },
      revokeSession: async (id) => {
        await revokeSessionRequest(id)
        await get().loadSessions()
      },
      revokeOtherSessions: async () => {
        await revokeOtherSessionsRequest()
        await get().loadSessions()
      },
      login: async (payload) => {
        set({ loading: true, error: null })
        try {
          const data = await loginRequest(payload)
          set({ token: data.token, user: data.user, refreshTokenExpiresAt: data.refreshTokenExpiresAt ?? null, loading: false })
        } catch (error) {
          set({ error: error instanceof Error ? error.message : 'No se pudo iniciar sesión', loading: false })
          throw error
        }
      },
      register: async (payload) => {
        set({ loading: true, error: null })
        try {
          await registerRequest(payload)
          const data = await loginRequest({ username: payload.username, password: payload.password })
          set({ token: data.token, user: data.user, refreshTokenExpiresAt: data.refreshTokenExpiresAt ?? null, loading: false })
        } catch (error) {
          set({ error: error instanceof Error ? error.message : 'No se pudo registrar la cuenta', loading: false })
          throw error
        }
      },
      logout: async () => {
        try {
          await logoutRequest()
        } finally {
          set({ token: null, user: null, sessions: [], refreshTokenExpiresAt: null, error: null, accountError: null, loading: false, accountLoading: false })
        }
      },
      forgotPassword: async (payload) => {
        set({ loading: true, error: null })
        try {
          const data = await forgotPasswordRequest(payload)
          set({ loading: false })
          return data
        } catch (error) {
          set({ error: error instanceof Error ? error.message : 'No se pudo solicitar la recuperación', loading: false })
          throw error
        }
      },
      resetPassword: async (payload) => {
        set({ loading: true, error: null })
        try {
          const data = await resetPasswordRequest(payload)
          set({ loading: false })
          return data
        } catch (error) {
          set({ error: error instanceof Error ? error.message : 'No se pudo restablecer la contraseña', loading: false })
          throw error
        }
      },
      clearError: () => set({ error: null }),
    }),
    {
      name: 'notes-auth',
      partialize: (state) => ({ token: state.token, user: state.user, refreshTokenExpiresAt: state.refreshTokenExpiresAt }),
    },
  ),
)
