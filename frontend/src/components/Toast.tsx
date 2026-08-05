import {
  createContext,
  useCallback,
  useContext,
  useState,
  type ReactNode,
} from 'react'
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react'

type ToastType = 'success' | 'error' | 'info'

interface Toast {
  id: number
  type: ToastType
  message: string
}

interface ToastContextValue {
  toast: (message: string, type?: ToastType) => void
}

const ToastContext = createContext<ToastContextValue | null>(null)

export function useToast() {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast must be used within ToastProvider')
  return ctx.toast
}

let toastId = 0

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])

  const toast = useCallback((message: string, type: ToastType = 'info') => {
    const id = ++toastId
    setToasts((prev) => [...prev, { id, type, message }])
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id))
    }, 4000)
  }, [])

  const dismiss = (id: number) =>
    setToasts((prev) => prev.filter((t) => t.id !== id))

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      <div className="fixed bottom-6 right-6 z-[100] flex flex-col gap-2.5 max-w-sm w-[calc(100vw-3rem)] sm:w-auto">
        {toasts.map((t) => (
          <div
            key={t.id}
            className="animate-scale-in flex items-start gap-3 rounded-xl border border-ink-700 bg-ink-850/95 backdrop-blur-md px-4 py-3 shadow-2xl shadow-black/50"
            role="alert"
          >
            {t.type === 'success' && (
              <CheckCircle2 className="size-5 shrink-0 text-emerald-400 mt-0.5" />
            )}
            {t.type === 'error' && (
              <AlertCircle className="size-5 shrink-0 text-rose-400 mt-0.5" />
            )}
            {t.type === 'info' && (
              <Info className="size-5 shrink-0 text-teal-400 mt-0.5" />
            )}
            <p className="text-sm text-ink-100 leading-snug flex-1">
              {t.message}
            </p>
            <button
              onClick={() => dismiss(t.id)}
              className="text-ink-400 hover:text-ink-100 transition-colors shrink-0"
              aria-label="Dismiss notification"
            >
              <X className="size-4" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}
