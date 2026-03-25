import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import { OfflineBanner } from './components/OfflineBanner.tsx'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <OfflineBanner />
    <App />
  </React.StrictMode>,
)