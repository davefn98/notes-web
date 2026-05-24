import { apiRequest } from './client'
import type { Tag, TagPayload, TagsResponse } from '../types/tag'

export function getTags() {
  return apiRequest<TagsResponse>('/tags')
}

export function createTag(payload: TagPayload) {
  return apiRequest<{ tag: Tag }>('/tags', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export function updateTag(id: number, payload: Partial<TagPayload>) {
  return apiRequest<{ tag: Tag }>(`/tags/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  })
}

export function deleteTag(id: number) {
  return apiRequest<void>(`/tags/${id}`, { method: 'DELETE' })
}
