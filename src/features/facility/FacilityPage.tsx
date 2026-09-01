import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import facilityImage1 from '../../assets/facility1.png'
import facilityImage2 from '../../assets/facility2.png'
import facilityImage3 from '../../assets/facility3.png'
import facilityImage4 from '../../assets/facility4.png'
import facilityImage5 from '../../assets/facility5.png'
import facilityImage6 from '../../assets/facility6.png'
import facilityImage7 from '../../assets/facility7.png'
import facilityImage8 from '../../assets/facility8.png'
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
const facilityImages = [facilityImage1, facilityImage2, facilityImage3, facilityImage4, facilityImage5, facilityImage6, facilityImage7, facilityImage8]
const validCategories = new Set<string>(categories.map(({ value }) => value))

export function FacilityPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const rawCategory = searchParams.get('category')?.toUpperCase() ?? 'ALL'
  const selected = (validCategories.has(rawCategory) ? rawCategory : 'ALL') as FacilityFilter
  const [facilities, setFacilities] = useState<Facility[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
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

  return <main className="pb-[120px]">
    <header className="border-b border-border-subtle bg-subtle px-6 py-16 md:px-12 md:py-24">
      <div className="mx-auto max-w-7xl">
        <p className="text-[11px] font-medium tracking-[0.2em] text-gold-500">FACILITIES</p>
        <h1 className="mt-3 font-display text-[50px] leading-none tracking-[-0.08rem] md:text-[68px]">머무름을 더 편안하게</h1>
        <p className="mt-6 w-full max-w-[760px] text-sm leading-7 break-keep whitespace-normal text-muted">고요한 휴식과 회복을 위해 준비한 MSDS의 공간과 서비스를 만나보세요.</p>
      </div>
    </header>

    <div className="mx-auto max-w-7xl px-6 md:px-12">
      <div className="-mx-6 overflow-x-auto border-b border-border-subtle px-6 md:mx-0 md:px-0" aria-label="편의시설 카테고리">
        <div className="flex min-w-max gap-1 py-7" role="group">
          {categories.map((category) => <button
            className={`min-h-11 border px-5 py-3 text-xs transition ${selected === category.value ? 'border-navy-900 bg-navy-900 font-medium text-white' : 'border-transparent text-muted hover:border-gold-300 hover:text-navy-900'}`}
            key={category.value}
            aria-pressed={selected === category.value}
            onClick={() => selectCategory(category.value)}
          >{category.label}</button>)}
        </div>
      </div>

      <div className="mt-10 flex items-end justify-between">
        <div><p className="text-[10px] tracking-[0.16em] text-gold-500">EXPLORE</p><h2 className="mt-2 font-display text-3xl">{categoryLabels[selected]} 편의시설</h2></div>
        {!loading && !error && <span className="text-xs text-muted">{facilities.length} PLACES</span>}
      </div>

      {loading && <div className="mt-8 grid gap-6 sm:grid-cols-2 xl:grid-cols-3" aria-live="polite" aria-label="편의시설을 불러오는 중입니다">{Array.from({ length: 6 }, (_, index) => <FacilitySkeleton key={index} />)}</div>}
      {!loading && error && <section className="mt-8 border border-error-border bg-white px-6 py-20 text-center" role="alert"><p className="text-sm text-error">편의시설 정보를 불러오지 못했습니다.</p><p className="mt-2 text-xs text-muted">잠시 후 다시 시도해 주세요.</p><button className="mt-7 border border-navy-900 px-6 py-3 text-xs tracking-[0.08em] hover:bg-navy-900 hover:text-white" onClick={retry}>다시 시도</button></section>}
      {!loading && !error && facilities.length === 0 && <section className="mt-8 border border-dashed border-gold-300 px-6 py-20 text-center"><p className="text-sm text-navy-900">{selected === 'ALL' ? '아직 등록된 편의시설이 없습니다.' : '이 카테고리에 등록된 편의시설이 없습니다.'}</p>{selected === 'ALL' ? <p className="mt-2 text-xs text-muted">새로운 공간을 준비하고 있습니다.</p> : <button className="mt-7 border border-navy-900 px-6 py-3 text-xs tracking-[0.08em] hover:bg-navy-900 hover:text-white" onClick={() => selectCategory('ALL')}>전체 편의시설 보기</button>}</section>}
      {!loading && !error && facilities.length > 0 && <section className="mt-8 grid gap-6 sm:grid-cols-2 xl:grid-cols-3" aria-live="polite">{facilities.map((facility, index) => <FacilityCard facility={facility} imageUrl={facilityImages[index % facilityImages.length]} key={facility.facilityId} />)}</section>}
    </div>
  </main>
}

function FacilityCard({ facility, imageUrl }: { facility: Facility; imageUrl: string }) {
  const [imageFailed, setImageFailed] = useState(false)
  return <article className="overflow-hidden border border-border-subtle bg-white shadow-card">
    <div className="aspect-[16/10] overflow-hidden bg-[linear-gradient(135deg,#f1ece3,#dde3d8)] md:aspect-[3/2]">
      {!imageFailed ? <img className="h-full w-full object-cover transition duration-700 hover:scale-[1.03]" src={imageUrl} alt={`${facility.name} 전경`} onError={() => setImageFailed(true)} /> : <div className="grid h-full place-items-center" aria-hidden="true"><span className="grid size-16 place-items-center rounded-full border border-gold-300 font-display text-3xl text-gold-500">{categorySymbols[facility.category]}</span></div>}
    </div>
    <div className="p-7">
      <span className="text-[10px] font-medium tracking-[0.16em] text-gold-500">{categoryLabels[facility.category]}</span>
      <h3 className="mt-2 font-display text-[30px] leading-tight">{facility.name}</h3>
      <p className="mt-4 text-sm leading-6 break-keep text-muted">{facility.description ?? '편안한 머무름을 위해 준비된 공간입니다.'}</p>
    </div>
  </article>
}

function FacilitySkeleton() {
  return <div className="animate-pulse overflow-hidden border border-border-subtle bg-white" aria-hidden="true"><div className="aspect-[3/2] bg-ivory-200" /><div className="p-7"><div className="h-2.5 w-16 bg-ivory-200" /><div className="mt-4 h-7 w-2/3 bg-ivory-200" /><div className="mt-5 h-3 w-full bg-ivory-200" /><div className="mt-2 h-3 w-4/5 bg-ivory-200" /></div></div>
}
