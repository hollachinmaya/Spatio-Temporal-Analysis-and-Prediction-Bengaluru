// src/pages/TimeSeries.jsx
import { useState } from 'react'
import { useApi } from '../hooks/useApi'
import { fetchMonthlyAll, fetchMonthlyStation, fetchYoY, fetchVolatility } from '../api/client'
import { STATIONS, STATION_COLORS, stationColor } from '../utils/aqi'
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, Tooltip,
  CartesianGrid, Legend, ResponsiveContainer, ReferenceLine, Cell
} from 'recharts'
import { Card, CardHeader, SectionHeader, Spinner, ErrorBox, Select, TabBtn } from '../components/UI'

const TIP = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div style={{ background: 'rgba(5,10,20,0.95)', border: '1px solid rgba(0,200,255,0.2)', borderRadius: 8, padding: '10px 14px', fontSize: 12, maxWidth: 200 }}>
      <div style={{ color: 'var(--text2)', marginBottom: 4, fontFamily: 'Space Mono, monospace', fontSize: 10 }}>{label}</div>
      {payload.slice(0, 6).map((p, i) => (
        <div key={i} style={{ color: p.color || 'var(--accent)', fontFamily: 'Space Mono, monospace', fontSize: 11 }}>
          {p.name}: <b>{typeof p.value === 'number' ? p.value.toFixed(1) : p.value}</b>
        </div>
      ))}
    </div>
  )
}

export default function TimeSeries() {
  const [mode, setMode] = useState('all')
  const [selStation, setSelStation] = useState('BapujiNagar')

  const { data: allMonthly,     loading: l1 } = useApi(fetchMonthlyAll)
  const { data: stationMonthly, loading: l2 } = useApi(() => fetchMonthlyStation(selStation), [selStation])
  const { data: yoy,            loading: l3 } = useApi(fetchYoY)
  const { data: vol,            loading: l4 } = useApi(fetchVolatility)

  const loading = l1 || l3 || l4

  // Build all-stations pivot for multi-line chart
  const allPivot = (() => {
    if (!allMonthly) return []
    const months = [...new Set(allMonthly.map(r => r.month))].sort()
    return months.map(m => {
      const row = { month: m }
      allMonthly.filter(r => r.month === m).forEach(r => { row[r.station] = r.aqi })
      return row
    })
  })()

  // YoY pivot per station
  const yoyStations = yoy ? [...new Set(yoy.map(r => r.station))] : []
  const yoyYears    = yoy ? [...new Set(yoy.map(r => r.year))].sort() : []
  const yoyPivot    = yoyYears.map(yr => {
    const row = { year: yr }
    yoy?.filter(r => r.year === yr).forEach(r => { row[r.station] = r.delta })
    return row
  })

  if (loading) return <Spinner label="Loading time series…" />

  return (
    <div className="fade-in" style={{ padding: 28, maxWidth: 1400 }}>
      <SectionHeader tag="TIME SERIES EXPLORER" title="Monthly AQI Trends"
        desc="Monthly-aggregated trajectories revealing long-term pollution dynamics and inter-zone divergence patterns (2019–2024)." />

      {/* Mode toggle */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 18, flexWrap: 'wrap', alignItems: 'center' }}>
        <TabBtn active={mode === 'all'}    onClick={() => setMode('all')}>All Stations</TabBtn>
        <TabBtn active={mode === 'single'} onClick={() => setMode('single')}>Single Station</TabBtn>
        {mode === 'single' && (
          <Select value={selStation} onChange={setSelStation} options={STATIONS} />
        )}
      </div>

      {/* Main time series */}
      <Card style={{ marginBottom: 18 }}>
        <CardHeader
          title={mode === 'all' ? 'All Stations — Monthly AQI (2019–2024)' : `${selStation} — Monthly AQI (2019–2024)`}
          badge="COVID-19 Dip Visible (2020)"
          badgeColor="blue"
        />
        {mode === 'all' ? (
          <ResponsiveContainer width="100%" height={360}>
            <LineChart data={allPivot} margin={{ right: 20 }}>
              <CartesianGrid stroke="rgba(0,200,255,0.04)" />
              <XAxis dataKey="month" tick={{ fill: 'var(--text2)', fontSize: 9 }} tickCount={24} angle={-35} textAnchor="end" height={50} />
              <YAxis tick={{ fill: 'var(--text2)', fontSize: 11 }} label={{ value: 'PM2.5 AQI', angle: -90, position: 'insideLeft', fill: 'var(--text2)', fontSize: 11 }} />
              <Tooltip content={<TIP />} />
              <Legend wrapperStyle={{ fontSize: 10, color: 'var(--text2)' }} />
              <ReferenceLine x="2020-04" stroke="rgba(255,107,43,0.35)" strokeDasharray="5,4" label={{ value: 'Lockdown', fill: '#ff6b2b', fontSize: 9 }} />
              {STATIONS.map((s, i) => (
                <Line key={s} type="monotone" dataKey={s} stroke={STATION_COLORS[i]}
                  strokeWidth={1.5} dot={false} connectNulls />
              ))}
            </LineChart>
          </ResponsiveContainer>
        ) : (
          l2 ? <Spinner /> : (
            <ResponsiveContainer width="100%" height={360}>
              <LineChart data={stationMonthly?.map(d => ({ month: d.month, aqi: d.aqi }))}>
                <CartesianGrid stroke="rgba(0,200,255,0.04)" />
                <XAxis dataKey="month" tick={{ fill: 'var(--text2)', fontSize: 9 }} angle={-35} textAnchor="end" height={50} />
                <YAxis tick={{ fill: 'var(--text2)', fontSize: 11 }} />
                <Tooltip content={<TIP />} />
                <ReferenceLine x="2020-04" stroke="rgba(255,107,43,0.35)" strokeDasharray="5,4" label={{ value: 'Lockdown', fill: '#ff6b2b', fontSize: 9 }} />
                <Line dataKey="aqi" name={selStation} stroke={stationColor(selStation)} strokeWidth={2.5} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          )
        )}
      </Card>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 18 }}>
        {/* YoY change */}
        <Card>
          <CardHeader title="Year-over-Year Δ AQI" badge="Change Analysis" badgeColor="orange" />
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={yoyPivot} margin={{ right: 20 }}>
              <CartesianGrid stroke="rgba(0,200,255,0.05)" />
              <XAxis dataKey="year" tick={{ fill: 'var(--text2)', fontSize: 12 }} />
              <YAxis tick={{ fill: 'var(--text2)', fontSize: 11 }} label={{ value: 'ΔAQI', angle: -90, position: 'insideLeft', fill: 'var(--text2)', fontSize: 11 }} />
              <Tooltip content={<TIP />} />
              <Legend wrapperStyle={{ fontSize: 10 }} />
              <ReferenceLine y={0} stroke="rgba(255,255,255,0.2)" strokeDasharray="4,3" />
              {yoyStations.slice(0, 5).map((s, i) => (
                <Line key={s} type="monotone" dataKey={s} stroke={STATION_COLORS[i]}
                  strokeWidth={2} dot={{ r: 3 }} connectNulls />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </Card>

        {/* Volatility */}
        <Card>
          <CardHeader title="Station AQI Volatility" badge="Std Deviation" badgeColor="purple" />
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={vol} layout="vertical" margin={{ left: 10, right: 20 }}>
              <XAxis type="number" tick={{ fill: 'var(--text2)', fontSize: 11 }} />
              <YAxis type="category" dataKey="station" width={110} tick={{ fill: 'var(--text2)', fontSize: 11 }} />
              <Tooltip formatter={v => [v.toFixed(1), 'Std Dev']} contentStyle={{ background: 'rgba(5,10,20,0.95)', border: '1px solid rgba(0,200,255,0.2)', borderRadius: 8, fontSize: 12 }} />
              <Bar dataKey="std_aqi" name="Std Dev" radius={[0,5,5,0]}>
                {(vol || []).map((d, i) => (
                  <Cell key={i} fill={STATION_COLORS[STATIONS.indexOf(d.station)] || '#00c8ff'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </Card>
      </div>
    </div>
  )
}
