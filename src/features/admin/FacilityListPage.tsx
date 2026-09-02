import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import facilityImage1 from '../../assets/facility1.png'
import facilityImage2 from '../../assets/facility2.png'
import facilityImage3 from '../../assets/facility3.png'
import facilityImage4 from '../../assets/facility4.png'
import facilityImage5 from '../../assets/facility5.png'
import facilityImage6 from '../../assets/facility6.png'
import facilityImage7 from '../../assets/facility7.png'
import facilityImage8 from '../../assets/facility8.png'
import type { FacilityDetail, FacilityCategory } from './types'
import { adminApi } from './api'
import {
  AdminPageHeader,
  ImageThumb,
  LoadingState,
  Notice,
  PrimaryLink,
  RoomFacilityTabs,
} from './shared'

const categoryLabel: Record<FacilityCategory, string> = {
  WELLNESS: '웰니스',
  LEISURE: '여가',
  FOOD: '식음료',
  BUSINESS: '비즈니스',
  CONVENIENCE: '편의',
  PARKING: '주차',
  ACCESSIBILITY: '접근성',
  ETC: '기타',
}
const facilityImages = [
  facilityImage1,
  facilityImage2,
  facilityImage3,
  facilityImage4,
  facilityImage5,
  facilityImage6,
  facilityImage7,
  facilityImage8,
]
const statusOptions = [
  { value: 'true', label: '활성' },
  { value: 'false', label: '비활성' },
] as const
const categoryOptions = Object.entries(categoryLabel).map(([value, label]) => ({
  value: value as FacilityCategory,
  label,
}))

export function FacilityListPage() {
  const [items, setItems] = useState<FacilityDetail[]>([]),
    [loading, setLoading] = useState(true),
    [error, setError] = useState(''),
    [active, setActive] = useState<Array<'true' | 'false'>>(['true', 'false']),
    [category, setCategory] = useState<FacilityCategory[]>(categoryOptions.map((x) => x.value)),
    [openFilter, setOpenFilter] = useState<'status' | 'category' | null>(null)
  useEffect(() => {
    void adminApi
      .facilityList()
      .then((list) => setItems(list.map((item) => ({ ...item, active: item.active ?? true }))))
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false))
  }, [])
  const shown = useMemo(
    () =>
      items.filter(
        (x) =>
          active.includes(String(x.active ?? true) as 'true' | 'false') &&
          category.includes(x.category),
      ),
    [items, active, category],
  )
  return (
    <section>
      <AdminPageHeader
        eyebrow="FACILITY MANAGEMENT"
        title="편의시설 관리"
        action={<PrimaryLink to="/admin/facilities/new">새 편의시설 등록</PrimaryLink>}
      />
      <RoomFacilityTabs />
      <div className="mb-5 flex flex-wrap gap-2" aria-label="편의시설 필터">
        <FilterMenu
          label="상태"
          options={statusOptions}
          selected={active}
          onChange={setActive}
          open={openFilter === 'status'}
          onOpenChange={(open) => setOpenFilter(open ? 'status' : null)}
        />
        <FilterMenu
          label="카테고리"
          options={categoryOptions}
          selected={category}
          onChange={setCategory}
          open={openFilter === 'category'}
          onOpenChange={(open) => setOpenFilter(open ? 'category' : null)}
        />
      </div>
      {loading ? (
        <LoadingState />
      ) : error ? (
        <Notice error>{error}</Notice>
      ) : shown.length === 0 ? (
        <div className="rounded-lg border border-dashed border-slate-300 bg-white p-16 text-center text-sm text-slate-600">
          조건에 맞는 편의시설이 없습니다.
        </div>
      ) : (
        <>
          <p className="mb-3 text-sm text-slate-600">총 {shown.length}개</p>
          <div className="hidden overflow-x-auto rounded-lg border border-slate-200 bg-white shadow-sm md:block">
            <table className="w-full border-collapse text-left text-sm">
              <thead className="bg-slate-50 text-xs text-slate-600">
                <tr>
                  {['이미지', 'ID', '시설명', '카테고리', '설명', '노출 상태', ''].map(
                    (heading) => (
                      <th className="px-4 py-3 font-medium" key={heading}>
                        {heading}
                      </th>
                    ),
                  )}
                </tr>
              </thead>
              <tbody>
                {shown.map((facility, index) => (
                  <tr
                    className="border-t border-slate-200 hover:bg-slate-50/60"
                    key={facility.facilityId}
                  >
                    <td className="px-4 py-3">
                      <ImageThumb
                        src={facilityImages[index % facilityImages.length]}
                        alt={`${facility.name} 편의시설`}
                      />
                    </td>
                    <td className="px-4">{facility.facilityId}</td>
                    <td className="px-4 font-medium text-[#172b44]">{facility.name}</td>
                    <td className="px-4 whitespace-nowrap">{categoryLabel[facility.category]}</td>
                    <td className="max-w-72 px-4 text-slate-600">
                      <span className="line-clamp-2">{facility.description || '설명 없음'}</span>
                    </td>
                    <td className="px-4">
                      <span
                        className={`inline-flex rounded-full border px-3 py-1 text-xs font-medium whitespace-nowrap ${facility.active ? 'border-[#d7c59e] bg-[#fff8e8] text-[#5f4b28]' : 'border-slate-300 bg-slate-100 text-slate-600'}`}
                      >
                        {facility.active ? '활성' : '비활성'}
                      </span>
                    </td>
                    <td className="px-4">
                      <Link
                        className="font-medium text-[#172b44] underline underline-offset-4"
                        to={`/admin/facilities/${facility.facilityId}/edit`}
                      >
                        수정
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="grid gap-3 md:hidden">
            {shown.map((facility, index) => (
              <article
                className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm"
                key={facility.facilityId}
              >
                <div className="flex gap-4">
                  <ImageThumb
                    src={facilityImages[index % facilityImages.length]}
                    alt={`${facility.name} 편의시설`}
                  />
                  <div className="min-w-0 flex-1">
                    <p className="m-0 text-xs text-slate-500">
                      #{facility.facilityId} · {categoryLabel[facility.category]}
                    </p>
                    <h2 className="my-1 text-lg font-semibold text-[#172b44]">{facility.name}</h2>
                    <span
                      className={`inline-flex rounded-full border px-2 py-0.5 text-xs font-medium ${facility.active ? 'border-[#d7c59e] bg-[#fff8e8] text-[#5f4b28]' : 'border-slate-300 bg-slate-100 text-slate-600'}`}
                    >
                      {facility.active ? '활성' : '비활성'}
                    </span>
                  </div>
                </div>
                <p className="mt-3 line-clamp-2 text-sm text-slate-600">
                  {facility.description || '설명 없음'}
                </p>
                <Link
                  className="mt-4 block min-h-11 rounded-sm border border-[#172b44] py-3 text-center text-sm font-medium text-[#172b44]"
                  to={`/admin/facilities/${facility.facilityId}/edit`}
                >
                  수정
                </Link>
              </article>
            ))}
          </div>
        </>
      )}
    </section>
  )
}

type FilterOption<T extends string> = { value: T; label: string }

function FilterMenu<T extends string>({
  label,
  options,
  selected,
  onChange,
  disabledValues = [],
  open,
  onOpenChange,
}: {
  label: string
  options: readonly FilterOption<T>[]
  selected: T[]
  onChange: (values: T[]) => void
  disabledValues?: readonly T[]
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const available = options.filter((option) => !disabledValues.includes(option.value))
  const allSelected = available.every((option) => selected.includes(option.value))
  const selectedLabels = options
    .filter((option) => selected.includes(option.value))
    .map((x) => x.label)
  const summary = allSelected
    ? '전체'
    : selectedLabels.length === 0
      ? '선택 없음'
      : selectedLabels.length === 1
        ? selectedLabels[0]
        : `${selectedLabels.length}개 선택`

  function toggle(value: T) {
    onChange(
      selected.includes(value) ? selected.filter((item) => item !== value) : [...selected, value],
    )
  }

  return (
    <details
      className="group relative [&>summary::-webkit-details-marker]:hidden"
      open={open}
      onToggle={(event) => onOpenChange(event.currentTarget.open)}
    >
      <summary className="flex min-h-9 list-none items-center overflow-hidden rounded-full border border-slate-300 bg-white text-xs shadow-sm transition hover:border-[#b79a67]">
        <span className="border-r border-slate-200 bg-slate-50 px-3 py-2 font-medium text-slate-500">
          {label}
        </span>
        <span className="min-w-20 px-3 py-2 font-medium text-[#172b44]">{summary}</span>
        <svg
          aria-hidden="true"
          className="mr-2 h-3.5 w-3.5 text-slate-400 transition group-open:rotate-180"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          viewBox="0 0 24 24"
        >
          <path d="m6 9 6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </summary>
      <div className="absolute left-0 z-20 mt-2 min-w-52 overflow-hidden rounded-lg border border-slate-200 bg-white p-1.5 shadow-xl">
        <label className="flex min-h-10 items-center gap-3 rounded-md px-3 text-sm font-medium text-slate-700 hover:bg-slate-50">
          <input
            type="checkbox"
            className="h-4 w-4 accent-[#b08d4d]"
            checked={allSelected}
            onChange={() =>
              onChange(
                allSelected
                  ? selected.filter((value) => disabledValues.includes(value))
                  : options.map((x) => x.value),
              )
            }
          />
          전체 선택
        </label>
        <div className="my-1 border-t border-slate-100" />
        {options.map((option) => {
          const disabled = disabledValues.includes(option.value)
          return (
            <label
              className={`flex min-h-10 items-center gap-3 rounded-md px-3 text-sm ${disabled ? 'cursor-not-allowed text-slate-300' : 'text-slate-700 hover:bg-slate-50'}`}
              key={option.value}
            >
              <input
                type="checkbox"
                className="h-4 w-4 accent-[#b08d4d]"
                checked={selected.includes(option.value)}
                disabled={disabled}
                onChange={() => toggle(option.value)}
              />
              {option.label}
            </label>
          )
        })}
      </div>
    </details>
  )
}
