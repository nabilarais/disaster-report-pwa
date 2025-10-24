import { useEffect, useMemo, useState } from 'react'
import { liveQuery } from 'dexie'
import { Report } from './types'
import { db } from './lib/db'
import { submitReport, startAutoSync } from './lib/sync'
import { exportToExcel, exportToPDF } from './lib/export'
import ReportForm from './components/ReportForm'
import Dashboard from './components/Dashboard'

type Role = 'Desa' | 'Kecamatan' | 'Disaster Report'

// ---- FLAG: Seed demo dimatikan ----
const ENABLE_SEED = false

export default function App() {
  const [tab, setTab] = useState<'form'|'dashboard'>('form')
  const [role, setRole] = useState<Role>('Desa')
  const [reports, setReports] = useState<Report[]>([])
  const [filter, setFilter] = useState({ kecamatan: 'Semua', jenis: 'Semua' })

  // ---- DATA STREAM (Dexie live) ----
  useEffect(() => {
    const sub = liveQuery(() =>
      db.reports.orderBy('reported_at').reverse().toArray()
    ).subscribe({
      next: rows => setReports(rows),
      error: e => console.error('liveQuery error', e),
    })
    startAutoSync()
    return () => sub.unsubscribe()
  }, [])

  const filtered = useMemo(() => reports.filter(r => {
    return (filter.kecamatan === 'Semua' || r.kecamatan === filter.kecamatan) &&
           (filter.jenis === 'Semua' || r.jenis_bencana === filter.jenis) &&
           (role !== 'Desa' || r.created_by === 'desa-001')
  }), [reports, filter, role])

  // ---- SUBMIT ----
  function handleSubmit(base: Omit<Report,'id'|'reported_at'|'status'>) {
    const now = new Date().toISOString()
    const rid = (crypto as any)?.randomUUID?.() ?? Math.random().toString(36).slice(2)
    const report: Report = {
      ...base,
      id: rid,
      reported_at: now,
      status: navigator.onLine ? 'synced' : 'pending'
    }
    submitReport(report)
  }

  // ---- SEED DEMO (guarded/no-op) ----
  function seedDemo() {
    if (!ENABLE_SEED) return
    const samples = [
      {kecamatan:'Tempunak', desa:'Sungai Ringin', jenis_bencana:'Banjir', kk:35, jiwa:142, rumah_rb:3, rumah_rs:12, rumah_rr:27, lat:-0.07, lng:111.49},
      {kecamatan:'Demo', desa:'Lalang Inggar', jenis_bencana:'Tanah Longsor', kk:12, jiwa:48, rumah_rb:1, rumah_rs:3, rumah_rr:8, lat:-0.10, lng:111.49},
      {kecamatan:'Kelam Permai', desa:'Merarai', jenis_bencana:'Puting Beliung', kk:20, jiwa:77, rumah_rb:0, rumah_rs:5, rumah_rr:12, lat:-0.18, lng:111.42},
      {kecamatan:'Ketungau Tengah', desa:'Paal Merah', jenis_bencana:'Kebakaran', kk:5, jiwa:19, rumah_rb:2, rumah_rs:1, rumah_rr:0, lat:-0.30, lng:111.63},
      {kecamatan:'Sepauk', desa:'Nanga Sepauk', jenis_bencana:'Banjir', kk:18, jiwa:69, rumah_rb:0, rumah_rs:4, rumah_rr:14, lat:-0.04, lng:111.69},
    ]
    samples.forEach(s => {
      const rid = (crypto as any)?.randomUUID?.() ?? Math.random().toString(36).slice(2)
      const report: Report = {
        ...s,
        meninggal:0, hilang:0, luka_berat:0, luka_ringan:0,
        pengungsi: Math.floor(Math.random()*80),
        jembatan:0, fasilitas_lainnya:0,
        kondisi:'—', keterangan:'seed',
        photos: [],
        created_by: 'desa-001',
        id: rid,
        reported_at: new Date(Date.now() - Math.random()*86400000).toISOString(),
        status: navigator.onLine ? 'synced' : 'pending'
      }
      submitReport(report)
    })
    setTab('dashboard')
  }

  return (
    <div className="container">
      <div className="nav">
        <div className="brand">⚑ Disaster Report Preview</div>
        <div className="tabs">
          <div className={['tab', tab==='form' && 'active'].filter(Boolean).join(' ')} onClick={()=>setTab('form')}>Form Laporan</div>
          <div className={['tab', tab==='dashboard' && 'active'].filter(Boolean).join(' ')} onClick={()=>setTab('dashboard')}>Dashboard</div>
        </div>
        <div style={{display:'flex', gap:8, alignItems:'center'}}>
          <span className="small">Peran:</span>
          <select value={role} onChange={e=>setRole(e.target.value as Role)}>
            <option>Desa</option>
            <option>Kecamatan</option>
            <option>Disaster Report</option>
          </select>
          {/* tombol Seed Demo dimatikan */}
          {ENABLE_SEED && <button onClick={seedDemo}>Seed Demo</button>}
          <span className="badge">{navigator.onLine ? 'Online' : 'Offline'}</span>
        </div>
      </div>

      {tab==='form' ? (
        <div className="card">
          <ReportForm onSubmit={handleSubmit} role={role} />
        </div>
      ) : (
        <>
          <div className="card" style={{marginBottom:12, display:'flex', gap:8, alignItems:'center'}}>
            <button onClick={()=>exportToExcel(filtered)}>Ekspor Excel</button>
            <button onClick={()=>exportToPDF(filtered)}>Ekspor PDF</button>
            <span className="small">Data sesuai filter & peran.</span>
          </div>
          <Dashboard data={filtered} onFilterChange={setFilter} />
        </>
      )}

      <p className="small">Preview: data tersimpan di IndexedDB. Sinkronisasi server dipalsukan (pending→synced saat online).</p>
    </div>
  )
}
