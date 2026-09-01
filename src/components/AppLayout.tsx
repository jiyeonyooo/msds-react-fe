import { Outlet } from 'react-router-dom'
import { Footer, Header } from './ui'

export function AppLayout() {
  return (
    <div className="min-h-screen">
      <Header />
      <Outlet />
      <Footer />
    </div>
  )
}
