export type Tag = {
  id: number
  name: string
  color?: string | null
  userId: number
}

export type TagPayload = {
  name: string
  color?: string | null
}

export type TagsResponse = {
  tags: Tag[]
}
