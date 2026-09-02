import Dexie, { type Table } from 'dexie'

type MetaRow = {
  key: string
  value: string
}

/**
 * Local-first database. Tables for attempts, recordings, and lesson progress
 * arrive in later phases. Version 1 only opens IndexedDB so the app is ready
 * to work with no signal.
 */
export class FretwiseDB extends Dexie {
  _meta!: Table<MetaRow, string>

  constructor() {
    super('fretwise')
    this.version(1).stores({
      _meta: 'key',
    })
  }
}

export const db = new FretwiseDB()
