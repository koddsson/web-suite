import express from 'express'
import bodyParser from 'body-parser'
import hbs from 'hbs'
import {fileURLToPath} from 'url'
import {dirname} from 'path'

const __dirname = dirname(fileURLToPath(import.meta.url))

const app = express()
app.use(bodyParser.json())

app.set('view engine', 'hbs')

app.set('views', __dirname + '/views')
hbs.registerPartials(__dirname + '/src/views/partials')

app.get('/:post', async (req, res) => {
  const postName = req.params.post
  return res.status(200).render(`posts/${postName}`)
})

export default app
