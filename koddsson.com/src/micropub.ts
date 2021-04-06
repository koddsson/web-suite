import fetch from 'node-fetch'
import express, {Request} from 'express'
import bodyParser from 'body-parser'

import * as db from './database.js'

const app = express()
app.use(bodyParser.json())

app.get('/', async (req, res) => {
  if (req.query['q'] === 'config') {
    return res.json({
      'media-endpoint': 'https://img.koddsson.com/upload'
    })
  }
  return res.status(404).send('Not found')
})

interface AuthResponse {
  me: string
}

interface NotePayload {
  category: string[]
  'mp-slug': string
  'like-of': string
  location: string
  h: 'entry'
  properties: {
    photo: {value: string; alt: string}[]
    content: string[]
  }
  type: string
  content: string
  'in-reply-to': string
}

interface Note {
  slug: string
  id?: string
  contents: string
  location: string | null
  categories: string
  replyTo?: string
}

async function saveNoteToDatabase(note: Note) {
  const timestamp = Math.floor(Number(new Date()) / 1000)
  const id = note.slug || timestamp

  await db.run(
    'INSERT INTO notes VALUES (?, ?, ?, ?, ?, ?)',
    id,
    note.contents,
    note.location,
    note.categories,
    timestamp,
    note.replyTo
  )

  return {id, timestamp}
}

app.post('/', async (req: Request<unknown, unknown, NotePayload>, res) => {
  // Handle authorization
  const response = await fetch('https://tokens.indieauth.com/token', {
    headers: {
      Accept: 'application/json',
      Authorization: req.header('Authorization') || ''
    }
  })

  const json: AuthResponse = await response.json()
  if (json.me !== 'https://koddsson.com/') {
    return res.status(401).send('Unauthorized')
  }

  const categories = (req.body.category || []).join(',')

  // Don't remove this. It's good to know what requests look like in the logs
  console.log(req.body)

  if (req.body['like-of']) {
    // TODO: Try and get metadata and add to the table.
    const timestamp = Math.floor(Number(new Date()) / 1000)
    await db.run("INSERT INTO favorites VALUES (?, DateTime('now'), ?)", req.body['like-of'], timestamp)
    // TODO: Set this header more correctly
    res.header('Location', 'https://koddsson.com/favorites')
    return res.status(201).send('Favorited')
  } else if (req.body['in-reply-to'] || req.body.h === 'entry') {
    const {id} = await saveNoteToDatabase({
      slug: req.body['mp-slug'],
      contents: req.body.content,
      location: req.body.location,
      categories,
      replyTo: req.body['in-reply-to']
    })

    const noteLink = `https://koddsson.com/notes/${id}`

    // TODO: Set this header more correctly
    res.header('Location', noteLink)
    return res.status(201).send('Note posted')
  } else if (req.body.type && req.body.type.includes('h-entry')) {
    const properties = req.body.properties
    const photo = properties.photo && properties.photo[0]
    const content = properties.content[0]

    const {id, timestamp} = await saveNoteToDatabase({
      slug: req.body['mp-slug'],
      contents: content,
      location: null,
      categories
    })

    if (photo) {
      await db.run('INSERT INTO photos VALUES (?, ?, ?)', timestamp, photo.value, photo.alt)
    }

    const noteLink = `https://koddsson.com/notes/${id}`

    // TODO: Set this header more correctly
    res.header('Location', noteLink)
    return res.status(201).send('Note posted')
  }

  return res.status(404).send('Not found')
})

export default app
