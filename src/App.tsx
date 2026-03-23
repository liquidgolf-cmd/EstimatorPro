import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import { AuthPage } from './pages/AuthPage'
import { DashboardPage } from './pages/DashboardPage'

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen bg-bg flex items-center justify-center">
        <svg className="animate-spin w-6 h-6 text-accent" viewBox="0 0 24 24" fill="none">
          <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeOpacity="0.25"/>
          <path d="M12 2a10 10 0 0110 10" stroke="currentColor" strokeWidth="3" strokeLinecap="round"/>
        </svg>
      </div>
    )
  }

  return user ? <>{children}</> : <Navigate to="/auth" replace />
}

function AppRoutes() {
  const { user, loading } = useAuth()

  if (loading) return null

  return (
    <Routes>
      <Route
        path="/auth"
        element={user ? <Navigate to="/dashboard" replace /> : <AuthPage />}
      />
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <DashboardPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/estimates/new"
        element={
          <ProtectedRoute>
            <div className="min-h-screen bg-bg flex items-center justify-center">
              <p className="text-text-muted">Estimate builder — coming in Session 3</p>
            </div>
          </ProtectedRoute>
        }
      />
      <Route
        path="/estimates/:id"
        element={
          <ProtectedRoute>
            <div className="min-h-screen bg-bg flex items-center justify-center">
              <p className="text-text-muted">Estimate view — coming in Session 3</p>
            </div>
          </ProtectedRoute>
        }
      />
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </AuthProvider>
  )
}
