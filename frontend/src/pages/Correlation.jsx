// src/pages/Correlation.jsx
import { useApi } from '../hooks/useApi'
import { fetchCorrelation } from '../api/client'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, Cell, ResponsiveContainer
} from 'recharts'
import { Card, CardHeader, SectionHeader, Spinner, ErrorBox, InsightBox } from '../components/UI'

function corrColor(val) {
  if (val >= 0.8) return { bg: 'rgba(0,200,255,0.28)',   color: '#00c8ff' }
  if (val >= 0.5) return { bg: 'rgba(0,200,255,0.12)',   color: '#7fc8d4' }
  if (val >= 0)   return { bg: 'rgba(255,255,255,0.04)', color: 'var(--text3)' }
  return              { bg: 'rgba(255,107,43,0.15)',  color: '#ff6b2b' }
}

export default function Correlation() {
  const { data, loading, error } = useApi(fetchCorrelation)

  if (loading) return <Spinner label="Computing correlation matrix…" />
  if (error)   return <ErrorBox message={error} />
  if (!data)   return null

  const { stations, pairs, avg_per_station, overall_avg } = data

  return (
    <div className="fade-in" style={{ padding: 28, maxWidth: 1400 }}>
      <SectionHeader tag="SPATIAL CORRELATION" title="Inter-Station Correlation"
        desc="Pearson correlation between all station pairs. High r > 0.8 indicates regional pollution driven by city-wide air mass movements." />

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 18 }}>
        {/* Heatmap */}
        <Card>
          <CardHeader title="Correlation Matrix (Pearson r)" badge="PM2.5 AQI" badgeColor="blue" />
          <div style={{ overflowX: 'auto' }}>
            <table style={{ borderCollapse: 'collapse', fontSize: 11, width: '100%' }}>
              <thead>
                <tr>
                  <th style={{ padding: '8px 10px', color: 'var(--text3)', fontFamily: 'Space Mono, monospace', fontSize: 10 }}></th>
                  {stations.map(s => (
                    <th key={s} style={{ padding: '8px 10px', color: 'var(--text2)', fontFamily: 'Space Mono, monospace', fontSize: 10, whiteSpace: 'nowrap', textAlign: 'center' }}>
                      {s.slice(0, 6)}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {stations.map(s1 => (
                  <tr key={s1}>
                    <th style={{ padding: '8px 10px', color: 'var(--text2)', fontFamily: 'Space Mono, monospace', fontSize: 10, textAlign: 'left', whiteSpace: 'nowrap' }}>{s1.slice(0, 8)}</th>
                    {stations.map(s2 => {
                      const pair = pairs.find(p => p.station1 === s1 && p.station2 === s2)
                      const val  = pair?.value
                      if (val === undefined) return <td key={s2} style={{ padding: '8px 12px', textAlign: 'center', color: 'var(--text3)' }}>—</td>
                      const self = s1 === s2
                      const { bg, color } = self
                        ? { bg: 'rgba(57,255,142,0.15)', color: '#39ff8e' }
                        : corrColor(val)
                      return (
                        <td key={s2} title={`${s1} vs ${s2}: ${val}`}
                          style={{ padding: '8px 12px', textAlign: 'center', background: bg, color,
                            fontFamily: 'Space Mono, monospace', fontWeight: 600,
                            border: '1px solid rgba(0,200,255,0.05)', cursor: 'default' }}>
                          {val.toFixed(2)}
                        </td>
                      )
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <InsightBox>
            🔗 <b>Network avg r = </b>
            <span style={{ color: 'var(--accent)', fontFamily: 'Space Mono, monospace' }}>{overall_avg}</span>
            {overall_avg > 0.7
              ? ' — High correlation suggests Bangalore\'s pollution is largely a regional phenomenon.'
              : ' — Moderate correlation indicates significant localized emission source influence.'}
          </InsightBox>
        </Card>

        {/* Avg correlation bar */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
          <Card>
            <CardHeader title="Avg Correlation per Station" badge="r score" badgeColor="green" />
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={[...avg_per_station].sort((a,b)=>b.avg_r-a.avg_r)} layout="vertical" margin={{ left: 10, right: 20 }}>
                <XAxis type="number" domain={[0,1]} tick={{ fill: 'var(--text2)', fontSize: 10 }} />
                <YAxis type="category" dataKey="station" width={105} tick={{ fill: 'var(--text2)', fontSize: 10 }} />
                <Tooltip formatter={v => [v.toFixed(3), 'Avg r']} contentStyle={{ background: 'rgba(5,10,20,0.95)', border: '1px solid rgba(0,200,255,0.2)', borderRadius: 8, fontSize: 12 }} />
                <Bar dataKey="avg_r" name="Avg r" radius={[0,5,5,0]}>
                  {avg_per_station.map((d, i) => (
                    <Cell key={i} fill={d.avg_r > 0.7 ? '#00c8ff' : d.avg_r > 0.5 ? '#b06dff' : '#ff6b2b'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </Card>

          {/* Legend */}
          <Card>
            <CardHeader title="Interpretation" badge="Guide" badgeColor="purple" />
            {[
              ['#00c8ff', 'r > 0.8', 'Strong regional coupling'],
              ['#b06dff', '0.5–0.8', 'Moderate correlation'],
              ['#ff6b2b', '< 0.5',   'Localized emissions dominate'],
              ['#39ff8e', '= 1.0',   'Self-correlation (diagonal)'],
            ].map(([color, range, label]) => (
              <div key={range} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0', borderBottom: '1px solid var(--border)', fontSize: 12 }}>
                <div style={{ width: 10, height: 10, borderRadius: '50%', background: color, flexShrink: 0 }} />
                <span style={{ fontFamily: 'Space Mono, monospace', color, fontSize: 11, width: 55 }}>{range}</span>
                <span style={{ color: 'var(--text2)' }}>{label}</span>
              </div>
            ))}
            <div style={{ marginTop: 14, padding: 12, background: 'var(--surface)', borderRadius: 8, border: '1px solid var(--border)', textAlign: 'center' }}>
              <div style={{ fontSize: 10, color: 'var(--text3)', marginBottom: 4 }}>NETWORK AVG r</div>
              <div style={{ fontFamily: 'Space Mono, monospace', fontSize: 26, fontWeight: 700, color: 'var(--accent)' }}>{overall_avg}</div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}
