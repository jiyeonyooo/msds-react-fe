export type AdminNavigationItem = {
  to: string
  label: string
  description: string
  endpoint: string
}

/**
 * 관리자 기능 목록. 상단 메뉴와 대시보드 카드가 같은 배열을 쓴다.
 * 한 기능이 두 번 들어가면 메뉴와 카드에 그대로 중복으로 나오므로 경로는 하나씩만 둔다.
 */
export const adminNavigation: AdminNavigationItem[] = [
  { to: '/admin/members', label: '회원 관리', description: '회원 조회와 정보·권한, 회원별 예약 내역 관리', endpoint: 'GET /admin/members' },
  { to: '/admin/reservations', label: '예약 관리', description: '예약 조회와 상태 관리', endpoint: 'GET /admin/resv' },
  { to: '/admin/inquiries', label: '문의 관리', description: '고객 문의와 답변 관리', endpoint: '/admin/inquiries' },
  { to: '/admin/rooms', label: '객실 관리', description: '객실 정보와 판매 상태 관리', endpoint: '/admin/rooms' },
  { to: '/admin/facilities', label: '시설 관리', description: '부대시설 정보와 운영 상태 관리', endpoint: '/admin/facilities' },
  { to: '/admin/programs', label: '프로그램 관리', description: '명상 프로그램 운영', endpoint: 'GET /meditation/admin' },
  { to: '/admin/wellness', label: '웰니스 통계', description: '숙박객 마음상태 통계', endpoint: 'GET /admin/wellness/statistics' },
  { to: '/admin/quietness', label: '조용함 관리', description: '측정 기기와 공간 현황 관리', endpoint: '/admin/noise-devices' },
]
