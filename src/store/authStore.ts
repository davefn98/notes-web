import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { login as loginRequest, register as registerRequest } from '../api/auth'
import type { LoginPayload, RegisterPayload, User } from '../types/auth'

type AuthState = {
  token: string | null
  user: User | null
  loading: boolean
  error: string | null
  login: (payload: LoginPayload) => Promise<void>
  register: (payload: RegisterPayload) => Promise<void>
  logout: () => void
  clearError: () => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      user: null,
      loading: false,
      error: null,
      login: async (payload) => {
        set({ loading: true, error: null })
        try {
          const data = await loginRequest(payload)
          set({ token: data.token, user: data.user, loading: false })
        } catch (error) {
          set({ error: error instanceof Error ? error.message : 'No se pudo iniciar sesion', loading: false })
          throw error
        }
      },
      register: async (payload) => {
        set({ loading: true, error: null })
        try {
          await registerRequest(payload)
          const data = await loginRequest({ username: payload.username, password: payload.password })
          set({ token: data.token, user: data.user, loading: false })
        } catch (error) {
          set({ error: error instanceof Error ? error.message : 'No se pudo registrar la cuenta', loading: false })
          throw error
        }
      },
      logout: () => set({ token: null, user: null, error: null }),
      clearError: () => set({ error: null }),
    }),
    {
      name: 'notes-auth',
      partialize: (state) => ({ token: state.token, user: state.user }),
    },
  ),
)
