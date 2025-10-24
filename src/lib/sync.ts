
import { db } from './db'
import type { Report } from '../types'

// Fake "server sync": mark pending -> synced after small delay when online.
export async function trySyncPending() {
  if (!navigator.onLine) return
  const pendings = await db.reports.where('status').equals('pending').toArray()
  if (pendings.length === 0) return
  // simulate network latency
  await new Promise(r => setTimeout(r, 800))
  await Promise.all(pendings.map(p => db.reports.update(p.id, { status: 'synced' })))
}

export async function submitReport(r: Report) {
  await db.reports.put(r)
  await trySyncPending()
}

export function startAutoSync() {
  window.addEventListener('online', () => trySyncPending())
}
