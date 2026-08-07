import { lazy, Suspense } from 'react'
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Spinner } from './components/ui'
import { AuthProvider, useAuth } from './lib/auth'

const AdminLayout    = lazy(() => import('./components/AdminLayout').then(m => ({ default: m.AdminLayout })))
const Dashboard      = lazy(() => import('./pages/Dashboard').then(m => ({ default: m.Dashboard })))
const ItemForm       = lazy(() => import('./pages/ItemForm').then(m => ({ default: m.ItemForm })))
const ItemDetail     = lazy(() => import('./pages/ItemDetail').then(m => ({ default: m.ItemDetail })))
const ShareManager   = lazy(() => import('./pages/ShareManager').then(m => ({ default: m.ShareManager })))
const PublicCatalog  = lazy(() => import('./pages/PublicCatalog').then(m => ({ default: m.PublicCatalog })))
const LoginPage      = lazy(() => import('./pages/LoginPage').then(m => ({ default: m.LoginPage })))

function PageLoader() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <Spinner className="size-8 text-teal-400" />
    </div>
  )
}

function RequireAuth({ children }: { children: React.ReactNode }) {
  const { authed } = useAuth()
  if (!authed) return <Navigate to="/login" replace />
  return <>{children}</>
}

function AppRoutes() {
  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>
        {/* Public routes */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/share/:token" element={<PublicCatalog />} />

        {/* Admin layout — dashboard is viewable without auth */}
        <Route
          path="/*"
          element={
            <AdminLayout>
              <Suspense fallback={<PageLoader />}>
                <Routes>
                  <Route path="/" element={<Dashboard />} />
                  <Route path="/items/:id" element={<ItemDetail />} />
                  <Route
                    path="/items/new"
                    element={
                      <RequireAuth>
                        <ItemForm />
                      </RequireAuth>
                    }
                  />
                  <Route
                    path="/items/:id/edit"
                    element={
                      <RequireAuth>
                        <ItemForm />
                      </RequireAuth>
                    }
                  />
                  <Route
                    path="/share"
                    element={
                      <RequireAuth>
                        <ShareManager />
                      </RequireAuth>
                    }
                  />
                </Routes>
              </Suspense>
            </AdminLayout>
          }
        />
      </Routes>
    </Suspense>
  )
}

export default function App() {
  return (
    <HashRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </HashRouter>
  )
}
