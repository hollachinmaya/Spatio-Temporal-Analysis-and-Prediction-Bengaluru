// src/utils/aqi.js

export const STATION_COLORS = [
  '#00c8ff','#ff6b2b','#39ff8e','#b06dff','#f5d020',
  '#ff4f6e','#00e5c0','#ff9f43','#a8d8ea',
]

export const STATIONS = [
  'BapujiNagar','BTM','Hebbal','Hombegowda','Jayanagar',
  'Kadabasenahalli','Peenya','RVCE','Silkboard',
]

export const MONTH_NAMES = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']

export function aqiColor(aqi) {
  if (aqi <= 50)  return '#39ff8e'
  if (aqi <= 100) return '#f5d020'
  if (aqi <= 150) return '#ff8c00'
  if (aqi <= 200) return '#ff6b2b'
  if (aqi <= 300) return '#cc2a36'
  return '#7e0023'
}

export function aqiLabel(aqi) {
  if (aqi <= 50)  return { text: 'Good',          bg: 'rgba(57,255,142,0.15)',  color: '#39ff8e' }
  if (aqi <= 100) return { text: 'Moderate',      bg: 'rgba(245,208,32,0.15)', color: '#f5d020' }
  if (aqi <= 150) return { text: 'USG',           bg: 'rgba(255,140,0,0.15)',  color: '#ff8c00' }
  if (aqi <= 200) return { text: 'Unhealthy',     bg: 'rgba(255,107,43,0.15)', color: '#ff6b2b' }
  if (aqi <= 300) return { text: 'V.Unhealthy',   bg: 'rgba(204,42,54,0.15)',  color: '#cc2a36' }
  return               { text: 'Hazardous',       bg: 'rgba(126,0,35,0.15)',   color: '#ff0040' }
}

export function stationColor(station) {
  const idx = STATIONS.indexOf(station)
  return STATION_COLORS[idx >= 0 ? idx : 0]
}

export const MODEL_COLORS = {
  'CNN-LSTM':          '#00c8ff',
  'Random Forest':     '#b06dff',
  'Linear Regression': '#7fa8cc',
}
