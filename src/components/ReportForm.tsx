
import { useEffect, useState } from 'react'
import imageCompression from 'browser-image-compression'
import { Report } from '../types'

type Props = {
  onSubmit: (r: Omit<Report,'id'|'reported_at'|'status'>) => void
  role: 'Desa'|'Kecamatan'|'Disaster Report'
}

export default function ReportForm({ onSubmit, role }: Props) {
  const [form, setForm] = useState<any>({
    kecamatan: '', desa: '', dusun: '', rt: '', rw: '',
    jalan: '', jenis_bencana: 'Banjir',
    kk: '', jiwa: '', meninggal: '', hilang: '', luka_berat: '', luka_ringan: '', pengungsi: '',
    rumah_rb: '', rumah_rs: '', rumah_rr: '', jembatan: '', fasilitas_lainnya: '',
    kondisi: '', keterangan: '', lat: '', lng: '', photos: [], created_by: role==='Desa' ? 'desa-001' : 'user'
  })
  const [locLoading, setLocLoading] = useState(false)

  useEffect(() => {
    setForm((f:any) => ({...f, created_by: role==='Desa' ? 'desa-001' : 'user'}))
  }, [role])

async function getLocation() {
  setLocLoading(true)
  if (!navigator.geolocation) {
    alert('Geolocation tidak didukung di browser ini')
    setLocLoading(false)
    return
  }
  const opts: PositionOptions = { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }

  navigator.geolocation.getCurrentPosition(
    (pos) => {
      setForm((f:any) => ({...f,
        lat: pos.coords.latitude.toFixed(6),
        lng: pos.coords.longitude.toFixed(6)
      }))
      setLocLoading(false)
    },
    (err) => {
      console.warn('geo error', err)
      // Coba sekali lagi dengan akurasi non-high untuk provider yang rewel
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setForm((f:any) => ({...f,
            lat: pos.coords.latitude.toFixed(6),
            lng: pos.coords.longitude.toFixed(6)
          }))
          setLocLoading(false)
        },
        () => {
          setLocLoading(false)
          alert('Gagal mengambil lokasi. Isi manual atau pilih dari peta ya.')
        },
        { enableHighAccuracy: false, timeout: 8000, maximumAge: 0 }
      )
    },
    opts
  )
}

  async function handlePhotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files || [])
    const out: string[] = []
    for (const file of files) {
      const compressed = await imageCompression(file, { maxSizeMB: 0.3, maxWidthOrHeight: 1600, useWebWorker: true })
      const b64 = await imageToBase64(compressed)
      out.push(b64)
    }
    setForm((f:any) => ({...f, photos: out}))
  }

  function imageToBase64(file: File) {
    return new Promise<string>((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => resolve(reader.result as string)
      reader.onerror = reject
      reader.readAsDataURL(file)
    })
  }

  function num(v:any){ const n = parseInt(v,10); return isNaN(n)? undefined : n }

  function submit(e: React.FormEvent) {
    e.preventDefault()
    const payload = {
      ...form,
      kk: num(form.kk), jiwa: num(form.jiwa), meninggal: num(form.meninggal),
      hilang: num(form.hilang), luka_berat: num(form.luka_berat), luka_ringan: num(form.luka_ringan), pengungsi: num(form.pengungsi),
      rumah_rb: num(form.rumah_rb), rumah_rs: num(form.rumah_rs), rumah_rr: num(form.rumah_rr),
      jembatan: num(form.jembatan), fasilitas_lainnya: num(form.fasilitas_lainnya)
    }
    onSubmit(payload)
    alert('Tersimpan. ' + (navigator.onLine ? 'Terkirim (synced).' : 'Akan disinkron saat online.'))
  }
const [showPicker, setShowPicker] = useState(false)

useEffect(() => {
  if (!showPicker) return
  let map: any, marker: any
  ;(async () => {
    const L = await import('leaflet')
    const icon = new L.Icon({
      iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
      iconSize: [25,41], iconAnchor: [12,41]
    })
    const startLat = Number(form.lat) || -0.07
    const startLng = Number(form.lng) || 111.49
    map = L.map('pickmap').setView([startLat, startLng], 8)
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap'
    }).addTo(map)
    if (form.lat && form.lng) {
      marker = L.marker([startLat, startLng], { icon }).addTo(map)
    }
    map.on('click', (e: any) => {
      const { lat, lng } = e.latlng
      if (marker) marker.setLatLng(e.latlng)
      else marker = L.marker(e.latlng, { icon }).addTo(map)
      setForm((f:any)=>({ ...f, lat: lat.toFixed(6), lng: lng.toFixed(6) }))
    })
  })()
  return () => { try { map?.remove() } catch {} }
}, [showPicker])

  return (
    <form onSubmit={submit}>
      <div className="grid">
        <div className="col-6">
          <div className="card">
            <h3>Identitas Lokasi</h3>
            <label>Kecamatan</label>
            <input value={form.kecamatan} onChange={e=>setForm({...form, kecamatan:e.target.value})} required />
            <label>Desa</label>
            <input value={form.desa} onChange={e=>setForm({...form, desa:e.target.value})} required />
            <div className="grid">
              <div className="col-6">
                <label>Dusun</label>
                <input value={form.dusun} onChange={e=>setForm({...form, dusun:e.target.value})} />
              </div>
              <div className="col-6">
                <label>Jalan</label>
                <input value={form.jalan} onChange={e=>setForm({...form, jalan:e.target.value})} />
              </div>
            </div>
            <div className="grid">
              <div className="col-6"><label>RT</label><input value={form.rt} onChange={e=>setForm({...form, rt:e.target.value})} /></div>
              <div className="col-6"><label>RW</label><input value={form.rw} onChange={e=>setForm({...form, rw:e.target.value})} /></div>
            </div>
            <div style={{display:'flex', gap:8, alignItems:'center', marginTop:8}}>
              <button type="button" onClick={getLocation}>
                {locLoading ? 'Mengambil...' : 'Ambil Lokasi (GPS)'}
              </button>
              <button type="button" onClick={()=>setShowPicker(v=>!v)}>
                {showPicker ? 'Tutup Peta' : 'Pilih dari Peta'}
              </button>
              <span className="small">Lat: {form.lat||'-'} Lng: {form.lng||'-'}</span>
            </div>
            {showPicker && (
              <div style={{marginTop:12}}>
                <div id="pickmap" className="map" />
                <p className="small">Klik peta untuk menetapkan koordinat.</p>
              </div>
            )}
          </div>
        </div>
        <div className="col-6">
          <div className="card">
            <h3>Detail Kejadian</h3>
            <label>Jenis Bencana</label>
            <select value={form.jenis_bencana} onChange={e=>setForm({...form, jenis_bencana:e.target.value})}>
              <option>Banjir</option><option>Tanah Longsor</option><option>Puting Beliung</option><option>Kebakaran</option><option>Gempa</option>
            </select>
            <div className="grid">
              <div className="col-6"><label>KK</label><input value={form.kk} onChange={e=>setForm({...form, kk:e.target.value})} /></div>
              <div className="col-6"><label>Jiwa</label><input value={form.jiwa} onChange={e=>setForm({...form, jiwa:e.target.value})} /></div>
            </div>
            <div className="grid">
              <div className="col-6"><label>Meninggal</label><input value={form.meninggal} onChange={e=>setForm({...form, meninggal:e.target.value})} /></div>
              <div className="col-6"><label>Hilang</label><input value={form.hilang} onChange={e=>setForm({...form, hilang:e.target.value})} /></div>
            </div>
            <div className="grid">
              <div className="col-6"><label>Luka Berat</label><input value={form.luka_berat} onChange={e=>setForm({...form, luka_berat:e.target.value})} /></div>
              <div className="col-6"><label>Luka Ringan</label><input value={form.luka_ringan} onChange={e=>setForm({...form, luka_ringan:e.target.value})} /></div>
            </div>
            <div className="grid">
              <div className="col-4"><label>RB</label><input value={form.rumah_rb} onChange={e=>setForm({...form, rumah_rb:e.target.value})} /></div>
              <div className="col-4"><label>RS</label><input value={form.rumah_rs} onChange={e=>setForm({...form, rumah_rs:e.target.value})} /></div>
              <div className="col-4"><label>RR</label><input value={form.rumah_rr} onChange={e=>setForm({...form, rumah_rr:e.target.value})} /></div>
            </div>
            <div className="grid">
              <div className="col-6"><label>Jembatan Rusak</label><input value={form.jembatan} onChange={e=>setForm({...form, jembatan:e.target.value})} /></div>
              <div className="col-6"><label>Fasilitas Umum Lainnya</label><input value={form.fasilitas_lainnya} onChange={e=>setForm({...form, fasilitas_lainnya:e.target.value})} /></div>
            </div>
            <label>Deskripsi Kondisi</label>
            <textarea rows={4} value={form.kondisi} onChange={e=>setForm({...form, kondisi:e.target.value})}></textarea>
            <label>Keterangan</label>
            <textarea rows={3} value={form.keterangan} onChange={e=>setForm({...form, keterangan:e.target.value})}></textarea>
            <label>Foto Lapangan (kompres otomatis)</label>
            <input type="file" accept="image/*" multiple onChange={handlePhotoChange} />
            <div className="footer">
              <button type="submit">Kirim</button>
              <span className="small">Status jaringan: {navigator.onLine? 'Online' : 'Offline'} • Foto: {form.photos.length}</span>
            </div>
          </div>
        </div>
      </div>
    </form>
  )
}
