import { useEffect, useRef, useState } from 'react'
import { ApiError } from '../../../lib/apiError'
import type { FacilityCategory } from '../../facility/types'
import {
  AdminButton,
  AdminFeedback,
  AdminField,
  AdminPageIntro,
  AdminPanel,
  AdminSummaryGrid,
} from '../../admin/AdminOperationsUi'
import { adminFacilitiesApi } from './api'
import type { AdminFacility, AdminFacilityRequest } from './types'

type FacilityForm = {
  name: string
  category: FacilityCategory
  active: boolean
  description: string
  imageUrl: string
}

const categoryLabels: Record<FacilityCategory, string> = {
  WELLNESS: '웰니스',
  LEISURE: '레저',
  FOOD: '식음',
  BUSINESS: '비즈니스',
  CONVENIENCE: '편의',
  PARKING: '주차',
  ACCESSIBILITY: '접근성',
  ETC: '기타',
}

const initialForm: FacilityForm = {
  name: '',
  category: 'WELLNESS',
  active: true,
  description: '',
  imageUrl: '',
}

export function AdminFacilityManagementPage() {
  const [facilities, setFacilities] = useState<AdminFacility[]>([])
  const [filter, setFilter] = useState<'ALL' | FacilityCategory>('ALL')
  const [form, setForm] = useState<FacilityForm>(initialForm)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const formRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    let active = true
    adminFacilitiesApi
      .list()
      .then((response) => active && setFacilities(response))
      .catch((cause) => active && setError(cause instanceof ApiError ? cause.message : '시설 목록을 불러오지 못했습니다.'))
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

  const startEdit = (facility: AdminFacility) => {
    setEditingId(facility.facilityId)
    setForm({
      name: facility.name,
      category: facility.category,
      active: facility.active,
      description: facility.description ?? '',
      imageUrl: facility.imageUrl ?? '',
    })
    setError('')
    setSuccess('')
    formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  const submit = async () => {
    if (!form.name.trim()) {
      setError('시설명을 입력해 주세요.')
      return
    }
    const request: AdminFacilityRequest = {
      name: form.name.trim(),
      category: form.category,
      active: form.active,
      description: form.description.trim() || undefined,
      imageUrl: form.imageUrl.trim() || undefined,
    }
    setSaving(true)
    setError('')
    setSuccess('')
    try {
      const saved = editingId == null
        ? await adminFacilitiesApi.create(request)
        : await adminFacilitiesApi.update(editingId, request)
      setFacilities((current) => {
        const exists = current.some((facility) => facility.facilityId === saved.facilityId)
        return exists
          ? current.map((facility) => (facility.facilityId === saved.facilityId ? saved : facility))
          : [...current, saved]
      })
      setEditingId(saved.facilityId)
      setSuccess(editingId == null ? '시설이 등록되었습니다.' : '시설 정보가 수정되었습니다.')
    } catch (cause) {
      setError(cause instanceof ApiError ? cause.message : '시설 정보를 저장하지 못했습니다.')
    } finally {
      setSaving(false)
    }
  }

  const visibleFacilities = filter === 'ALL'
    ? facilities
    : facilities.filter((facility) => facility.category === filter)

  return (
    <div className="mx-auto max-w-[1116px] rounded-xl bg-[#f8f5ef] p-5 md:p-8">
      <AdminPageIntro
        badgeDescription="목록 · 필터 · 등록 · 수정"
        badgeTitle="FACILITY API CONNECTED"
        description="고객에게 제공하는 부대시설의 분류와 노출 상태, 안내 정보를 관리합니다."
        eyebrow="STAY OPERATIONS"
        title="시설 관리"
      />
      <AdminSummaryGrid
        items={[
          { label: '전체 시설', value: facilities.length, note: 'GET /admin/facilities' },
          { label: '웰니스', value: facilities.filter((facility) => facility.category === 'WELLNESS').length, note: 'category = WELLNESS' },
          { label: '운영 중', value: facilities.filter((facility) => facility.active).length, note: 'active = true' },
        ]}
      />
      <div className="grid gap-5 xl:grid-cols-[0.95fr_1.05fr]">
        <AdminPanel
          action={
            <div className="flex flex-wrap gap-2">
              <select aria-label="시설 분류 필터" className="rounded-sm border border-ivory-200 bg-white px-3 py-2 text-[10px]" onChange={(event) => setFilter(event.target.value as 'ALL' | FacilityCategory)} value={filter}>
                <option value="ALL">전체 분류</option>
                {Object.entries(categoryLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
              </select>
              <AdminButton onClick={startCreate}>신규 시설 등록</AdminButton>
            </div>
          }
          endpoint="GET /api/admin/facilities"
          title="시설 목록"
        >
          {loading ? (
            <p className="py-12 text-center text-xs text-ink-500">시설 정보를 불러오는 중입니다.</p>
          ) : visibleFacilities.length === 0 ? (
            <p className="py-12 text-center text-xs text-ink-500">조건에 맞는 시설이 없습니다.</p>
          ) : (
            <ul className="m-0 grid list-none gap-0 p-0">
              {visibleFacilities.map((facility) => (
                <li className="grid grid-cols-[64px_1fr_auto] items-center gap-4 border-b border-ivory-200 py-4 first:pt-0 last:border-0 last:pb-0" key={facility.facilityId}>
                  <div className="grid h-16 w-16 place-items-center overflow-hidden rounded-sm bg-ivory-100 text-[9px] tracking-[0.08em] text-gold-500">
                    {facility.imageUrl ? <img alt="" className="h-full w-full object-cover" src={facility.imageUrl} /> : 'IMG'}
                  </div>
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <strong className="truncate text-sm font-medium text-navy-900">{facility.name}</strong>
                      <span className={`rounded-full px-2.5 py-1 text-[8px] ${facility.active ? 'bg-[#eef3e9] text-[#4f6945]' : 'bg-ivory-100 text-ink-500'}`}>{facility.active ? '운영 중' : '운영 중지'}</span>
                    </div>
                    <p className="mt-1 text-[9px] tracking-[0.05em] text-gold-500">{categoryLabels[facility.category]} · {facility.category}</p>
                    <p className="mt-2 line-clamp-2 text-[10px] leading-5 text-ink-500">{facility.description || '등록된 설명이 없습니다.'}</p>
                  </div>
                  <AdminButton onClick={() => startEdit(facility)} variant="outline">수정</AdminButton>
                </li>
              ))}
            </ul>
          )}
        </AdminPanel>

        <div ref={formRef}>
          <AdminPanel
            action={<AdminButton disabled={saving} onClick={() => void submit()}>{saving ? '저장 중' : '저장'}</AdminButton>}
            endpoint={editingId == null ? 'POST /api/admin/facilities' : `PATCH /api/admin/facilities/${editingId}`}
            title={editingId == null ? '시설 등록' : '시설 수정'}
          >
            <div className="grid gap-4 md:grid-cols-2">
              <AdminField label="시설명" required><input className="admin-field" maxLength={100} onChange={(e) => setForm({ ...form, name: e.target.value })} value={form.name} /></AdminField>
              <AdminField label="분류" required><select className="admin-field" onChange={(e) => setForm({ ...form, category: e.target.value as FacilityCategory })} value={form.category}>{Object.entries(categoryLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></AdminField>
              <AdminField label="운영 상태"><select className="admin-field" onChange={(e) => setForm({ ...form, active: e.target.value === 'true' })} value={String(form.active)}><option value="true">운영 중</option><option value="false">운영 중지</option></select></AdminField>
              <AdminField label="이미지 URL"><input className="admin-field" maxLength={512} onChange={(e) => setForm({ ...form, imageUrl: e.target.value })} placeholder="https://..." type="url" value={form.imageUrl} /></AdminField>
              <div className="md:col-span-2">
                <AdminField label="시설 설명"><textarea className="mt-2 min-h-28 w-full resize-y rounded-sm border border-ivory-200 bg-white px-3 py-3 text-xs" maxLength={255} onChange={(e) => setForm({ ...form, description: e.target.value })} value={form.description} /></AdminField>
                <p className="mt-1 text-right text-[9px] text-ink-500">{form.description.length} / 255</p>
              </div>
            </div>
            <p className="mt-5 rounded-sm bg-ivory-100 px-4 py-3 text-[9px] leading-5 text-ink-500">시설 삭제는 예약·안내 이력 보존 정책이 정해지지 않아 제공하지 않습니다. 노출 중단은 운영 상태로 관리합니다.</p>
            {error && <div className="mt-4"><AdminFeedback>{error}</AdminFeedback></div>}
            {success && <div className="mt-4"><AdminFeedback tone="success">{success}</AdminFeedback></div>}
          </AdminPanel>
        </div>
      </div>
    </div>
  )
}
