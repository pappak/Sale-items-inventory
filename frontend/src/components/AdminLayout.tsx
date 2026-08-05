import { Link, useLocation } from 'react-router-dom'
import { Boxes, LayoutGrid, Share2, Plus } from 'lucide-react'
import type { ReactNode } from 'react'
import { ThemeToggle } from './ThemeToggle'

const navItems = [
  { to: '/', label: 'Inventory', icon: LayoutGrid },
  { to: '/share', label: 'Share Links', icon: Share2 },
]

export function AdminLayout({ children }: { children: ReactNode }) {
  const location = useLocation()

  return (
    <div className="min-h-screen grain">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-ink-800 bg-ink-950/80 backdrop-blur-xl">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between gap-4">
            <Link to="/" className="flex items-center gap-2.5 group">
              <div className="flex size-9 items-center justify-center rounded-xl bg-teal-500/10 border border-teal-500/20 text-teal-400 group-hover:bg-teal-500/20 transition-colors">
                <Boxes className="size-5" />
              </div>
              <div className="flex flex-col leading-none">
                <span className="font-display text-lg text-ink-50 tracking-tight">
                  Inventory
                </span>
                <span className="text-[10px] uppercase tracking-[0.2em] text-ink-400 font-medium">
                  Manager
                </span>
              </div>
            </Link>

            <nav className="flex items-center gap-1">
              {navItems.map((item) => {
                const active =
                  item.to === '/'
                    ? location.pathname === '/' ||
                      location.pathname.startsWith('/items')
                    : location.pathname.startsWith(item.to)
                const Icon = item.icon
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
              <Link
                to="/items/new"
                className="ml-2 flex items-center gap-1.5 rounded-lg bg-teal-500 px-3.5 py-2 text-sm font-semibold text-ink-950 hover:bg-teal-400 transition-colors"
              >
                <Plus className="size-4" />
                <span className="hidden sm:inline">Add Item</span>
              </Link>
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
