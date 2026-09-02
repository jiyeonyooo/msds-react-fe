import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import roomImage1 from '../../assets/rooms1.png'
import roomImage2 from '../../assets/rooms2.png'
import roomImage3 from '../../assets/rooms3.png'
import roomImage4 from '../../assets/rooms4.png'
import type { RoomSummary } from '../rooms/types'
import { adminApi } from './api'
import {
  AdminPageHeader,
  ImageThumb,
  LoadingState,
  Notice,
  PrimaryLink,
  RoomFacilityTabs,
} from './shared'

const typeLabel = { STAY: '스테이', REST: '휴식', MEDITATE: '명상', RETREAT: '리트리트' }
const money = new Intl.NumberFormat('ko-KR')
const roomImages = [roomImage1, roomImage2, roomImage3, roomImage4]

export function RoomListPage() {
  const [items, setItems] = useState<RoomSummary[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  useEffect(() => {
    void adminApi
      .roomList()
      .then(setItems)
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false))
  }, [])
  return (
    <section>
      <AdminPageHeader
        eyebrow="ROOM MANAGEMENT"
        title="객실 관리"
        action={<PrimaryLink to="/admin/rooms/new">새 객실 등록</PrimaryLink>}
      />
      <RoomFacilityTabs />
      {loading ? (
        <LoadingState />
      ) : error ? (
        <Notice error>{error}</Notice>
      ) : items.length === 0 ? (
        <div className="rounded-lg border border-dashed border-slate-300 bg-white p-16 text-center text-sm text-slate-600">
          등록된 객실이 없습니다. 새 객실을 등록해 주세요.
        </div>
      ) : (
        <>
          <p className="mb-3 text-sm text-slate-600">총 {items.length}개</p>
          <div className="hidden overflow-x-auto rounded-lg border border-slate-200 bg-white shadow-sm md:block">
            <table className="w-full border-collapse text-left text-sm">
              <thead className="bg-slate-50 text-xs text-slate-600">
                <tr>
                  {[
                    '이미지',
                    'ID',
                    '객실명',
                    '유형',
                    '판매 상태',
                    '인원',
                    '면적',
                    '기본 가격',
                    '',
                  ].map((x) => (
                    <th key={x} className="px-4 py-3 font-medium">
                      {x}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {items.map((room, index) => (
                  <tr className="border-t border-slate-200 hover:bg-slate-50/60" key={room.roomId}>
                    <td className="px-4 py-3">
                      <ImageThumb
                        src={roomImages[index % roomImages.length]}
                        alt={`${room.name} 객실`}
                      />
                    </td>
                    <td className="px-4">{room.roomId}</td>
                    <td className="px-4 font-medium">{room.name}</td>
                    <td className="px-4">{typeLabel[room.roomType]}</td>
                    <td className="px-4 text-slate-500">상세에서 확인</td>
                    <td className="px-4">
                      {room.standardGuests}/{room.maxGuests}명
                    </td>
                    <td className="px-4">{room.areaM2 ?? '-'}m²</td>
                    <td className="px-4">₩ {money.format(room.basePrice)}</td>
                    <td className="px-4">
                      <Link
                        className="font-medium text-[#172b44] underline underline-offset-4"
                        to={`/admin/rooms/${room.roomId}/edit`}
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
            {items.map((room, index) => (
              <article
                className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm"
                key={room.roomId}
              >
                <div className="flex gap-4">
                  <ImageThumb
                    src={roomImages[index % roomImages.length]}
                    alt={`${room.name} 객실`}
                  />
                  <div>
                    <p className="m-0 text-xs text-slate-500">
                      #{room.roomId} · {typeLabel[room.roomType]}
                    </p>
                    <h2 className="my-1 text-lg">{room.name}</h2>
                    <p className="m-0 text-sm">
                      {room.standardGuests}/{room.maxGuests}명 · {room.areaM2 ?? '-'}m²
                    </p>
                  </div>
                </div>
                <Link
                  className="mt-4 block min-h-11 rounded-sm border border-[#172b44] py-3 text-center text-sm font-medium text-[#172b44]"
                  to={`/admin/rooms/${room.roomId}/edit`}
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
