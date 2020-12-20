import express from 'express'
import morgan from 'morgan'
import bodyParser from 'body-parser'
import hbs from 'hbs'
import {fileURLToPath} from 'url'
import {dirname} from 'path'
import markdown from 'helper-markdown'

import micropub from './micropub.js'
import favorites from './favorites.js'
import notes from './notes.js'
import posts from './posts.js'

import {getLatestPost} from './data.js'

const __dirname = dirname(fileURLToPath(import.meta.url))

const app = express()

app.use(morgan('combined'))
app.use(express.static('public'))

// Not sure if this needed here or in sub-apps.
app.use(bodyParser.urlencoded({extended: true, limit: '100mb'}))
app.use(bodyParser.json())

// Setting up views and partials.
app.set('view engine', 'hbs')
app.set('views', __dirname + '/views')
hbs.registerPartials(__dirname + '/views/partials')

// Set up markdown helper in handlebar views.
hbs.registerHelper('markdown', markdown({linkify: true}))

app.get('/', async (_, res) => res.render('index', {latestNote: await getLatestPost()}))

app.use('/micropub', micropub)
app.use('/notes', notes)
app.use('/favorites', favorites)
app.use('/posts', posts)

export default app
