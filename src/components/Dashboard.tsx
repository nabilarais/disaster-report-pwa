import { MapContainer, Popup, TileLayer, CircleMarker } from 'react-leaflet'
import { LatLngExpression } from 'leaflet'
import { useMemo } from 'react'
import { Report } from '../types'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip,
  PieChart, Pie, Cell, Legend, ResponsiveContainer
} from 'recharts'

// Warna per jenis bencana (untuk peta & bar chart)
const COLOR_BY_TYPE: Record<string, string> = {
  'Banjir': '#3b82f6',
  'Tanah Longsor': '#8b5cf6',
  'Puting Beliung': '#22c55e',
  'Kebakaran': '#ef4444',
  'Gempa': '#f59e0b',
  'Lainnya': '#94a3b8',
}
const colorOf = (t: string) => COLOR_BY_TYPE[t] ?? COLOR_BY_TYPE['Lainnya']

// Warna RB/RS/RR (untuk pie chart)
const COLOR_RBRSRR: Record<string, string> = {
  RB: '#ef4444',   // rusak berat = merah
  RS: '#f59e0b',   // rusak sedang = oranye
  RR: '#22c55e',   // rusak ringan = hijau
}
const colorDamage = (k: string) => COLOR_RBRSRR[k] ?? '#94a3b8'

// Label pie di-dalam slice (biar tidak keluar container)
const RAD = Math.PI / 180
const renderPieLabel: any = ({ cx, cy, midAngle, innerRadius, outerRadius, percent, value }: any) => {
  if (percent < 0.08) return null // sembunyikan label slice kecil
  const r = innerRadius + (outerRadius - innerRadius) * 0.55
  const x = cx + r * Math.cos(-midAngle * RAD)
  const y = cy + r * Math.sin(-midAngle * RAD)
  return (
    <text
      x={x}
      y={y}
      fill="#0b1220"
      textAnchor="middle"
      dominantBaseline="central"
      style={{ fontWeight: 700 }}
    >
      {value}
    </text>
  )
}

type Props = {
  data: Report[]
  onFilterChange: (f: { kecamatan: string; jenis: string }) => void
}

export default function Dashboard({ data, onFilterChange }: Props) {
  const center: LatLngExpression = [-0.07, 111.49]

  const kecamatanList = useMemo(
    () => ['Semua', ...Array.from(new Set(data.map(d => d.kecamatan).filter(Boolean)))],
    [data]
  )
  const jenisList = useMemo(
    () => ['Semua', ...Array.from(new Set(data.map(d => d.jenis_bencana).filter(Boolean)))],
    [data]
  )

  const byJenis = useMemo(() => {
    const map = new Map<string, number>()
    data.forEach(d => map.set(d.jenis_bencana, (map.get(d.jenis_bencana) || 0) + 1))
    return Array.from(map, ([name, total]) => ({ name, total }))
  }, [data])

  const rbrr = useMemo(() => {
    const rb = data.reduce((a, d) => a + (d.rumah_rb || 0), 0)
    const rs = data.reduce((a, d) => a + (d.rumah_rs || 0), 0)
    const rr = data.reduce((a, d) => a + (d.rumah_rr || 0), 0)
    return [
      { name: 'RB', value: rb },
      { name: 'RS', value: rs },
      { name: 'RR', value: rr },
    ]
  }, [data])

  return (
    <div className="grid">
      <div className="col-12">
        <div className="card" style={{ display: 'flex', gap: 12, alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <span className="small">Filter kecamatan:</span>
            <select onChange={e => onFilterChange({ kecamatan: e.target.value, jenis: 'Semua' })}>
              {kecamatanList.map(k => <option key={k}>{k}</option>)}
            </select>
            <span className="small">Jenis:</span>
            <select onChange={e => onFilterChange({ kecamatan: 'Semua', jenis: e.target.value })}>
              {jenisList.map(k => <option key={k}>{k}</option>)}
            </select>
          </div>
          <div className="badge">{data.length} laporan</div>
        </div>
      </div>

      <div className="col-12">
        <div className="card">
          {/* Legend warna peta */}
          <div className="small" style={{ marginBottom: 8, display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            {Object.entries(COLOR_BY_TYPE).map(([name, col]) => (
              <span key={name} style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                <span style={{ width: 10, height: 10, borderRadius: 999, background: col, display: 'inline-block' }}></span>
                {name}
              </span>
            ))}
          </div>

          <div className="map">
            <MapContainer center={center} zoom={7} style={{ height: '100%', width: '100%' }}>
              <TileLayer
                attribution="&copy; OpenStreetMap"
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />

              {data.filter(d => d.lat && d.lng).map(d => {
                const pos: [number, number] = [Number(d.lat), Number(d.lng)]
                const col = colorOf(d.jenis_bencana)
                return (
                  <CircleMarker
                    key={d.id}
                    center={pos}
                    radius={9}
                    pathOptions={{ color: col, fillColor: col, fillOpacity: 0.9 }}
                  >
                    <Popup>
                      <div style={{ minWidth: 230 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                          <span style={{ display: 'inline-block', width: 10, height: 10, borderRadius: 999, background: col }}></span>
                          <b>{d.jenis_bencana}</b>
                        </div>
                        <div>{d.desa}, {d.kecamatan}</div>
                        <div>KK/Jiwa: <b>{d.kk || 0}</b>/<b>{d.jiwa || 0}</b></div>
                        <div>RB/RS/RR: <b>{d.rumah_rb || 0}</b>/<b>{d.rumah_rs || 0}</b>/<b>{d.rumah_rr || 0}</b></div>
                        {typeof d.pengungsi === 'number' && <div>Pengungsi: <b>{d.pengungsi}</b></div>}
                        <div className="small">{new Date(d.reported_at).toLocaleString()}</div>
                        <div className="small">
                          <span className="status-dot" style={{ background: d.status === 'synced' ? '#22c55e' : '#f59e0b' }}></span>
                          {d.status}
                        </div>
                        {d.kondisi && <div className="small" style={{ marginTop: 6 }}><i>“{d.kondisi}”</i></div>}
                      </div>
                    </Popup>
                  </CircleMarker>
                )
              })}
            </MapContainer>
          </div>
        </div>
      </div>

      <div className="col-6">
        <div className="card" style={{ height: 360 }}>
          <h3>Jumlah Laporan per Jenis</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart
              data={byJenis}
              margin={{ top: 8, right: 8, bottom: 28, left: 8 }} // ruang legend
            >
              <XAxis
                dataKey="name"
                tick={{ fill: '#cbd5e1' }}
                axisLine={{ stroke: '#334155' }}
                tickLine={{ stroke: '#334155' }}
              />
              <YAxis
                allowDecimals={false}
                tick={{ fill: '#cbd5e1' }}
                axisLine={{ stroke: '#334155' }}
                tickLine={{ stroke: '#334155' }}
              />
              <Tooltip />
              <Legend verticalAlign="bottom" height={24} wrapperStyle={{ color: '#cbd5e1' }} />
              {/* set fill untuk warna legend (bar tetap diwarnai via <Cell/>) */}
              <Bar dataKey="total" name="Total" fill="#94a3b8">
                {byJenis.map((d, i) => (
                  <Cell key={i} fill={colorOf(d.name)} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="col-6">
        <div className="card" style={{ height: 360 }}>
          <h3>RB / RS / RR</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart margin={{ top: 8, right: 8, bottom: 28, left: 8 }}>
              <Pie
                data={rbrr}
                dataKey="value"
                nameKey="name"
                innerRadius={50}
                outerRadius={110}
                label={renderPieLabel}
                labelLine={false}
              >
                {rbrr.map((s, i) => (
                  <Cell key={i} fill={colorDamage(s.name)} />
                ))}
              </Pie>
              <Tooltip />
              <Legend verticalAlign="bottom" height={24} wrapperStyle={{ color: '#cbd5e1' }} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="col-12">
        <div className="card">
          <h3>Tabel</h3>
          <table className="table">
            <thead>
              <tr>
                <th>Waktu</th><th>Kecamatan</th><th>Desa</th><th>Jenis</th>
                <th>KK</th><th>Jiwa</th><th>RB</th><th>RS</th><th>RR</th><th>Status</th>
              </tr>
            </thead>
            <tbody>
              {data.map(d => (
                <tr key={d.id}>
                  <td>{new Date(d.reported_at).toLocaleString()}</td>
                  <td>{d.kecamatan}</td>
                  <td>{d.desa}</td>
                  <td>{d.jenis_bencana}</td>
                  <td>{d.kk || 0}</td>
                  <td>{d.jiwa || 0}</td>
                  <td>{d.rumah_rb || 0}</td>
                  <td>{d.rumah_rs || 0}</td>
                  <td>{d.rumah_rr || 0}</td>
                  <td>{d.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
