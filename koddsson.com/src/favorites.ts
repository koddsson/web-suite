import express from 'express'
import hbs from 'hbs'
import {fileURLToPath} from 'url'
import {dirname} from 'path'

import {getFavorites} from './data.js'

const __dirname = dirname(fileURLToPath(import.meta.url))

const app = express()

app.set('view engine', 'hbs')

app.set('views', __dirname + '/src/views')
hbs.registerPartials(__dirname + '/src/views/partials')

app.get('/', async (_, res) => res.render('favorites', {favorites: await getFavorites()}))

export default app
