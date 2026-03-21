import { Routes, Route } from 'react-router-dom'
import LandingPage from './pages/LandingPage'
import LoginPage from './pages/LoginPage'
import DashboardLayout from './layouts/DashboardLayout'
import LiveConsultation from './pages/dashboard/LiveConsultation'
import HistoryPage from './pages/dashboard/HistoryPage'
import PatientsPage from './pages/dashboard/PatientsPage'
import SettingsPage from './pages/dashboard/SettingsPage'
import RealTimeTalk from './pages/dashboard/RealTimeTalk'

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/dashboard" element={<DashboardLayout />}>
        <Route index element={<LiveConsultation />} />
        <Route path="history" element={<HistoryPage />} />
        <Route path="patients" element={<PatientsPage />} />
        <Route path="settings" element={<SettingsPage />} />
        <Route path="talk" element={<RealTimeTalk />} />
      </Route>
    </Routes>
  )
}
