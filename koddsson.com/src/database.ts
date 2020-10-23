import sqlite3 from 'sqlite3'
import {open} from 'sqlite'

export async function all<T>(statement: string, ...args: unknown[]): Promise<T[]> {
  const db = await open({
    filename: process.env.DB_HOST || '',
    driver: sqlite3.Database
  })
  const results = await db.all(statement, ...args)
  db.close()
  return results
}

export async function get<T>(statement: string, ...args: unknown[]): Promise<T | undefined> {
  const db = await open({
    filename: process.env.DB_HOST || '',
    driver: sqlite3.Database
  })
  const results: T | undefined = await db.get(statement, ...args)
  db.close()
  return results
}

export async function run(statement: string, ...args: unknown[]): Promise<unknown> {
  const db = await open({
    filename: process.env.DB_HOST || '',
    driver: sqlite3.Database
  })
  const results = await db.run(statement, ...args)
  db.close()
  return results
}
