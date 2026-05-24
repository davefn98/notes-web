import { apiRequest } from './client'
import type { LoginPayload, LoginResponse, RegisterPayload, User } from '../types/auth'

export function login(payload: LoginPayload) {
  return apiRequest<LoginResponse>('/auth/login', {
    auth: false,
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export function register(payload: RegisterPayload) {
  return apiRequest<User>('/auth/register', {
    auth: false,
    method: 'POST',
    body: JSON.stringify(payload),
  })
}
