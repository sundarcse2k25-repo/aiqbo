import { Routes, Route, Navigate } from 'react-router-dom'
import ReportsPage from '@/pages/ReportsPage'

/**
 * Central route definitions for the application.
 *
 * Current routes:
 *   /          → redirect to /reports
 *   /reports   → Profit & Loss report page
 *
 * Future routes can be added here as new features are built.
 */
export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/reports" replace />} />
      <Route path="/reports" element={<ReportsPage />} />
    </Routes>
  )
}
