// src/pages/Temporal.jsx
import { useState } from 'react'
import { useApi } from '../hooks/useApi'
import { fetchSeasonal, fetchYearly, fetchWeekly, fetchSeasonalStation } from '../api/client'
import { STATIONS, STATION_COLORS } from '../utils/aqi'
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, Tooltip,
  CartesianGrid, Legend, ResponsiveContainer, ReferenceLine, Cell
} from 'recharts'
import { Card, CardHeader, SectionHeader, Spinner, ErrorBox, Select, InsightBox } from '../components/UI'

const TIP = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div style={{ background: 'rgba(5,10,20,0.95)', border: '1px solid rgba(0,200,255,0.2)', borderRadius: 8, padding: '10px 14px', fontSize: 12 }}>
      <div style={{ color: 'var(--text2)', marginBottom: 4 }}>{label}</div>
      {payload.map((p, i) => (
        <div key={i} style={{ color: p.color || 'var(--accent)', fontFamily: 'Space Mono,monospace' }}>
          {p.name}: <b>{typeof p.value === 'number' ? p.value.toFixed(1) : p.value}</b>
        </div>
      ))}
    </div>
  )
}

export default function Temporal() {
  const { data: seasonal } = useApi(fetchSeasonal)
  const { data: yearly   } = useApi(fetchYearly)
  const { data: weekly   } = useApi(fetchWeekly)
  const [selStation, setSelStation] = useState('BapujiNagar')
  const { data: stationSeasonal, loading: stLoading } = useApi(
    () => fetchSeasonalStation(selStation), [selStation]
  )

  const loading = !seasonal || !yearly || !weekly

  // Build yearly pivot: [{year, Station1, Station2...}]
  const yearlyPivot = (() => {
    if (!yearly) return []
    const years = [...new Set(yearly.map(r => r.year))].sort()
    return years.map(yr => {
      const row = { year: yr }
      yearly.filter(r => r.year === yr).forEach(r => { row[r.station] = r.mean_aqi })
      return row
    })
  })()

  // Weekly bar colors
  const weeklyData = weekly?.data?.map(d => ({
    ...d,
    color: ['Sat','Sun'].includes(d.day) ? '#39ff8e' : '#00c8ff'
  })) || []

  const maxMonth = seasonal?.reduce((a, b) => b.PM2_5_AQI > a.PM2_5_AQI ? b : a, { PM2_5_AQI: 0 })
  const minMonth = seasonal?.reduce((a, b) => b.PM2_5_AQI < a.PM2_5_AQI ? b : a, { PM2_5_AQI: 9999 })

  if (loading) return <Spinner label="Loading temporal analysis…" />

  return (
    <div className="fade-in" style={{ padding: 28, maxWidth: 1400 }}>
      <SectionHeader tag="TEMPORAL DECOMPOSITION" title="Temporal Analysis"
        desc="Seasonal cycles, COVID-19 dip, and weekday–weekend anthropogenic patterns." />

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 18, marginBottom: 18 }}>
        {/* Seasonal */}
        <Card>
          <CardHeader title="Seasonal Pattern (City Avg)" badge="Monthly" badgeColor="blue" />
          <ResponsiveContainer width="100%" height={240}>
            <LineChart data={seasonal}>
              <CartesianGrid stroke="rgba(0,200,255,0.06)" />
              <XAxis dataKey="month_name" tick={{ fill: 'var(--text2)', fontSize: 11 }} />
              <YAxis tick={{ fill: 'var(--text2)', fontSize: 11 }} domain={[60, 130]} />
              <Tooltip content={<TIP />} />
              <Line dataKey="PM2_5_AQI" name="AQI" stroke="var(--accent)" strokeWidth={2.5}
                dot={{ fill: 'var(--accent)', r: 4 }} activeDot={{ r: 6 }} />
            </LineChart>
          </ResponsiveContainer>
          {maxMonth && (
            <InsightBox accent="var(--accent)">
              🔺 <b>Peak:</b> {maxMonth.month_name} (AQI {maxMonth.PM2_5_AQI?.toFixed(1)}) — Winter inversion traps pollutants.&nbsp;
              🔻 <b>Lowest:</b> {minMonth.month_name} (AQI {minMonth.PM2_5_AQI?.toFixed(1)}) — Monsoon washout.
            </InsightBox>
          )}
        </Card>

        {/* Weekday vs Weekend */}
        <Card>
          <CardHeader title="Weekday vs Weekend Effect" badge="Transport Analysis" badgeColor="orange" />
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={weeklyData} margin={{ top: 5 }}>
              <CartesianGrid stroke="rgba(0,200,255,0.06)" />
              <XAxis dataKey="day" tick={{ fill: 'var(--text2)', fontSize: 12 }} />
              <YAxis tick={{ fill: 'var(--text2)', fontSize: 11 }} domain={[80, 110]} />
              <Tooltip content={<TIP />} />
              <Bar dataKey="mean_aqi" name="Mean AQI" radius={[5,5,0,0]}>
                {weeklyData.map((d, i) => <Cell key={i} fill={d.color} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
          {weekly && (
            <InsightBox accent="var(--accent2)">
              📈 <b>Weekday avg:</b> {weekly.weekday_avg} vs <b>Weekend avg:</b> {weekly.weekend_avg} —
              Δ {Math.abs(weekly.delta).toFixed(1)} AQI units
              {weekly.delta > 0 ? ' — vehicular emissions drive weekday peaks.' : '.'}
            </InsightBox>
          )}
        </Card>
      </div>

      {/* Yearly trend */}
      <Card style={{ marginBottom: 18 }}>
        <CardHeader title="Yearly AQI Trends (All Stations)" badge="2019–2024 · COVID Analysis" badgeColor="purple" />
        <ResponsiveContainer width="100%" height={320}>
          <LineChart data={yearlyPivot} margin={{ right: 20 }}>
            <CartesianGrid stroke="rgba(0,200,255,0.05)" />
            <XAxis dataKey="year" tick={{ fill: 'var(--text2)', fontSize: 12 }} />
            <YAxis tick={{ fill: 'var(--text2)', fontSize: 11 }} domain={[50, 140]} />
            <Tooltip content={<TIP />} />
            <Legend wrapperStyle={{ fontSize: 11, color: 'var(--text2)' }} />
            <ReferenceLine x={2020} stroke="rgba(255,107,43,0.4)" strokeDasharray="5,4" label={{ value: 'COVID-19', fill: '#ff6b2b', fontSize: 10 }} />
            {STATIONS.map((s, i) => (
              <Line key={s} type="monotone" dataKey={s} stroke={STATION_COLORS[i]}
                strokeWidth={2} dot={{ r: 3 }} activeDot={{ r: 5 }} connectNulls />
            ))}
          </LineChart>
        </ResponsiveContainer>
        <InsightBox accent="var(--accent4)">
          📉 <b>2020 COVID Dip:</b> Lockdown restrictions caused notable AQI reduction across most stations due to reduced traffic and industrial activity.&nbsp;
          📈 <b>2021–2024 Rebound:</b> Post-pandemic economic recovery drove AQI back toward pre-COVID levels.
        </InsightBox>
      </Card>

      {/* Per-station seasonal */}
      <Card>
        <CardHeader title="Monthly Seasonal Pattern (Per Station)" badge="Comparison" badgeColor="green" />
        <div style={{ marginBottom: 14 }}>
          <Select label="Station:" value={selStation} onChange={setSelStation} options={STATIONS} />
        </div>
        {stLoading ? <Spinner label="Loading…" /> : (
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={stationSeasonal}>
              <CartesianGrid stroke="rgba(0,200,255,0.06)" />
              <XAxis dataKey="month_name" tick={{ fill: 'var(--text2)', fontSize: 11 }} />
              <YAxis tick={{ fill: 'var(--text2)', fontSize: 11 }} />
              <Tooltip content={<TIP />} />
              <Bar dataKey="PM2_5_AQI" name={`${selStation} AQI`} radius={[4,4,0,0]}>
                {(stationSeasonal || []).map((d, i) => (
                  <Cell key={i} fill={`hsl(${200 - d.PM2_5_AQI},80%,60%)`} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </Card>
    </div>
  )
}
