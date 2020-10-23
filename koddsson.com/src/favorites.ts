import express from 'express'
import * as db from './database.js'

const app = express()

app.get('/', async (req, res) => {
  const favorites = await db.all('SELECT * FROM favorites ORDER BY timestamp DESC')
  return res.render('favorites', {favorites})
})

export default app
