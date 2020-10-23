export interface Note {
  slug: string
  timestamp: number
  relativeDate: string
  isNote: boolean
  isFavorite: boolean
  photo: string | undefined
  type: 'note' | 'favorite'
}
