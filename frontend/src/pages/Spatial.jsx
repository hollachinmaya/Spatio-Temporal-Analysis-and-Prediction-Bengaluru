// src/pages/Spatial.jsx
import { useState } from 'react'
import { useApi } from '../hooks/useApi'
import { fetchHotspots, fetchPollutantProfile } from '../api/client'
import { aqiColor } from '../utils/aqi'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, Cell, ResponsiveContainer,
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis
} from 'recharts'
import { Card, CardHeader, SectionHeader, Spinner, ErrorBox, Select, InsightBox } from '../components/UI'

const STATIONS = ['BapujiNagar','BTM','Hebbal','Hombegowda','Jayanagar','Kadabasenahalli','Peenya','RVCE','Silkboard']

const TIP = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div style={{ background: 'rgba(5,10,20,0.95)', border: '1px solid rgba(0,200,255,0.2)', borderRadius: 8, padding: '10px 14px', fontSize: 12 }}>
      <div style={{ color: 'var(--text2)', marginBottom: 4 }}>{label}</div>
      {payload.map((p, i) => (
        <div key={i} style={{ color: p.color || 'var(--accent)', fontFamily: 'Space Mono, monospace' }}>{p.name}: <b>{typeof p.value === 'number' ? p.value.toFixed(1) : p.value}</b></div>
      ))}
    </div>
  )
}

function BangaloreMap({ hotspots }) {
  const latMin = 12.85, latMax = 13.08, lonMin = 77.47, lonMax = 77.72
  const W = 500, H = 380
  const toX = lon => ((lon - lonMin) / (lonMax - lonMin)) * (W - 80) + 40
  const toY = lat => H - ((lat - latMin) / (latMax - latMin)) * (H - 80) - 40
  const [hovered, setHovered] = useState(null)

  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', height: 380 }}>
      <defs>
        <filter id="glow2">
          <feGaussianBlur stdDeviation="3" result="b" />
          <feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
        <radialGradient id="bgGrad"><stop offset="0%" stopColor="rgba(0,200,255,0.04)" /><stop offset="100%" stopColor="transparent" /></radialGradient>
      </defs>
      <rect width={W} height={H} fill="var(--surface2)" rx="10" />
      <ellipse cx={W/2} cy={H/2} rx={200} ry={160} fill="url(#bgGrad)" />
      {/* City boundary */}
      <path d="M 60 340 Q 110 310 140 270 Q 170 230 240 200 Q 310 170 370 180 Q 430 195 450 240 Q 460 290 430 335 Q 400 375 330 385 Q 250 395 170 380 Q 100 365 60 340 Z"
        fill="rgba(0,200,255,0.03)" stroke="rgba(0,200,255,0.13)" strokeWidth="1.5" strokeDasharray="6,3" />
      {/* Roads */}
      <line x1="50" y1="190" x2="460" y2="190" stroke="rgba(255,255,255,0.04)" strokeWidth="2" />
      <line x1="250" y1="30"  x2="250" y2="365" stroke="rgba(255,255,255,0.04)" strokeWidth="2" />
      {/* North indicator */}
      <text x="468" y="52" fill="rgba(0,200,255,0.6)" fontSize="12" fontFamily="Space Mono">N</text>
      <polygon points="472,35 468,46 476,46" fill="rgba(0,200,255,0.5)" />
      {hotspots.map(h => {
        const x = toX(h.lon), y = toY(h.lat)
        const r = 10 + Math.max(0, (h.mean_aqi - 70) / 4)
        const clr = aqiColor(h.mean_aqi)
        const isH = hovered === h.station
        return (
          <g key={h.station} style={{ cursor: 'pointer' }}
            onMouseEnter={() => setHovered(h.station)}
            onMouseLeave={() => setHovered(null)}>
            <circle cx={x} cy={y} r={r + 10} fill={clr} opacity={isH ? 0.15 : 0.06} />
            <circle cx={x} cy={y} r={r + 4}  fill={clr} opacity={isH ? 0.2 : 0.1} />
            <circle cx={x} cy={y} r={r}       fill={clr} opacity={0.85} filter="url(#glow2)" stroke={clr} strokeWidth="1.5" />
            <text x={x} y={y + 1} textAnchor="middle" dominantBaseline="middle" fill="white" fontSize="9" fontWeight="bold" fontFamily="Space Mono">{Math.round(h.mean_aqi)}</text>
            <text x={x} y={y + r + 14} textAnchor="middle" fill={clr} fontSize="9" fontFamily="DM Sans" fontWeight="600">{h.station}</text>
            {isH && (
              <g>
                <rect x={x - 50} y={y - r - 42} width={100} height={34} rx="5" fill="rgba(5,10,20,0.95)" stroke={clr} strokeWidth="1" />
                <text x={x} y={y - r - 26} textAnchor="middle" fill={clr} fontSize="11" fontFamily="Space Mono" fontWeight="700">{h.station}</text>
                <text x={x} y={y - r - 14} textAnchor="middle" fill="var(--text2)" fontSize="10" fontFamily="DM Sans">AQI {h.mean_aqi} · {h.zone}</text>
              </g>
            )}
          </g>
        )
      })}
    </svg>
  )
}

export default function Spatial() {
  const { data: hotspots, loading, error } = useApi(fetchHotspots)
  const [radarStation, setRadarStation] = useState('BapujiNagar')
  const { data: profile, loading: profLoading } = useApi(() => fetchPollutantProfile(radarStation), [radarStation])

  if (loading) return <Spinner label="Detecting hotspots…" />
  if (error)   return <ErrorBox message={error} />

  const sorted = [...(hotspots || [])].sort((a, b) => b.mean_aqi - a.mean_aqi)
  const radarData = profile ? [
    { subject: 'PM2.5', val: profile.profile.PM2_5 },
    { subject: 'PM10',  val: profile.profile.PM10  },
    { subject: 'NO2',   val: profile.profile.NO2   },
    { subject: 'SO2',   val: profile.profile.SO2   },
    { subject: 'CO×10', val: (profile.profile.CO || 0) * 10 },
    { subject: 'Ozone', val: profile.profile.Ozone },
    { subject: 'NH3',   val: profile.profile.NH3   },
  ] : []

  const top3    = sorted.slice(0, 3).map(h => h.station).join(', ')
  const bottom2 = sorted.slice(-2).map(h => h.station).join(', ')

  return (
    <div className="fade-in" style={{ padding: 28, maxWidth: 1400 }}>
      <SectionHeader tag="SPATIAL ANALYSIS" title="Hotspot Detection" desc="Long-term spatial aggregation identifying structural hotspots and cold spots across Bangalore's urban morphology." />

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.6fr', gap: 18, marginBottom: 18 }}>
        {/* Map */}
        <Card>
          <CardHeader title="Station Map" badge="Hotspot Detection" badgeColor="orange" />
          <BangaloreMap hotspots={sorted} />
          <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', marginTop: 12 }}>
            {[['#cc2a36','Hotspot (>100)'],['#f5d020','Moderate (75–100)'],['#39ff8e','Cold Spot (<75)']].map(([c, l]) => (
              <div key={l} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: 'var(--text2)' }}>
                <div style={{ width: 10, height: 10, borderRadius: '50%', background: c }} />
                {l}
              </div>
            ))}
          </div>
        </Card>

        {/* Bar ranking */}
        <Card>
          <CardHeader title="Mean AQI by Station (2019–2024)" badge="Ranked" badgeColor="blue" />
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={sorted} margin={{ left: 10, right: 20 }}>
              <XAxis dataKey="station" tick={{ fill: 'var(--text2)', fontSize: 10 }} angle={-20} textAnchor="end" />
              <YAxis tick={{ fill: 'var(--text2)', fontSize: 11 }} domain={[0, 130]} />
              <Tooltip content={<TIP />} />
              <Bar dataKey="mean_aqi" name="Mean AQI" radius={[5,5,0,0]}>
                {sorted.map((h, i) => <Cell key={i} fill={aqiColor(h.mean_aqi)} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
          <InsightBox accent="var(--accent)">
            🔴 <b>Hotspots:</b> {top3} &nbsp;|&nbsp; 🟢 <b>Cold Spots:</b> {bottom2}
          </InsightBox>
        </Card>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 18 }}>
        {/* Radar */}
        <Card>
          <CardHeader title="Pollutant Profile" badge="Radar" badgeColor="green" />
          <Select label="Station:" value={radarStation} onChange={setRadarStation} options={STATIONS} />
          <div style={{ marginTop: 16 }}>
            {profLoading ? <Spinner label="Loading profile…" /> : (
              <ResponsiveContainer width="100%" height={260}>
                <RadarChart data={radarData}>
                  <PolarGrid stroke="rgba(0,200,255,0.1)" />
                  <PolarAngleAxis dataKey="subject" tick={{ fill: 'var(--text2)', fontSize: 11 }} />
                  <PolarRadiusAxis tick={{ fill: 'var(--text3)', fontSize: 9 }} />
                  <Radar dataKey="val" stroke="var(--accent)" fill="var(--accent)" fillOpacity={0.2} strokeWidth={2} />
                </RadarChart>
              </ResponsiveContainer>
            )}
          </div>
        </Card>

        {/* Max AQI */}
        <Card>
          <CardHeader title="Max AQI Events" badge="Extremes" badgeColor="orange" />
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={sorted} margin={{ bottom: 20 }}>
              <XAxis dataKey="station" tick={{ fill: 'var(--text2)', fontSize: 10 }} angle={-20} textAnchor="end" />
              <YAxis tick={{ fill: 'var(--text2)', fontSize: 11 }} />
              <Tooltip content={<TIP />} />
              <Bar dataKey="max_aqi" name="Max AQI" fill="rgba(204,42,54,0.75)" radius={[4,4,0,0]} />
              <Bar dataKey="std_aqi" name="Std Dev" fill="rgba(176,109,255,0.6)" radius={[4,4,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>
      </div>
    </div>
  )
}
