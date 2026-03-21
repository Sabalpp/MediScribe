import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import '../index.css'
import OverlayApp from './OverlayApp.jsx'

createRoot(document.getElementById('overlay-root')).render(
  <StrictMode>
    <OverlayApp />
  </StrictMode>,
)
