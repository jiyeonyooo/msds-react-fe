import { useEffect, useMemo, useState, type FormEvent, type ReactNode } from 'react'
import { Button } from '../../../components/ui/Button'
import { ApiError } from '../../../lib/apiError'
import { adminQuietnessApi } from './api'
import {
  AdminPageHeading,
  AdminSummaryCard,
  adminPanelTitleClass,
  adminSectionTitleClass,
} from '../../admin/shared'
import type {
  NoiseDevice,
  NoiseDeviceStatus,
  QuietSpace,
  QuietSpaceType,
  QuietnessLevel,
  QuietnessThreshold,
  QuietnessThresholdUpdateRequest,
} from './types'

const guesthouseId = 1

const spaceTypeLabels: Record<QuietSpaceType, string> = {
  ROOM: '객실',
  LOUNGE: '라운지',
  MEDITATION_ROOM: '명상실',
  COMMON_AREA: '공용 공간',
  FACILITY: '부대시설',
  OTHER: '기타',
}

const statusLabels: Record<NoiseDeviceStatus, string> = {
  ACTIVE: 'ACTIVE',
  INACTIVE: 'INACTIVE',
  DISCONNECTED: 'DISCONNECTED',
}

const statusStyles: Record<NoiseDeviceStatus, string> = {
  ACTIVE: 'border-[#afc9b1] bg-[#edf5ed] text-[#3f6f46]',
  INACTIVE: 'border-slate-300 bg-slate-100 text-slate-600',
  DISCONNECTED: 'border-[#d7c59e] bg-[#fffaf0] text-[#a77f3b]',
}

const thresholdLabels: Record<Exclude<QuietnessLevel, 'VERY_LOUD'>, string> = {
  VERY_QUIET: '매우 조용',
  QUIET: '조용',
  NORMAL: '보통',
  LOUD: '시끄러움',
}

function errorMessage(error: unknown) {
  return error instanceof ApiError ? error.message : '요청을 처리하지 못했습니다.'
}

function formatDate(value: string | null) {
  if (!value) return '연결 기록 없음'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return new Intl.DateTimeFormat('ko-KR', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(date)
}

export function AdminQuietnessPage() {
  const [spaces, setSpaces] = useState<QuietSpace[]>([])
  const [devices, setDevices] = useState<NoiseDevice[]>([])
  const [thresholds, setThresholds] = useState<QuietnessThreshold[]>([])
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [dialog, setDialog] = useState<'space' | 'device' | null>(null)

  useEffect(() => {
    let cancelled = false
    Promise.all([
      adminQuietnessApi.getSpaces(guesthouseId),
      adminQuietnessApi.getDevices(guesthouseId),
      adminQuietnessApi.getThresholds(guesthouseId),
    ])
      .then(([nextSpaces, nextDevices, nextThresholds]) => {
        if (cancelled) return
        setSpaces(nextSpaces)
        setDevices(nextDevices)
        setThresholds(nextThresholds)
      })
      .catch((requestError: unknown) => {
        if (!cancelled) setError(errorMessage(requestError))
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [])

  const spaceNames = useMemo(
    () => new Map(spaces.map((space) => [space.spaceId, space.name])),
    [spaces],
  )
  const activeDevices = devices.filter((device) => device.status === 'ACTIVE')

  const notify = (nextMessage: string) => {
    setError('')
    setMessage(nextMessage)
  }

  const fail = (requestError: unknown) => {
    setMessage('')
    setError(errorMessage(requestError))
  }

  const updateStatus = async (deviceId: number, status: NoiseDeviceStatus) => {
    try {
      const updated = await adminQuietnessApi.updateDeviceStatus(deviceId, status)
      setDevices((current) =>
        current.map((device) => (device.deviceId === deviceId ? updated : device)),
      )
      notify(`${updated.deviceName} 상태를 ${statusLabels[status]}로 변경했습니다.`)
    } catch (requestError) {
      fail(requestError)
    }
  }

  const createSpace = async (request: { name: string; type: QuietSpaceType }) => {
    try {
      const created = await adminQuietnessApi.createSpace({ guesthouseId, ...request })
      setSpaces((current) => [...current, created])
      setDialog(null)
      notify(`${created.name} 공간을 등록했습니다.`)
    } catch (requestError) {
      fail(requestError)
    }
  }

  const createDevice = async (request: {
    spaceId: number
    deviceName: string
    serialNumber: string
    modelName?: string
  }) => {
    try {
      const created = await adminQuietnessApi.createDevice({ guesthouseId, ...request })
      setDevices((current) => [...current, created])
      setDialog(null)
      notify(`${created.deviceName} 기기를 등록했습니다.`)
    } catch (requestError) {
      fail(requestError)
    }
  }

  return (
    <section>
      <AdminPageHeading
        action={
          <label className="text-sm font-medium text-slate-700">
            게스트하우스
            <select
              aria-label="게스트하우스 선택"
              className="mt-2 block h-11 min-w-[220px] rounded-sm border border-slate-300 bg-white px-3 text-sm"
              value={guesthouseId}
              onChange={() => undefined}
            >
              <option value={guesthouseId}>게스트하우스 #1</option>
            </select>
          </label>
        }
        description="공간과 측정 기기의 연결 상태를 관리하고 실제 소음 측정값을 등록합니다."
        eyebrow="LIVE SPACE OPERATIONS"
        title="조용함 관리"
      />

      {(message || error) && (
        <div
          className={`mb-4 rounded-lg border px-4 py-3 text-sm ${error ? 'border-[#ead8d2] bg-[#fffaf8] text-error' : 'border-[#e5d7b8] bg-[#fffaf0] text-slate-700'}`}
          role="status"
        >
          {error || message}
        </div>
      )}

      <div className="grid gap-3 sm:grid-cols-3" aria-label="조용함 운영 요약">
        <AdminSummaryCard label="등록 기기" unit="대" value={loading ? '—' : devices.length} />
        <AdminSummaryCard
          label="ACTIVE 기기"
          unit="대"
          value={loading ? '—' : activeDevices.length}
        />
        <AdminSummaryCard label="측정 공간" unit="곳" value={loading ? '—' : spaces.length} />
      </div>

      <section className="mt-4 grid gap-4 xl:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
        <Card>
          <CardHeader
            eyebrow="DEVICE MANAGEMENT"
            title="측정 기기"
            action={<Button onClick={() => setDialog('device')}>기기 등록</Button>}
          />
          <div className="mt-6 overflow-x-auto">
            <table className="w-full min-w-[600px] border-collapse text-left">
              <thead>
                <tr className="border-b border-slate-200 text-[11px] tracking-[0.08em] text-slate-500">
                  <th className="px-3 py-3 font-medium">기기 / 공간</th>
                  <th className="px-3 py-3 font-medium">일련번호 · 모델</th>
                  <th className="px-3 py-3 font-medium">상태</th>
                  <th className="px-3 py-3 font-medium">최근 연결</th>
                </tr>
              </thead>
              <tbody>
                {devices.map((device) => (
                  <tr className="border-b border-slate-200 text-sm" key={device.deviceId}>
                    <td className="px-3 py-4">
                      <p className="font-medium text-[#172b44]">{device.deviceName}</p>
                      <p className="mt-1 text-xs text-slate-500">
                        {spaceNames.get(device.spaceId) ?? `공간 #${device.spaceId}`}
                      </p>
                    </td>
                    <td className="px-3 py-4 text-slate-700">
                      <p>{device.serialNumber}</p>
                      <p className="mt-1 text-xs text-slate-500">
                        {device.modelName || '모델 미등록'}
                      </p>
                    </td>
                    <td className="px-3 py-4">
                      <select
                        aria-label={`${device.deviceName} 상태`}
                        className={`h-8 rounded-full border px-2 text-[9px] font-medium tracking-[0.06em] ${statusStyles[device.status]}`}
                        onChange={(event) =>
                          void updateStatus(
                            device.deviceId,
                            event.target.value as NoiseDeviceStatus,
                          )
                        }
                        value={device.status}
                      >
                        {Object.keys(statusLabels).map((status) => (
                          <option key={status} value={status}>
                            {statusLabels[status as NoiseDeviceStatus]}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="px-3 py-4 text-xs text-slate-500">
                      {formatDate(device.lastConnectedAt)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {!loading && devices.length === 0 && (
              <EmptyState>등록된 측정 기기가 없습니다.</EmptyState>
            )}
          </div>
          <PathNote>PATCH /devices/{'{deviceId}'}/status · ACTIVE 기기만 측정값 등록 가능</PathNote>
        </Card>

        <Card>
          <CardHeader
            eyebrow="SPACE MANAGEMENT"
            title="측정 공간"
            action={<Button onClick={() => setDialog('space')}>공간 등록</Button>}
          />
          <div className="mt-6 space-y-2">
            {spaces.map((space) => (
              <article
                className="flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50 px-4 py-4"
                key={space.spaceId}
              >
                <div>
                  <p className="text-sm font-medium text-[#172b44]">{space.name}</p>
                  <p className="mt-1 text-xs text-slate-500">
                    {spaceTypeLabels[space.type]} · SPACE #{space.spaceId}
                  </p>
                </div>
                <span
                  aria-label={space.active ? '활성 공간' : '비활성 공간'}
                  className={`size-2 rounded-full ${space.active ? 'bg-[#668e69]' : 'bg-[#a9a9a4]'}`}
                />
              </article>
            ))}
            {!loading && spaces.length === 0 && <EmptyState>등록된 공간이 없습니다.</EmptyState>}
          </div>
          <PathNote>POST /spaces · name 최대 100자 · type 필수</PathNote>
        </Card>
      </section>

      <section className="mt-4 grid gap-4 xl:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
        <MeasurementCard
          activeDevices={activeDevices}
          onError={fail}
          onSuccess={(deviceName) => notify(`${deviceName} 측정값을 등록했습니다.`)}
        />
        <ThresholdCard
          onChange={setThresholds}
          onError={fail}
          onSuccess={() => notify('조용함 기준값을 변경했습니다.')}
          thresholds={thresholds}
        />
      </section>
      {dialog === 'space' && <SpaceDialog onClose={() => setDialog(null)} onSubmit={createSpace} />}
      {dialog === 'device' && (
        <DeviceDialog onClose={() => setDialog(null)} onSubmit={createDevice} spaces={spaces} />
      )}
    </section>
  )
}

function Card({ children }: { children: ReactNode }) {
  return (
    <article className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
      {children}
    </article>
  )
}

function CardHeader({
  eyebrow,
  title,
  action,
}: {
  eyebrow: string
  title: string
  action?: ReactNode
}) {
  return (
    <header className="flex items-center justify-between gap-4 border-b border-slate-200 pb-4">
      <div>
        <p className="text-[11px] font-medium tracking-[0.12em] text-slate-500">{eyebrow}</p>
        <h2 className={`mt-1 ${adminPanelTitleClass}`}>{title}</h2>
      </div>
      {action}
    </header>
  )
}

function PathNote({ children }: { children: ReactNode }) {
  return (
    <p className="mt-5 border-t border-slate-200 pt-4 text-xs leading-5 text-slate-500">
      {children}
    </p>
  )
}

function EmptyState({ children }: { children: ReactNode }) {
  return <p className="px-3 py-10 text-center text-sm text-slate-500">{children}</p>
}

function MeasurementCard({
  activeDevices,
  onError,
  onSuccess,
}: {
  activeDevices: NoiseDevice[]
  onError: (error: unknown) => void
  onSuccess: (deviceName: string) => void
}) {
  const [submitting, setSubmitting] = useState(false)

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    const deviceId = Number(form.get('deviceId'))
    const device = activeDevices.find((item) => item.deviceId === deviceId)
    setSubmitting(true)
    try {
      await adminQuietnessApi.createMeasurement({
        deviceId,
        decibel: Number(form.get('decibel')),
        measuredAt: String(form.get('measuredAt') || '') || undefined,
      })
      event.currentTarget.reset()
      onSuccess(device?.deviceName ?? `기기 #${deviceId}`)
    } catch (requestError) {
      onError(requestError)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Card>
      <CardHeader eyebrow="MEASUREMENT REGISTRATION" title="소음 측정값 등록" />
      <form className="mt-6 grid gap-4 sm:grid-cols-2" onSubmit={submit}>
        <Field label="측정 기기 *">
          <select className="admin-field" disabled={!activeDevices.length} name="deviceId" required>
            <option value="">ACTIVE 기기 선택</option>
            {activeDevices.map((device) => (
              <option key={device.deviceId} value={device.deviceId}>
                {device.deviceName}
              </option>
            ))}
          </select>
        </Field>
        <Field label="데시벨 *">
          <input
            className="admin-field"
            min="0"
            name="decibel"
            placeholder="예: 42.5"
            required
            step="0.1"
            type="number"
          />
        </Field>
        <Field label="측정 시각 (선택)">
          <input className="admin-field" name="measuredAt" type="datetime-local" />
        </Field>
        <div className="flex items-end">
          <Button className="w-full" disabled={submitting || !activeDevices.length} type="submit">
            {submitting ? '등록 중...' : '측정 등록'}
          </Button>
        </div>
      </form>
      <PathNote>ACTIVE 상태의 기기만 등록 가능 · decibel ≥ 0 · measuredAt은 선택값</PathNote>
    </Card>
  )
}

function ThresholdCard({
  thresholds,
  onChange,
  onError,
  onSuccess,
}: {
  thresholds: QuietnessThreshold[]
  onChange: (thresholds: QuietnessThreshold[]) => void
  onError: (error: unknown) => void
  onSuccess: () => void
}) {
  const [submitting, setSubmitting] = useState(false)
  const editableThresholds = thresholds.filter(
    (
      threshold,
    ): threshold is QuietnessThreshold & {
      level: Exclude<QuietnessLevel, 'VERY_LOUD'>
      maxDecibel: number
    } => threshold.level !== 'VERY_LOUD' && threshold.maxDecibel !== null,
  )

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    const request: QuietnessThresholdUpdateRequest = {
      veryQuietMax: Number(form.get('VERY_QUIET')),
      quietMax: Number(form.get('QUIET')),
      normalMax: Number(form.get('NORMAL')),
      loudMax: Number(form.get('LOUD')),
    }
    setSubmitting(true)
    try {
      const updated = await adminQuietnessApi.updateThresholds(guesthouseId, request)
      onChange(updated)
      onSuccess()
    } catch (requestError) {
      onError(requestError)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Card>
      <CardHeader eyebrow="LIVE POLICY" title="조용함 기준값 관리" />
      <p className="mt-4 text-sm leading-6 text-slate-600">
        각 단계의 최대 데시벨을 입력하면 다음 단계의 시작값은 자동으로 이어집니다.
      </p>
      {editableThresholds.length === 4 ? (
        <form className="mt-4 grid grid-cols-2 gap-3" onSubmit={submit}>
          {editableThresholds.map((threshold) => (
            <label className="text-sm font-medium text-slate-700" key={threshold.level}>
              {thresholdLabels[threshold.level]}
              <span className="mt-2 flex items-center rounded-sm border border-slate-300 bg-white px-3">
                <input
                  className="h-10 min-w-0 flex-1 bg-transparent text-sm text-[#172b44] outline-none"
                  defaultValue={threshold.maxDecibel}
                  key={`${threshold.level}-${threshold.maxDecibel}`}
                  max="999.98"
                  min="0"
                  name={threshold.level}
                  required
                  step="0.01"
                  type="number"
                />
                <span className="text-xs text-slate-500">dB</span>
              </span>
            </label>
          ))}
          <Button className="col-span-2 mt-1 w-full" disabled={submitting} type="submit">
            {submitting ? '저장 중...' : '기준값 저장'}
          </Button>
        </form>
      ) : (
        <p className="mt-4 rounded-lg border border-dashed border-slate-300 px-4 py-8 text-center text-sm text-slate-500">
          기준값을 불러오는 중입니다.
        </p>
      )}
    </Card>
  )
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="block text-sm font-medium text-slate-700">
      {label}
      {children}
    </label>
  )
}

function DialogShell({
  title,
  onClose,
  children,
}: {
  title: string
  onClose: () => void
  children: ReactNode
}) {
  return (
    <div
      className="fixed inset-0 z-50 grid place-items-center bg-slate-950/40 px-5"
      role="presentation"
    >
      <section
        aria-modal="true"
        className="w-full max-w-[500px] rounded-lg bg-white p-7 shadow-floating"
        role="dialog"
      >
        <header className="flex items-start justify-between gap-4">
          <div>
            <p className="text-[11px] font-medium tracking-[0.12em] text-slate-500">
              NEW REGISTRATION
            </p>
            <h2 className={`mt-1 ${adminSectionTitleClass}`}>{title}</h2>
          </div>
          <button
            aria-label="닫기"
            className="p-2 text-xl text-slate-500"
            onClick={onClose}
            type="button"
          >
            ×
          </button>
        </header>
        {children}
      </section>
    </div>
  )
}

function SpaceDialog({
  onClose,
  onSubmit,
}: {
  onClose: () => void
  onSubmit: (request: { name: string; type: QuietSpaceType }) => Promise<void>
}) {
  const [submitting, setSubmitting] = useState(false)
  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    setSubmitting(true)
    await onSubmit({
      name: String(form.get('name')),
      type: String(form.get('type')) as QuietSpaceType,
    })
    setSubmitting(false)
  }
  return (
    <DialogShell onClose={onClose} title="공간 등록">
      <form className="mt-6 space-y-4" onSubmit={submit}>
        <Field label="공간명 *">
          <input className="admin-field" maxLength={100} name="name" required />
        </Field>
        <Field label="공간 유형 *">
          <select className="admin-field" name="type" required>
            {(Object.keys(spaceTypeLabels) as QuietSpaceType[]).map((type) => (
              <option key={type} value={type}>
                {spaceTypeLabels[type]}
              </option>
            ))}
          </select>
        </Field>
        <div className="flex justify-end gap-2 pt-3">
          <Button onClick={onClose} variant="secondary">
            취소
          </Button>
          <Button disabled={submitting} type="submit">
            {submitting ? '등록 중...' : '공간 등록'}
          </Button>
        </div>
      </form>
    </DialogShell>
  )
}

function DeviceDialog({
  spaces,
  onClose,
  onSubmit,
}: {
  spaces: QuietSpace[]
  onClose: () => void
  onSubmit: (request: {
    spaceId: number
    deviceName: string
    serialNumber: string
    modelName?: string
  }) => Promise<void>
}) {
  const [submitting, setSubmitting] = useState(false)
  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    setSubmitting(true)
    await onSubmit({
      spaceId: Number(form.get('spaceId')),
      deviceName: String(form.get('deviceName')),
      serialNumber: String(form.get('serialNumber')),
      modelName: String(form.get('modelName') || '') || undefined,
    })
    setSubmitting(false)
  }
  return (
    <DialogShell onClose={onClose} title="기기 등록">
      <form className="mt-6 grid gap-4 sm:grid-cols-2" onSubmit={submit}>
        <div className="sm:col-span-2">
          <Field label="측정 공간 *">
            <select className="admin-field" name="spaceId" required>
              <option value="">공간 선택</option>
              {spaces.map((space) => (
                <option key={space.spaceId} value={space.spaceId}>
                  {space.name}
                </option>
              ))}
            </select>
          </Field>
        </div>
        <Field label="기기명 *">
          <input className="admin-field" maxLength={100} name="deviceName" required />
        </Field>
        <Field label="일련번호 *">
          <input className="admin-field" maxLength={100} name="serialNumber" required />
        </Field>
        <div className="sm:col-span-2">
          <Field label="모델명 (선택)">
            <input className="admin-field" maxLength={100} name="modelName" />
          </Field>
        </div>
        <div className="flex justify-end gap-2 pt-3 sm:col-span-2">
          <Button onClick={onClose} variant="secondary">
            취소
          </Button>
          <Button disabled={submitting || !spaces.length} type="submit">
            {submitting ? '등록 중...' : '기기 등록'}
          </Button>
        </div>
      </form>
    </DialogShell>
  )
}
