export type AdminNavigationItem = {
  to: string
  label: string
  description: string
  endpoint: string
}

export const adminNavigation: AdminNavigationItem[] = [
  { to: '/admin/members', label: '회원 관리', description: '회원 정보와 회원별 예약 내역 조회', endpoint: 'GET /admin/members' },
  { to: '/admin/reservations', label: '예약 관리', description: '예약 조회와 상태 관리', endpoint: 'GET /admin/resv' },
  { to: '/admin/programs', label: '프로그램 관리', description: '명상 프로그램 운영', endpoint: 'GET /meditation/admin' },
  { to: '/admin/rooms', label: '객실 관리', description: '객실 정보와 판매 상태 관리', endpoint: '/admin/rooms' },
  { to: '/admin/facilities', label: '시설 관리', description: '부대시설 정보와 운영 상태 관리', endpoint: '/admin/facilities' },
  { to: '/admin/wellness', label: '웰니스 통계', description: '숙박객 마음상태 통계', endpoint: 'GET /admin/wellness/statistics' },
  { to: '/admin/quietness', label: '조용함 관리', description: '측정 기기와 공간 현황 관리', endpoint: '/admin/noise-devices' },
  { to: '/admin/inquiries', label: '문의 관리', description: '고객 문의와 답변 관리', endpoint: '/admin/inquiries' },
]
