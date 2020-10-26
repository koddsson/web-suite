export interface Note {
  slug: string
  timestamp: number
  relativeDate: string
  isNote: boolean
  isFavorite: boolean
  photo: Photo | undefined
  type: 'note' | 'favorite'
}

interface Photo {
  url: string
  alt: string
}
