import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Layout from './components/Layout'
import Home from './pages/Home'
import Chat from './pages/Chat'
import Analyzer from './pages/Analyzer'
import Disease from './pages/Disease'
import Weather from './pages/Weather'
import Market from './pages/Market'
import Soil from './pages/Soil'
import Calendar from './pages/Calendar'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index         element={<Home />} />
          <Route path="chat"     element={<Chat />} />
          <Route path="analyzer" element={<Analyzer />} />
          <Route path="disease"  element={<Disease />} />
          <Route path="weather"  element={<Weather />} />
          <Route path="market"   element={<Market />} />
          <Route path="soil"     element={<Soil />} />
          <Route path="calendar" element={<Calendar />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
