import { useEffect, useState } from 'react'
import { getDevAuthState } from '../../dev/auth'
import { isDevMode } from '../../dev/scenarios'
import { useSession } from '../auth/useSession'

export function useWellnessMember() {
  const session = useSession()
  const [devMember, setDevMember] = useState(isDevMode && getDevAuthState() === 'member')
  useEffect(() => {
    const update = () => setDevMember(isDevMode && getDevAuthState() === 'member')
    addEventListener('msds-dev-auth', update)
    return () => removeEventListener('msds-dev-auth', update)
  }, [])
  return { isMember: session !== null || devMember, session }
}
