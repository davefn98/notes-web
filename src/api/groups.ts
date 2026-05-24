import { apiRequest } from './client'
import type { Group, GroupPayload, GroupsTreeResponse } from '../types/group'

export function getGroupsTree() {
  return apiRequest<GroupsTreeResponse>('/groups/tree')
}

export function createGroup(payload: GroupPayload) {
  return apiRequest<Group>('/groups', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export function updateGroup(id: number, payload: Partial<GroupPayload>) {
  return apiRequest<Group>(`/groups/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  })
}

export function deleteGroup(id: number) {
  return apiRequest<void>(`/groups/${id}`, { method: 'DELETE' })
}
