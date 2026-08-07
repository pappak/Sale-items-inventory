import { Link, useLocation } from 'react-router-dom'
import { LayoutGrid, Share2, Plus, LogOut, Settings } from 'lucide-react'
import type { ReactNode } from 'react'
import { ThemeToggle } from './ThemeToggle'
import { useAuth } from '../lib/auth'

const navItems = [
  { to: '/', label: 'Inventory', icon: LayoutGrid },
  { to: '/share', label: 'Share Links', icon: Share2 },
]

export function AdminLayout({ children }: { children: ReactNode }) {
  const location = useLocation()
  const { authed, logout } = useAuth()

  return (
    <div className="min-h-screen grain">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-ink-800 bg-ink-950/80 backdrop-blur-xl">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between gap-4">
            <Link to="/" className="flex items-center group">
              <img
                src="/catalogia-logo.png"
                alt="Catalogia"
                className="w-[80px] h-auto object-contain"
              />
            </Link>
            <span className="text-[10px] font-mono text-ink-500 border border-ink-700 rounded px-1.5 py-0.5 leading-none">
              v{__APP_VERSION__} [Build {__BUILD_NUMBER__}]
            </span>

            <nav className="flex items-center gap-1">
              {navItems.map((item) => {
                const active =
                  item.to === '/'
                    ? location.pathname === '/' ||
                      location.pathname.startsWith('/items')
                    : location.pathname.startsWith(item.to)
                const Icon = item.icon
                if (item.to === '/share' && !authed) return null
                return (
                  <Link
                    key={item.to}
                    to={item.to}
                    className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                      active
                        ? 'bg-ink-800 text-ink-50'
                        : 'text-ink-400 hover:text-ink-100 hover:bg-ink-850'
                    }`}
                  >
                    <Icon className="size-4" />
                    <span className="hidden sm:inline">{item.label}</span>
                  </Link>
                )
              })}
              <ThemeToggle />
              {authed ? (
                <>
                  <div className="ml-2 flex items-center gap-1.5 rounded-lg border border-teal-500/30 bg-teal-500/10 px-2.5 py-1.5 text-xs font-semibold text-teal-400 tracking-wide">
                    <Settings className="size-3.5" />
                    <span>Admin</span>
                  </div>
                  <Link
                    to="/items/new"
                    className="ml-1 flex items-center gap-1.5 rounded-lg bg-teal-500 px-3.5 py-2 text-sm font-semibold text-ink-950 hover:bg-teal-400 transition-colors"
                  >
                    <Plus className="size-4" />
                    <span className="hidden sm:inline">Add Item</span>
                  </Link>
                  <button
                    onClick={logout}
                    className="ml-1 flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium text-ink-400 hover:text-ink-100 hover:bg-ink-850 transition-colors"
                    title="Sign out"
                  >
                    <LogOut className="size-4" />
                    <span className="hidden sm:inline">Sign Out</span>
                  </button>
                </>
              ) : (
                <Link
                  to="/login"
                  className="ml-2 flex items-center justify-center rounded-lg p-2 text-ink-500 hover:text-ink-300 hover:bg-ink-850 transition-colors"
                  title="Sign in"
                >
                  <Settings className="size-5" />
                </Link>
              )}
            </nav>
          </div>
        </div>
      </header>

      <main className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
    </div>
  )
}
