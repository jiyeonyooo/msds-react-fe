import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { AdminApiError, adminApi } from './api'
import { RoomImageEditor } from './ImageUploadFields'
import { resolveImageUrl, uploadPendingImage, type PendingImage } from './imageUpload'
import { AdminField, AdminPageHeader, inputClass, LoadingState, Notice } from './shared'
import type { RoomFormValue, RoomImageType, RoomUpdateRequest } from './types'

const initial: RoomFormValue = {
  name: '',
  description: '',
  roomType: 'STAY',
  status: 'INAVAILABLE',
  minGuest: 1,
  maxGuest: 1,
  area: 0,
  basePrice: 0,
}
const labels = {
  STAY: '스테이',
  REST: '휴식',
  MEDITATE: '명상',
  RETREAT: '리트리트',
  AVAILABLE: '판매 가능',
  SOLDOUT: '매진',
  INAVAILABLE: '판매 중지',
}

function validate(v: RoomFormValue) {
  const e: Partial<Record<keyof RoomFormValue, string>> = {}
  if (!v.name.trim()) e.name = '객실명을 입력해 주세요.'
  else if (v.name.trim().length > 100) e.name = '100자 이하로 입력해 주세요.'
  if (!v.description.trim()) e.description = '상세 설명을 입력해 주세요.'
  if (!Number.isInteger(v.minGuest) || v.minGuest < 1) e.minGuest = '1 이상의 정수를 입력해 주세요.'
  if (!Number.isInteger(v.maxGuest) || v.maxGuest < v.minGuest)
    e.maxGuest = '기준 인원 이상의 정수를 입력해 주세요.'
  if (!(v.area > 0)) e.area = '0보다 큰 면적을 입력해 주세요.'
  if (!Number.isInteger(v.basePrice) || v.basePrice < 0)
    e.basePrice = '0 이상의 원 단위 정수를 입력해 주세요.'
  return e
}

export function RoomFormPage() {
  const { roomId } = useParams()
  const id = roomId ? Number(roomId) : null
  const edit = id !== null
  const navigate = useNavigate()
  const [form, setForm] = useState(initial)
  const [base, setBase] = useState(initial)
  const [loading, setLoading] = useState(edit)
  const [pending, setPending] = useState(false)
  const [message, setMessage] = useState('')
  const [errors, setErrors] = useState<ReturnType<typeof validate>>({})
  const [images, setImages] = useState<PendingImage[]>([])
  const [createdRoomId, setCreatedRoomId] = useState<number | null>(null)
  const [serverImages, setServerImages] = useState<
    { imageId: number; imageUrl: string; imageType: RoomImageType; sortOrder: number }[]
  >([])
  const dirty = JSON.stringify(form) !== JSON.stringify(base) || images.length > 0
  const invalid = Object.keys(validate(form)).length > 0
  useEffect(() => {
    if (!edit || !id) return
    void adminApi
      .roomDetail(id)
      .then((r) => {
        const v: RoomFormValue = {
          name: r.name,
          description: r.description ?? '',
          roomType: r.roomType,
          status: r.status,
          minGuest: r.capacity.standardGuests,
          maxGuest: r.capacity.maxGuests,
          area: r.roomSpecs.areaM2 ?? 0,
          basePrice: r.basePrice,
        }
        setForm(v)
        setBase(v)
        setServerImages(
          r.images.flatMap((image) =>
            image.imageId == null
              ? []
              : [{ ...image, imageId: image.imageId, imageType: image.imageType as RoomImageType }],
          ),
        )
      })
      .catch((e: Error) => setMessage(e.message))
      .finally(() => setLoading(false))
  }, [edit, id])
  useEffect(() => {
    const guard = (e: BeforeUnloadEvent) => {
      if (dirty) {
        e.preventDefault()
        e.returnValue = ''
      }
    }
    addEventListener('beforeunload', guard)
    return () => removeEventListener('beforeunload', guard)
  }, [dirty])
  const patch = useMemo(
    () =>
      Object.fromEntries(
        (Object.keys(form) as (keyof RoomFormValue)[])
          .filter((k) => form[k] !== base[k])
          .map((k) => [k, form[k]]),
      ) as RoomUpdateRequest,
    [form, base],
  )
  const set = <K extends keyof RoomFormValue>(key: K, value: RoomFormValue[K]) => {
    setForm((v) => ({ ...v, [key]: value }))
    setMessage('')
  }
  async function submit(e: FormEvent) {
    e.preventDefault()
    const next = validate(form)
    setErrors(next)
    if (Object.keys(next).length) return
    setPending(true)
    setMessage('')
    try {
      const effectiveRoomId = id ?? createdRoomId
      const result =
        effectiveRoomId
          ? Object.keys(patch).length
            ? await adminApi.updateRoom(effectiveRoomId, patch)
            : await adminApi.roomDetail(effectiveRoomId)
          : await adminApi.createRoom({
              ...form,
              name: form.name.trim(),
              description: form.description.trim(),
            })
      const targetRoomId = result.roomId
      const uploaded = []
      const failedIds = new Set<string>()
      for (const image of images) {
        try {
          const file =
            image.uploaded ??
            (await uploadPendingImage(image, 'rooms', (change) =>
              setImages((items) =>
                items.map((item) =>
                  item.clientId === image.clientId ? { ...item, ...change } : item,
                ),
              ),
            ))
          uploaded.push({
            imageUrl: file.url,
            imageType: image.imageType,
            sortOrder: serverImages.length + image.sortOrder,
          })
        } catch {
          failedIds.add(image.clientId)
          // Each failed item remains visible and can be retried without re-uploading successful files.
        }
      }
      if (uploaded.length) await adminApi.addRoomImages(targetRoomId, uploaded)
      const v: RoomFormValue = {
        name: result.name,
        description: result.description ?? '',
        roomType: result.roomType,
        status: result.status,
        minGuest: result.capacity.standardGuests,
        maxGuest: result.capacity.maxGuests,
        area: result.roomSpecs.areaM2 ?? form.area,
        basePrice: result.basePrice,
      }
      setBase(v)
      setForm(v)
      if (failedIds.size) {
        images
          .filter((image) => !failedIds.has(image.clientId))
          .forEach((image) => URL.revokeObjectURL(image.previewUrl))
        setImages((items) => items.filter((image) => failedIds.has(image.clientId)))
        setCreatedRoomId(targetRoomId)
        setMessage('객실 정보는 저장했지만 일부 이미지 업로드에 실패했습니다. 실패한 이미지를 다시 시도해 주세요.')
        return
      }
      images.forEach((image) => URL.revokeObjectURL(image.previewUrl))
      setImages([])
      if (!edit) {
        navigate('/admin/rooms', { replace: true, state: { toast: '객실이 등록되었습니다.' } })
      } else {
        navigate('/admin/rooms', {
          replace: true,
          state: { toast: '객실 정보가 수정되었습니다.' },
        })
      }
    } catch (err) {
      const api = err as AdminApiError
      setMessage(api.status === 404 ? '요청한 객실을 찾을 수 없습니다.' : api.message)
    } finally {
      setPending(false)
    }
  }
  if (loading)
    return (
      <section>
        <LoadingState />
      </section>
    )
  return (
    <section className="pb-24 md:pb-0">
      <AdminPageHeader
        eyebrow={edit ? 'EDIT ROOM' : 'NEW ROOM'}
        title={edit ? '객실 수정' : '객실 등록'}
      />
      <div className="mx-auto w-full max-w-4xl">
        {message && <Notice error={!message.includes('저장되었습니다')}>{message}</Notice>}
        <form className="grid gap-6" onSubmit={submit} noValidate>
          <section className="grid gap-5 rounded-lg border border-slate-200 bg-white p-5 shadow-sm md:p-6">
            <h2 className="m-0 border-b border-slate-100 pb-4 text-base font-semibold text-[#172b44]">
              기본 정보
            </h2>
            <AdminField label="객실명" required error={errors.name}>
              <input
                className={inputClass}
                value={form.name}
                maxLength={100}
                onChange={(e) => set('name', e.target.value)}
                aria-invalid={!!errors.name}
              />
            </AdminField>
            <AdminField label="상세 설명" required error={errors.description}>
              <textarea
                className={`${inputClass} min-h-32`}
                value={form.description}
                onChange={(e) => set('description', e.target.value)}
              />
            </AdminField>
            <div className="grid gap-5 sm:grid-cols-2">
              <AdminField label="객실 유형" required>
                <select
                  className={inputClass}
                  value={form.roomType}
                  onChange={(e) => set('roomType', e.target.value as RoomFormValue['roomType'])}
                >
                  {(['STAY', 'REST', 'MEDITATE', 'RETREAT'] as const).map((x) => (
                    <option key={x} value={x}>
                      {labels[x]}
                    </option>
                  ))}
                </select>
              </AdminField>
              <AdminField label="판매 상태" required>
                <select
                  className={inputClass}
                  value={form.status}
                  onChange={(e) => set('status', e.target.value as RoomFormValue['status'])}
                >
                  {(['AVAILABLE', 'SOLDOUT', 'INAVAILABLE'] as const).map((x) => (
                    <option key={x} value={x}>
                      {labels[x]}
                    </option>
                  ))}
                </select>
              </AdminField>
            </div>
          </section>
          <section className="grid gap-5 rounded-lg border border-slate-200 bg-white p-5 shadow-sm md:grid-cols-3 md:p-6">
            <h2 className="m-0 border-b border-slate-100 pb-4 text-base font-semibold text-[#172b44] md:col-span-3">
              수용·규격 정보
            </h2>
            {(['minGuest', 'maxGuest', 'area'] as const).map((k) => (
              <AdminField
                key={k}
                label={{ minGuest: '기준 인원', maxGuest: '최대 인원', area: '면적 (m²)' }[k]}
                required
                error={errors[k]}
              >
                <input
                  className={inputClass}
                  type="number"
                  min={k === 'area' ? '0.01' : '1'}
                  step={k === 'area' ? '0.01' : '1'}
                  value={form[k]}
                  onChange={(e) => set(k, Number(e.target.value))}
                />
              </AdminField>
            ))}
          </section>
          <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm md:p-6">
            <h2 className="mt-0 border-b border-slate-100 pb-4 text-base font-semibold text-[#172b44]">
              가격 정보
            </h2>
            <AdminField label="1박 기본 가격 (원)" required error={errors.basePrice}>
              <input
                className={inputClass}
                type="number"
                min="0"
                step="1"
                value={form.basePrice}
                onChange={(e) => set('basePrice', Number(e.target.value))}
              />
            </AdminField>
          </section>
          {serverImages.length > 0 && (
            <section className="grid gap-4 rounded-lg border border-slate-200 bg-white p-5 shadow-sm md:p-6">
              <h2 className="m-0 border-b border-slate-100 pb-4 text-base font-semibold text-[#172b44]">등록된 객실 이미지</h2>
              <div className="grid gap-4 sm:grid-cols-2">
                {serverImages.sort((a, b) => a.sortOrder - b.sortOrder).map((image) => (
                  <article className="overflow-hidden rounded border border-slate-200" key={image.imageId}>
                    <img className="h-40 w-full bg-slate-100 object-cover" src={resolveImageUrl(image.imageUrl)} alt="등록된 객실 이미지" />
                    <div className="flex items-center justify-between gap-2 p-3 text-sm">
                      <span>{image.imageType}</span>
                      <button
                        type="button"
                        className="min-h-9 rounded-sm border border-slate-300 px-3 text-xs"
                        disabled={pending}
                        onClick={async () => {
                          if (!id || !confirm('이 객실 이미지를 삭제하시겠습니까?')) return
                          setPending(true)
                          try {
                            await adminApi.deleteRoomImage(id, image.imageId)
                            setServerImages((items) => items.filter((item) => item.imageId !== image.imageId))
                          } catch (error) {
                            setMessage(error instanceof Error ? error.message : '이미지를 삭제하지 못했습니다.')
                          } finally {
                            setPending(false)
                          }
                        }}
                        aria-label="등록된 객실 이미지 삭제"
                      >삭제</button>
                    </div>
                  </article>
                ))}
              </div>
            </section>
          )}
          <RoomImageEditor
            images={images}
            onChange={setImages}
            disabled={pending}
            existingImageCount={serverImages.length}
          />
          <div className="fixed inset-x-0 bottom-0 z-10 flex justify-end gap-2 border-t border-slate-200 bg-white p-4 shadow-lg md:static md:border-0 md:bg-transparent md:p-0 md:shadow-none">
            <button
              type="button"
              className="min-h-11 rounded-sm border border-slate-300 bg-white px-5 text-sm font-medium text-slate-700 hover:bg-slate-50"
              onClick={() => {
                if (
                  !dirty ||
                  confirm('저장하지 않은 변경사항이 있습니다. 페이지를 나가시겠습니까?')
                )
                  navigate('/admin/rooms')
              }}
            >
              취소
            </button>
            <button
              className="min-h-11 rounded-sm bg-[#172b44] px-6 text-sm font-medium text-white hover:bg-[#253f5d] disabled:cursor-not-allowed disabled:bg-slate-300"
              disabled={pending || invalid || (edit && !dirty)}
            >
              {pending ? '저장 중입니다…' : edit ? '변경사항 저장' : '등록'}
            </button>
          </div>
        </form>
      </div>
    </section>
  )
}
