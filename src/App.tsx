import { BrowserRouter, Route, Routes } from 'react-router-dom'
import { AppLayout } from './components/AppLayout'
import { HomePage } from './features/home/HomePage'
import { FacilityPage } from './features/facility/FacilityPage'
import ProgramListPage from './features/program/ProgramListPage'
import ProgramDetailPage from './features/program/ProgramDetailPage'
import MyProgramReservationsPage from './features/program/MyProgramReservationsPage'
import { RoomsPage } from './features/rooms/RoomsPage'
import { RoomDetailPage } from './features/rooms/RoomDetailPage'
import { ReservationPage } from './features/reservation/ReservationPage'
import { MyReservationsPage } from './features/reservation/MyReservationsPage'
import { ConfirmationPage } from './features/reservation/ConfirmationPage'
import { LoginPage } from './features/auth/LoginPage'
import { SignupPage } from './features/auth/SignupPage'
import { WellnessOverviewPage } from './features/wellness/WellnessOverviewPage'
import { WellnessCheckPage } from './features/wellness/WellnessCheckPage'
import { WellnessResultPage } from './features/wellness/WellnessResultPage'
import { WellnessHistoryPage } from './features/wellness/WellnessHistoryPage'
import ReviewPage from './features/program/review/ReviewPage'
import { ComponentGallery } from './dev/ComponentGallery'
import { DevShell } from './dev/DevShell'
import { DevLoginPage } from './dev/DevLoginPage'
import { isDevMode } from './dev/scenarios'
import { AdminLayout } from './components/admin/AdminLayout'
import { AdminDashboardPage } from './features/program/admin/AdminDashboardPage'
import { AdminProgramPage } from './features/program/admin/AdminProgramPage'
import { AdminProgramApplicantsPage } from './features/program/admin/AdminProgramApplicantsPage'
import { AdminInquiryListPage } from './features/inquiry/admin/AdminInquiryListPage'
import { AdminInquiryDetailPage } from './features/inquiry/admin/AdminInquiryDetailPage'
import './index.css'
export default function App() {
  return (
    <BrowserRouter>
      {isDevMode && <DevShell />}
      <Routes>
        <Route element={<AppLayout />}>
          <Route index element={<HomePage />} />
          <Route path="facility" element={<FacilityPage />} />
          <Route path="programs" element={<ProgramListPage />} />
          <Route path="programs/:programId" element={<ProgramDetailPage />} />
          <Route path="rooms" element={<RoomsPage />} />
          <Route path="rooms/:roomId" element={<RoomDetailPage />} />
          <Route path="reservations" element={<ReservationPage />} />
          <Route path="reservations/confirm" element={<ConfirmationPage />} />
          <Route path="my-reservations" element={<MyReservationsPage />} />
          <Route path="my-reservations/:resvId" element={<MyReservationsPage />} />
          <Route path="my-programs" element={<MyProgramReservationsPage />} />
          <Route path="login" element={<LoginPage />} />
          <Route path="signup" element={<SignupPage />} />
          <Route path="wellness" element={<WellnessOverviewPage />} />
          <Route path="wellness/check" element={<WellnessCheckPage />} />
          <Route path="wellness/result" element={<WellnessResultPage />} />
          <Route path="wellness/result/:checkId" element={<WellnessResultPage />} />
          <Route path="wellness/history" element={<WellnessHistoryPage />} />
          <Route path="reviews" element={<ReviewPage />} />
          {isDevMode && <Route path="__dev/login" element={<DevLoginPage />} />}
          {isDevMode && <Route path="__dev/components" element={<ComponentGallery />} />}
          <Route path="*" element={<NotFoundPage />} />
        </Route>
        <Route path="admin" element={<AdminLayout />}>
          <Route index element={<AdminDashboardPage />} />
          <Route path="programs" element={<AdminProgramPage />} />
          <Route path="programs/:programId/applications" element={<AdminProgramApplicantsPage />} />
          <Route path="inquiries" element={<AdminInquiryListPage />} />
          <Route path="inquiries/:inquiryId" element={<AdminInquiryDetailPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
function NotFoundPage() {
  return (
    <main className="mx-auto max-w-7xl px-6 pt-[58px] pb-[110px] text-center md:pt-[90px]">
      <p className="text-[11px] font-medium tracking-[0.17em] text-gold-500">NOT FOUND</p>
      <h1>페이지를 찾을 수 없습니다.</h1>
      <a
        className="inline-block rounded-sm bg-navy-900 px-6 py-[13px] text-xs tracking-[0.06em] text-white transition hover:bg-navy-700"
        href="/"
      >
        홈으로 돌아가기
      </a>
    </main>
  )
}
