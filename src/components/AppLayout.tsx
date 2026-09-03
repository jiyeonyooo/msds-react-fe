import { Outlet } from 'react-router-dom'
import { BackToTop, RouteFade } from './motion'
import { BookingSummaryBar, Footer, Header, ToastHost } from './ui'

export function AppLayout() {
  return (
    <div className="min-h-screen">
      <Header />
      <BookingSummaryBar />
      <RouteFade>
        <Outlet />
      </RouteFade>
      <Footer />
      <BackToTop />
      <ToastHost />
    </div>
  )
}
