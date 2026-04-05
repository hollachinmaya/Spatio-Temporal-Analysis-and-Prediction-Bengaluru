// src/components/UI.jsx
import { Loader2 } from 'lucide-react'

/* ── Card ──────────────────────────────────────────────────────────────────── */
export function Card({ children, className = '' }) {
  return (
    <div
      className={`rounded-2xl border p-5 relative overflow-hidden ${className}`}
      style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}
    >
      {children}
    </div>
  )
}

export function CardHeader({ title, badge, badgeColor = 'blue' }) {
  const colors = {
    blue:   { bg: 'rgba(0,200,255,0.1)',   border: 'rgba(0,200,255,0.25)',   text: '#00c8ff' },
    orange: { bg: 'rgba(255,107,43,0.1)',  border: 'rgba(255,107,43,0.25)',  text: '#ff6b2b' },
    green:  { bg: 'rgba(57,255,142,0.1)',  border: 'rgba(57,255,142,0.25)', text: '#39ff8e' },
    purple: { bg: 'rgba(176,109,255,0.1)', border: 'rgba(176,109,255,0.25)',text: '#b06dff' },
  }
  const c = colors[badgeColor] || colors.blue
  return (
    <div className="flex items-center justify-between mb-4">
      <span style={{ fontFamily: 'Space Mono, monospace', fontSize: 11, textTransform: 'uppercase', letterSpacing: 2, color: 'var(--text2)' }}>
        {title}
      </span>
      {badge && (
        <span style={{ fontSize: 10, padding: '3px 10px', borderRadius: 20, fontFamily: 'Space Mono, monospace', background: c.bg, border: `1px solid ${c.border}`, color: c.text }}>
          {badge}
        </span>
      )}
    </div>
  )
}

/* ── Spinner ───────────────────────────────────────────────────────────────── */
export function Spinner({ size = 24, label = 'Loading…' }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-16">
      <Loader2 size={size} color="var(--accent)" className="animate-spin-slow" />
      <span style={{ fontSize: 12, color: 'var(--text3)', fontFamily: 'Space Mono, monospace' }}>{label}</span>
    </div>
  )
}

/* ── Error ─────────────────────────────────────────────────────────────────── */
export function ErrorBox({ message }) {
  return (
    <div className="rounded-xl p-4 text-sm" style={{ background: 'rgba(255,107,43,0.08)', border: '1px solid rgba(255,107,43,0.3)', color: '#ff6b2b', fontFamily: 'Space Mono, monospace' }}>
      ⚠ {message}
    </div>
  )
}

/* ── StatCard ──────────────────────────────────────────────────────────────── */
export function StatCard({ icon, value, label, sub, accent }) {
  return (
    <div
      className="rounded-2xl p-5 relative overflow-hidden hover:-translate-y-0.5 transition-transform"
      style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
    >
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: `linear-gradient(90deg, ${accent || 'var(--accent)'}, transparent)` }} />
      <div style={{ fontSize: 22, marginBottom: 8 }}>{icon}</div>
      <div style={{ fontFamily: 'Space Mono, monospace', fontSize: 26, fontWeight: 700, color: accent || 'var(--text)' }}>{value}</div>
      <div style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: 1, color: 'var(--text3)', marginTop: 4 }}>{label}</div>
      {sub && <div style={{ fontSize: 12, color: 'var(--text2)', marginTop: 3 }}>{sub}</div>}
    </div>
  )
}

/* ── Select ────────────────────────────────────────────────────────────────── */
export function Select({ value, onChange, options, label }) {
  return (
    <div className="flex items-center gap-2">
      {label && <span style={{ fontSize: 12, color: 'var(--text3)' }}>{label}</span>}
      <select
        value={value}
        onChange={e => onChange(e.target.value)}
        style={{
          background: 'var(--surface2)', border: '1px solid var(--border)', color: 'var(--text)',
          padding: '7px 12px', borderRadius: 8, fontSize: 13, fontFamily: 'DM Sans, sans-serif', cursor: 'pointer'
        }}
      >
        {options.map(o => (
          <option key={o.value ?? o} value={o.value ?? o}>{o.label ?? o}</option>
        ))}
      </select>
    </div>
  )
}

/* ── AqiBadge ──────────────────────────────────────────────────────────────── */
export function AqiBadge({ aqi }) {
  const { text, bg, color } = aqiLabelHelper(aqi)
  return (
    <span style={{ background: bg, color, border: `1px solid ${color}44`, borderRadius: 20, padding: '2px 10px', fontSize: 11, fontWeight: 600 }}>
      {text}
    </span>
  )
}
function aqiLabelHelper(aqi) {
  if (aqi <= 50)  return { text: 'Good',        bg: 'rgba(57,255,142,0.15)',  color: '#39ff8e' }
  if (aqi <= 100) return { text: 'Moderate',    bg: 'rgba(245,208,32,0.15)', color: '#f5d020' }
  if (aqi <= 150) return { text: 'USG',         bg: 'rgba(255,140,0,0.15)',  color: '#ff8c00' }
  if (aqi <= 200) return { text: 'Unhealthy',   bg: 'rgba(255,107,43,0.15)', color: '#ff6b2b' }
  if (aqi <= 300) return { text: 'V.Unhealthy', bg: 'rgba(204,42,54,0.15)',  color: '#cc2a36' }
  return               { text: 'Hazardous',     bg: 'rgba(126,0,35,0.15)',   color: '#ff0040' }
}

/* ── InsightBox ────────────────────────────────────────────────────────────── */
export function InsightBox({ children, accent = 'var(--accent)' }) {
  return (
    <div style={{ background: 'var(--surface2)', borderRadius: 8, borderLeft: `3px solid ${accent}`, padding: '10px 14px', fontSize: 12, color: 'var(--text2)', marginTop: 14, lineHeight: 1.7 }}>
      {children}
    </div>
  )
}

/* ── SectionHeader ─────────────────────────────────────────────────────────── */
export function SectionHeader({ tag, title, desc }) {
  return (
    <div className="mb-6">
      <p style={{ fontFamily: 'Space Mono, monospace', fontSize: 11, textTransform: 'uppercase', letterSpacing: 3, color: 'var(--accent)', marginBottom: 4 }}>
        // {tag}
      </p>
      <h2 style={{ fontSize: 22, fontWeight: 700, color: 'var(--text)' }}>{title}</h2>
      {desc && <p style={{ fontSize: 14, color: 'var(--text2)', marginTop: 4 }}>{desc}</p>}
    </div>
  )
}

/* ── Tab Buttons ───────────────────────────────────────────────────────────── */
export function TabBtn({ active, onClick, children }) {
  return (
    <button
      onClick={onClick}
      style={{
        padding: '7px 16px', borderRadius: 7, fontSize: 13, fontFamily: 'Space Mono, monospace',
        cursor: 'pointer', border: '1px solid',
        borderColor: active ? 'rgba(0,200,255,0.35)' : 'var(--border)',
        background:  active ? 'rgba(0,200,255,0.1)'  : 'transparent',
        color:       active ? 'var(--accent)'         : 'var(--text2)',
        transition: 'all .2s',
      }}
    >
      {children}
    </button>
  )
}
