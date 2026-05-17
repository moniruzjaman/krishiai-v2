import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useEffect } from 'react'
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
      retry: 2,
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

export default function App() {
  return (
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
  )
}
