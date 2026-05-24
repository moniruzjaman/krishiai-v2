import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useEffect, lazy, Suspense, Component, type ReactNode } from 'react'
import Layout from './components/Layout'
import { useSettingsStore } from './store/useSettingsStore'
import { useLocationStore } from './store/useLocationStore'
import { autoInitDatabase } from './services/dbInitService'

// ── Lazy-loaded pages (code splitting for faster INP) ───────────
const Home      = lazy(() => import('./pages/Home'))
const Chat      = lazy(() => import('./pages/Chat'))
const Analyzer  = lazy(() => import('./pages/Analyzer'))
const Disease   = lazy(() => import('./pages/Disease'))
const Weather   = lazy(() => import('./pages/Weather'))
const Market    = lazy(() => import('./pages/Market'))
const Soil      = lazy(() => import('./pages/Soil'))
const Calendar  = lazy(() => import('./pages/Calendar'))
const Login     = lazy(() => import('./pages/Login'))
const Profile   = lazy(() => import('./pages/Profile'))

// ── Lightweight page loading fallback ────────────────────────────
function PageLoader() {
  return (
    <div className="flex items-center justify-center p-12">
      <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary-600 border-t-transparent" />
    </div>
  )
}

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
      staleTime: 5 * 60 * 1000,
    },
  },
})

function ThemeSync() {
  const { theme, fontSize } = useSettingsStore()

  useEffect(() => {
    const root = document.documentElement
    root.classList.toggle('dark', theme === 'dark')
    root.classList.toggle('text-large', fontSize === 'large')
  }, [theme, fontSize])

  return null
}

/**
 * LocationInitializer — Auto-requests GPS and reverse-geocodes
 * on app startup. If permission was previously granted, this
 * happens silently without any UI prompt.
 *
 * Also starts watching position for live updates.
 * Also attempts database auto-init.
 */
function LocationInitializer() {
  const { autoInitLocation, startWatching, stopWatching } = useLocationStore()

  useEffect(() => {
    // Auto-init location on mount
    autoInitLocation()

    // Start watching GPS position
    startWatching()

    // Auto-init database
    autoInitDatabase()

    return () => {
      stopWatching()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return null
}

// ── Error Boundary ──
interface ErrorBoundaryProps {
  children: ReactNode
}
interface ErrorBoundaryState {
  hasError: boolean
  error: Error | null
}

class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('[KrishiAI] Runtime error:', error, info)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: '2rem', fontFamily: 'system-ui', textAlign: 'center' }}>
          <h2 style={{ fontSize: '1.5rem', color: '#dc2626', marginBottom: '1rem' }}>
            কৃষি AI — ত্রুটি
          </h2>
          <p style={{ color: '#666', marginBottom: '1rem' }}>
            অ্যাপ লোড করতে সমস্যা হয়েছে। দয়া করে পৃষ্ঠা রিফ্রেশ করুন।
          </p>
          <pre style={{
            background: '#f5f5f5', padding: '1rem', borderRadius: '8px',
            fontSize: '0.75rem', textAlign: 'left', overflow: 'auto',
            maxHeight: '200px', color: '#333'
          }}>
            {this.state.error?.message}
          </pre>
          <button
            onClick={() => window.location.reload()}
            style={{
              marginTop: '1rem', padding: '0.5rem 1.5rem',
              background: '#16a34a', color: 'white', border: 'none',
              borderRadius: '8px', cursor: 'pointer', fontSize: '1rem'
            }}
          >
            রিফ্রেশ করুন
          </button>
        </div>
      )
    }
    return this.props.children
  }
}

export default function App() {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <ThemeSync />
          <LocationInitializer />
          <Layout>
            <Suspense fallback={<PageLoader />}>
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/chat" element={<Chat />} />
                <Route path="/analyzer" element={<Analyzer />} />
                <Route path="/disease" element={<Disease />} />
                <Route path="/weather" element={<Weather />} />
                <Route path="/market" element={<Market />} />
                <Route path="/soil" element={<Soil />} />
                <Route path="/calendar" element={<Calendar />} />
                <Route path="/login" element={<Login />} />
                <Route path="/profile" element={<Profile />} />
              </Routes>
            </Suspense>
          </Layout>
        </BrowserRouter>
      </QueryClientProvider>
    </ErrorBoundary>
  )
}
