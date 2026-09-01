import { BrowserRouter, Route, Routes } from 'react-router-dom'
import { AppLayout } from './components/AppLayout'
import { HomePage } from './features/home/HomePage'
import { ReservationPage } from './features/reservation/ReservationPage'
import { MyReservationsPage } from './features/reservation/MyReservationsPage'
import { ConfirmationPage } from './features/reservation/ConfirmationPage'
import { ComponentGallery } from './dev/ComponentGallery'
import { DevShell } from './dev/DevShell'
import { isDevMode } from './dev/scenarios'
import './index.css'
export default function App() { return <BrowserRouter>{isDevMode && <DevShell />}<Routes><Route element={<AppLayout />}><Route index element={<HomePage />} /><Route path="reservations" element={<ReservationPage />} /><Route path="reservations/confirm" element={<ConfirmationPage />} /><Route path="my-reservations" element={<MyReservationsPage />} /><Route path="my-reservations/:resvId" element={<MyReservationsPage />} />{isDevMode && <Route path="__dev/components" element={<ComponentGallery />} />}<Route path="*" element={<NotFoundPage />} /></Route></Routes></BrowserRouter> }
function NotFoundPage() { return <main className="page error-page"><p className="eyebrow gold">NOT FOUND</p><h1>페이지를 찾을 수 없습니다.</h1><a className="primary-button" href="/">홈으로 돌아가기</a></main> }
