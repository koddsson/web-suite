import express from 'express'
import morgan from 'morgan'
import bodyParser from 'body-parser'
import relativeDate from 'relative-date'
import hbs from 'hbs'
import {fileURLToPath} from 'url'
import {dirname} from 'path'
import markdown from 'helper-markdown'
import type {Note} from './types'

import micropub from './micropub.js'
import favorites from './favorites.js'
import notes from './notes.js'
import * as db from './database.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const app = express()

app.use(morgan('combined'))
app.use(express.static('public'))
app.use(bodyParser.urlencoded({extended: true, limit: '100mb'}))
app.use(bodyParser.json())

app.set('view engine', 'hbs')
app.set('views', __dirname + '/views')

hbs.registerPartials(__dirname + '/views/partials')
hbs.registerHelper('markdown', markdown({linkify: true}))

app.get('/', async (req, res) => {
  // TODO: Somehow get favorites to show up in the latest notes agaitn
  // SELECT url as content, slug, 'favorite' as type, slug as timestamp, NULL as reply from favorites UNION ALL
  const latestNote = await db.get<Note>(`
    SELECT content, slug, 'note' as type, timestamp, replyTo as reply FROM notes
    ORDER BY timestamp DESC
    LIMIT 1
  `)
  if (latestNote) {
    latestNote.relativeDate = relativeDate(latestNote.timestamp * 1000)
    latestNote.isNote = latestNote.type === 'note'
    latestNote.isFavorite = latestNote.type === 'favorite'
    if (latestNote.isNote) {
      latestNote.photo = await db.get('SELECT * FROM photos where slug = ?', latestNote.slug)
    }
  }
  return res.render('index', {latestNote})
})

app.use('/micropub', micropub)
app.use('/notes', notes)
app.get('/favorites', favorites)

export default app
