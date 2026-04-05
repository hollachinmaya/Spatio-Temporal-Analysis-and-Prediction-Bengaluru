// src/App.jsx
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Sidebar    from './components/Sidebar'
import Header     from './components/Header'
import Overview   from './pages/Overview'
import Spatial    from './pages/Spatial'
import Temporal   from './pages/Temporal'
import Correlation from './pages/Correlation'
import Prediction from './pages/Prediction'
import TimeSeries from './pages/TimeSeries'
import CodeViewer from './pages/CodeViewer'

export default function App() {
  return (
    <BrowserRouter>
      <div style={{ display: 'flex', minHeight: '100vh', position: 'relative', zIndex: 1 }}>
        {/* Ambient glow blobs */}
        <div style={{ position: 'fixed', width: 500, height: 500, borderRadius: '50%', background: 'rgba(0,200,255,0.04)', filter: 'blur(100px)', top: -100, right: -100, pointerEvents: 'none', zIndex: 0 }} />
        <div style={{ position: 'fixed', width: 400, height: 400, borderRadius: '50%', background: 'rgba(176,109,255,0.04)', filter: 'blur(100px)', bottom: -100, left: -100, pointerEvents: 'none', zIndex: 0 }} />

        <Sidebar />

        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          <Header />
          <main style={{ flex: 1, overflowY: 'auto' }}>
            <Routes>
              <Route path="/"            element={<Overview />} />
              <Route path="/spatial"     element={<Spatial />} />
              <Route path="/temporal"    element={<Temporal />} />
              <Route path="/correlation" element={<Correlation />} />
              <Route path="/prediction"  element={<Prediction />} />
              <Route path="/timeseries"  element={<TimeSeries />} />
              {/* <Route path="/code"        element={<CodeViewer />} /> */}
            </Routes>
          </main>
        </div>
      </div>
    </BrowserRouter>
  )
}
