export type User = {
  id: number
  name: string
  username: string
  role?: string | null
  status: string
  roles?: Array<string | { id: number; name: string }>
}

export type LoginPayload = {
  username: string
  password: string
}

export type RegisterPayload = LoginPayload & {
  name: string
}

export type LoginResponse = {
  token: string
  user: User
}
