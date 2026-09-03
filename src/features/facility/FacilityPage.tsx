import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useRevealAll } from '../../components/motion/hooks'
import { resolveImageUrl } from '../../lib/imageUrl'
import { getFacilities } from './api'
import type { Facility, FacilityCategory, FacilityFilter } from './types'

const categories: { value: FacilityFilter; label: string }[] = [
  { value: 'ALL', label: '전체' },
  { value: 'WELLNESS', label: '웰니스' },
  { value: 'LEISURE', label: '여가' },
  { value: 'FOOD', label: '식음료' },
  { value: 'CONVENIENCE', label: '편의' },
  { value: 'PARKING', label: '주차' },
  { value: 'ACCESSIBILITY', label: '접근성' },
  { value: 'BUSINESS', label: '비즈니스' },
  { value: 'ETC', label: '기타' },
]

const categoryLabels = Object.fromEntries(categories.map(({ value, label }) => [value, label])) as Record<FacilityFilter, string>
const categorySymbols: Record<FacilityCategory, string> = {
  WELLNESS: '✦', LEISURE: '⌁', FOOD: '◡', BUSINESS: '▱',
  CONVENIENCE: '◇', PARKING: 'P', ACCESSIBILITY: '♿', ETC: '＋',
}
const validCategories = new Set<string>(categories.map(({ value }) => value))

export function FacilityPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const rawCategory = searchParams.get('category')?.toUpperCase() ?? 'ALL'
  const selected = (validCategories.has(rawCategory) ? rawCategory : 'ALL') as FacilityFilter
  const [facilities, setFacilities] = useState<Facility[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  // 목록이 도착한 뒤에 그려지므로 길이를 키로 리빌 관찰을 다시 건다.
  useRevealAll(`facilities-${facilities.length}`)
  const [retryKey, setRetryKey] = useState(0)

  useEffect(() => {
    let active = true
    getFacilities(selected === 'ALL' ? undefined : selected)
      .then((data) => {
        if (!active) return
        setFacilities(data)
        setError(false)
      })
      .catch(() => active && setError(true))
      .finally(() => active && setLoading(false))
    return () => { active = false }
  }, [selected, retryKey])

  function selectCategory(category: FacilityFilter) {
    setLoading(true)
    setError(false)
    setSearchParams(category === 'ALL' ? {} : { category })
  }

  function retry() {
    setLoading(true)
    setError(false)
    setRetryKey((value) => value + 1)
  }

  return <main className="min-h-screen bg-canvas">
    <section className="mx-auto max-w-[1240px] px-6 py-14 sm:px-8 md:px-12 md:py-16 lg:px-16">
      <div className="mb-8 flex items-end justify-between gap-4">
        <div className="min-w-0 flex-1">
          <p className="text-[10px] font-medium tracking-[0.18em] text-gold-500">FACILITIES &amp; SERVICES</p>
          <h1 className="mt-2 font-display text-[38px] font-medium">{facilities.length} FACILITIES</h1>
          <p className="mt-4 w-full text-sm leading-7 text-ink-700">
            깊은 이완과 균형 있는 회복이 머무는 내내 이어지도록, 웰니스부터 다이닝과
            편의 서비스까지 세심하게 준비했습니다.
          </p>
        </div>
      </div>
      <div className="mb-8 overflow-x-auto" aria-label="편의시설 카테고리">
        <div className="flex min-w-max gap-2" role="group">
          {categories.map((category) => <button
            className={`min-h-9 rounded-full border px-4 text-[10px] tracking-[0.08em] transition ${selected === category.value ? 'border-navy-900 bg-navy-900 text-white' : 'border-ivory-200 bg-white text-ink-700 hover:border-gold-300'}`}
            key={category.value}
            aria-pressed={selected === category.value}
            onClick={() => selectCategory(category.value)}
          >{category.label}</button>)}
        </div>
      </div>

      {loading && <div className="mt-12 grid gap-6 md:grid-cols-2" aria-live="polite" aria-label="편의시설을 불러오는 중입니다">{Array.from({ length: 4 }, (_, index) => <FacilitySkeleton key={index} />)}</div>}
      {!loading && error && <section className="mt-8 border border-error-border bg-white px-6 py-20 text-center" role="alert"><p className="text-sm text-error">편의시설 정보를 불러오지 못했습니다.</p><p className="mt-2 text-xs text-muted">잠시 후 다시 시도해 주세요.</p><button className="mt-7 border border-navy-900 px-6 py-3 text-xs tracking-[0.08em] hover:bg-navy-900 hover:text-white" onClick={retry}>다시 시도</button></section>}
      {!loading && !error && facilities.length === 0 && <section className="mt-8 border border-dashed border-gold-300 px-6 py-20 text-center"><p className="text-sm text-navy-900">{selected === 'ALL' ? '아직 등록된 편의시설이 없습니다.' : '이 카테고리에 등록된 편의시설이 없습니다.'}</p>{selected === 'ALL' ? <p className="mt-2 text-xs text-muted">새로운 공간을 준비하고 있습니다.</p> : <button className="mt-7 border border-navy-900 px-6 py-3 text-xs tracking-[0.08em] hover:bg-navy-900 hover:text-white" onClick={() => selectCategory('ALL')}>전체 편의시설 보기</button>}</section>}
      {!loading && !error && facilities.length > 0 && <section className="mt-12 grid gap-6 md:grid-cols-2" aria-live="polite">{facilities.map((facility) => <FacilityCard facility={facility} key={facility.facilityId} />)}</section>}
    </section>
  </main>
}

function FacilityCard({ facility }: { facility: Facility }) {
  const [imageFailed, setImageFailed] = useState(false)
  const imageUrl = resolveImageUrl(facility.imageUrl)
  return <article className="group relative flex h-full flex-col overflow-hidden border border-border-subtle bg-white shadow-card transition-[transform,box-shadow,border-color] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] hover:z-10 hover:scale-[1.015] hover:border-gold-300 hover:shadow-[0_24px_55px_rgba(16,35,55,0.18)] motion-reduce:transform-none motion-reduce:transition-none">
    <div className="relative h-[260px] shrink-0 overflow-hidden bg-[linear-gradient(135deg,#f1ece3,#dde3d8)] md:h-[330px]">
      {imageUrl && !imageFailed ? <img className="h-full w-full object-cover transition-transform duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-[1.04] motion-reduce:transform-none motion-reduce:transition-none" src={imageUrl} alt={`${facility.name} 전경`} onError={() => setImageFailed(true)} /> : <div className="grid h-full place-items-center" aria-hidden="true"><span className="grid size-16 place-items-center rounded-full border border-gold-300 font-display text-3xl text-gold-500">{categorySymbols[facility.category]}</span></div>}
      <span className="absolute top-5 left-5 bg-navy-900/90 px-3 py-2 text-[10px] tracking-[0.14em] text-white">{categoryLabels[facility.category]}</span>
    </div>
    <div className="flex flex-1 flex-col p-7 md:p-9">
      <span className="text-[10px] font-medium tracking-[0.16em] text-gold-500">{categoryLabels[facility.category]}</span>
      <h2 className="mt-2 font-display text-[34px] leading-none">{facility.name}</h2>
      <p className="mt-4 line-clamp-3 h-[4.5rem] text-sm leading-6 break-keep text-muted">{facility.description ?? '편안한 머무름을 위해 준비된 공간입니다.'}</p>
    </div>
    <div className="pointer-events-none absolute inset-0 grid place-items-center bg-[linear-gradient(145deg,rgba(16,35,55,0.68),rgba(16,35,55,0.88))] px-8 text-center text-white opacity-0 backdrop-blur-[1px] transition-opacity duration-500 group-hover:opacity-100">
      <div className="translate-y-3 transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:translate-y-0 motion-reduce:transform-none motion-reduce:transition-none">
        <span className="mb-5 block text-[10px] font-medium tracking-[0.24em] text-gold-300">{categoryLabels[facility.category]} · FACILITY</span>
        <span className="block font-display text-[32px] leading-none tracking-[-0.02em]">{facility.name}</span>
        <span className="mx-auto mt-6 block h-px w-10 bg-gold-300 transition-[width] duration-500 group-hover:w-16" />
      </div>
    </div>
  </article>
}

function FacilitySkeleton() {
  return <div className="animate-pulse overflow-hidden border border-border-subtle bg-white" aria-hidden="true"><div className="aspect-[3/2] bg-ivory-200" /><div className="p-7"><div className="h-2.5 w-16 bg-ivory-200" /><div className="mt-4 h-7 w-2/3 bg-ivory-200" /><div className="mt-5 h-3 w-full bg-ivory-200" /><div className="mt-2 h-3 w-4/5 bg-ivory-200" /></div></div>
}
