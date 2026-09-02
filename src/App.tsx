import { Navigate, Route, Routes } from 'react-router-dom'
import { AppShell } from './components/AppShell'
import { PracticePage } from './pages/PracticePage'
import { SongsPage } from './pages/SongsPage'
import { TunerPage } from './pages/TunerPage'
import { SettingsPage } from './pages/SettingsPage'

export default function App() {
  return (
    <Routes>
      <Route element={<AppShell />}>
        <Route path="/" element={<Navigate to="/practice" replace />} />
        <Route path="/practice" element={<PracticePage />} />
        <Route path="/songs" element={<SongsPage />} />
        <Route path="/tuner" element={<TunerPage />} />
        <Route path="/settings" element={<SettingsPage />} />
        <Route path="*" element={<Navigate to="/practice" replace />} />
      </Route>
    </Routes>
  )
}
