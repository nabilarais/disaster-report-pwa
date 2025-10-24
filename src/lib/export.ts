
import type { Report } from '../types'
import * as XLSX from 'xlsx'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

export function exportToExcel(data: Report[]) {
  const rows = data.map(r => ({
    Kecamatan: r.kecamatan,
    Desa: r.desa,
    Jenis: r.jenis_bencana,
    KK: r.kk || 0,
    Jiwa: r.jiwa || 0,
    Meninggal: r.meninggal || 0,
    Hilang: r.hilang || 0,
    'Luka Berat': r.luka_berat || 0,
    'Luka Ringan': r.luka_ringan || 0,
    Pengungsi: r.pengungsi || 0,
    RB: r.rumah_rb || 0,
    RS: r.rumah_rs || 0,
    RR: r.rumah_rr || 0,
    Jembatan: r.jembatan || 0,
    Fasilitas: r.fasilitas_lainnya || 0,
    Lat: r.lat || '',
    Lng: r.lng || '',
    Waktu: r.reported_at,
    Status: r.status
  }))
  const ws = XLSX.utils.json_to_sheet(rows)
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, 'Laporan')
  XLSX.writeFile(wb, 'rekap-laporan.xlsx')
}

export function exportToPDF(data: Report[]) {
  const doc = new jsPDF()
  doc.text('Rekap Laporan Bencana', 14, 14)
  const body = data.map(r => [
    r.kecamatan, r.desa, r.jenis_bencana,
    r.kk || 0, r.jiwa || 0, r.meninggal || 0, r.pengungsi || 0,
    r.rumah_rb || 0, r.rumah_rs || 0, r.rumah_rr || 0,
    r.reported_at
  ])
  autoTable(doc, {
    head: [['Kecamatan','Desa','Jenis','KK','Jiwa','Meninggal','Pengungsi','RB','RS','RR','Waktu']],
    body
  })
  doc.save('rekap-laporan.pdf')
}
