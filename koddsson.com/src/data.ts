import relativeDate from 'relative-date'

import type {Note, Photo} from './types'
import {all, get} from './database.js'

async function getPhoto(slug: string): Promise<Photo> {
  return (await get<Photo>('SELECT * FROM photos where slug = ?', slug))!
}

async function getLatestNote() {
  const latestNote = await get<Note>(`
    SELECT content, slug, 'note' as type, timestamp, replyTo as reply FROM notes
    ORDER BY timestamp DESC
    LIMIT 1
  `)
  if (latestNote) {
    latestNote.relativeDate = relativeDate(latestNote.timestamp * 1000)
    latestNote.isNote = true
    latestNote.isFavorite = false
    latestNote.photo = await getPhoto(latestNote.slug)
  }
  return latestNote
}

export async function getLatestPost() {
  const latestNote = await getLatestNote()
  // TODO: Somehow get favorites to show up in the latest notes again
  // SELECT url as content, slug, 'favorite' as type, slug as timestamp, NULL as reply from favorites UNION ALL
  return latestNote
}

export async function getFavorites() {
  return await all('SELECT * FROM favorites ORDER BY timestamp DESC')
}
