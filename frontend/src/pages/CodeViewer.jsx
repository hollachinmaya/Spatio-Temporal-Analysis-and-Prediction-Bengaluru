// src/pages/CodeViewer.jsx
import { useState } from 'react'
import { Copy, Check } from 'lucide-react'
import { SectionHeader, Card, CardHeader } from '../components/UI'

const FILES = {
  backend: [
    {
      name: 'main.py',
      lang: 'python',
      code: `from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routers import overview, spatial, temporal, correlation, prediction, timeseries

app = FastAPI(
    title="Bangalore AQI Intelligence API",
    description="Spatiotemporal Framework for Urban Air Quality Analysis",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(overview.router,    prefix="/api/overview",    tags=["Overview"])
app.include_router(spatial.router,     prefix="/api/spatial",     tags=["Spatial"])
app.include_router(temporal.router,    prefix="/api/temporal",    tags=["Temporal"])
app.include_router(correlation.router, prefix="/api/correlation", tags=["Correlation"])
app.include_router(prediction.router,  prefix="/api/prediction",  tags=["Prediction"])
app.include_router(timeseries.router,  prefix="/api/timeseries",  tags=["TimeSeries"])

@app.get("/")
def root():
    return {"message": "Bangalore AQI Intelligence API", "status": "running"}`,
    },
    {
      name: 'app/core.py',
      lang: 'python',
      code: `"""Central data loading and caching for all routes."""
import pandas as pd
from functools import lru_cache
from pathlib import Path

DATA_PATH = Path(__file__).parent / "data.csv"
FEATURES  = ["PM2_5","PM10","NO2","SO2","CO","Ozone","RH_Percent","Month","DayOfWeek"]
TARGET    = "PM2_5_AQI"
SEQ_LEN   = 7

STATION_COORDS = {
    "Peenya":          [13.0283, 77.5193],
    "Silkboard":       [12.9171, 77.6220],
    "BapujiNagar":     [12.9562, 77.5543],
    "BTM":             [12.9165, 77.6101],
    "Hebbal":          [13.0350, 77.5970],
    "Hombegowda":      [12.9760, 77.5760],
    "Jayanagar":       [12.9255, 77.5828],
    "Kadabasenahalli": [12.8900, 77.6100],
    "RVCE":            [12.9230, 77.4988],
}

@lru_cache(maxsize=1)
def load_df() -> pd.DataFrame:
    df = pd.read_csv(DATA_PATH)
    df["Timestamp"] = pd.to_datetime(df["Timestamp"], format="%d-%m-%Y")
    df["Year"]      = df["Timestamp"].dt.year
    df["Month"]     = df["Timestamp"].dt.month
    df["DayOfWeek"] = df["Timestamp"].dt.dayofweek
    df["PM2_5_AQI"] = df["PM2_5_AQI"].fillna(df["PM2_5_AQI"].median())
    return df`,
    },
    {
      name: 'app/routers/prediction.py',
      lang: 'python',
      code: `"""CNN-LSTM model training and inference endpoint."""
import numpy as np
from sklearn.preprocessing import MinMaxScaler
from sklearn.metrics import mean_squared_error, r2_score
from app.core import load_df, FEATURES, TARGET, SEQ_LEN

# ── Activations ──────────────────────────────────────────────────────────────
relu    = lambda x: np.maximum(0, x)
relu_d  = lambda x: (x > 0).astype(float)
sigmoid = lambda x: 1 / (1 + np.exp(-np.clip(x, -15, 15)))

class CNNLSTMModel:
    """
    Architecture:
      Input (N, T=7, F=9)
      → Conv1D(32, kernel=3, ReLU)
      → Conv1D(32, kernel=3, ReLU)
      → GlobalAvgPool1D  → (N, 32)
      → Dense(32, ReLU)
      → Dense(1)         → AQI forecast
    Trained with Adam + early stopping (patience=12)
    """
    def __init__(self, F, T, lr=2e-3):
        H = 32; k = 3
        self.Wc1 = np.random.randn(k*F, H) * np.sqrt(2/(k*F))
        self.bc1 = np.zeros(H)
        self.Wc2 = np.random.randn(k*H, H) * np.sqrt(2/(k*H))
        self.bc2 = np.zeros(H)
        self.W1  = np.random.randn(H, 32)  * np.sqrt(2/H)
        self.b1  = np.zeros(32)
        self.W2  = np.random.randn(32, 1)  * 0.01
        self.b2  = np.zeros(1)
        self.lr  = lr; self._t = 0
        self._m = {n: np.zeros_like(v) for n,v in self._P()}
        self._v = {n: np.zeros_like(v) for n,v in self._P()}

    def _P(self):
        return [("Wc1",self.Wc1),("bc1",self.bc1),
                ("Wc2",self.Wc2),("bc2",self.bc2),
                ("W1",self.W1),  ("b1",self.b1),
                ("W2",self.W2),  ("b2",self.b2)]

    def fit(self, X, y, epochs=70, bs=64):
        # Adam gradient descent with 10% validation split
        vn = int(len(X)*.1)
        Xtr,ytr = X[:-vn], y[:-vn]
        best_val, pat = np.inf, 0
        train_loss, val_loss = [], []
        for ep in range(epochs):
            ix = np.random.permutation(len(Xtr))
            ep_loss = 0
            for s in range(0, len(Xtr), bs):
                bi = ix[s:s+bs]
                pred, cache = self._forward(Xtr[bi])
                ep_loss += np.mean((pred - ytr[bi])**2)
                self._adam(self._backward(cache, pred, ytr[bi]))
            val_pred, _ = self._forward(X[-vn:])
            vl = float(np.mean((val_pred - y[-vn:])**2))
            train_loss.append(ep_loss); val_loss.append(vl)
            if vl < best_val: best_val, pat = vl, 0
            else:
                pat += 1
                if pat >= 12: break
        return train_loss, val_loss`,
    },
    {
      name: 'app/routers/correlation.py',
      lang: 'python',
      code: `"""Inter-station Pearson correlation matrix."""
from fastapi import APIRouter
from app.core import load_df

router = APIRouter()

@router.get("/matrix")
def get_correlation_matrix():
    df = load_df()
    pivot = df.pivot_table(
        values="PM2_5_AQI",
        index="Timestamp",
        columns="Station",
        aggfunc="mean",
    )
    corr     = pivot.corr().round(3)
    stations = corr.columns.tolist()

    pairs = [
        {"station1": s1, "station2": s2, "value": round(float(corr.loc[s1,s2]),3)}
        for s1 in stations for s2 in stations
        if not (corr.loc[s1,s2] != corr.loc[s1,s2])  # skip NaN
    ]
    avg_corr = [
        {"station": s, "avg_r": round(
            sum(p["value"] for p in pairs
                if p["station1"]==s and p["station2"]!=s)
            / (len(stations)-1), 3)}
        for s in stations
    ]
    return {
        "stations": stations,
        "pairs":    pairs,
        "avg_per_station": avg_corr,
        "overall_avg": round(
            sum(a["avg_r"] for a in avg_corr)/len(avg_corr), 3),
    }`,
    },
  ],
  frontend: [
    {
      name: 'src/api/client.js',
      lang: 'javascript',
      code: `// Axios wrapper for all FastAPI endpoints
import axios from 'axios'

const api = axios.create({
  baseURL: '/api',
  timeout: 120000,  // CNN-LSTM training can take ~60s
})

// Overview
export const fetchOverview = () =>
  api.get('/overview/stats').then(r => r.data)

// Spatial
export const fetchHotspots = () =>
  api.get('/spatial/hotspots').then(r => r.data)

export const fetchPollutantProfile = station =>
  api.get(\`/spatial/pollutant-profile/\${station}\`).then(r => r.data)

// Temporal
export const fetchSeasonal = () =>
  api.get('/temporal/seasonal').then(r => r.data)

export const fetchYearly = () =>
  api.get('/temporal/yearly').then(r => r.data)

export const fetchWeekly = () =>
  api.get('/temporal/weekly').then(r => r.data)

// Correlation
export const fetchCorrelation = () =>
  api.get('/correlation/matrix').then(r => r.data)

// CNN-LSTM Prediction
export const trainStation = station =>
  api.get(\`/prediction/train/\${station}\`).then(r => r.data)

// Time Series
export const fetchMonthlyAll = () =>
  api.get('/timeseries/monthly').then(r => r.data)

export const fetchYoY = () =>
  api.get('/timeseries/yoy').then(r => r.data)`,
    },
    {
      name: 'src/hooks/useApi.js',
      lang: 'javascript',
      code: `// Generic data-fetching hooks with loading/error state
import { useState, useEffect, useCallback } from 'react'

// Auto-fetches on mount and when deps change
export function useApi(fetcher, deps = []) {
  const [data,    setData]    = useState(null)
  const [loading, setLoading] = useState(true)
  const [error,   setError]   = useState(null)

  const run = useCallback(async () => {
    setLoading(true); setError(null)
    try {
      setData(await fetcher())
    } catch(e) {
      setError(e?.response?.data?.detail || e.message)
    } finally {
      setLoading(false)
    }
  }, deps)

  useEffect(() => { run() }, [run])
  return { data, loading, error, refetch: run }
}

// Lazy hook — only runs when trigger() is called
export function useLazyApi(fetcher) {
  const [data,    setData]    = useState(null)
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState(null)

  const trigger = useCallback(async (...args) => {
    setLoading(true); setError(null)
    try {
      const result = await fetcher(...args)
      setData(result); return result
    } catch(e) {
      setError(e?.response?.data?.detail || e.message)
    } finally {
      setLoading(false)
    }
  }, [fetcher])

  return { data, loading, error, trigger }
}`,
    },
    {
      name: 'src/pages/Prediction.jsx (key section)',
      lang: 'jsx',
      code: `// CNN-LSTM Prediction Page
import { useState, useCallback } from 'react'
import { useLazyApi } from '../hooks/useApi'
import { trainStation } from '../api/client'

export default function Prediction() {
  const [station, setStation] = useState('Hombegowda')
  const { data, loading, error, trigger } = useLazyApi(trainStation)

  const run = useCallback(
    () => trigger(station),
    [station, trigger]
  )

  return (
    <div>
      <Select value={station} onChange={setStation} options={STATIONS} />

      <button onClick={run} disabled={loading}>
        {loading ? 'Training…' : 'Train CNN-LSTM'}
      </button>

      {data && (
        <>
          {/* Model comparison: CNN-LSTM vs RF vs Linear */}
          <ModelCards metrics={data.metrics} />

          {/* Actual vs Predicted line chart */}
          <ActualVsPredicted
            dates={data.dates}
            actual={data.actual}
            predicted={data.predicted}
          />

          {/* Training/Validation loss convergence */}
          <LossCurves
            trainLoss={data.train_loss}
            valLoss={data.val_loss}
          />

          {/* Scatter plot with perfect-fit line */}
          <ScatterPlot actual={data.actual} predicted={data.predicted} />

          {/* Feature importance bars */}
          <FeatureImportance data={data.feature_importance} />
        </>
      )}
    </div>
  )
}`,
    },
  ],
}

function highlight(code, lang) {
  // Simple regex-based syntax highlighter
  const escape = s => s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')
  let c = escape(code)

  if (lang === 'python') {
    c = c.replace(/\b(def|class|import|from|return|if|else|elif|for|while|try|except|with|as|in|not|and|or|is|None|True|False|self|lambda|pass|raise|yield)\b/g, '<span class="code-keyword">$1</span>')
    c = c.replace(/("""[\s\S]*?"""|\'\'\'[\s\S]*?\'\'\'|"[^"]*"|'[^']*')/g, '<span class="code-string">$1</span>')
    c = c.replace(/(#[^\n]*)/g, '<span class="code-comment">$1</span>')
    c = c.replace(/\b([A-Z][a-zA-Z0-9_]*)\b/g, '<span class="code-class">$1</span>')
    c = c.replace(/\b([a-z_][a-z0-9_]*)\s*(?=\()/g, '<span class="code-function">$1</span>')
    c = c.replace(/\b(\d+\.?\d*)\b/g, '<span class="code-number">$1</span>')
  } else {
    c = c.replace(/\b(import|export|from|const|let|var|function|return|if|else|for|while|class|new|this|async|await|default|try|catch|of|in|true|false|null|undefined)\b/g, '<span class="code-keyword">$1</span>')
    c = c.replace(/(`[^`]*`|"[^"]*"|'[^']*')/g, '<span class="code-string">$1</span>')
    c = c.replace(/(\/\/[^\n]*)/g, '<span class="code-comment">$1</span>')
    c = c.replace(/\b([A-Z][a-zA-Z0-9_]*)\b/g, '<span class="code-class">$1</span>')
    c = c.replace(/\b([a-z_][a-z0-9_]*)\s*(?=\()/g, '<span class="code-function">$1</span>')
    c = c.replace(/\b(\d+\.?\d*)\b/g, '<span class="code-number">$1</span>')
  }
  return c
}

function CopyBtn({ text }) {
  const [copied, setCopied] = useState(false)
  const copy = () => {
    navigator.clipboard.writeText(text)
    setCopied(true); setTimeout(() => setCopied(false), 2000)
  }
  return (
    <button onClick={copy} style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '5px 12px', borderRadius: 6, fontSize: 11, cursor: 'pointer', background: copied ? 'rgba(57,255,142,0.15)' : 'rgba(0,200,255,0.1)', border: copied ? '1px solid rgba(57,255,142,0.35)' : '1px solid rgba(0,200,255,0.25)', color: copied ? 'var(--accent3)' : 'var(--accent)', fontFamily: 'Space Mono, monospace', transition: 'all .2s' }}>
      {copied ? <><Check size={11} /> Copied!</> : <><Copy size={11} /> Copy</>}
    </button>
  )
}

export default function CodeViewer() {
  const [section, setSection] = useState('backend')
  const [activeFile, setActiveFile] = useState(0)

  const files = FILES[section]
  const file  = files[activeFile]

  return (
    <div className="fade-in" style={{ padding: 28, maxWidth: 1400 }}>
      <SectionHeader tag="SOURCE CODE" title="Full Implementation"
        desc="Complete FastAPI backend + React frontend source code for the Bangalore AQI Intelligence Dashboard." />

      {/* Section toggle */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
        {['backend', 'frontend'].map(s => (
          <button key={s} onClick={() => { setSection(s); setActiveFile(0) }}
            style={{ padding: '8px 20px', borderRadius: 8, fontSize: 13, fontFamily: 'Space Mono, monospace', cursor: 'pointer', border: '1px solid', textTransform: 'uppercase', letterSpacing: 1, transition: 'all .2s',
              borderColor: section === s ? 'rgba(0,200,255,0.35)' : 'var(--border)',
              background:  section === s ? 'rgba(0,200,255,0.1)'  : 'transparent',
              color:       section === s ? 'var(--accent)'         : 'var(--text2)',
            }}>
            {s === 'backend' ? '🐍 FastAPI Backend' : '⚛️ React Frontend'}
          </button>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '220px 1fr', gap: 18 }}>
        {/* File list */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          {files.map((f, i) => (
            <button key={i} onClick={() => setActiveFile(i)}
              style={{ textAlign: 'left', padding: '9px 12px', borderRadius: 8, fontSize: 12, fontFamily: 'Space Mono, monospace', cursor: 'pointer', border: '1px solid', transition: 'all .2s', wordBreak: 'break-all',
                borderColor: activeFile === i ? 'rgba(0,200,255,0.35)' : 'transparent',
                background:  activeFile === i ? 'rgba(0,200,255,0.08)'  : 'var(--surface)',
                color:       activeFile === i ? 'var(--accent)'          : 'var(--text2)',
              }}>
              {f.name}
            </button>
          ))}
        </div>

        {/* Code panel */}
        <Card style={{ padding: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 20px', borderBottom: '1px solid var(--border)' }}>
            <span style={{ fontFamily: 'Space Mono, monospace', fontSize: 12, color: 'var(--accent)' }}>{file.name}</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ fontSize: 10, color: 'var(--text3)', fontFamily: 'Space Mono, monospace', textTransform: 'uppercase', letterSpacing: 1 }}>{file.lang}</span>
              <CopyBtn text={file.code} />
            </div>
          </div>
          <div className="code-block" style={{ margin: 0, borderRadius: '0 0 14px 14px', maxHeight: 600 }}
            dangerouslySetInnerHTML={{ __html: highlight(file.code, file.lang) }} />
        </Card>
      </div>

      {/* Run instructions */}
      <Card style={{ marginTop: 20 }}>
        <CardHeader title="How to Run the Project" badge="Setup Guide" badgeColor="green" />
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
          <div>
            <div style={{ fontFamily: 'Space Mono, monospace', fontSize: 11, color: 'var(--accent)', marginBottom: 10, textTransform: 'uppercase', letterSpacing: 1 }}>🐍 Backend (FastAPI)</div>
            <div className="code-block" style={{ fontSize: 11 }}>{`cd backend
pip install -r requirements.txt
uvicorn main:app --reload --port 8000

# API docs → http://localhost:8000/docs`}</div>
          </div>
          <div>
            <div style={{ fontFamily: 'Space Mono, monospace', fontSize: 11, color: 'var(--accent4)', marginBottom: 10, textTransform: 'uppercase', letterSpacing: 1 }}>⚛️ Frontend (React + Vite)</div>
            <div className="code-block" style={{ fontSize: 11 }}>{`cd frontend
npm install
npm run dev

# App → http://localhost:5173`}</div>
          </div>
        </div>
      </Card>
    </div>
  )
}
