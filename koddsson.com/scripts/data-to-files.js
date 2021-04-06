import sqlite3 from 'sqlite3'
import {open} from 'sqlite'
import {rmdirSync, mkdirSync, readFileSync, writeFileSync} from 'fs'
import Handlebars from 'handlebars'
import markdown from '@koddsson/helper-markdown'

async function all(statement, ...args) {
  const db = await open({
    filename: process.env.DB_HOST || '',
    driver: sqlite3.Database
  })
  const results = await db.all(statement, ...args)
  db.close()
  return results
}

Handlebars.registerHelper('markdown', markdown({linkify: true}))
const template = Handlebars.compile(readFileSync('./src/views/partials/note.hbs', {encoding: 'utf8'}))

rmdirSync('./data/notes', {recursive: true})
mkdirSync('./data/notes')
mkdirSync('./data/notes/slug')

const allNotes = await all('select * from notes')
let latestNote = {timestamp: 0}

;(async function () {
  for (const row of allNotes) {
    if (row.timestamp > latestNote.timestamp) {
      latestNote = row
    }

    const result = template(row)
    writeFileSync(`./data/notes/${row.timestamp}.json`, JSON.stringify(row, null, 4))
    writeFileSync(`./data/notes/${row.timestamp}.html`, result)
    if (row.timestamp.toString() !== row.slug) {
      writeFileSync(`./data/notes/slug/${row.slug}.json`, JSON.stringify(row, null, 4))
      writeFileSync(`./data/notes/slug/${row.slug}.html`, result)
    }
    console.log(`Wrote: ${row.slug}`)
  }
})()

writeFileSync('./data/notes/latest.json', JSON.stringify(latestNote, null, 4))
writeFileSync('./data/notes/latest.html', template(latestNote))
