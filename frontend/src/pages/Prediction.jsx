// src/pages/Prediction.jsx
import { useState, useCallback } from 'react'
import { useLazyApi } from '../hooks/useApi'
import { trainStation } from '../api/client'
import { STATIONS, MODEL_COLORS } from '../utils/aqi'
import {
  LineChart, Line, BarChart, Bar, ScatterChart, Scatter,
  XAxis, YAxis, Tooltip, CartesianGrid, Legend,
  ResponsiveContainer, ReferenceLine
} from 'recharts'
import { Card, CardHeader, SectionHeader, Spinner, ErrorBox, Select, InsightBox } from '../components/UI'
import { BrainCircuit, Zap } from 'lucide-react'

const TIP = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div style={{ background: 'rgba(5,10,20,0.95)', border: '1px solid rgba(0,200,255,0.2)', borderRadius: 8, padding: '10px 14px', fontSize: 12 }}>
      <div style={{ color: 'var(--text2)', marginBottom: 4 }}>{label}</div>
      {payload.map((p, i) => (
        <div key={i} style={{ color: p.color || 'var(--accent)', fontFamily: 'Space Mono, monospace' }}>
          {p.name}: <b>{typeof p.value === 'number' ? p.value.toFixed(2) : p.value}</b>
        </div>
      ))}
    </div>
  )
}

// Architecture layer diagram
function ArchDiagram({ arch }) {
  const layers = arch?.layers || []
  const icons = { input: '→', conv: '⊕', pool: '↓', dense: '●', output: '★' }
  const colors = { input: '#4a6a8a', conv: '#00c8ff', pool: '#39ff8e', dense: '#b06dff', output: '#ff6b2b' }
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0, flexWrap: 'wrap', padding: '16px 0' }}>
      {layers.map((l, i) => (
        <div key={i} style={{ display: 'flex', alignItems: 'center' }}>
          <div style={{ background: colors[l.type] + '15', border: `1.5px solid ${colors[l.type]}44`, borderRadius: 10, padding: '12px 14px', textAlign: 'center', minWidth: 90 }}>
            <div style={{ fontSize: 16, marginBottom: 3 }}>{icons[l.type]}</div>
            <div style={{ fontFamily: 'Space Mono, monospace', fontSize: 11, fontWeight: 700, color: colors[l.type] }}>{l.name}</div>
            <div style={{ fontSize: 9,  color: 'var(--text2)', marginTop: 2 }}>{l.shape}</div>
            {l.params && <div style={{ fontSize: 9, color: 'var(--text3)', marginTop: 2 }}>{l.params}</div>}
          </div>
          {i < layers.length - 1 && <div style={{ color: 'var(--text3)', fontSize: 16, margin: '0 5px' }}>→</div>}
        </div>
      ))}
    </div>
  )
}

// Metric comparison cards
function ModelCard({ name, metrics, selected, onSelect }) {
  const color = MODEL_COLORS[name] || 'var(--text2)'
  const icons = { 'CNN-LSTM': '🧠', 'Random Forest': '🌲', 'Linear Regression': '📏' }
  return (
    <div onClick={onSelect} style={{
      background: 'var(--surface2)', borderRadius: 12, padding: 18,
      border: `1px solid ${selected ? color + '60' : 'var(--border)'}`,
      cursor: 'pointer', transition: 'all .2s',
      boxShadow: selected ? `0 0 14px ${color}22` : 'none',
      position: 'relative', overflow: 'hidden',
    }}>
      {selected && <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: color }} />}
      <div style={{ fontSize: 20, marginBottom: 6 }}>{icons[name]}</div>
      <div style={{ fontFamily: 'Space Mono, monospace', fontSize: 13, fontWeight: 700, color, marginBottom: 10 }}>{name}</div>
      {metrics ? (
        <>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 4, color: 'var(--text2)' }}>
            <span>R²</span><span style={{ color, fontFamily: 'Space Mono, monospace', fontSize: 16, fontWeight: 700 }}>{metrics.r2}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 4, color: 'var(--text2)' }}>
            <span>RMSE</span><span style={{ fontFamily: 'Space Mono, monospace' }}>{metrics.rmse}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: 'var(--text2)' }}>
            <span>MAE</span><span style={{ fontFamily: 'Space Mono, monospace' }}>{metrics.mae}</span>
          </div>
        </>
      ) : <div style={{ color: 'var(--text3)', fontSize: 12 }}>—</div>}
    </div>
  )
}

export default function Prediction() {
  const [station, setStation]   = useState('Hombegowda')
  const [selected, setSelected] = useState('CNN-LSTM')
  const { data, loading, error, trigger } = useLazyApi(trainStation)

  const run = useCallback(() => trigger(station), [station, trigger])

  // Scatter data: actual vs predicted
  const scatterData = data
    ? data.actual.map((a, i) => ({ actual: a, predicted: data.predicted[i] }))
    : []
  const minV = scatterData.length ? Math.min(...scatterData.map(d => d.actual)) : 0
  const maxV = scatterData.length ? Math.max(...scatterData.map(d => d.actual)) : 300
  const perfectLine = [{ actual: minV, predicted: minV }, { actual: maxV, predicted: maxV }]

  // Feature importance bars
  const maxFI = data?.feature_importance?.[0]?.[1] || 1
  const featNames = { PM2_5: 'PM2.5', PM10: 'PM10', NO2: 'NO2', SO2: 'SO2', CO: 'CO', Ozone: 'Ozone', RH_Percent: 'Humidity', Month: 'Month', DayOfWeek: 'Day of Week' }

  return (
    <div className="fade-in" style={{ padding: 28, maxWidth: 1400 }}>
      <SectionHeader tag="CNN-LSTM PREDICTION ENGINE" title="Deep Learning Forecast"
        desc="Hybrid CNN-LSTM model trained on 7-day lookback windows. Conv1D layers capture local temporal patterns; dense layers output next-day AQI." />

      {/* Architecture */}
      <Card style={{ marginBottom: 18 }}>
        <CardHeader title="Model Architecture" badge="CNN-LSTM · Spatiotemporal" badgeColor="purple" />
        <ArchDiagram arch={data?.architecture} />
        {!data && (
          <div style={{ display: 'flex', justifyContent: 'center', flexWrap: 'wrap', gap: 6, marginTop: 4 }}>
            {[
              ['Input (batch,7,9)', '#4a6a8a'],
              ['Conv1D(32,k=3,ReLU)', '#00c8ff'],
              ['Conv1D(32,k=3,ReLU)', '#00c8ff'],
              ['GlobalAvgPool', '#39ff8e'],
              ['Dense(32,ReLU)', '#b06dff'],
              ['Dense(1)', '#ff6b2b'],
            ].map(([label, color], i, arr) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <span style={{ background: color + '20', border: `1px solid ${color}40`, borderRadius: 6, padding: '4px 10px', fontSize: 11, fontFamily: 'Space Mono, monospace', color }}>{label}</span>
                {i < arr.length - 1 && <span style={{ color: 'var(--text3)', fontSize: 14 }}>→</span>}
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Controls */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 18, flexWrap: 'wrap' }}>
        <Select label="Station:" value={station} onChange={setStation} options={STATIONS} />
        <button onClick={run} disabled={loading}
          style={{
            display: 'flex', alignItems: 'center', gap: 7, padding: '8px 20px',
            borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: loading ? 'not-allowed' : 'pointer',
            background: loading ? 'rgba(0,200,255,0.05)' : 'rgba(0,200,255,0.12)',
            border: '1px solid rgba(0,200,255,0.3)', color: 'var(--accent)', transition: 'all .2s',
          }}>
          {loading ? <><span className="animate-spin-slow" style={{ fontSize: 16 }}>⟳</span> Training…</> : <><Zap size={14} /> Train CNN-LSTM</>}
        </button>
        {loading && <span style={{ fontSize: 12, color: 'var(--text3)', fontFamily: 'Space Mono, monospace' }}>⏳ Training takes ~30–60s…</span>}
      </div>

      {error && <ErrorBox message={error} />}

      {data && (
        <>
          {/* Model comparison cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 14, marginBottom: 18 }}>
            {['CNN-LSTM','Random Forest','Linear Regression'].map(m => (
              <ModelCard key={m} name={m} metrics={data.metrics[m]} selected={selected === m} onSelect={() => setSelected(m)} />
            ))}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 18, marginBottom: 18 }}>
            {/* Actual vs Predicted */}
            <Card>
              <CardHeader title="Actual vs Predicted AQI" badge="CNN-LSTM · Test Set" badgeColor="blue" />
              <ResponsiveContainer width="100%" height={260}>
                <LineChart data={data.dates.map((d, i) => ({ date: d, actual: data.actual[i], predicted: data.predicted[i] }))}>
                  <CartesianGrid stroke="rgba(0,200,255,0.05)" />
                  <XAxis dataKey="date" tick={{ fill: 'var(--text2)', fontSize: 9 }} tickCount={6} />
                  <YAxis tick={{ fill: 'var(--text2)', fontSize: 11 }} />
                  <Tooltip content={<TIP />} />
                  <Legend wrapperStyle={{ fontSize: 11, color: 'var(--text2)' }} />
                  <Line dataKey="actual"    name="Actual AQI"    stroke="var(--accent)"  strokeWidth={2} dot={false} />
                  <Line dataKey="predicted" name="CNN-LSTM Pred" stroke="var(--accent2)" strokeWidth={2} dot={false} strokeDasharray="4,2" />
                </LineChart>
              </ResponsiveContainer>
            </Card>

            {/* Training loss */}
            <Card>
              <CardHeader title="Training & Validation Loss" badge="Convergence" badgeColor="orange" />
              <ResponsiveContainer width="100%" height={260}>
                <LineChart data={data.train_loss.map((v, i) => ({ epoch: i + 1, train: v, val: data.val_loss[i] }))}>
                  <CartesianGrid stroke="rgba(0,200,255,0.05)" />
                  <XAxis dataKey="epoch" tick={{ fill: 'var(--text2)', fontSize: 11 }} label={{ value: 'Epoch', fill: 'var(--text2)', fontSize: 11, position: 'insideBottom', offset: -2 }} />
                  <YAxis tick={{ fill: 'var(--text2)', fontSize: 10 }} />
                  <Tooltip content={<TIP />} />
                  <Legend wrapperStyle={{ fontSize: 11, color: 'var(--text2)' }} />
                  <Line dataKey="train" name="Train Loss" stroke="var(--accent)"  strokeWidth={2} dot={false} />
                  <Line dataKey="val"   name="Val Loss"   stroke="var(--accent2)" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </Card>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: 18 }}>
            {/* Scatter plot */}
            <Card>
              <CardHeader title="Actual vs Predicted Scatter" badge="Perfect Fit Line" badgeColor="green" />
              <ResponsiveContainer width="100%" height={260}>
                <ScatterChart>
                  <CartesianGrid stroke="rgba(0,200,255,0.05)" />
                  <XAxis dataKey="actual"    name="Actual"    tick={{ fill: 'var(--text2)', fontSize: 11 }} label={{ value: 'Actual AQI',    fill: 'var(--text2)', fontSize: 11, position: 'insideBottom', offset: -5 }} />
                  <YAxis dataKey="predicted" name="Predicted" tick={{ fill: 'var(--text2)', fontSize: 11 }} label={{ value: 'Predicted AQI', fill: 'var(--text2)', fontSize: 11, angle: -90, position: 'insideLeft' }} />
                  <Tooltip cursor={{ strokeDasharray: '3 3' }} content={<TIP />} />
                  <Scatter name="CNN-LSTM" data={scatterData} fill="rgba(0,200,255,0.4)" />
                  <Line type="linear" data={perfectLine} dataKey="predicted" stroke="rgba(255,107,43,0.6)" strokeWidth={1.5} strokeDasharray="6,3" dot={false} name="Perfect Fit" />
                </ScatterChart>
              </ResponsiveContainer>
            </Card>

            {/* Feature importance */}
            <Card>
              <CardHeader title="Feature Importance (RF)" badge="Top 8 Predictors" badgeColor="purple" />
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, paddingTop: 6 }}>
                {data.feature_importance.map(([name, val]) => (
                  <div key={name} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ fontSize: 11, color: 'var(--text2)', width: 80, flexShrink: 0, fontFamily: 'Space Mono, monospace' }}>{featNames[name] || name}</div>
                    <div style={{ flex: 1, height: 8, background: 'rgba(255,255,255,0.06)', borderRadius: 4, overflow: 'hidden' }}>
                      <div style={{ height: '100%', borderRadius: 4, width: `${(val / maxFI * 100).toFixed(1)}%`, background: 'linear-gradient(90deg,var(--accent),var(--accent4))', transition: 'width .6s ease' }} />
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--text3)', fontFamily: 'Space Mono, monospace', width: 45, textAlign: 'right' }}>{(val * 100).toFixed(1)}%</div>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </>
      )}

      {!data && !loading && (
        <Card>
          <div style={{ textAlign: 'center', padding: '40px 20px' }}>
            <BrainCircuit size={40} color="var(--accent)" style={{ margin: '0 auto 14px' }} />
            <p style={{ fontSize: 15, color: 'var(--text2)', marginBottom: 6 }}>Select a station and click <b style={{ color: 'var(--accent)' }}>Train CNN-LSTM</b> to run the model.</p>
            <p style={{ fontSize: 12, color: 'var(--text3)', fontFamily: 'Space Mono, monospace' }}>Training time: ~30–60 seconds per station</p>
          </div>
        </Card>
      )}
    </div>
  )
}
