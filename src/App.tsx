import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { PhoneFrame } from '@/components/layout/PhoneFrame'
import { HomePage } from '@/pages/HomePage'
import { FlipHuntPage } from '@/pages/FlipHuntPage'
import { ConfirmPage } from '@/pages/ConfirmPage'
import { AnalysingPage } from '@/pages/AnalysingPage'
import { ResultPage } from '@/pages/ResultPage'
import { ComparablesPage } from '@/pages/ComparablesPage'
import { OfferPage } from '@/pages/OfferPage'
import { RisksPage } from '@/pages/RisksPage'
import { FlipPage } from '@/pages/FlipPage'
import { RelistPage } from '@/pages/RelistPage'
import { FlipHistoryPage } from '@/pages/FlipHistoryPage'

export default function App() {
  return (
    <BrowserRouter>
      <PhoneFrame>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/flip" element={<FlipHuntPage />} />
          <Route path="/flip/history" element={<FlipHistoryPage />} />
          <Route path="/analyse" element={<Navigate to="/" replace />} />
          <Route path="/confirm" element={<ConfirmPage />} />
          <Route path="/analysing" element={<AnalysingPage />} />
          <Route path="/result/:id" element={<ResultPage />} />
          <Route path="/result/:id/comparables" element={<ComparablesPage />} />
          <Route path="/result/:id/offer" element={<OfferPage />} />
          <Route path="/result/:id/risks" element={<RisksPage />} />
          <Route path="/result/:id/flip" element={<FlipPage />} />
          <Route path="/result/:id/relist" element={<RelistPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </PhoneFrame>
    </BrowserRouter>
  )
}
