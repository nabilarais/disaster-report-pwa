
import Dexie, { Table } from 'dexie'
import type { Report } from '../types'

export class AppDB extends Dexie {
  reports!: Table<Report, string>
  constructor() {
    super('disaster-report-db')
    this.version(1).stores({
      reports: 'id, kecamatan, desa, jenis_bencana, reported_at, status'
    })
  }
}
export const db = new AppDB()
