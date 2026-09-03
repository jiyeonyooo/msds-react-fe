import { useEffect, useRef, useState, type ChangeEvent } from 'react'
import {
  createPendingImage,
  MAX_ROOM_IMAGE_COUNT,
  resolveImageUrl,
  validateImageFile,
  type PendingImage,
} from './imageUpload'
import type { RoomImageType } from './types'

const typeLabels: Record<RoomImageType, string> = {
  MAIN: '대표',
  BEDROOM: '침실',
  BATHROOM: '욕실',
  VIEW: '전망',
  ETC: '기타',
}

const buttonClass =
  'min-h-9 rounded-sm border border-slate-300 bg-white px-3 text-xs font-medium text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40'

export function RoomImageEditor({
  images,
  onChange,
  disabled,
  existingImageCount = 0,
}: {
  images: PendingImage[]
  onChange: (images: PendingImage[]) => void
  disabled?: boolean
  existingImageCount?: number
}) {
  const [error, setError] = useState('')
  const imagesRef = useRef(images)
  useEffect(() => {
    imagesRef.current = images
  }, [images])
  useEffect(
    () => () => imagesRef.current.forEach((image) => URL.revokeObjectURL(image.previewUrl)),
    [],
  )

  function selectFiles(event: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files ?? [])
    event.target.value = ''
    if (existingImageCount + images.length + files.length > MAX_ROOM_IMAGE_COUNT) {
      setError(`객실 이미지는 최대 ${MAX_ROOM_IMAGE_COUNT}장까지 등록할 수 있습니다.`)
      return
    }
    const invalid = files.map(validateImageFile).find(Boolean)
    if (invalid) {
      setError(invalid)
      return
    }
    setError('')
    onChange([
      ...images,
      ...files.map((file, index) => {
        const image = createPendingImage(file, images.length + index)
        return existingImageCount > 0 && image.imageType === 'MAIN'
          ? { ...image, imageType: 'ETC' as const }
          : image
      }),
    ])
  }

  function remove(index: number) {
    URL.revokeObjectURL(images[index].previewUrl)
    const next: PendingImage[] = images.filter((_, i) => i !== index).map((image, sortOrder) => ({
      ...image,
      sortOrder,
      imageType: image.imageType === 'MAIN' ? ('ETC' as const) : image.imageType,
    }))
    if (next.length && !next.some((image) => image.imageType === 'MAIN')) next[0].imageType = 'MAIN'
    onChange(next)
  }

  function update(index: number, patch: Partial<PendingImage>) {
    let next = images.map((image, i) => (i === index ? { ...image, ...patch } : image))
    if (patch.imageType === 'MAIN')
      next = next.map((image, i) =>
        i !== index && image.imageType === 'MAIN' ? { ...image, imageType: 'ETC' } : image,
      )
    onChange(next)
  }

  function move(index: number, direction: -1 | 1) {
    const target = index + direction
    if (target < 0 || target >= images.length) return
    const next = [...images]
    ;[next[index], next[target]] = [next[target], next[index]]
    onChange(next.map((image, sortOrder) => ({ ...image, sortOrder })))
  }

  return (
    <section className="grid gap-4 rounded-lg border border-slate-200 bg-white p-5 shadow-sm md:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-4">
        <div>
          <h2 className="m-0 text-base font-semibold text-[#172b44]">객실 이미지</h2>
          <p className="mt-1 text-xs text-slate-500">JPG, PNG, WEBP · 장당 10MB · 최대 10장</p>
        </div>
        <label className={`${buttonClass} inline-flex cursor-pointer items-center`}>
          이미지 선택
          <input
            className="sr-only"
            type="file"
            accept="image/jpeg,image/png,image/webp"
            multiple
            disabled={disabled || existingImageCount + images.length >= MAX_ROOM_IMAGE_COUNT}
            onChange={selectFiles}
          />
        </label>
      </div>
      {error && <p className="m-0 text-sm text-error" role="alert">{error}</p>}
      {!images.length && (
        <p className="m-0 rounded border border-dashed border-slate-300 py-10 text-center text-sm text-slate-500">
          등록할 객실 이미지를 선택해 주세요.
        </p>
      )}
      <div className="grid gap-4 sm:grid-cols-2">
        {images.map((image, index) => (
          <article className="overflow-hidden rounded border border-slate-200" key={image.clientId}>
            <img className="h-40 w-full bg-slate-100 object-cover" src={image.previewUrl} alt={`${index + 1}번 객실 이미지 미리보기`} />
            <div className="grid gap-3 p-3">
              <select
                className="min-h-9 rounded-sm border border-slate-300 px-2 text-sm"
                value={image.imageType}
                disabled={disabled}
                aria-label={`${index + 1}번 이미지 유형`}
                onChange={(event) => update(index, { imageType: event.target.value as RoomImageType })}
              >
                {Object.entries(typeLabels).map(([value, label]) => <option value={value} key={value}>{label}</option>)}
              </select>
              {image.status !== 'selected' && (
                <div>
                  <progress className="h-2 w-full" max="100" value={image.progress} />
                  <p className={`m-0 text-xs ${image.status === 'failed' ? 'text-error' : 'text-slate-500'}`}>
                    {image.status === 'failed' ? image.errorMessage : image.status === 'uploaded' ? '업로드 완료' : `업로드 중 ${image.progress}%`}
                  </p>
                </div>
              )}
              <div className="flex flex-wrap gap-2">
                <button type="button" className={buttonClass} disabled={disabled || index === 0} onClick={() => move(index, -1)} aria-label={`${index + 1}번 이미지 앞으로 이동`}>앞으로</button>
                <button type="button" className={buttonClass} disabled={disabled || index === images.length - 1} onClick={() => move(index, 1)} aria-label={`${index + 1}번 이미지 뒤로 이동`}>뒤로</button>
                <button type="button" className={buttonClass} disabled={disabled} onClick={() => remove(index)} aria-label={`${index + 1}번 이미지 삭제`}>삭제</button>
              </div>
            </div>
          </article>
        ))}
      </div>
    </section>
  )
}

export function SingleImageField({
  currentUrl,
  pending,
  onChange,
  disabled,
}: {
  currentUrl?: string
  pending: PendingImage | null
  onChange: (image: PendingImage | null) => void
  disabled?: boolean
}) {
  const [error, setError] = useState('')
  const pendingRef = useRef(pending)
  useEffect(() => {
    pendingRef.current = pending
  }, [pending])
  useEffect(() => () => {
    if (pendingRef.current) URL.revokeObjectURL(pendingRef.current.previewUrl)
  }, [])

  function select(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return
    const invalid = validateImageFile(file)
    if (invalid) return setError(invalid)
    if (pending) URL.revokeObjectURL(pending.previewUrl)
    setError('')
    onChange(createPendingImage(file))
  }
  const preview = pending?.previewUrl || resolveImageUrl(currentUrl)
  return (
    <section className="grid gap-4 rounded-lg border border-slate-200 bg-white p-5 shadow-sm md:p-6">
      <div className="border-b border-slate-100 pb-4">
        <h2 className="m-0 text-base font-semibold text-[#172b44]">편의시설 이미지</h2>
        <p className="mt-1 text-xs text-slate-500">JPG, PNG, WEBP · 최대 10MB · 한 장</p>
      </div>
      {preview ? <img className="h-56 w-full rounded bg-slate-100 object-cover" src={preview} alt="편의시설 이미지 미리보기" /> : <p className="m-0 rounded border border-dashed border-slate-300 py-16 text-center text-sm text-slate-500">선택된 이미지가 없습니다.</p>}
      {pending?.status !== undefined && pending.status !== 'selected' && (
        <div>
          <progress className="h-2 w-full" max="100" value={pending.progress} />
          <p className={`m-0 text-xs ${pending.status === 'failed' ? 'text-error' : 'text-slate-500'}`}>{pending.status === 'failed' ? pending.errorMessage : pending.status === 'uploaded' ? '업로드 완료' : `업로드 중 ${pending.progress}%`}</p>
        </div>
      )}
      {error && <p className="m-0 text-sm text-error" role="alert">{error}</p>}
      <div className="flex gap-2">
        <label className={`${buttonClass} inline-flex cursor-pointer items-center`}>
          {preview ? '이미지 교체' : '이미지 선택'}
          <input className="sr-only" type="file" accept="image/jpeg,image/png,image/webp" disabled={disabled} onChange={select} />
        </label>
        {pending && <button type="button" className={buttonClass} disabled={disabled} onClick={() => { URL.revokeObjectURL(pending.previewUrl); onChange(null) }}>선택 취소</button>}
      </div>
    </section>
  )
}
