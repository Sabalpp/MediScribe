/* eslint-disable react-refresh/only-export-components -- context + hook pattern */
import { createContext, useCallback, useContext, useMemo, useState } from 'react'

const DashboardSessionContext = createContext(null)

export function DashboardSessionProvider({ children }) {
  const [inCall, setInCall] = useState(false)

  const startCall = useCallback(() => {
    setInCall(true)
  }, [])

  const endCall = useCallback(() => {
    setInCall(false)
  }, [])

  const value = useMemo(() => ({ inCall, startCall, endCall }), [inCall, startCall, endCall])

  return <DashboardSessionContext.Provider value={value}>{children}</DashboardSessionContext.Provider>
}

export function useDashboardSession() {
  const ctx = useContext(DashboardSessionContext)
  if (!ctx) {
    throw new Error('useDashboardSession must be used within DashboardSessionProvider')
  }
  return ctx
}
