export type ApiError = {
  message: string
  details?: Array<{ field: string; message: string }>
}

export type ApiResponse<T> = {
  success: boolean
  data?: T
  error?: ApiError
}

export type Pagination = {
  page: number
  limit: number
  total: number
  totalPages: number
  hasNextPage: boolean
  hasPreviousPage: boolean
}
