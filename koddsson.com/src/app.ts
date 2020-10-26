import express from 'express'
import morgan from 'morgan'
import bodyParser from 'body-parser'
import relativeDate from 'relative-date'
import hbs from 'hbs'
import {fileURLToPath} from 'url'
import {dirname} from 'path'
import markdown from 'helper-markdown'
import type {Note, Photo} from './types'

import micropub from './micropub.js'
import favorites from './favorites.js'
import notes from './notes.js'
import * as db from './database.js'

const __dirname = dirname(fileURLToPath(import.meta.url))

const app = express()

app.use(morgan('combined'))
app.use(express.static('public'))

// Not sure if this needed here or in sub-apps.
app.use(bodyParser.urlencoded({extended: true, limit: '100mb'}))
app.use(bodyParser.json())

// Setting up ciiews and partials.
app.set('view engine', 'hbs')
app.set('views', __dirname + '/views')
hbs.registerPartials(__dirname + '/views/partials')

// Set up markdown helper in handlebar views.
hbs.registerHelper('markdown', markdown({linkify: true}))

async function getPhoto(slug: string): Promise<Photo> {
  return (await db.get<Photo>('SELECT * FROM photos where slug = ?', slug))!
}

async function getLatestPost() {
  // TODO: Somehow get favorites to show up in the latest notes again
  // SELECT url as content, slug, 'favorite' as type, slug as timestamp, NULL as reply from favorites UNION ALL
  const latestNote = await db.get<Note>(`
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

app.get('/', async (_, res) => res.render('index', {latestNote: await getLatestPost()}))

app.use('/micropub', micropub)
app.use('/notes', notes)
app.use('/favorites', favorites)

export default app
