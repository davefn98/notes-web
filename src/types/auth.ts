export type User = {
  id: number
  name: string
  username: string
  email?: string | null
  emailVerifiedAt?: string | null
  role?: string | null
  status: string
  roles?: Array<string | { id: number; name: string }>
  created_at?: string
}

export type LoginPayload = {
  username: string
  password: string
}

export type RegisterPayload = LoginPayload & {
  name: string
  email: string
}

export type ForgotPasswordPayload = {
  username: string
}

export type ResetPasswordPayload = {
  token: string
  newPassword: string
}

export type LoginResponse = {
  token: string
  refreshToken?: string
  refreshTokenExpiresAt?: string
  user: User
}

export type UserResponse = {
  user: User
}

export type RefreshSession = {
  id: number
  userId: number
  userAgent?: string | null
  ipAddress?: string | null
  lastUsedAt: string
  expiresAt: string
  revokedAt?: string | null
  createdAt: string
  current?: boolean
}

export type SessionsResponse = {
  sessions: RefreshSession[]
}

export type ChangePasswordPayload = {
  currentPassword: string
  newPassword: string
}
