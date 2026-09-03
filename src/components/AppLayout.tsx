import { Outlet } from 'react-router-dom'
import { BackToTop, RouteFade, ScrollProgress } from './motion'
import { Footer, Header } from './ui'

export function AppLayout() {
  return (
    <div className="min-h-screen">
      <ScrollProgress />
      <Header />
      <RouteFade>
        <Outlet />
      </RouteFade>
      <Footer />
      <BackToTop />
    </div>
  )
}
