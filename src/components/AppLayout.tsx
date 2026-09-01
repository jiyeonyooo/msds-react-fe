import { useEffect, useState } from 'react'
import { NavLink, Outlet } from 'react-router-dom'
import { getDevAuthState } from '../dev/auth'
import { isDevMode } from '../dev/scenarios'

const links = [{ label: 'HOME', path: '/' }, { label: 'STAY', path: '/reservations' }, { label: 'PROGRAM', path: '/programs' }, { label: 'WELLNESS', path: '/wellness' }, { label: 'ABOUT', path: '/about' }]
export function AppLayout() { const [signedIn,setSignedIn]=useState(isDevMode&&getDevAuthState()==='member'); useEffect(()=>{const update=()=>setSignedIn(getDevAuthState()==='member');addEventListener('msds-dev-auth',update);return()=>removeEventListener('msds-dev-auth',update)},[]); const action=signedIn?{to:'/my-reservations',label:'MY RESERVATION'}:{to:'/login',label:'LOGIN'}; return <div className="app-shell"><header className="site-header"><div className="header-inner"><NavLink className="logo" to="/" aria-label="MSDS 홈으로"><span>☾</span>MSDS</NavLink><nav aria-label="주요 메뉴">{links.map(link=><NavLink key={link.path} className={({isActive})=>isActive?'nav-link active':'nav-link'} to={link.path}>{link.label}</NavLink>)}</nav><NavLink className="header-cta" to={action.to}>{action.label}</NavLink></div></header><Outlet /><footer className="site-footer"><strong>☾ MSDS</strong><p>MINDFUL STAY, DEEP SILENCE</p><small>기능별 구현은 <code>src/features</code>에서 이어갈 수 있습니다.</small></footer></div> }
