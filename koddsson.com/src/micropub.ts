import fetch from 'node-fetch'
import express, {Request} from 'express'
import bodyParser from 'body-parser'
import Handlebars from 'handlebars'
import markdown from '@koddsson/helper-markdown'
import {symlinkSync, readFileSync, writeFileSync, unlinkSync} from 'fs'

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
  id: string
  contents: string
  location: string | null
  categories: string
  timestamp: string
  replyTo: string | null
}

async function saveNoteToDatabase(note: Note) {
  await db.run(
    'INSERT INTO notes VALUES (?, ?, ?, ?, ?, ?)',
    note.id,
    note.contents,
    note.location,
    note.categories,
    note.timestamp,
    note.replyTo
  )
  saveNoteToDisk(note)
}

Handlebars.registerHelper('markdown', markdown({linkify: true}))
const noteTemplate = Handlebars.compile(readFileSync('./src/views/partials/note.hbs', {encoding: 'utf8'}))

function saveNoteToDisk(note: Note) {
  // Write the current note under the timestamp and slug if it differs from the timestamp
  writeFileSync(`./data/notes/${note.timestamp}.json`, JSON.stringify(note, null, 4), {encoding: 'utf8'})
  writeFileSync(`./data/notes/${note.timestamp}.html`, noteTemplate(note), {encoding: 'utf8'})
  if (note.id !== note.timestamp) {
    unlinkSync(`./data/notes/${note.id}.json`)
    unlinkSync(`./data/notes/${note.id}.html`)
    symlinkSync(`./${note.timestamp}.json`, `./data/notes/${note.id}.json`)
    symlinkSync(`./${note.timestamp}.html`, `./data/notes/${note.id}.html`)
  }
  // Symlink the note to the latest tag
  unlinkSync(`./data/notes/latest.json`)
  unlinkSync(`./data/notes/latest.html`)
  symlinkSync(`./${note.timestamp}.json`, `./data/notes/latest.json`)
  symlinkSync(`./${note.timestamp}.html`, `./data/notes/latest.html`)
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
  const slug = req.body['mp-slug']

  // Don't remove this. It's good to know what requests look like in the logs
  console.log(req.body)

  if (req.body['like-of']) {
    // TODO: Try and get metadata and add to the table.
    const timestamp = Math.floor(Number(new Date()) / 1000)
    await db.run("INSERT INTO favorites VALUES (?, DateTime('now'), ?)", req.body['like-of'], timestamp)
    // TODO: Set this header more correctly
    res.header('Location', 'https://koddsson.com/favorites')
    return res.status(201).send('Favorited')
  } else if (req.body['in-reply-to']) {
    const timestamp = Math.floor(Number(new Date()) / 1000)
    const id = slug || timestamp

    await saveNoteToDatabase({
      id: id.toString(),
      contents: req.body.content,
      location: req.body.location,
      categories,
      timestamp: timestamp.toString(),
      replyTo: req.body['in-reply-to']
    })

    const noteLink = `https://koddsson.com/notes/${id}`

    // TODO: Set this header more correctly
    res.header('Location', noteLink)
    return res.status(201).send('Note posted')
  } else if (req.body.h === 'entry') {
    const timestamp = Math.floor(Number(new Date()) / 1000)
    const id = slug || timestamp

    await saveNoteToDatabase({
      id: id.toString(),
      contents: req.body.content,
      location: req.body.location,
      categories,
      timestamp: timestamp.toString(),
      replyTo: null
    })

    const noteLink = `https://koddsson.com/notes/${id}`

    // TODO: Set this header more correctly
    res.header('Location', noteLink)
    return res.status(201).send('Note posted')
  } else if (req.body.type && req.body.type.includes('h-entry')) {
    const timestamp = Math.floor(Number(new Date()) / 1000)
    const id = slug || timestamp
    const properties = req.body.properties
    const photo = properties.photo && properties.photo[0]
    const content = properties.content[0]

    if (photo) {
      await db.run('INSERT INTO photos VALUES (?, ?, ?)', timestamp, photo.value, photo.alt)
    }

    await saveNoteToDatabase({
      id: id.toString(),
      contents: content,
      location: null,
      categories,
      timestamp: timestamp.toString(),
      replyTo: null
    })

    const noteLink = `https://koddsson.com/notes/${id}`

    // TODO: Set this header more correctly
    res.header('Location', noteLink)
    return res.status(201).send('Note posted')
  }

  return res.status(404).send('Not found')
})

export default app
