import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useEffect, Component, type ReactNode } from 'react'
import Layout from './components/Layout'
import Home from './pages/Home'
import Chat from './pages/Chat'
import Analyzer from './pages/Analyzer'
import Disease from './pages/Disease'
import Weather from './pages/Weather'
import Market from './pages/Market'
import Soil from './pages/Soil'
import Calendar from './pages/Calendar'
import Login from './pages/Login'
import Profile from './pages/Profile'
import { useSettingsStore } from './store/useSettingsStore'

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
          <Layout>
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
          </Layout>
        </BrowserRouter>
      </QueryClientProvider>
    </ErrorBoundary>
  )
}
