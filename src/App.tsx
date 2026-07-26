import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { HomePage } from '@/pages/HomePage'
import { ConfirmPage } from '@/pages/ConfirmPage'
import { AnalysingPage } from '@/pages/AnalysingPage'
import { ResultPage } from '@/pages/ResultPage'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/confirm" element={<ConfirmPage />} />
        <Route path="/analysing" element={<AnalysingPage />} />
        <Route path="/result/:id" element={<ResultPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
