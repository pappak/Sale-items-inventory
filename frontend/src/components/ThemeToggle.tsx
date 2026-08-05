import { Monitor, Moon, Sun } from 'lucide-react'
import { useTheme, type Theme } from '../lib/theme'

const cycle: Record<Theme, Theme> = {
  system: 'dark',
  dark: 'light',
  light: 'system',
}

const config: Record<
  Theme,
  { icon: typeof Monitor; label: string }
> = {
  system: { icon: Monitor, label: 'System theme' },
  dark: { icon: Moon, label: 'Dark theme' },
  light: { icon: Sun, label: 'Light theme' },
}

export function ThemeToggle() {
  const { theme, setTheme } = useTheme()
  const { icon: Icon, label } = config[theme]

  return (
    <button
      onClick={() => setTheme(cycle[theme])}
      title={label}
      aria-label={label}
      className="flex size-9 items-center justify-center rounded-lg text-ink-400 hover:text-ink-100 hover:bg-ink-850 transition-colors"
    >
      <Icon className="size-4" />
    </button>
  )
}
