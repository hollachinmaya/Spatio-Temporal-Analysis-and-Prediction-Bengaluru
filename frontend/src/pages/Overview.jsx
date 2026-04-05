// src/pages/Overview.jsx
import { useApi } from '../hooks/useApi'
import { fetchOverview } from '../api/client'
import { aqiColor, aqiLabel } from '../utils/aqi'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  RadarChart, Radar, PolarGrid, PolarAngleAxis, Cell
} from 'recharts'
import { Card, CardHeader, StatCard, AqiBadge, SectionHeader, Spinner, ErrorBox, InsightBox } from '../components/UI'

const CUSTOM_TOOLTIP = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div style={{ background: 'rgba(5,10,20,0.95)', border: '1px solid rgba(0,200,255,0.2)', borderRadius: 8, padding: '10px 14px', fontSize: 12 }}>
      <div style={{ color: 'var(--text2)', marginBottom: 4 }}>{label}</div>
      {payload.map((p, i) => (
        <div key={i} style={{ color: p.color || 'var(--accent)', fontFamily: 'Space Mono, monospace' }}>
          {p.name}: <b>{typeof p.value === 'number' ? p.value.toFixed(1) : p.value}</b>
        </div>
      ))}
    </div>
  )
}

export default function Overview() {
  const { data, loading, error } = useApi(fetchOverview)

  if (loading) return <Spinner label="Loading city overview…" />
  if (error)   return <ErrorBox message={error} />
  if (!data)   return null

  const { hotspot, pollutants } = data

  const pollutantChartData = pollutants.map(p => ({
    station: p.Station,
    'PM2.5': +p.PM2_5.toFixed(1),
    'PM10':  +p.PM10.toFixed(1),
    'NO2':   +p.NO2.toFixed(1),
  }))

  return (
    <div className="fade-in" style={{ padding: 28, maxWidth: 1400 }}>
      <SectionHeader
        tag="CITY OVERVIEW"
        title="Bangalore Air Quality Intelligence"
        desc="6-year spatiotemporal analysis across 9 monitoring stations · CPCB / KSPCB data"
      />

      {/* Stat grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(160px,1fr))', gap: 14, marginBottom: 24 }}>
        <StatCard icon="🏙️" value={data.stations}              label="Stations"       sub="CPCB / KSPCB"         accent="var(--accent)" />
        <StatCard icon="📊" value={data.total_records.toLocaleString()} label="Data Points" sub={data.date_range}  accent="var(--text2)" />
        <StatCard icon="📅" value="6 Years"                    label="Analysis Period" sub="Jan 2019 – Dec 2024"  accent="var(--text2)" />
        <StatCard icon="🌡️" value={data.avg_aqi}               label="City Avg AQI"   sub="All stations"         accent={aqiColor(data.avg_aqi)} />
        <StatCard icon="⚠️" value={data.max_aqi}               label="Peak AQI"       sub="Worst episode"        accent="#cc2a36" />
        <StatCard icon="🔴" value={data.worst_station}         label="Worst Station"  sub="Structural hotspot"   accent="#ff6b2b" />
        <StatCard icon="🟢" value={data.best_station}          label="Cleanest"       sub="Cold spot"            accent="var(--accent3)" />
      </div>

      {/* AQI Scale */}
      <Card style={{ marginBottom: 24 }}>
        <CardHeader title="AQI Health Categories" />
        <div style={{ display: 'flex', gap: 4, borderRadius: 8, overflow: 'hidden' }}>
          {[
            ['Good',       '0–50',   '#39ff8e'],
            ['Moderate',   '51–100', '#f5d020'],
            ['USG',        '101–150','#ff8c00'],
            ['Unhealthy',  '151–200','#ff6b2b'],
            ['V.Unhealthy','201–300','#cc2a36'],
            ['Hazardous',  '300+',   '#ff0040'],
          ].map(([label, range, color]) => (
            <div key={label} style={{ flex: 1, textAlign: 'center', padding: '8px 4px', background: color + '22', color, fontSize: 10, fontFamily: 'Space Mono, monospace', fontWeight: 600 }}>
              {label}<br />{range}
            </div>
          ))}
        </div>
      </Card>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 18, marginBottom: 18 }}>
        {/* Station Ranking */}
        <Card>
          <CardHeader title="Station AQI Ranking" badge="PM2.5 Based" badgeColor="orange" />
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={[...hotspot].reverse()} layout="vertical" margin={{ left: 10, right: 20 }}>
              <XAxis type="number" tick={{ fill: 'var(--text2)', fontSize: 11 }} />
              <YAxis type="category" dataKey="station" width={110} tick={{ fill: 'var(--text2)', fontSize: 11 }} />
              <Tooltip content={<CUSTOM_TOOLTIP />} />
              <Bar dataKey="mean_aqi" name="Mean AQI" radius={[0, 5, 5, 0]}>
                {hotspot.map((h, i) => (
                  <Cell key={i} fill={aqiColor(h.mean_aqi)} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </Card>

        {/* Pollutant Comparison */}
        <Card>
          <CardHeader title="Pollutant Profile by Station" badge="μg/m³ avg" badgeColor="purple" />
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={pollutantChartData} margin={{ bottom: 20 }}>
              <XAxis dataKey="station" tick={{ fill: 'var(--text2)', fontSize: 9 }} angle={-25} textAnchor="end" />
              <YAxis tick={{ fill: 'var(--text2)', fontSize: 11 }} />
              <Tooltip content={<CUSTOM_TOOLTIP />} />
              <Bar dataKey="PM2.5" fill="rgba(0,200,255,0.8)"   radius={[3,3,0,0]} />
              <Bar dataKey="PM10"  fill="rgba(176,109,255,0.8)" radius={[3,3,0,0]} />
              <Bar dataKey="NO2"   fill="rgba(255,107,43,0.8)"  radius={[3,3,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>
      </div>

      {/* Full station table */}
      <Card>
        <CardHeader title="Station Summary Table" badge="2019–2024" badgeColor="blue" />
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr>
                {['Rank','Station','Zone','Mean AQI','Max AQI','Std Dev','Status'].map(h => (
                  <th key={h} style={{ textAlign: 'left', padding: '8px 14px', fontSize: 10, textTransform: 'uppercase', letterSpacing: 1, color: 'var(--text3)', borderBottom: '1px solid var(--border)', fontFamily: 'Space Mono, monospace' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {hotspot.map((h, i) => (
                <tr key={h.station} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                  <td style={{ padding: '11px 14px' }}>
                    <span style={{ display: 'inline-flex', width: 24, height: 24, borderRadius: 6, alignItems: 'center', justifyContent: 'center', fontSize: 11, fontFamily: 'Space Mono, monospace', fontWeight: 700, background: aqiColor(h.mean_aqi) + '22', color: aqiColor(h.mean_aqi) }}>{i + 1}</span>
                  </td>
                  <td style={{ padding: '11px 14px', fontWeight: 600 }}>{h.station}</td>
                  <td style={{ padding: '11px 14px', color: 'var(--text2)' }}>{h.zone}</td>
                  <td style={{ padding: '11px 14px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div style={{ width: Math.min(h.mean_aqi / 1.5, 90), height: 4, borderRadius: 2, background: aqiColor(h.mean_aqi) }} />
                      <b style={{ color: aqiColor(h.mean_aqi), fontFamily: 'Space Mono, monospace' }}>{h.mean_aqi}</b>
                    </div>
                  </td>
                  <td style={{ padding: '11px 14px', color: '#cc2a36', fontFamily: 'Space Mono, monospace' }}>{h.max_aqi}</td>
                  <td style={{ padding: '11px 14px', color: 'var(--text2)', fontFamily: 'Space Mono, monospace' }}>±{h.std_aqi}</td>
                  <td style={{ padding: '11px 14px' }}><AqiBadge aqi={h.mean_aqi} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  )
}
