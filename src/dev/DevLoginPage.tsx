import { useNavigate } from 'react-router-dom'
import { setDevAuthState } from './auth'

export function DevLoginPage() {
  const navigate = useNavigate()
  const signIn = () => {
    setDevAuthState('member')
    navigate(sessionStorage.getItem('return_path') ?? '/')
  }
  return (
    <main className="dev-login">
      <section>
        <p>DEVELOPMENT ONLY</p>
        <h1>로그인 상태 전환</h1>
        <span>개발 도구의 인증 상태를 로그인됨으로 바꿉니다.</span>
        <button onClick={signIn}>로그인된 상태로 계속</button>
      </section>
    </main>
  )
}
