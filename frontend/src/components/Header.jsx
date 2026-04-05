// src/components/Header.jsx
import { useLocation } from 'react-router-dom'
import { Activity } from 'lucide-react'

const PAGE_META = {
  '/':            { title: 'Overview',          desc: 'City-wide air quality summary' },
  '/spatial':     { title: 'Spatial Hotspots',  desc: 'Pollution hotspot detection across zones' },
  '/temporal':    { title: 'Temporal Analysis', desc: 'Seasonal, yearly & weekday patterns' },
  '/correlation': { title: 'Correlation',       desc: 'Inter-station Pearson correlation matrix' },
  '/prediction':  { title: 'CNN-LSTM Prediction','desc': 'Deep learning forecast engine' },
  '/timeseries':  { title: 'Time Series',       desc: 'Monthly AQI trends 2019–2024' },
  '/code':        { title: 'Source Code',       desc: 'Full project implementation' },
}

export default function Header() {
  const { pathname } = useLocation()
  const meta = PAGE_META[pathname] || PAGE_META['/']

  return (
    <header style={{
      padding: '14px 28px', borderBottom: '1px solid var(--border)',
      background: 'rgba(5,10,20,0.85)', backdropFilter: 'blur(16px)',
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      position: 'sticky', top: 0, zIndex: 40,
    }}>
      <div>
        <h1 style={{ fontSize: 17, fontWeight: 700, color: 'var(--text)' }}>{meta.title}</h1>
        <p  style={{ fontSize: 12, color: 'var(--text3)', marginTop: 1 }}>{meta.desc}</p>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontFamily: 'Space Mono, monospace', fontSize: 18, fontWeight: 700, color: 'var(--accent)' }}>9</div>
          <div style={{ fontSize: 10, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: 1 }}>Stations</div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontFamily: 'Space Mono, monospace', fontSize: 18, fontWeight: 700, color: 'var(--text2)' }}>17,779</div>
          <div style={{ fontSize: 10, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: 1 }}>Records</div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: 'var(--accent3)', background: 'rgba(57,255,142,0.08)', border: '1px solid rgba(57,255,142,0.2)', padding: '6px 12px', borderRadius: 20, fontFamily: 'Space Mono, monospace' }}>
          <Activity size={12} />
          LIVE ANALYSIS
        </div>
      </div>
    </header>
  )
}
