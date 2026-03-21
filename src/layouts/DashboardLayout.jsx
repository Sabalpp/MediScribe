import { Outlet } from 'react-router-dom'
import Sidebar from '../components/Sidebar'
import { DashboardSessionProvider } from '../context/DashboardSessionContext'

export default function DashboardLayout() {
  return (
    <DashboardSessionProvider>
      <div className="flex h-screen overflow-hidden bg-surface text-on-surface">
        <Sidebar />
        <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
          <Outlet />
        </div>
      </div>
    </DashboardSessionProvider>
  )
}
