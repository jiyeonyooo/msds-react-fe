import { useEffect, useRef, useState } from 'react'
import { ApiError } from '../../../lib/apiError'
import {
  AdminButton,
  AdminFeedback,
  AdminField,
  AdminPageIntro,
  AdminPanel,
  AdminSummaryGrid,
} from '../../admin/AdminOperationsUi'
import { adminRoomsApi } from './api'
import type { AdminRoom, AdminRoomRequest } from './types'
import type { RoomStatus, RoomType } from '../types'

type RoomForm = {
  name: string
  description: string
  roomType: RoomType
  status: RoomStatus
  minGuest: string
  maxGuest: string
  area: string
  basePrice: string
}

const initialForm: RoomForm = {
  name: '',
  description: '',
  roomType: 'STAY',
  status: 'AVAILABLE',
  minGuest: '2',
  maxGuest: '2',
  area: '',
  basePrice: '',
}

const roomTypeLabels: Record<RoomType, string> = {
  STAY: '숙박',
  REST: '휴식',
  MEDITATE: '명상',
  RETREAT: '리트릿',
}

const statusLabels: Record<RoomStatus, string> = {
  AVAILABLE: '판매 가능',
  SOLDOUT: '판매 중지',
  INAVAILABLE: '운영 중지',
}

function statusClass(status: RoomStatus) {
  if (status === 'AVAILABLE') return 'bg-[#eef3e9] text-[#4f6945]'
  if (status === 'SOLDOUT') return 'bg-navy-900 text-white'
  return 'bg-ivory-100 text-ink-500'
}

function currency(value: number) {
  return `${new Intl.NumberFormat('ko-KR').format(value)}원`
}

export function AdminRoomManagementPage() {
  const [rooms, setRooms] = useState<AdminRoom[]>([])
  const [form, setForm] = useState<RoomForm>(initialForm)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const formRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    let active = true
    adminRoomsApi
      .list()
      .then((response) => active && setRooms(response))
      .catch((cause) => active && setError(cause instanceof ApiError ? cause.message : '객실 목록을 불러오지 못했습니다.'))
      .finally(() => active && setLoading(false))
    return () => {
      active = false
    }
  }, [])

  const startCreate = () => {
    setEditingId(null)
    setForm(initialForm)
    setError('')
    setSuccess('')
    formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  const startEdit = (room: AdminRoom) => {
    setEditingId(room.roomId)
    setForm({
      name: room.name,
      description: room.description ?? '',
      roomType: room.roomType,
      status: room.status,
      minGuest: String(room.capacity.standardGuests),
      maxGuest: String(room.capacity.maxGuests),
      area: room.roomSpecs.areaM2 == null ? '' : String(room.roomSpecs.areaM2),
      basePrice: String(room.basePrice),
    })
    setError('')
    setSuccess('')
    formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  const submit = async () => {
    const minGuest = Number(form.minGuest)
    const maxGuest = Number(form.maxGuest)
    const area = Number(form.area)
    const basePrice = Number(form.basePrice)
    if (!form.name.trim() || !form.description.trim() || !Number.isFinite(area) || area <= 0 || !Number.isFinite(basePrice) || basePrice < 0) {
      setError('필수 입력값을 모두 올바르게 입력해 주세요.')
      return
    }
    if (!Number.isInteger(minGuest) || !Number.isInteger(maxGuest) || minGuest < 1 || minGuest > maxGuest) {
      setError('기준 인원과 최대 인원을 확인해 주세요. 최대 인원은 기준 인원보다 작을 수 없습니다.')
      return
    }

    const request: AdminRoomRequest = {
      name: form.name.trim(),
      description: form.description.trim(),
      roomType: form.roomType,
      status: form.status,
      minGuest,
      maxGuest,
      area,
      basePrice,
    }
    setSaving(true)
    setError('')
    setSuccess('')
    try {
      const saved = editingId == null
        ? await adminRoomsApi.create(request)
        : await adminRoomsApi.update(editingId, request)
      setRooms((current) => {
        const exists = current.some((room) => room.roomId === saved.roomId)
        return exists ? current.map((room) => (room.roomId === saved.roomId ? saved : room)) : [...current, saved]
      })
      setEditingId(saved.roomId)
      setSuccess(editingId == null ? '객실이 등록되었습니다.' : '객실 정보가 수정되었습니다.')
    } catch (cause) {
      setError(cause instanceof ApiError ? cause.message : '객실 정보를 저장하지 못했습니다.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="mx-auto max-w-[1116px] rounded-xl bg-[#f8f5ef] p-5 md:p-8">
      <AdminPageIntro
        badgeDescription="목록 · 상세 · 등록 · 수정"
        badgeTitle="ROOM API CONNECTED"
        description="객실의 판매 상태와 수용 인원, 면적, 기준 요금을 관리합니다."
        eyebrow="STAY OPERATIONS"
        title="객실 관리"
      />
      <AdminSummaryGrid
        items={[
          { label: '전체 객실', value: rooms.length, note: 'GET /admin/rooms' },
          { label: '판매 가능', value: rooms.filter((room) => room.status === 'AVAILABLE').length, note: 'status = AVAILABLE' },
          { label: '판매 중지', value: rooms.filter((room) => room.status !== 'AVAILABLE').length, note: '운영 확인 필요' },
        ]}
      />
      <div className="grid gap-5 xl:grid-cols-[0.95fr_1.05fr]">
        <AdminPanel
          action={<AdminButton onClick={startCreate}>신규 객실 등록</AdminButton>}
          endpoint="GET /api/admin/rooms · GET /api/admin/rooms/{roomId}"
          title="객실 목록"
        >
          {loading ? (
            <p className="py-12 text-center text-xs text-ink-500">객실 정보를 불러오는 중입니다.</p>
          ) : rooms.length === 0 ? (
            <p className="py-12 text-center text-xs text-ink-500">등록된 객실이 없습니다.</p>
          ) : (
            <ul className="m-0 grid list-none gap-0 p-0">
              {rooms.map((room) => (
                <li className="grid gap-4 border-b border-ivory-200 py-5 first:pt-0 last:border-0 last:pb-0" key={room.roomId}>
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <strong className="text-sm font-medium text-navy-900">{room.name}</strong>
                      <p className="mt-1 text-[9px] tracking-[0.05em] text-gold-500">{roomTypeLabels[room.roomType]} · {room.roomType}</p>
                    </div>
                    <span className={`rounded-full px-3 py-1.5 text-[9px] ${statusClass(room.status)}`}>{statusLabels[room.status]}</span>
                  </div>
                  <div className="grid grid-cols-3 gap-2 rounded-sm bg-ivory-100 px-3 py-3 text-[9px] text-ink-500">
                    <span>인원 <strong className="block pt-1 text-[10px] font-medium text-navy-900">{room.capacity.standardGuests} / {room.capacity.maxGuests}명</strong></span>
                    <span>면적 <strong className="block pt-1 text-[10px] font-medium text-navy-900">{room.roomSpecs.areaM2 ?? '-'}㎡</strong></span>
                    <span>기준 요금 <strong className="block pt-1 text-[10px] font-medium text-navy-900">{currency(room.basePrice)}</strong></span>
                  </div>
                  <AdminButton className="justify-self-end" onClick={() => startEdit(room)} variant="outline">수정</AdminButton>
                </li>
              ))}
            </ul>
          )}
        </AdminPanel>

        <div ref={formRef}>
          <AdminPanel
            action={<AdminButton disabled={saving} onClick={() => void submit()}>{saving ? '저장 중' : '저장'}</AdminButton>}
            endpoint={editingId == null ? 'POST /api/admin/rooms' : `PATCH /api/admin/rooms/${editingId}`}
            title={editingId == null ? '객실 등록' : '객실 수정'}
          >
            <div className="grid gap-4 md:grid-cols-2">
              <AdminField label="객실명" required><input className="admin-field" maxLength={100} onChange={(e) => setForm({ ...form, name: e.target.value })} value={form.name} /></AdminField>
              <AdminField label="객실 유형" required><select className="admin-field" onChange={(e) => setForm({ ...form, roomType: e.target.value as RoomType })} value={form.roomType}>{Object.entries(roomTypeLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></AdminField>
              <AdminField label="판매 상태" required><select className="admin-field" onChange={(e) => setForm({ ...form, status: e.target.value as RoomStatus })} value={form.status}>{Object.entries(statusLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></AdminField>
              <AdminField label="기준 인원" required><input className="admin-field" min="1" onChange={(e) => setForm({ ...form, minGuest: e.target.value })} type="number" value={form.minGuest} /></AdminField>
              <AdminField label="최대 인원" required><input className="admin-field" min="1" onChange={(e) => setForm({ ...form, maxGuest: e.target.value })} type="number" value={form.maxGuest} /></AdminField>
              <AdminField label="면적 (㎡)" required><input className="admin-field" min="0.1" onChange={(e) => setForm({ ...form, area: e.target.value })} step="0.1" type="number" value={form.area} /></AdminField>
              <AdminField label="기준 요금 (원)" required><input className="admin-field" min="0" onChange={(e) => setForm({ ...form, basePrice: e.target.value })} step="1000" type="number" value={form.basePrice} /></AdminField>
              <AdminField label="설명" required><textarea className="mt-2 min-h-28 w-full resize-y rounded-sm border border-ivory-200 bg-white px-3 py-3 text-xs" maxLength={500} onChange={(e) => setForm({ ...form, description: e.target.value })} value={form.description} /></AdminField>
            </div>
            <p className="mt-5 rounded-sm bg-ivory-100 px-4 py-3 text-[9px] leading-5 text-ink-500">객실 삭제 기능은 운영 데이터 보존 정책이 정의되지 않아 제공하지 않습니다. 판매 중단은 상태를 변경해 관리합니다.</p>
            {error && <div className="mt-4"><AdminFeedback>{error}</AdminFeedback></div>}
            {success && <div className="mt-4"><AdminFeedback tone="success">{success}</AdminFeedback></div>}
          </AdminPanel>
        </div>
      </div>
    </div>
  )
}
