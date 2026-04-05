// src/components/Sidebar.jsx
import { NavLink } from 'react-router-dom'
import {
  LayoutDashboard, Map, Calendar, Link2,
  BrainCircuit, TrendingUp, Code2, ChevronRight
} from 'lucide-react'

const NAV = [
  { path: '/',            icon: LayoutDashboard, label: 'Overview',     tag: '01' },
  { path: '/spatial',     icon: Map,             label: 'Spatial',      tag: '02' },
  { path: '/temporal',    icon: Calendar,        label: 'Temporal',     tag: '03' },
  { path: '/correlation', icon: Link2,           label: 'Correlation',  tag: '04' },
  { path: '/prediction',  icon: BrainCircuit,    label: 'CNN-LSTM',     tag: '05' },
  { path: '/timeseries',  icon: TrendingUp,      label: 'Time Series',  tag: '06' },
  { path: '/code',        icon: Code2,           label: 'Source Code',  tag: '07' },
]

export default function Sidebar() {
  return (
    <aside
      style={{
        width: 220, minHeight: '100vh', flexShrink: 0,
        background: 'var(--surface)', borderRight: '1px solid var(--border)',
        display: 'flex', flexDirection: 'column',
        position: 'sticky', top: 0, zIndex: 50,
      }}
    >
      {/* Logo */}
      <div style={{ padding: '24px 20px', borderBottom: '1px solid var(--border)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 36, height: 36, borderRadius: 10,
            background: 'linear-gradient(135deg,#00c8ff,#b06dff)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 18, boxShadow: '0 0 16px rgba(0,200,255,0.3)',
          }}>🌫️</div>
          <div>
            <div style={{ fontFamily: 'Space Mono, monospace', fontSize: 11, fontWeight: 700, background: 'linear-gradient(90deg,#00c8ff,#b06dff)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              BLR AQI
            </div>
            <div style={{ fontSize: 10, color: 'var(--text3)' }}>Intelligence</div>
          </div>
        </div>
      </div>

      {/* Nav items */}
      <nav style={{ flex: 1, padding: '16px 12px', display: 'flex', flexDirection: 'column', gap: 4 }}>
        {NAV.map(({ path, icon: Icon, label, tag }) => (
          <NavLink
            key={path}
            to={path}
            end={path === '/'}
            style={({ isActive }) => ({
              display: 'flex', alignItems: 'center', gap: 10,
              padding: '9px 12px', borderRadius: 8, textDecoration: 'none',
              border: '1px solid',
              borderColor: isActive ? 'rgba(0,200,255,0.3)' : 'transparent',
              background:  isActive ? 'rgba(0,200,255,0.08)' : 'transparent',
              color:       isActive ? 'var(--accent)' : 'var(--text2)',
              transition: 'all .18s',
            })}
          >
            {({ isActive }) => (
              <>
                <Icon size={15} />
                <span style={{ flex: 1, fontSize: 13, fontWeight: isActive ? 600 : 400 }}>{label}</span>
                <span style={{ fontSize: 10, fontFamily: 'Space Mono, monospace', color: isActive ? 'var(--accent)' : 'var(--text3)' }}>{tag}</span>
                {isActive && <ChevronRight size={12} />}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Footer */}
      <div style={{ padding: '16px 20px', borderTop: '1px solid var(--border)', fontSize: 10, color: 'var(--text3)', lineHeight: 1.7 }}>
        <div style={{ fontFamily: 'Space Mono, monospace' }}>JSS STU · 2025–26</div>
        <div>ISE Department</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginTop: 6 }}>
          <div style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--accent3)', animation: 'pulse 2s infinite' }} />
          <span style={{ color: 'var(--accent3)' }}>API Connected</span>
        </div>
      </div>
    </aside>
  )
}
