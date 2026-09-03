import { Outlet } from 'react-router-dom'
import { BackToTop, RouteFade } from './motion'
import { Footer, Header, ToastHost } from './ui'

export function AppLayout() {
  return (
    <div className="min-h-screen">
      <Header />
      <RouteFade>
        <Outlet />
      </RouteFade>
      <Footer />
      <BackToTop />
      <ToastHost />
    </div>
  )
}
