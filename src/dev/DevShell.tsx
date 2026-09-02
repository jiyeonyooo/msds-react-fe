import { useEffect, useRef, useState, type PointerEvent } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { getDevAuthState, setDevAuthState, type DevAuthState } from './auth'
import { devScenarios, getDevScenario, setDevScenario, type DevScenario } from './scenarios'
import './dev.css'

const routes = [
  { path: '/admin', label: 'ADMIN HOME' },
  { path: '/admin/reservations', label: 'ADMIN · RESERVATIONS' },
  { path: '/admin/programs', label: 'ADMIN · PROGRAMS' },
  { path: '/admin/rooms', label: 'ADMIN · ROOMS' },
  { path: '/admin/wellness', label: 'ADMIN · WELLNESS' },
  { path: '/admin/quietness', label: 'ADMIN · QUIETNESS' },
  { path: '/admin/inquiries', label: 'ADMIN · INQUIRIES' },
  { path: '/', label: '홈' },
  { path: '/reservations', label: '예약 조회' },
  { path: '/my-reservations', label: '내 예약' },
  { path: '/login', label: '로그인' },
  { path: '/signup', label: '회원가입' },
  { path: '/__dev/components', label: '컴포넌트' },
]
export function DevShell() {
  const navigate = useNavigate()
  const location = useLocation()
  const [open, setOpen] = useState(true)
  const [scenario, setScenario] = useState<DevScenario>(getDevScenario())
  const [auth, setAuth] = useState<DevAuthState>(getDevAuthState())
  const [position, setPosition] = useState({ x: Math.max(16, window.innerWidth - 276), y: 16 })
  const drag = useRef<{
    pointerX: number
    pointerY: number
    startX: number
    startY: number
  } | null>(null)
  useEffect(() => {
    const sync = () => {
      setScenario(getDevScenario())
      setAuth(getDevAuthState())
    }
    addEventListener('msds-dev-scenario', sync)
    addEventListener('msds-dev-auth', sync)
    return () => {
      removeEventListener('msds-dev-scenario', sync)
      removeEventListener('msds-dev-auth', sync)
    }
  }, [])
  useEffect(() => {
    const move = (event: globalThis.PointerEvent) => {
      if (!drag.current) return
      setPosition({
        x: Math.max(0, drag.current.startX + event.clientX - drag.current.pointerX),
        y: Math.max(0, drag.current.startY + event.clientY - drag.current.pointerY),
      })
    }
    const up = () => {
      drag.current = null
    }
    addEventListener('pointermove', move)
    addEventListener('pointerup', up)
    return () => {
      removeEventListener('pointermove', move)
      removeEventListener('pointerup', up)
    }
  }, [])
  const startDrag = (event: PointerEvent<HTMLElement>) => {
    if ((event.target as HTMLElement).closest('button')) return
    drag.current = {
      pointerX: event.clientX,
      pointerY: event.clientY,
      startX: position.x,
      startY: position.y,
    }
  }
  if (!open)
    return (
      <button className="dev-fab" onClick={() => setOpen(true)}>
        DEV
      </button>
    )
  return (
    <aside
      className="dev-shell"
      style={{ left: position.x, top: position.y, right: 'auto' }}
      aria-label="개발 도구"
    >
      <header onPointerDown={startDrag}>
        <strong>DEVTOOLS</strong>
        <span>DRAG</span>
        <button onClick={() => setOpen(false)} aria-label="개발 도구 접기">
          ×
        </button>
      </header>
      <section className="dev-routes">
        <h2>ROUTES</h2>
        {routes.map((route) => (
          <button
            className={location.pathname === route.path ? 'selected' : ''}
            key={route.path}
            onClick={() => navigate(route.path)}
          >
            <span>{route.label}</span>
            <code>{route.path}</code>
          </button>
        ))}
      </section>
      <section>
        <h2>AUTH</h2>
        <select
          aria-label="인증 상태"
          value={auth}
          onChange={(e) => {
            const next = e.target.value as DevAuthState
            setDevAuthState(next)
            setAuth(next)
          }}
        >
          <option value="guest">비로그인</option>
          <option value="member">로그인됨</option>
          <option value="admin">ADMIN</option>
        </select>
      </section>
      <section>
        <h2>API SCENARIO</h2>
        <select
          aria-label="API 시나리오"
          value={scenario}
          onChange={(e) => {
            const next = e.target.value as DevScenario
            setDevScenario(next)
            setScenario(next)
          }}
        >
          {devScenarios.map((item) => (
            <option key={item.id} value={item.id}>
              {item.label}
            </option>
          ))}
        </select>
        <p>변경 후 화면의 조회·확정·취소 동작을 다시 실행하세요.</p>
      </section>
      <Link to="/__dev/components">OPEN COMPONENTS →</Link>
    </aside>
  )
}
