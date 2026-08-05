import { lazy, Suspense } from 'react'
import { HashRouter, Routes, Route } from 'react-router-dom'
import { AdminLayout } from './components/AdminLayout'
import { Spinner } from './components/ui'

const Dashboard    = lazy(() => import('./pages/Dashboard').then(m => ({ default: m.Dashboard })))
const ItemForm     = lazy(() => import('./pages/ItemForm').then(m => ({ default: m.ItemForm })))
const ShareManager = lazy(() => import('./pages/ShareManager').then(m => ({ default: m.ShareManager })))
const PublicCatalog = lazy(() => import('./pages/PublicCatalog').then(m => ({ default: m.PublicCatalog })))

function PageLoader() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <Spinner className="size-8 text-teal-400" />
    </div>
  )
}

export default function App() {
  return (
    <HashRouter>
      <Suspense fallback={<PageLoader />}>
        <Routes>
          {/* Public route — no admin layout */}
          <Route path="/share/:token" element={<PublicCatalog />} />

          {/* Admin routes — wrapped in layout */}
          <Route
            path="/*"
            element={
              <AdminLayout>
                <Suspense fallback={<PageLoader />}>
                  <Routes>
                    <Route path="/" element={<Dashboard />} />
                    <Route path="/items/new" element={<ItemForm />} />
                    <Route path="/items/:id/edit" element={<ItemForm />} />
                    <Route path="/share" element={<ShareManager />} />
                  </Routes>
                </Suspense>
              </AdminLayout>
            }
          />
        </Routes>
      </Suspense>
    </HashRouter>
  )
}
