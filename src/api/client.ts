import { useAuthStore } from '../store/authStore'
import type { ApiResponse } from '../types/api'
import type { LoginResponse } from '../types/auth'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'https://notes-api-zwbl.onrender.com'

export class ApiRequestError extends Error {
  status: number

  constructor(message: string, status: number) {
    super(message)
    this.name = 'ApiRequestError'
    this.status = status
  }
}

type RequestOptions = RequestInit & {
  auth?: boolean
  retryOnUnauthorized?: boolean
}

let refreshPromise: Promise<string | null> | null = null

async function parseResponse<T>(response: Response) {
  return (await response.json().catch(() => null)) as ApiResponse<T> | null
}

async function refreshAccessToken() {
  if (!refreshPromise) {
    refreshPromise = (async () => {
      const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      })

      const payload = await parseResponse<LoginResponse>(response)
      if (!response.ok || !payload?.success || !payload.data?.token) {
        useAuthStore.getState().clearSession()
        return null
      }

      useAuthStore.getState().setSession(payload.data)
      return payload.data.token
    })().finally(() => {
      refreshPromise = null
    })
  }

  return refreshPromise
}

export async function apiRequest<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { auth = true, retryOnUnauthorized = true, headers, body, ...requestOptions } = options
  const token = useAuthStore.getState().token
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...requestOptions,
    credentials: 'include',
    headers: {
      ...(body instanceof FormData ? {} : { 'Content-Type': 'application/json' }),
      ...(auth && token ? { Authorization: `Bearer ${token}` } : {}),
      ...headers,
    },
    body,
  })

  if (response.status === 204) return undefined as T

  if (response.status === 401 && auth && retryOnUnauthorized) {
    const refreshedToken = await refreshAccessToken()
    if (refreshedToken) {
      return apiRequest<T>(path, { ...options, retryOnUnauthorized: false })
    }
  }

  const payload = await parseResponse<T>(response)
  if (!response.ok || !payload?.success) {
    throw new ApiRequestError(payload?.error?.message ?? 'No se pudo completar la solicitud', response.status)
  }

  return payload.data as T
}
