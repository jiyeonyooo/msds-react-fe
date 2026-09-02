import { BrowserRouter, Route, Routes } from 'react-router-dom'
import { AppLayout } from './components/AppLayout'
import { GlobalScrollbar } from './components/GlobalScrollbar'
import { Navigate } from 'react-router-dom'
import { HomePage } from './features/home/HomePage'
import { FacilityPage } from './features/facility/FacilityPage'
import ProgramListPage from './features/program/ProgramListPage'
import ProgramDetailPage from './features/program/ProgramDetailPage'
import MyProgramReservationsPage from './features/program/MyProgramReservationsPage'
import ReviewPage from './features/program/review/ReviewPage'
import { RoomsPage } from './features/rooms/RoomsPage'
import { RoomDetailPage } from './features/rooms/RoomDetailPage'
import { ReservationPage } from './features/reservation/ReservationPage'
import { MyReservationsPage } from './features/reservation/MyReservationsPage'
import { ConfirmationPage } from './features/reservation/ConfirmationPage'
import { LoginPage } from './features/auth/LoginPage'
import { SignupPage } from './features/auth/SignupPage'
import { RequireAuth } from './features/auth/RequireAuth'
import { MyPage } from './features/account/MyPage'
import { RequireMemberMyPage } from './features/account/RequireMemberMyPage'
import { ProfileEditPage } from './features/account/ProfileEditPage'
import { AccountDeletePage } from './features/account/AccountDeletePage'
import { InquiryListPage } from './features/inquiry/InquiryListPage'
import { InquiryNewPage } from './features/inquiry/InquiryNewPage'
import { InquiryDetailPage } from './features/inquiry/InquiryDetailPage'
import { WellnessOverviewPage } from './features/wellness/WellnessOverviewPage'
import { WellnessCheckPage } from './features/wellness/WellnessCheckPage'
import { WellnessResultPage } from './features/wellness/WellnessResultPage'
import { WellnessHistoryPage } from './features/wellness/WellnessHistoryPage'
import { QuietnessSpaceDetailPage } from './features/wellness/QuietnessSpaceDetailPage'
import { ComponentGallery } from './dev/ComponentGallery'
import { DevShell } from './dev/DevShell'
import { DevLoginPage } from './dev/DevLoginPage'
import { isDevMode } from './dev/scenarios'
import { AdminLayout } from './features/admin/AdminLayout'
import { AdminProgramPage } from './features/program/admin/AdminProgramPage'
import { AdminProgramApplicantsPage } from './features/program/admin/AdminProgramApplicantsPage'
import { AdminInquiryListPage } from './features/inquiry/admin/AdminInquiryListPage'
import { AdminInquiryDetailPage } from './features/inquiry/admin/AdminInquiryDetailPage'
import { AdminQuietnessPage } from './features/quietness/admin/AdminQuietnessPage'
import {
  AdminFeaturePlaceholderPage,
  AdminForbiddenPage,
  AdminHomePage,
} from './features/admin/AdminPages'
import { RequireAdmin } from './features/admin/RequireAdmin'
import { AdminReservationsPage } from './features/admin/AdminReservationsPage'
import { AdminWellnessStatisticsPage } from './features/wellness/admin/AdminWellnessStatisticsPage'
import { AdminMembersPage } from './features/admin/AdminMembersPage'
import './index.css'
export default function App() {
  return (
    <BrowserRouter>
      {isDevMode && <DevShell />}
      <GlobalScrollbar />
      <Routes>
        <Route element={<AppLayout />}>
          <Route index element={<HomePage />} />
          <Route path="facility" element={<FacilityPage />} />
          <Route path="programs" element={<ProgramListPage />} />
          <Route path="programs/:programId" element={<ProgramDetailPage />} />
          <Route path="reviews" element={<ReviewPage />} />
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
          <Route path="admin/forbidden" element={<AdminForbiddenPage />} />
          <Route path="wellness/quietness/:spaceId" element={<QuietnessSpaceDetailPage />} />
          <Route
            path="mypage"
            element={
              <RequireMemberMyPage>
                <MyPage />
              </RequireMemberMyPage>
            }
          />
          <Route
            path="mypage/edit"
            element={
              <RequireMemberMyPage>
                <ProfileEditPage />
              </RequireMemberMyPage>
            }
          />
          <Route
            path="mypage/delete"
            element={
              <RequireMemberMyPage>
                <AccountDeletePage />
              </RequireMemberMyPage>
            }
          />
          <Route
            path="inquiries"
            element={
              <RequireAuth>
                <InquiryListPage />
              </RequireAuth>
            }
          />
          <Route
            path="inquiries/new"
            element={
              <RequireAuth>
                <InquiryNewPage />
              </RequireAuth>
            }
          />
          <Route
            path="inquiries/:inquiryId"
            element={
              <RequireAuth>
                <InquiryDetailPage />
              </RequireAuth>
            }
          />
          {isDevMode && <Route path="__dev/login" element={<DevLoginPage />} />}
          {isDevMode && <Route path="__dev/components" element={<ComponentGallery />} />}
          <Route path="*" element={<NotFoundPage />} />
        </Route>
        <Route
          path="admin"
          element={
            <RequireAdmin>
              <AdminLayout />
            </RequireAdmin>
          }
        >
          <Route index element={<AdminHomePage />} />
          <Route path="members" element={<AdminMembersPage />} />
          <Route path="members/:memberId" element={<AdminMembersPage />} />
          <Route path="reservations" element={<AdminReservationsPage />} />
          <Route path="reservations/:resvId" element={<AdminReservationsPage />} />
          <Route path="programs" element={<AdminProgramPage />} />
          <Route path="programs/:programId/applications" element={<AdminProgramApplicantsPage />} />
          <Route path="rooms" element={<AdminFeaturePlaceholderPage />} />
          <Route path="wellness" element={<AdminWellnessStatisticsPage />} />
          <Route path="quietness" element={<AdminQuietnessPage />} />
          <Route path="inquiries" element={<AdminInquiryListPage />} />
          <Route path="inquiries/:inquiryId" element={<AdminInquiryDetailPage />} />
          <Route path="*" element={<Navigate replace to="/admin" />} />
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
