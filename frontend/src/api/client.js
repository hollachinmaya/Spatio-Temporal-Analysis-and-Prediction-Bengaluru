// src/api/client.js
import axios from 'axios'

const api = axios.create({
  baseURL: '/api',
  timeout: 120000, // 2 min — CNN-LSTM training can take a while
})

// ── Overview ──────────────────────────────────────────────────────────────────
export const fetchOverview = () =>
  api.get('/overview/stats').then(r => r.data)

// ── Spatial ───────────────────────────────────────────────────────────────────
export const fetchHotspots = () =>
  api.get('/spatial/hotspots').then(r => r.data)

export const fetchPollutantProfile = station =>
  api.get(`/spatial/pollutant-profile/${station}`).then(r => r.data)

export const fetchStations = () =>
  api.get('/spatial/stations').then(r => r.data)

// ── Temporal ──────────────────────────────────────────────────────────────────
export const fetchSeasonal      = ()        => api.get('/temporal/seasonal').then(r => r.data)
export const fetchSeasonalStation = station => api.get(`/temporal/seasonal/${station}`).then(r => r.data)
export const fetchYearly        = ()        => api.get('/temporal/yearly').then(r => r.data)
export const fetchWeekly        = ()        => api.get('/temporal/weekly').then(r => r.data)

// ── Correlation ───────────────────────────────────────────────────────────────
export const fetchCorrelation = () =>
  api.get('/correlation/matrix').then(r => r.data)

// ── Prediction (CNN-LSTM) ─────────────────────────────────────────────────────
export const trainStation        = station => api.get(`/prediction/train/${station}`).then(r => r.data)
export const fetchForecast       = station => api.get(`/prediction/forecast/${station}`).then(r => r.data)
export const fetchLoss           = station => api.get(`/prediction/loss/${station}`).then(r => r.data)
export const fetchFeatureImportance = station => api.get(`/prediction/feature-importance/${station}`).then(r => r.data)
export const fetchArchitecture   = ()      => api.get('/prediction/architecture').then(r => r.data)

// ── Time Series ───────────────────────────────────────────────────────────────
export const fetchMonthlyAll     = ()        => api.get('/timeseries/monthly').then(r => r.data)
export const fetchMonthlyStation = station   => api.get(`/timeseries/monthly/${station}`).then(r => r.data)
export const fetchYoY            = ()        => api.get('/timeseries/yoy').then(r => r.data)
export const fetchVolatility     = ()        => api.get('/timeseries/volatility').then(r => r.data)
