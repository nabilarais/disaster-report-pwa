
export type DamageClass = 'RB' | 'RS' | 'RR'

export type Report = {
  id: string
  kecamatan: string
  desa: string
  dusun?: string
  rt?: string
  rw?: string
  jalan?: string
  jenis_bencana: string
  kk?: number
  jiwa?: number
  meninggal?: number
  hilang?: number
  luka_berat?: number
  luka_ringan?: number
  pengungsi?: number
  rumah_rb?: number
  rumah_rs?: number
  rumah_rr?: number
  jembatan?: number
  fasilitas_lainnya?: number
  kondisi?: string
  keterangan?: string
  lat?: number
  lng?: number
  reported_at: string
  photos: string[]
  status: 'pending' | 'synced'
  created_by?: string
}
