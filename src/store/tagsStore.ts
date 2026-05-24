import { create } from 'zustand'
import {
  createTag as createTagApi,
  deleteTag as deleteTagApi,
  getTags,
  updateTag as updateTagApi,
} from '../api/tags'
import type { Tag, TagPayload } from '../types/tag'

type TagsState = {
  tags: Tag[]
  loading: boolean
  error: string | null
  loadTags: () => Promise<void>
  saveTag: (payload: TagPayload, id?: number) => Promise<void>
  removeTag: (id: number) => Promise<void>
}

export const useTagsStore = create<TagsState>((set, get) => ({
  tags: [],
  loading: false,
  error: null,
  loadTags: async () => {
    set({ loading: true, error: null })
    try {
      const data = await getTags()
      set({ tags: data.tags, loading: false })
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'No se pudieron cargar las etiquetas', loading: false })
    }
  },
  saveTag: async (payload, id) => {
    if (id) await updateTagApi(id, payload)
    else await createTagApi(payload)
    await get().loadTags()
  },
  removeTag: async (id) => {
    await deleteTagApi(id)
    await get().loadTags()
  },
}))
