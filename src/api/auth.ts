import { apiRequest } from './client'
import type { ChangePasswordPayload, LoginPayload, LoginResponse, RegisterPayload, SessionsResponse, UserResponse, ForgotPasswordPayload, ResetPasswordPayload } from '../types/auth'

export function login(payload: LoginPayload) {
  return apiRequest<LoginResponse>('/auth/login', {
    auth: false,
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export function register(payload: RegisterPayload) {
  return apiRequest<UserResponse>('/auth/register', {
    auth: false,
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export function logout() {
  return apiRequest<void>('/auth/logout', {
    auth: false,
    method: 'POST',
    body: JSON.stringify({}),
  })
}

export function getProfile() {
  return apiRequest<UserResponse>('/profile')
}

export function changePassword(payload: ChangePasswordPayload) {
  return apiRequest<void>('/profile/password', {
    method: 'PATCH',
    body: JSON.stringify(payload),
  })
}

export function getSessions() {
  return apiRequest<SessionsResponse>('/auth/sessions')
}

export function revokeSession(id: number) {
  return apiRequest<void>(`/auth/sessions/${id}`, { method: 'DELETE' })
}

export function revokeOtherSessions() {
  return apiRequest<void>('/auth/sessions/revoke-others', {
    method: 'POST',
    body: JSON.stringify({}),
  })
}

export function forgotPassword(payload: ForgotPasswordPayload) {
  return apiRequest<{ message: string; resetToken?: string; resetTokenExpiresAt?: string }>('/auth/password/forgot', {
    auth: false,
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export function resetPassword(payload: ResetPasswordPayload) {
  return apiRequest<{ message: string }>('/auth/password/reset', {
    auth: false,
    method: 'POST',
    body: JSON.stringify(payload),
  })
}
