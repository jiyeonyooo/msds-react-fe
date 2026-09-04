import {
  ContactShadows,
  Environment,
  Html,
  Lightformer,
  OrbitControls,
  RoundedBox,
} from '@react-three/drei'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import {
  Bloom,
  DepthOfField,
  EffectComposer,
  N8AO,
  SMAA,
  Vignette,
} from '@react-three/postprocessing'
import meditationImage from '../../assets/home/meditation-courtyard.png'
import stayImage from '../../assets/home/ocean-suite.png'
import oceanImage from '../../assets/facility8.png'
import studioImage from '../../assets/facility5.png'
import wellnessImage from '../../assets/facility7.png'
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type Dispatch,
  type SetStateAction,
} from 'react'
import {
  ACESFilmicToneMapping,
  CatmullRomCurve3,
  Matrix4,
  PerspectiveCamera,
  SRGBColorSpace,
  Vector3,
  type Group,
  type Mesh,
  type MeshBasicMaterial,
} from 'three'

/* ------------------------------------------------------------------------ *
 * MSDS 캠퍼스 — 건축 모형(maquette) 컨셉
 *
 * 색으로 설명하지 않는다. 아이보리 석고 매스 · 네이비 받침대 · 황동 마감뿐이고,
 * 형태는 빛과 그림자로만 읽힌다. 잔디 초록도 목재 갈색도 쓰지 않는 이유는
 * 그 색들이 브랜드 팔레트(index.css)에 없기 때문이다. 부지 가장자리는 안개로
 * 흰 여백에 녹여, 전시대 위에 놓인 모형처럼 보이게 한다.
 * ------------------------------------------------------------------------ */

/* 부지 치수. 육지는 x -9.3~6.1, 그 동쪽 9.4까지가 물이다.
   받침대는 이 둘을 합한 영역을 기준으로 사방 0.7씩 여백을 두고 감싼다. */
const SHORE_X = 6.1
const LAND_EAST_X = 9.4
const PLINTH_CENTER_X = (-9.3 + LAND_EAST_X) / 2
const PLINTH_WIDTH = LAND_EAST_X + 9.3 + 1.4
const PLINTH_DEPTH = 16.2
const PLINTH_HEIGHT = 0.62
const PLINTH_BOTTOM = -0.05 - PLINTH_HEIGHT

/* 모형 전체를 감싸는 상자. 카메라 거리를 이 상자에 맞춰 계산한다. */
const SITE_MIN: [number, number, number] = [
  PLINTH_CENTER_X - PLINTH_WIDTH / 2,
  PLINTH_BOTTOM,
  -PLINTH_DEPTH / 2,
]
const SITE_MAX: [number, number, number] = [
  PLINTH_CENTER_X + PLINTH_WIDTH / 2,
  3.4,
  PLINTH_DEPTH / 2,
]
const CAMERA_TARGET: [number, number, number] = [PLINTH_CENTER_X, -0.9, 0]
/* 피사계 심도의 초점은 시선점이 아니라 건물 높이에 맞춘다. */
const FOCUS_POINT: [number, number, number] = [0, 0.6, 0]
/* 시선 방향은 고정하고 거리만 화면 비율에 맞춘다. */
const CAMERA_DIRECTION: [number, number, number] = (() => {
  const length = Math.hypot(16.6, 16.1, 19.2)
  return [16.6 / length, 16.1 / length, 19.2 / length]
})()
const UP = new Vector3(0, 1, 0)

/* 석회암 매스 · 청회색 지붕 · 따뜻한 창 · 황동. 받침대와 배경은 네이비다.
   아이보리 위에 아이보리를 올리면 형태가 안 읽혀 밋밋해진다. 어두운 바탕에
   밝은 매스를 올리고, 창만 따뜻하게 켜 두는 편이 훨씬 또렷하다. */
const PLASTER = { color: '#e2d8c4', metalness: 0.02, roughness: 0.84 } as const
const PLASTER_LIGHT = { color: '#efe7d7', metalness: 0.02, roughness: 0.78 } as const
const PLASTER_SHADE = { color: '#c3b69d', metalness: 0.02, roughness: 0.9 } as const
const ROOF = { color: '#315069', metalness: 0.22, roughness: 0.46 } as const
const NAVY_STONE = { color: '#0a1a2b', metalness: 0.06, roughness: 0.72 } as const
const BRASS = { color: '#c1a36c', metalness: 0.85, roughness: 0.3 } as const

/* 선택하지 않은 매스는 채도를 빼 뒤로 물린다. 재질을 통째로 바꾸지 않고
   같은 자리의 색만 갈아 끼워, 전환이 조명처럼 조용하게 일어나도록 한다. */
const PLASTER_MUTED = { color: '#8e949c', metalness: 0.02, roughness: 0.86 } as const
const PLASTER_LIGHT_MUTED = { color: '#9aa1a9', metalness: 0.02, roughness: 0.8 } as const
const PLASTER_SHADE_MUTED = { color: '#767c85', metalness: 0.02, roughness: 0.9 } as const
const ROOF_MUTED = { color: '#33414d', metalness: 0.2, roughness: 0.5 } as const

const WATER = {
  clearcoat: 1,
  clearcoatRoughness: 0.06,
  color: '#12324c',
  metalness: 0.4,
  roughness: 0.05,
} as const
const FOLIAGE = { color: '#93a48c', metalness: 0, roughness: 0.94 } as const
const FOLIAGE_DEEP = { color: '#7b8c76', metalness: 0, roughness: 0.95 } as const

/* 시간대. 저녁이 기본이다 — 브랜드가 '고요'인데 정오의 평평한 빛은 그 정서와 멀다. */
type Mood = 'dusk' | 'day'
const MOODS: Record<
  Mood,
  {
    ambient: number
    background: string
    bloom: number
    exposure: number
    fill: number
    glow: number
    hemi: [string, string, number]
    key: string
    keyIntensity: number
    label: string
    lamps: boolean
    rim: number
  }
> = {
  dusk: {
    ambient: 0.3,
    background: '#102941',
    bloom: 0.62,
    exposure: 1.02,
    fill: 0.62,
    glow: 1.15,
    hemi: ['#c8d8e6', '#0a1a2b', 0.5],
    key: '#ffd9a8',
    keyIntensity: 1.95,
    label: '저녁',
    lamps: true,
    rim: 0.85,
  },
  day: {
    ambient: 0.34,
    background: '#c3d2da',
    bloom: 0.3,
    exposure: 0.94,
    fill: 0.72,
    glow: 0.12,
    hemi: ['#f2f7fa', '#5d6d78', 0.9],
    key: '#fff4e2',
    keyIntensity: 2.5,
    label: '낮',
    lamps: false,
    rim: 0.4,
  },
}

const GOLD = '#b79a67'

type CampusPlace = {
  id: string
  name: string
  label: string
  description: string
  image: string
  position: [number, number, number]
  size: [number, number, number]
  floors: number
  terrace: boolean
}

const places: CampusPlace[] = [
  {
    id: 'wellness',
    name: '웰니스 하우스',
    label: 'WELLNESS HOUSE',
    description: '리셉션과 티 라운지, 스파가 이어지는 중심 동입니다.',
    image: wellnessImage,
    position: [-0.3, 0, -0.1],
    size: [4.35, 2.45, 2.75],
    floors: 3,
    terrace: true,
  },
  {
    id: 'stay',
    name: '스테이 빌리지',
    label: 'STAY VILLAGE',
    description: '오션 스위트와 숲의 객실이 낮은 채로 흩어져 있습니다.',
    image: stayImage,
    position: [3.7, 0, -2.25],
    size: [3.9, 2.25, 3.2],
    floors: 3,
    terrace: true,
  },
  {
    id: 'meditation',
    name: '명상 정원',
    label: 'MEDITATION GARDEN',
    description: '호흡과 사색을 위한, 소리를 덜어낸 마당입니다.',
    image: meditationImage,
    position: [-4.6, 0, 2.45],
    size: [2.8, 1.4, 2.55],
    floors: 2,
    terrace: false,
  },
  {
    id: 'studio',
    name: '프로그램 스튜디오',
    label: 'PROGRAM STUDIO',
    description: '움직임 수업과 워크숍이 열리는 열린 공간입니다.',
    image: studioImage,
    position: [-0.2, 0, 3.35],
    size: [3.6, 1.7, 2.35],
    floors: 2,
    terrace: false,
  },
  {
    id: 'ocean',
    name: '오션 데크',
    label: 'OCEAN DECK',
    description: '물 위로 뻗어 나가 바다를 마주하는 산책 데크입니다.',
    image: oceanImage,
    position: [4.75, 0, 3.4],
    size: [2.7, 0.7, 2.2],
    floors: 1,
    terrace: false,
  },
]

/* 대지 경계: x -9.3 ~ 6.1, z -7.4 ~ 7.4. 동쪽 6.1부터는 물이다. */
const treePositions: [number, number][] = [
  [-8.2, -6.0],
  [-6.9, -6.5],
  [-5.4, -6.05],
  [-3.6, -6.45],
  [-1.7, -6.1],
  [0.4, -6.5],
  [2.4, -6.1],
  [4.3, -6.45],
  [5.35, -5.15],
  [5.4, 0.6],
  [5.0, 6.4],
  [3.2, 6.1],
  [1.4, 6.5],
  [-0.6, 6.2],
  [-2.6, 6.5],
  [-4.6, 6.1],
  [-6.4, 6.4],
  [-8.0, 5.9],
  [-8.65, 3.7],
  [-8.2, 1.8],
  [-8.6, -0.2],
  [-8.2, -2.0],
  [-8.65, -3.9],
]

const rockPositions: [number, number, number][] = [
  [-6.6, -2.6, 0.3],
  [-3.4, -4.1, 0.22],
  [-6.3, 0.9, 0.26],
  [1.8, -4.4, 0.2],
  [5.6, -0.9, 0.28],
  [2.9, 5.1, 0.22],
  [-3.5, 4.8, 0.26],
]

const bollardPositions: [number, number][] = [
  [-3.2, 0.15],
  [-2.45, 1.5],
  [-1.6, 2.6],
  [1.05, 1.75],
  [2.3, 0.85],
  [3.35, 0.2],
  [4.45, 1.25],
]

function usePrefersReducedMotion() {
  const [reduced, setReduced] = useState(
    () =>
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches,
  )

  useEffect(() => {
    const query = window.matchMedia('(prefers-reduced-motion: reduce)')
    const handleChange = () => setReduced(query.matches)
    query.addEventListener('change', handleChange)
    return () => query.removeEventListener('change', handleChange)
  }, [])

  return reduced
}

export default function CampusModel() {
  const [canvasKey, setCanvasKey] = useState(0)
  const [contextLost, setContextLost] = useState(false)
  const [hoverId, setHoverId] = useState<string | null>(null)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [mood, setMood] = useState<Mood>('dusk')
  const [isTouring, setIsTouring] = useState(false)
  const [isVisible, setIsVisible] = useState(true)
  const stageRef = useRef<HTMLDivElement>(null)
  const reducedMotion = usePrefersReducedMotion()

  /* 선택은 남고 호버는 스쳐 간다. 강조 대상은 둘 중 먼저 있는 쪽이다. */
  const activeId = hoverId ?? selectedId
  const activePlace = places.find((place) => place.id === activeId) ?? null
  const selectedPlace = places.find((place) => place.id === selectedId) ?? null

  const retryRenderer = () => {
    setContextLost(false)
    setCanvasKey((current) => current + 1)
  }

  const toggleSelect = useCallback((id: string) => {
    setIsTouring(false)
    setSelectedId((current) => (current === id ? null : id))
  }, [])

  /* 자동 투어. 다섯 곳을 차례로 비춘다. 직접 돌려 볼 생각이 없는 사람에게도
     한 바퀴는 보여 주자는 것이고, 손을 대는 순간 바로 멈춘다. */
  useEffect(() => {
    if (!isTouring) return
    const order = places.map((place) => place.id)
    let index = 0
    const timer = window.setInterval(() => {
      index = (index + 1) % order.length
      setSelectedId(order[index])
    }, 4600)
    return () => window.clearInterval(timer)
  }, [isTouring])

  const startTour = () => {
    setIsTouring(true)
    setSelectedId(places[0].id)
  }

  const stopTour = useCallback(() => setIsTouring(false), [])

  /* 화면 밖으로 나가면 렌더 루프를 아예 멈춘다. 후처리까지 도는 씬이라
     보이지 않는 동안 프레임을 계속 그리는 것은 그냥 낭비다. */
  useEffect(() => {
    const node = stageRef.current
    if (!node) return
    const observer = new IntersectionObserver(([entry]) => setIsVisible(entry.isIntersecting), {
      rootMargin: '120px',
    })
    observer.observe(node)
    return () => observer.disconnect()
  }, [])

  const frameloop = reducedMotion ? 'demand' : isVisible ? 'always' : 'never'
  const m = MOODS[mood]

  return (
    <section className="overflow-hidden bg-navy-900 px-6 py-20 md:px-12 md:py-[112px]">
      <div className="mx-auto max-w-[1088px]">
        <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
          <div>
            <p className="text-[11px] font-medium tracking-[0.2em] text-gold-500">EXPLORE MSDS</p>
            <h2 className="mt-3 font-display text-[2.25rem] leading-tight text-white md:text-[2.75rem]">
              머무름의 모든 장면을 한눈에
            </h2>
          </div>
          <p className="max-w-[380px] text-sm leading-7 break-keep text-white/60">
            MSDS의 시설과 숙소를 건축 모형으로 옮겼습니다. 드래그해 각도를 바꾸고, 아래 이름을
            선택하면 해당 공간만 남기고 나머지는 뒤로 물러납니다.
          </p>
        </div>

        <div
          className="mt-10 overflow-hidden rounded-lg border border-white/12 bg-white/4 p-3 md:p-4"
          onPointerDownCapture={stopTour}
          onWheelCapture={stopTour}
          ref={stageRef}
        >
          <div
            className="relative h-[600px] overflow-hidden rounded-sm"
            style={{ background: m.background }}
          >
            <p className="pointer-events-none absolute left-6 top-6 z-10 rounded-full bg-navy-900/45 px-3.5 py-1.5 text-[10px] tracking-[0.2em] text-white/55 backdrop-blur-sm">
              DRAG TO ROTATE · SCROLL TO ZOOM · CLICK TO FOCUS
            </p>

            <div className="absolute right-6 top-6 z-10 flex items-center gap-2">
              <button
                aria-pressed={isTouring}
                className={`rounded-full border px-4 py-2 text-[11px] tracking-[0.1em] backdrop-blur-sm transition-colors duration-200 ${
                  isTouring
                    ? 'border-gold-500 bg-gold-500 text-navy-900'
                    : 'border-white/15 bg-navy-900/50 text-white/60 hover:text-white'
                }`}
                onClick={() => (isTouring ? setIsTouring(false) : startTour())}
                type="button"
              >
                {isTouring ? '투어 중지' : '자동 투어'}
              </button>

              {/* 시간대 전환. 저녁의 켜진 창이 이 모형의 인상을 만든다. */}
              <div className="flex items-center gap-1 rounded-full border border-white/15 bg-navy-900/50 p-1 backdrop-blur-sm">
                {(Object.keys(MOODS) as Mood[]).map((key) => (
                  <button
                    className={`rounded-full px-3.5 py-1.5 text-[11px] tracking-[0.1em] transition-colors duration-200 ${
                      mood === key ? 'bg-gold-500 text-navy-900' : 'text-white/55 hover:text-white'
                    }`}
                    key={key}
                    onClick={() => setMood(key)}
                    type="button"
                  >
                    {MOODS[key].label}
                  </button>
                ))}
              </div>
            </div>

            {/* 선택 상태 표시 겸 해제. 3D를 클릭해 들어온 사용자에게 나가는 길을 준다. */}
            {selectedId && (
              <button
                className="absolute bottom-6 right-6 z-10 rounded-full border border-white/20 bg-navy-900/60 px-4 py-2 text-[11px] tracking-[0.1em] text-white/75 backdrop-blur-sm transition-colors hover:text-white"
                onClick={() => setSelectedId(null)}
                type="button"
              >
                전체 보기로 돌아가기
              </button>
            )}

            {/* 강조된 공간의 설명을 캔버스 안에 겹쳐 둔다. 눈이 모형을 떠나지 않게.
                사진은 '선택'했을 때만 붙인다 — 스쳐 가는 호버마다 2MB를 받아오면
                마우스를 움직이는 것만으로 네트워크가 출렁인다. */}
            {activePlace && (
              <div className="pointer-events-none absolute bottom-6 left-6 z-10 w-[330px] border-l-2 border-gold-500 bg-navy-900/65 backdrop-blur-sm">
                {selectedPlace && (
                  <img
                    alt=""
                    className="h-[150px] w-full object-cover opacity-90"
                    key={selectedPlace.id}
                    src={selectedPlace.image}
                  />
                )}
                <div className="py-3 pl-4 pr-5">
                  <p className="text-[10px] tracking-[0.18em] text-gold-300">{activePlace.label}</p>
                  <p className="mt-1.5 font-display text-[26px] leading-tight text-white">
                    {activePlace.name}
                  </p>
                  <p className="mt-2 text-[13px] leading-6 break-keep text-white/70">
                    {activePlace.description}
                  </p>
                </div>
              </div>
            )}

            <Canvas
              camera={{ far: 120, fov: 33, near: 0.1, position: [16.6, 16.2, 19.2] }}
              dpr={[1, 1.35]}
              frameloop={frameloop}
              gl={{
                antialias: false,
                outputColorSpace: SRGBColorSpace,
                powerPreference: 'default',
                stencil: false,
                toneMapping: ACESFilmicToneMapping,
                toneMappingExposure: m.exposure,
              }}
              key={canvasKey}
              onPointerMissed={() => setSelectedId(null)}
              shadows
            >
              <color attach="background" args={[m.background]} />
              <ContextLifecycle onStatusChange={setContextLost} />
              <CameraFraming background={m.background} />
              <Scene
                activeId={activeId}
                animate={!reducedMotion}
                mood={mood}
                onActiveChange={setHoverId}
                onSelect={toggleSelect}
                selectedId={selectedId}
              />
              <OrbitControls
                dampingFactor={0.05}
                enableDamping
                enablePan={false}
                maxDistance={80}
                maxPolarAngle={Math.PI / 2.25}
                minDistance={14}
                minPolarAngle={Math.PI / 5}
                rotateSpeed={0.55}
                target={CAMERA_TARGET}
                zoomSpeed={0.65}
              />
              <EffectComposer enableNormalPass={false} multisampling={0}>
                <N8AO
                  aoRadius={1.7}
                  aoSamples={16}
                  color="#050d16"
                  denoiseSamples={6}
                  distanceFalloff={1.1}
                  halfRes
                  intensity={2.4}
                  quality="medium"
                />
                <Bloom
                  intensity={m.bloom}
                  luminanceSmoothing={0.3}
                  luminanceThreshold={0.72}
                  mipmapBlur
                />
                <DepthOfField
                  bokehScale={1.1}
                  focalLength={0.12}
                  focusRange={0.22}
                  target={FOCUS_POINT}
                />
                <Vignette darkness={0.34} eskil={false} offset={0.32} />
                <SMAA />
              </EffectComposer>
            </Canvas>

            {contextLost && (
              <div className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-4 bg-navy-900/85 px-6 text-center text-white backdrop-blur-sm">
                <p className="text-sm leading-6">3D 화면을 다시 준비하고 있습니다.</p>
                <button
                  className="rounded-full border border-white/40 bg-white/10 px-5 py-2 text-xs tracking-[0.08em] transition-colors hover:bg-white/20"
                  onClick={retryRenderer}
                  type="button"
                >
                  3D 다시 불러오기
                </button>
              </div>
            )}
          </div>

          <PlaceKey
            activeId={activeId}
            onHover={setHoverId}
            onSelect={toggleSelect}
            selectedId={selectedId}
          />
        </div>

        <p className="mt-6 text-center text-xs leading-6 break-keep text-white/40">
          시설 위치는 조감도 이해를 돕기 위한 안내이며, 객실 배정은 예약 시점의 이용 가능 객실을
          기준으로 진행됩니다.
        </p>
      </div>
    </section>
  )
}

/* 모형의 범례. 캔버스 바로 아래 한 줄 다섯 칸으로 두어, 모형과 이름이 한 화면에
   같이 잡히게 한다. 3D를 볼 수 없는 환경에서도 같은 정보가 글로 남는다. */
function PlaceKey({
  activeId,
  onHover,
  onSelect,
  selectedId,
}: {
  activeId: string | null
  onHover: Dispatch<SetStateAction<string | null>>
  onSelect: (id: string) => void
  selectedId: string | null
}) {
  return (
    <ul className="mt-3 grid grid-cols-5 gap-px bg-white/10 md:mt-4">
      {places.map((place, index) => {
        const isActive = activeId === place.id
        const isSelected = selectedId === place.id
        return (
          <li key={place.id}>
            <button
              aria-pressed={isSelected}
              className={`flex h-full w-full flex-col items-start px-4 py-4 text-left transition-colors duration-200 ${
                isActive ? 'bg-white/12' : 'bg-navy-900'
              }`}
              onBlur={() => onHover((current) => (current === place.id ? null : current))}
              onClick={() => onSelect(place.id)}
              onFocus={() => onHover(place.id)}
              onPointerEnter={() => onHover(place.id)}
              onPointerLeave={() => onHover((current) => (current === place.id ? null : current))}
              type="button"
            >
              <span
                className={`text-[10px] tracking-[0.16em] transition-colors ${
                  isSelected ? 'text-gold-500' : 'text-white/35'
                }`}
              >
                {String(index + 1).padStart(2, '0')}
              </span>
              <span
                className={`mt-1.5 font-display text-[19px] leading-tight transition-colors ${
                  isActive || isSelected ? 'text-white' : 'text-white/70'
                }`}
              >
                {place.name}
              </span>
              <span className="mt-1 text-[10px] tracking-[0.12em] text-white/30">
                {place.label}
              </span>
              {/* 선택된 칸만 아래에 황동 선이 그어진다. */}
              <span
                aria-hidden="true"
                className={`mt-3 block h-px w-full transition-colors duration-300 ${
                  isSelected ? 'bg-gold-500' : 'bg-white/10'
                }`}
              />
            </button>
          </li>
        )
      })}
    </ul>
  )
}

/* 시간대는 씬 전체가 함께 읽어야 해서 컨텍스트로 내린다.
   muted는 매스마다 달라지므로 props로 넘긴다. */
const StageContext = createContext({ glow: MOODS.dusk.glow, lamps: MOODS.dusk.lamps })
const useStage = () => useContext(StageContext)

/* 부지가 가로로 긴 탓에 프레임 비율에 따라 필요한 카메라 거리가 크게 달라진다.
   바운딩 구가 아니라 상자 여덟 꼭짓점을 실제로 투영해 거리를 구한다. 구 기준으로
   잡으면 납작한 모형이 필요 이상으로 멀어져 화면에서 작아진다. */
function fitDistance(width: number, height: number, fov: number) {
  if (width === 0 || height === 0) return 30

  const target = new Vector3(...CAMERA_TARGET)
  const direction = new Vector3(...CAMERA_DIRECTION)
  const base = 24
  const eye = target.clone().addScaledVector(direction, base)
  const view = new Matrix4().lookAt(eye, target, UP).setPosition(eye).invert()

  const tanV = Math.tan((fov * Math.PI) / 180 / 2)
  const tanH = tanV * (width / height)
  const corner = new Vector3()
  let push = 0

  for (const x of [SITE_MIN[0], SITE_MAX[0]]) {
    for (const y of [SITE_MIN[1], SITE_MAX[1]]) {
      for (const z of [SITE_MIN[2], SITE_MAX[2]]) {
        corner.set(x, y, z).applyMatrix4(view)
        /* 카메라는 -z를 바라본다. 시선 방향으로 물러나면 x·y는 그대로고 깊이만
           늘어나므로, 필요한 깊이에서 현재 깊이를 뺀 값이 밀어야 할 거리다. */
        const needed = Math.max(Math.abs(corner.x) / tanH, Math.abs(corner.y) / tanV) * 0.95
        push = Math.max(push, needed + corner.z)
      }
    }
  }

  return Math.min(80, Math.max(14, base + push))
}

function CameraFraming({ background }: { background: string }) {
  const camera = useThree((state) => state.camera)
  const size = useThree((state) => state.size)
  const invalidate = useThree((state) => state.invalidate)
  const fov = camera instanceof PerspectiveCamera ? camera.fov : 33
  const distance = useMemo(
    () => fitDistance(size.width, size.height, fov),
    [fov, size.height, size.width],
  )

  useEffect(() => {
    camera.position
      .set(...CAMERA_TARGET)
      .addScaledVector(new Vector3(...CAMERA_DIRECTION), distance)
    camera.updateProjectionMatrix()
    invalidate()
  }, [camera, distance, invalidate])

  /* 안개도 카메라 거리를 따라간다. 고정값으로 두면 좁은 화면에서 카메라가
     물러난 만큼 모형 전체가 안개에 잠겨 하얗게 날아간다. */
  return <fog args={[background, distance * 1.12, distance * 2.3]} attach="fog" />
}

function ContextLifecycle({
  onStatusChange,
}: {
  onStatusChange: Dispatch<SetStateAction<boolean>>
}) {
  const { gl, invalidate } = useThree()

  useEffect(() => {
    const canvas = gl.domElement
    const handleLost = (event: Event) => {
      event.preventDefault()
      onStatusChange(true)
    }
    const handleRestored = () => {
      onStatusChange(false)
      invalidate()
    }

    canvas.addEventListener('webglcontextlost', handleLost)
    canvas.addEventListener('webglcontextrestored', handleRestored)
    return () => {
      canvas.removeEventListener('webglcontextlost', handleLost)
      canvas.removeEventListener('webglcontextrestored', handleRestored)
    }
  }, [gl, invalidate, onStatusChange])

  return null
}

function Scene({
  activeId,
  animate,
  mood,
  onActiveChange,
  onSelect,
  selectedId,
}: {
  activeId: string | null
  animate: boolean
  mood: Mood
  onActiveChange: Dispatch<SetStateAction<string | null>>
  onSelect: (id: string) => void
  selectedId: string | null
}) {
  const m = MOODS[mood]
  const handleHover = useCallback(
    (id: string | null) => {
      onActiveChange((current) => (id === null ? (current ? null : current) : id))
    },
    [onActiveChange],
  )
  const stage = useMemo(() => ({ glow: m.glow, lamps: m.lamps }), [m.glow, m.lamps])

  return (
    <StageContext.Provider value={stage}>
      {/* 앰비언트는 낮게. 면 대비가 살아나야 매스가 형태로 읽힌다. */}
      <ambientLight intensity={m.ambient} />
      <hemisphereLight args={m.hemi} />
      <directionalLight
        castShadow
        color={m.key}
        intensity={m.keyIntensity}
        position={[-8, 12.5, 7]}
        shadow-bias={-0.0002}
        shadow-camera-bottom={-13}
        shadow-camera-far={40}
        shadow-camera-left={-14}
        shadow-camera-right={14}
        shadow-camera-top={13}
        shadow-mapSize={[2048, 2048]}
        shadow-normalBias={0.02}
      />
      {/* 반대편 필 라이트 — 그림자 속을 완전히 죽이지 않을 만큼만. */}
      <directionalLight color="#8fb0c8" intensity={m.fill} position={[9, 5, -8]} />
      {/* 뒤쪽 림 라이트 — 매스 윤곽에 얇은 빛선을 남긴다. */}
      <directionalLight color="#d7c59e" intensity={m.rim} position={[4, 3.2, -11]} />

      {/* 유리·황동이 반사할 대상을 손으로 배치한다. CDN HDRI 대신 라이트포머를
          쓰는 편이 네트워크에도, 톤 관리에도 낫다. */}
      <Environment environmentIntensity={mood === 'dusk' ? 0.4 : 0.7} frames={1} resolution={256}>
        <Lightformer
          color={mood === 'dusk' ? '#8fb6d8' : '#fff8ec'}
          form="rect"
          intensity={mood === 'dusk' ? 1.5 : 2.4}
          position={[0, 9, 1]}
          rotation={[Math.PI / 2, 0, 0]}
          scale={[12, 12, 1]}
        />
        <Lightformer
          color="#e3ebf2"
          form="rect"
          intensity={1.1}
          position={[-10, 3.5, 3]}
          rotation={[0, Math.PI / 2, 0]}
          scale={[8, 7, 1]}
        />
        <Lightformer
          color="#e6b877"
          form="rect"
          intensity={mood === 'dusk' ? 1.6 : 0.85}
          position={[8, 2.2, -6]}
          rotation={[0, -Math.PI / 2.6, 0]}
          scale={[7, 5, 1]}
        />
      </Environment>

      <ModelStage animate={animate}>
        <Plinth />
        <Terrain />
        <Sea animate={animate} />
        {places.map((place, index) => (
          <CampusBuilding
            animate={animate}
            index={index}
            isActive={activeId === place.id}
            key={place.id}
            muted={selectedId !== null && selectedId !== place.id}
            onHover={handleHover}
            onSelect={onSelect}
            place={place}
          />
        ))}
        {treePositions.map(([x, z], index) => (
          <ModelTree
            form={index % 3 === 1 ? 1 : index % 5 === 3 ? 2 : 0}
            key={`${x}-${z}`}
            scale={0.68 + (index % 4) * 0.09}
            x={x}
            z={z}
          />
        ))}
        {rockPositions.map(([x, z, scale]) => (
          <ModelRock key={`${x}-${z}`} scale={scale} x={x} z={z} />
        ))}
        {bollardPositions.map(([x, z]) => (
          <Bollard key={`${x}-${z}`} x={x} z={z} />
        ))}
        <Peacock animate={animate} />
        <Compass />
      </ModelStage>

      <ContactShadows
        blur={2.6}
        color="#000000"
        far={4}
        opacity={mood === 'dusk' ? 0.5 : 0.34}
        position={[PLINTH_CENTER_X, PLINTH_BOTTOM - 0.02, 0]}
        resolution={1024}
        scale={26}
      />
    </StageContext.Provider>
  )
}

/* 모형이 놓이는 무대. 처음 한 번 천천히 떠오르고, 아주 느리게 돌다가 멈춘다.
   사용자가 손을 대는 순간 회전은 즉시 끝난다 — 조작을 방해하지 않기 위해서다. */
function ModelStage({ animate, children }: { animate: boolean; children: React.ReactNode }) {
  const groupRef = useRef<Group>(null)
  const elapsedRef = useRef(0)
  const interruptedRef = useRef(false)
  const { gl } = useThree()

  useEffect(() => {
    const canvas = gl.domElement
    const stop = () => {
      interruptedRef.current = true
    }
    canvas.addEventListener('pointerdown', stop)
    canvas.addEventListener('wheel', stop, { passive: true })
    return () => {
      canvas.removeEventListener('pointerdown', stop)
      canvas.removeEventListener('wheel', stop)
    }
  }, [gl])

  useFrame((_, delta) => {
    const group = groupRef.current
    if (!group || !animate) return

    elapsedRef.current += delta
    const t = Math.min(1, elapsedRef.current / 1.8)
    const eased = 1 - Math.pow(1 - t, 5)
    group.position.y = -0.7 * (1 - eased)
    group.scale.setScalar(0.955 + 0.045 * eased)

    if (!interruptedRef.current) {
      const decay = Math.max(0, 1 - elapsedRef.current / 7.5)
      group.rotation.y += delta * 0.085 * decay * decay
    }
  })

  return <group ref={groupRef}>{children}</group>
}

/* 네이비 받침대. 모형을 '전시된 것'으로 만들어 주는 장치이자,
   위쪽 OUR PRINCIPLES 섹션(bg-navy-900)과 색을 잇는 연결부다. */
function Plinth() {
  const edges: Array<{
    args: [number, number, number]
    position: [number, number, number]
  }> = [
    { args: [PLINTH_WIDTH, 0.022, 0.05], position: [0, -0.048, PLINTH_DEPTH / 2 - 0.025] },
    { args: [PLINTH_WIDTH, 0.022, 0.05], position: [0, -0.048, -PLINTH_DEPTH / 2 + 0.025] },
    { args: [0.05, 0.022, PLINTH_DEPTH], position: [PLINTH_WIDTH / 2 - 0.025, -0.048, 0] },
    { args: [0.05, 0.022, PLINTH_DEPTH], position: [-PLINTH_WIDTH / 2 + 0.025, -0.048, 0] },
  ]

  return (
    <group position={[PLINTH_CENTER_X, 0, 0]}>
      <RoundedBox
        args={[PLINTH_WIDTH, PLINTH_HEIGHT, PLINTH_DEPTH]}
        position={[0, PLINTH_BOTTOM + PLINTH_HEIGHT / 2, 0]}
        radius={0.06}
        receiveShadow
      >
        <meshStandardMaterial {...NAVY_STONE} />
      </RoundedBox>
      {/* 상판 가장자리를 따라 도는 얇은 황동 인레이 */}
      {edges.map((edge) => (
        <mesh key={`${edge.position[0]}-${edge.position[2]}`} position={edge.position}>
          <boxGeometry args={edge.args} />
          <meshStandardMaterial {...BRASS} />
        </mesh>
      ))}
    </group>
  )
}

function Terrain() {
  return (
    <group>
      <RoundedBox
        args={[15.4, 0.4, 14.8]}
        castShadow
        position={[-1.6, -0.2, 0]}
        radius={0.07}
        receiveShadow
      >
        <meshStandardMaterial {...PLASTER} />
      </RoundedBox>

      {/* 길은 색이 아니라 음각으로 표현한다. AO가 얕은 홈을 대신 그려 준다. */}
      <PathInlay length={13.4} position={[1.6, 0.7]} rotation={-0.5} width={0.9} />
      <PathInlay length={9.6} position={[-3.6, 1.1]} rotation={0.4} width={0.68} />
      <PathInlay length={6.2} position={[-6.4, -2.4]} rotation={-1.15} width={0.6} />

      <GardenBed position={[-5.1, -0.8]} scale={[2.1, 0.85]} />
      <GardenBed position={[1.6, -2.6]} scale={[1.4, 0.7]} />
      <GardenBed position={[2.2, 5.0]} scale={[1.45, 0.56]} />

      <PoolTerrace />

      {/* 호안선. 육지가 어디서 끝나고 물이 시작되는지 한 줄로 보여 준다. */}
      <mesh position={[SHORE_X - 0.02, 0.02, 0]}>
        <boxGeometry args={[0.04, 0.05, 14.8]} />
        <meshStandardMaterial {...BRASS} />
      </mesh>
    </group>
  )
}

function PathInlay({
  length,
  position,
  rotation,
  width,
}: {
  length: number
  position: [number, number]
  rotation: number
  width: number
}) {
  return (
    <group position={[position[0], 0, position[1]]} rotation={[0, rotation, 0]}>
      <mesh position={[0, -0.018, 0]} receiveShadow>
        <boxGeometry args={[width, 0.05, length]} />
        <meshStandardMaterial {...PLASTER_SHADE} />
      </mesh>
    </group>
  )
}

function GardenBed({ position, scale }: { position: [number, number]; scale: [number, number] }) {
  return (
    <group position={[position[0], 0, position[1]]}>
      <mesh position={[0, -0.012, 0]} receiveShadow scale={[scale[0], 1, scale[1]]}>
        <cylinderGeometry args={[1, 1, 0.045, 40]} />
        <meshStandardMaterial {...PLASTER_SHADE} />
      </mesh>
      {[-0.5, -0.1, 0.32, 0.62].map((offset, index) => (
        <mesh
          castShadow
          key={offset}
          position={[offset * scale[0], 0.09 + (index % 2) * 0.03, (index - 2) * 0.1 * scale[1]]}
        >
          <sphereGeometry args={[0.16 + (index % 2) * 0.04, 14, 10]} />
          <meshStandardMaterial {...(index % 2 ? FOLIAGE : FOLIAGE_DEEP)} />
        </mesh>
      ))}
    </group>
  )
}

/* 반사 연못. 명상 정원과 웰니스 하우스 사이에 놓아, 물이 하늘과 매스를
   되비추게 한다. 백색 모형에서 유일하게 깊은 색이 허용되는 자리다. */
function PoolTerrace() {
  return (
    <group position={[-2.9, 0, -2.9]}>
      <mesh position={[0, -0.01, 0]} receiveShadow>
        <boxGeometry args={[3.0, 0.06, 1.9]} />
        <meshStandardMaterial {...PLASTER_LIGHT} />
      </mesh>
      <mesh position={[0, 0.016, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[2.5, 1.4]} />
        <meshPhysicalMaterial {...WATER} />
      </mesh>
      {[
        {
          args: [2.6, 0.014, 0.035] as [number, number, number],
          position: [0, 0.026, 0.718] as [number, number, number],
        },
        {
          args: [2.6, 0.014, 0.035] as [number, number, number],
          position: [0, 0.026, -0.718] as [number, number, number],
        },
        {
          args: [0.035, 0.014, 1.47] as [number, number, number],
          position: [1.268, 0.026, 0] as [number, number, number],
        },
        {
          args: [0.035, 0.014, 1.47] as [number, number, number],
          position: [-1.268, 0.026, 0] as [number, number, number],
        },
      ].map((rim) => (
        <mesh key={`${rim.position[0]}-${rim.position[2]}`} position={rim.position}>
          <boxGeometry args={rim.args} />
          <meshStandardMaterial {...BRASS} />
        </mesh>
      ))}
    </group>
  )
}

/* 수면. 정지된 물은 모형을 죽은 것으로 만든다. 진폭은 3cm 남짓,
   주기는 느리게 — 브랜드 모션 원칙(--ease-calm)과 같은 태도다. */
function Sea({ animate }: { animate: boolean }) {
  const meshRef = useRef<Mesh>(null)
  const baseRef = useRef<Float32Array | null>(null)

  useFrame(({ clock }) => {
    const mesh = meshRef.current
    if (!mesh || !animate) return
    const position = mesh.geometry.attributes.position
    if (!baseRef.current) {
      baseRef.current = Float32Array.from(position.array as Float32Array)
    }
    const base = baseRef.current
    const t = clock.elapsedTime * 0.38

    for (let i = 0; i < position.count; i += 1) {
      const x = base[i * 3]
      const y = base[i * 3 + 1]
      position.setZ(
        i,
        Math.sin(x * 1.2 + t) * 0.026 +
          Math.sin(y * 0.85 - t * 0.72) * 0.02 +
          Math.sin((x + y) * 0.55 + t * 1.3) * 0.012,
      )
    }
    position.needsUpdate = true
    mesh.geometry.computeVertexNormals()
  })

  return (
    <mesh
      position={[(SHORE_X + LAND_EAST_X) / 2, -0.03, 0]}
      ref={meshRef}
      rotation={[-Math.PI / 2, 0, 0]}
    >
      <planeGeometry args={[LAND_EAST_X - SHORE_X, 14.8, 40, 60]} />
      <meshPhysicalMaterial {...WATER} />
    </mesh>
  )
}

function CampusBuilding({
  animate,
  index,
  isActive,
  muted,
  onHover,
  onSelect,
  place,
}: {
  animate: boolean
  index: number
  isActive: boolean
  muted: boolean
  onHover: (id: string | null) => void
  onSelect: (id: string) => void
  place: CampusPlace
}) {
  const groupRef = useRef<Group>(null)
  const ringRef = useRef<MeshBasicMaterial>(null)
  const [width, height, depth] = place.size
  const baseY = place.position[1]
  const ringRadius = Math.max(width, depth) * 0.66 + 0.42
  const pinTop = height + 0.95

  useFrame((_, delta) => {
    if (!animate) return
    const group = groupRef.current
    const ring = ringRef.current
    const step = Math.min(1, delta * 7)
    if (group) {
      const target = baseY + (isActive ? 0.16 : 0)
      group.position.y += (target - group.position.y) * step
    }
    if (ring) {
      ring.opacity += ((isActive ? 0.85 : 0) - ring.opacity) * step
    }
  })

  return (
    <group
      onPointerOut={() => {
        document.body.style.cursor = 'auto'
        onHover(null)
      }}
      onPointerOver={(event) => {
        event.stopPropagation()
        document.body.style.cursor = 'pointer'
        onHover(place.id)
      }}
      onPointerUp={(event) => {
        event.stopPropagation()
        onSelect(place.id)
      }}
      position={[
        place.position[0],
        animate ? baseY : baseY + (isActive ? 0.16 : 0),
        place.position[2],
      ]}
      ref={groupRef}
    >
      {/* 활성 표시는 아웃라인이 아니라 바닥의 황동 링이다.
          백색 모형 위에서는 이쪽이 훨씬 조용하게 읽힌다. */}
      <mesh position={[0, 0.012, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[ringRadius, ringRadius + 0.07, 80]} />
        <meshBasicMaterial
          color={GOLD}
          opacity={animate ? 0 : isActive ? 0.85 : 0}
          ref={ringRef}
          toneMapped={false}
          transparent
        />
      </mesh>

      {place.id === 'stay' && (
        <StayVillage depth={depth} height={height} muted={muted} width={width} />
      )}
      {place.id === 'ocean' && <OceanDeck muted={muted} />}
      {place.id !== 'stay' && place.id !== 'ocean' && (
        <PlasterMass
          depth={depth}
          floors={place.floors}
          height={height}
          muted={muted}
          terrace={place.terrace}
          width={width}
        />
      )}

      <MarkerPin active={isActive} height={pinTop} />

      {isActive && (
        <Html
          center
          distanceFactor={10}
          position={[0, pinTop + 0.5, 0]}
          style={{ pointerEvents: 'none' }}
        >
          <div className="w-max border-l-2 border-gold-500 bg-navy-900/85 py-2 pl-3 pr-5 text-left shadow-[0_12px_34px_-16px_rgba(0,0,0,0.7)] backdrop-blur-sm">
            <span className="block text-[9px] tracking-[0.18em] text-gold-300">
              {String(index + 1).padStart(2, '0')} · {place.label}
            </span>
            <strong className="mt-1 block font-display text-[17px] leading-tight font-medium text-white">
              {place.name}
            </strong>
          </div>
        </Html>
      )}
    </group>
  )
}

/* 모형 위에 꽂는 황동 핀. 실제 건축 모형의 표기 방식이기도 하고,
   활성 상태를 색이 아니라 빛의 세기로 알릴 수 있어 톤을 해치지 않는다. */
function MarkerPin({ active, height }: { active: boolean; height: number }) {
  return (
    <group position={[0, height - 0.45, 0]}>
      <mesh>
        <cylinderGeometry args={[0.009, 0.009, 0.9, 8]} />
        <meshStandardMaterial {...BRASS} />
      </mesh>
      <mesh position={[0, 0.46, 0]}>
        <sphereGeometry args={[active ? 0.058 : 0.038, 16, 12]} />
        <meshStandardMaterial
          color="#e6d7b4"
          emissive={GOLD}
          emissiveIntensity={active ? 2.6 : 0.7}
          metalness={0.5}
          roughness={0.3}
        />
      </mesh>
    </group>
  )
}

/* 석고 매스 한 채. 박스를 쌓는 대신 (1) 얇게 뻗은 캔틸레버 지붕,
   (2) 깊게 파인 창 밴드, (3) 상층 테라스 후퇴 — 이 셋으로 실루엣을 만든다. */
function PlasterMass({
  depth,
  floors,
  height,
  muted,
  terrace,
  width,
}: {
  depth: number
  floors: number
  height: number
  muted: boolean
  terrace: boolean
  width: number
}) {
  const floorHeight = height / floors
  const bodyFloors = terrace ? floors - 1 : floors
  const bodyHeight = floorHeight * bodyFloors
  const crownDepth = depth - 0.95
  const crownZ = -0.45
  const overhang = Math.min(0.42, Math.max(0.15, width * 0.1))

  return (
    <group>
      {/* 대지 패드 — 매스를 지면에서 살짝 들어 그림자 선을 만든다. */}
      <mesh castShadow position={[0, 0.045, 0]} receiveShadow>
        <boxGeometry args={[width + 0.52, 0.09, depth + 0.6]} />
        <meshStandardMaterial {...(muted ? PLASTER_SHADE_MUTED : PLASTER_SHADE)} />
      </mesh>

      <RoundedBox
        args={[width, bodyHeight, depth]}
        castShadow
        position={[0, bodyHeight / 2 + 0.09, 0]}
        radius={0.05}
        receiveShadow
        smoothness={4}
      >
        <meshStandardMaterial {...(muted ? PLASTER_MUTED : PLASTER)} />
      </RoundedBox>

      {Array.from({ length: bodyFloors }, (_, floor) => (
        <GlazingBand
          depth={depth}
          floorHeight={floorHeight}
          key={floor}
          level={floor}
          muted={muted}
          width={width}
        />
      ))}

      {terrace && (
        <group>
          {/* 상층은 뒤로 물러나며 앞쪽에 테라스를 남긴다. */}
          <RoundedBox
            args={[width - 0.5, floorHeight, crownDepth]}
            castShadow
            position={[0, bodyHeight + floorHeight / 2 + 0.11, crownZ]}
            radius={0.05}
            receiveShadow
            smoothness={4}
          >
            <meshStandardMaterial {...(muted ? PLASTER_LIGHT_MUTED : PLASTER_LIGHT)} />
          </RoundedBox>
          <GlazingBand
            depth={crownDepth}
            floorHeight={floorHeight}
            level={0}
            muted={muted}
            offsetY={bodyHeight + 0.02}
            offsetZ={crownZ}
            width={width - 0.5}
          />
          <mesh castShadow position={[0, bodyHeight + 0.11, depth / 2 - 0.24]} receiveShadow>
            <boxGeometry args={[width - 0.24, 0.05, 0.85]} />
            <meshStandardMaterial {...(muted ? PLASTER_SHADE_MUTED : PLASTER_SHADE)} />
          </mesh>
          {/* 황동 난간 — 손잡이 한 줄과 얇은 세로대 */}
          <mesh position={[0, bodyHeight + 0.37, depth / 2 + 0.16]}>
            <boxGeometry args={[width - 0.24, 0.016, 0.016]} />
            <meshStandardMaterial {...BRASS} />
          </mesh>
          {[-0.42, -0.14, 0.14, 0.42].map((ratio) => (
            <mesh
              key={ratio}
              position={[width * ratio * 0.92, bodyHeight + 0.24, depth / 2 + 0.16]}
            >
              <boxGeometry args={[0.012, 0.28, 0.012]} />
              <meshStandardMaterial {...BRASS} />
            </mesh>
          ))}
        </group>
      )}

      {/* 칼처럼 얇은 캔틸레버 지붕. 두께가 얇을수록 모형은 비싸 보인다. */}
      <mesh
        castShadow
        position={[
          0,
          (terrace ? bodyHeight + floorHeight : bodyHeight) + 0.155,
          terrace ? crownZ : 0,
        ]}
      >
        <boxGeometry
          args={[
            (terrace ? width - 0.5 : width) + overhang * 2,
            0.055,
            (terrace ? crownDepth : depth) + overhang * 2,
          ]}
        />
        {/* 지붕을 청회색으로 둔다. 매스와 같은 크림으로 두면 위에서 볼 때
            건물이 아니라 판때기로 읽힌다. */}
        <meshStandardMaterial {...(muted ? ROOF_MUTED : ROOF)} />
      </mesh>

      {/* 지상층 진입부 — 깊게 판 포치와 얇은 황동 캐노피 */}
      <mesh position={[0, 0.09 + floorHeight * 0.34, depth / 2 - 0.16]}>
        <boxGeometry args={[Math.min(1.5, width * 0.42), floorHeight * 0.62, 0.12]} />
        <meshStandardMaterial color="#1b3d55" metalness={0.08} roughness={0.46} />
      </mesh>
      {/* 진입 캐노피. 황동으로 두면 위에서 내려다볼 때 넓은 갈색 판으로 읽혀
          모형의 백색 톤을 깨뜨린다. 황동은 선으로만 쓰고 면은 석고로 둔다. */}
      <mesh castShadow position={[0, 0.09 + floorHeight * 0.72, depth / 2 + 0.22]}>
        <boxGeometry args={[Math.min(1.9, width * 0.54), 0.035, 0.58]} />
        <meshStandardMaterial {...(muted ? ROOF_MUTED : ROOF)} />
      </mesh>
      <mesh position={[0, 0.09 + floorHeight * 0.72 - 0.024, depth / 2 + 0.5]}>
        <boxGeometry args={[Math.min(1.9, width * 0.54), 0.014, 0.014]} />
        <meshStandardMaterial {...BRASS} />
      </mesh>
      {[0, 1, 2].map((step) => (
        <mesh
          castShadow
          key={step}
          position={[0, 0.055 - step * 0.022, depth / 2 + 0.62 + step * 0.16]}
        >
          <boxGeometry args={[Math.min(1.7, width * 0.48), 0.05, 0.3]} />
          <meshStandardMaterial {...(muted ? PLASTER_SHADE_MUTED : PLASTER_SHADE)} />
        </mesh>
      ))}
    </group>
  )
}

/* 창은 밝게 빛나는 판이 아니라 벽을 깊게 파낸 어두운 띠다.
   위쪽에만 황동 리빌을 한 줄 넣어 개구부의 두께를 드러낸다. */
function GlassMaterial({ muted, opacity }: { muted?: boolean; opacity?: number }) {
  const { glow } = useStage()
  return (
    <meshPhysicalMaterial
      clearcoat={0.7}
      color={muted ? '#3a4a56' : '#274c5b'}
      emissive={muted ? '#2b3740' : '#c28b45'}
      emissiveIntensity={muted ? glow * 0.12 : glow}
      metalness={0.12}
      opacity={opacity ?? 1}
      roughness={0.16}
      transparent={opacity !== undefined}
    />
  )
}

function GlazingBand({
  depth,
  floorHeight,
  level,
  muted,
  offsetY = 0,
  offsetZ = 0,
  width,
}: {
  depth: number
  floorHeight: number
  level: number
  muted: boolean
  offsetY?: number
  offsetZ?: number
  width: number
}) {
  const centerY = 0.09 + offsetY + floorHeight * level + floorHeight * 0.56
  const bandHeight = floorHeight * 0.46
  const frontWidth = width * 0.8
  const sideDepth = depth * 0.6
  /* 개구부를 벽 두께만큼 실제로 파낸다. 벽면과 같은 높이에 두면 유리가
     '붙인 스티커'로 보이고, AO도 걸리지 않아 깊이가 생기지 않는다. */
  const recess = 0.16

  return (
    <group>
      <mesh position={[0, centerY, offsetZ + depth / 2 - recess]}>
        <boxGeometry args={[frontWidth, bandHeight, 0.08]} />
        <GlassMaterial muted={muted} />
      </mesh>
      <mesh position={[width / 2 - recess, centerY, offsetZ]} rotation={[0, Math.PI / 2, 0]}>
        <boxGeometry args={[sideDepth, bandHeight, 0.08]} />
        <GlassMaterial muted={muted} />
      </mesh>
      <mesh position={[-width / 2 + recess, centerY, offsetZ]} rotation={[0, Math.PI / 2, 0]}>
        <boxGeometry args={[sideDepth * 0.7, bandHeight, 0.08]} />
        <GlassMaterial muted={muted} />
      </mesh>
    </group>
  )
}

/* 스테이 빌리지는 한 덩어리가 아니라 낮은 채들이 흩어진 배치다. */
function StayVillage({
  depth,
  height,
  muted,
  width,
}: {
  depth: number
  height: number
  muted: boolean
  width: number
}) {
  return (
    <group>
      <group rotation={[0, -0.05, 0]}>
        <PlasterMass
          depth={depth * 0.58}
          floors={3}
          height={height}
          muted={muted}
          terrace
          width={width * 0.54}
        />
      </group>
      <group position={[-1.42, 0, 1.15]} rotation={[0, -0.26, 0]}>
        <PlasterMass
          depth={1.05}
          floors={2}
          height={1.34}
          muted={muted}
          terrace={false}
          width={1.34}
        />
      </group>
      <group position={[1.46, 0, 1.08]} rotation={[0, 0.2, 0]}>
        <PlasterMass
          depth={1.05}
          floors={2}
          height={1.34}
          muted={muted}
          terrace={false}
          width={1.34}
        />
      </group>
      <group position={[1.44, 0, -1.14]} rotation={[0, -0.13, 0]}>
        <PlasterMass
          depth={1}
          floors={2}
          height={1.28}
          muted={muted}
          terrace={false}
          width={1.28}
        />
      </group>
    </group>
  )
}

/* 오션 데크는 물 위로 걸쳐 나간다. 지지 말뚝이 보여야 '떠 있다'가 읽힌다. */
function OceanDeck({ muted }: { muted: boolean }) {
  return (
    <group>
      <mesh castShadow position={[0.35, 0.11, 0]} receiveShadow>
        <boxGeometry args={[3.6, 0.12, 2.9]} />
        <meshStandardMaterial {...(muted ? PLASTER_LIGHT_MUTED : PLASTER_LIGHT)} />
      </mesh>
      {[-1.1, 1.35].flatMap((x) =>
        [-1.15, 1.15].map((z) => (
          <mesh key={`${x}-${z}`} position={[x + 0.35, -0.24, z]}>
            <cylinderGeometry args={[0.055, 0.055, 0.62, 10]} />
            <meshStandardMaterial {...NAVY_STONE} />
          </mesh>
        )),
      )}

      {/* 파빌리온 — 기둥 넷과 얇은 지붕판만 남긴 최소 구조 */}
      <group position={[-0.55, 0.17, 0]}>
        {[-0.55, 0.55].flatMap((x) =>
          [-0.5, 0.5].map((z) => (
            <mesh castShadow key={`${x}-${z}`} position={[x, 0.62, z]}>
              <cylinderGeometry args={[0.032, 0.032, 1.24, 10]} />
              <meshStandardMaterial {...BRASS} />
            </mesh>
          )),
        )}
        <mesh castShadow position={[0, 1.27, 0]}>
          <boxGeometry args={[1.66, 0.045, 1.56]} />
          <meshStandardMaterial {...(muted ? ROOF_MUTED : ROOF)} />
        </mesh>
        <mesh position={[0, 0.62, -0.53]}>
          <boxGeometry args={[1.1, 1.06, 0.02]} />
          <GlassMaterial muted={muted} opacity={0.5} />
        </mesh>
      </group>

      {/* 데크 체어 — 형태만 남긴 두 장의 판 */}
      {[-0.72, 0.72].map((z) => (
        <group key={z} position={[1.35, 0.24, z]} rotation={[0, 0.1, 0]}>
          <mesh castShadow rotation={[0.1, 0, 0]}>
            <boxGeometry args={[0.62, 0.05, 0.28]} />
            <meshStandardMaterial {...(muted ? PLASTER_LIGHT_MUTED : PLASTER_LIGHT)} />
          </mesh>
          <mesh castShadow position={[0, 0.1, -0.16]} rotation={[-0.55, 0, 0]}>
            <boxGeometry args={[0.62, 0.05, 0.3]} />
            <meshStandardMaterial {...(muted ? PLASTER_LIGHT_MUTED : PLASTER_LIGHT)} />
          </mesh>
        </group>
      ))}
    </group>
  )
}

/* 모형 수목. 실제 모형이 그렇듯 초록이 아니라 아주 탈색된 세이지 톤이다. */
/* 명상 정원 옆 잔디의 공작. 모형 전체가 절제된 톤이라 색을 가진 것이 하나쯤
   있으면 눈이 머물 자리가 생긴다. 공작의 청록·황동은 마침 브랜드 팔레트와
   같은 계열이라 이질감 없이 들어간다. 찾아내는 재미를 위한 것이므로 안내는
   호버했을 때만 붙는다. */
const PEACOCK_BODY = { color: '#12586b', metalness: 0.28, roughness: 0.42 } as const
const PEACOCK_NECK = { color: '#1a7f96', metalness: 0.32, roughness: 0.36 } as const
const FEATHER_COUNT = 13

/* 공작이 도는 길. 웰니스 하우스와 프로그램 스튜디오 사이, 볼라드가 늘어선
   좁은 마당을 한 바퀴 돈다. 건물 실루엣을 가리지 않으면서도 등이 늘 조명
   근처에 걸리는 자리다. */
const PEACOCK_PATH = new CatmullRomCurve3(
  [
    [3.15, 0, 1.15],
    [2.3, 0, 1.95],
    [0.9, 0, 2.05],
    [-0.8, 0, 1.9],
    [-1.95, 0, 1.5],
    [-0.4, 0, 1.12],
    [1.6, 0, 1.02],
  ].map(([x, y, z]) => new Vector3(x, y, z)),
  true,
  'catmullrom',
  0.5,
)
const PEACOCK_PATH_LENGTH = PEACOCK_PATH.getLength()
const PEACOCK_SPEED = 0.34

function Peacock({ animate }: { animate: boolean }) {
  const { lamps } = useStage()
  const groupRef = useRef<Group>(null)
  const bodyRef = useRef<Group>(null)
  const fanRef = useRef<Group>(null)
  const headRef = useRef<Group>(null)
  const legsRef = useRef<Group>(null)
  const travelled = useRef(0)
  const [hovered, setHovered] = useState(false)

  useFrame((_, delta) => {
    const t = travelled.current
    /* 일정한 속도로 미끄러지면 로봇처럼 보인다. 걸음에 느려지는 구간을 섞어
       두어야 '거니는' 것으로 읽힌다. 쳐다보는 동안에는 멈춘다. */
    if (animate && !hovered) {
      const stride = 0.42 + 0.58 * (0.5 + 0.5 * Math.sin(t * 0.85))
      travelled.current += delta * PEACOCK_SPEED * stride
    }

    const progress = (travelled.current / PEACOCK_PATH_LENGTH) % 1
    const point = PEACOCK_PATH.getPointAt(progress)
    const tangent = PEACOCK_PATH.getTangentAt(progress)

    const group = groupRef.current
    if (group) {
      group.position.set(point.x, 0, point.z)
      /* 몸은 진행 방향을 본다. 꽁지는 자연히 뒤로 끌리므로, 카메라를 등지고
         걸을 때 부채가 펼쳐져 보이고 돌아올 때는 앞모습이 보인다. */
      group.rotation.y = Math.atan2(tangent.x, tangent.z)
    }
    /* 걸음마다 몸이 살짝 오르내리고 좌우로 기운다. */
    if (bodyRef.current) {
      bodyRef.current.position.y = Math.abs(Math.sin(t * 5.2)) * 0.035
      bodyRef.current.rotation.z = Math.sin(t * 5.2) * 0.05
    }
    if (legsRef.current) legsRef.current.rotation.x = Math.sin(t * 5.2) * 0.34
    if (fanRef.current) fanRef.current.rotation.y = Math.sin(t * 1.6) * 0.12
    if (headRef.current) {
      headRef.current.rotation.y = Math.sin(t * 1.1 + 1.2) * 0.42
      headRef.current.rotation.x = Math.sin(t * 5.2 + 0.6) * 0.09
    }
  })

  return (
    <group
      onPointerOut={() => setHovered(false)}
      onPointerOver={(event) => {
        event.stopPropagation()
        setHovered(true)
      }}
      ref={groupRef}
      scale={0.86}
    >
      <group ref={bodyRef}>
        {/* 다리 */}
        <group position={[0, 0.32, 0.02]} ref={legsRef}>
          {[-0.09, 0.09].map((offset, index) => (
            <mesh
              castShadow
              key={offset}
              position={[offset, -0.16, 0]}
              rotation={[index === 0 ? 0.26 : -0.26, 0, 0]}
            >
              <cylinderGeometry args={[0.014, 0.014, 0.32, 6]} />
              <meshStandardMaterial {...BRASS} />
            </mesh>
          ))}
        </group>

        {/* 몸통 */}
        <mesh castShadow position={[0, 0.42, 0]} scale={[1, 0.86, 1.35]}>
          <sphereGeometry args={[0.26, 20, 16]} />
          <meshStandardMaterial {...PEACOCK_BODY} />
        </mesh>

        {/* 목 — 앞으로 기울여 세운다 */}
        <mesh castShadow position={[0, 0.72, 0.16]} rotation={[0.24, 0, 0]}>
          <cylinderGeometry args={[0.06, 0.11, 0.44, 10]} />
          <meshStandardMaterial {...PEACOCK_NECK} />
        </mesh>

        <group position={[0, 0.96, 0.24]} ref={headRef}>
          <mesh castShadow>
            <sphereGeometry args={[0.095, 16, 12]} />
            <meshStandardMaterial {...PEACOCK_NECK} />
          </mesh>
          <mesh castShadow position={[0, -0.01, 0.11]} rotation={[Math.PI / 2, 0, 0]}>
            <coneGeometry args={[0.035, 0.11, 8]} />
            <meshStandardMaterial {...BRASS} />
          </mesh>
          {/* 머리깃 세 가닥 */}
          {[-0.05, 0, 0.05].map((offset) => (
            <group key={offset} position={[offset, 0.09, 0.01]} rotation={[0, 0, offset * 4]}>
              <mesh>
                <cylinderGeometry args={[0.005, 0.005, 0.13, 4]} />
                <meshStandardMaterial {...BRASS} />
              </mesh>
              <mesh position={[0, 0.08, 0]}>
                <sphereGeometry args={[0.025, 8, 6]} />
                <meshStandardMaterial
                  color="#e8d3a4"
                  emissive="#c1a36c"
                  emissiveIntensity={lamps ? 1.6 : 0.3}
                  toneMapped={false}
                />
              </mesh>
            </group>
          ))}
        </group>

        {/* 펼친 꽁지. 부채는 뒤로 조금 눕혀 세운다. */}
        <group position={[0, 0.34, -0.2]} ref={fanRef} rotation={[-0.34, 0, 0]}>
          {Array.from({ length: FEATHER_COUNT }, (_, index) => {
            const spread = (index / (FEATHER_COUNT - 1) - 0.5) * 2
            const angle = spread * 1.15
            const length = 1.02 - Math.abs(spread) * 0.24
            return (
              <group key={index} rotation={[0, 0, angle]}>
                <mesh position={[0, length / 2, 0]}>
                  <cylinderGeometry args={[0.012, 0.03, length, 5]} />
                  <meshStandardMaterial {...PEACOCK_NECK} />
                </mesh>
                {/* 깃 끝의 눈 무늬. 저녁에는 아주 약하게 빛나 블룸이 받는다. */}
                <mesh position={[0, length, 0]} scale={[1, 1.25, 0.4]}>
                  <sphereGeometry args={[0.062, 12, 10]} />
                  <meshStandardMaterial
                    color="#1d6f83"
                    emissive="#c1a36c"
                    emissiveIntensity={lamps ? 1.15 : 0.22}
                    metalness={0.4}
                    roughness={0.3}
                  />
                </mesh>
              </group>
            )
          })}
        </group>
      </group>

      {hovered && (
        <Html center distanceFactor={9} position={[0, 2.3, 0]} style={{ pointerEvents: 'none' }}>
          <div className="w-max rounded-full border border-gold-500/40 bg-navy-900/85 px-3 py-1 text-[10px] tracking-[0.16em] text-gold-300 backdrop-blur-sm">
            공작
          </div>
        </Html>
      )}
    </group>
  )
}

/* 받침대 모서리의 방위 표시. 조감도를 보는 사람이 가장 먼저 찾는 정보다. */
function Compass() {
  return (
    <group
      position={[PLINTH_CENTER_X - PLINTH_WIDTH / 2 + 1.05, -0.035, PLINTH_DEPTH / 2 - 1.05]}
      rotation={[-Math.PI / 2, 0, 0]}
    >
      <mesh>
        <ringGeometry args={[0.34, 0.36, 48]} />
        <meshStandardMaterial {...BRASS} />
      </mesh>
      <mesh position={[0, 0.14, 0]}>
        <circleGeometry args={[0.09, 3]} />
        <meshStandardMaterial {...BRASS} />
      </mesh>
      <mesh position={[0, -0.14, 0]} rotation={[0, 0, Math.PI]}>
        <circleGeometry args={[0.06, 3]} />
        <meshStandardMaterial color="#7e8894" metalness={0.4} roughness={0.5} />
      </mesh>
    </group>
  )
}

function ModelTree({ form, scale, x, z }: { form: number; scale: number; x: number; z: number }) {
  return (
    <group position={[x, 0, z]} rotation={[0, x * 0.41, 0]} scale={scale}>
      <mesh castShadow position={[0, 0.46, 0]}>
        <cylinderGeometry args={[0.045, 0.075, 0.92, 8]} />
        <meshStandardMaterial {...PLASTER_SHADE} />
      </mesh>
      {form === 0 && (
        <>
          <mesh castShadow position={[0, 1.16, 0]}>
            <icosahedronGeometry args={[0.58, 2]} />
            <meshStandardMaterial {...FOLIAGE} />
          </mesh>
          <mesh castShadow position={[0.3, 1.02, 0.14]}>
            <icosahedronGeometry args={[0.36, 2]} />
            <meshStandardMaterial {...FOLIAGE_DEEP} />
          </mesh>
          <mesh castShadow position={[-0.24, 1.0, -0.18]}>
            <icosahedronGeometry args={[0.31, 2]} />
            <meshStandardMaterial {...FOLIAGE_DEEP} />
          </mesh>
        </>
      )}
      {/* 원추형 — 해안가 침엽수. 둥근 형태만 반복되면 모형이 스티커처럼 보인다. */}
      {form === 1 && (
        <mesh castShadow position={[0, 1.42, 0]}>
          <coneGeometry args={[0.46, 1.9, 9]} />
          <meshStandardMaterial {...FOLIAGE} />
        </mesh>
      )}
      {/* 낮게 퍼진 관목형 */}
      {form === 2 && (
        <>
          <mesh castShadow position={[0, 0.94, 0]} scale={[1, 0.68, 1]}>
            <icosahedronGeometry args={[0.66, 2]} />
            <meshStandardMaterial {...FOLIAGE_DEEP} />
          </mesh>
          <mesh castShadow position={[0.18, 1.22, -0.1]}>
            <icosahedronGeometry args={[0.32, 2]} />
            <meshStandardMaterial {...FOLIAGE} />
          </mesh>
        </>
      )}
    </group>
  )
}

function ModelRock({ scale, x, z }: { scale: number; x: number; z: number }) {
  return (
    <mesh
      castShadow
      position={[x, 0.05, z]}
      rotation={[0.2, x * 0.4, -0.08]}
      scale={[scale * 1.5, scale, scale]}
    >
      <dodecahedronGeometry args={[1, 1]} />
      <meshStandardMaterial {...PLASTER_SHADE} />
    </mesh>
  )
}

function Bollard({ x, z }: { x: number; z: number }) {
  const { lamps } = useStage()
  return (
    <group position={[x, 0, z]}>
      <mesh castShadow position={[0, 0.17, 0]}>
        <cylinderGeometry args={[0.032, 0.04, 0.34, 10]} />
        <meshStandardMaterial {...BRASS} />
      </mesh>
      <mesh position={[0, 0.35, 0]}>
        <sphereGeometry args={[0.038, 12, 8]} />
        <meshStandardMaterial
          color="#f3e6c8"
          emissive="#e8b96f"
          emissiveIntensity={lamps ? 3.4 : 0.9}
          toneMapped={false}
        />
      </mesh>
      {/* 저녁에만 실제 빛을 낸다. 등이 바닥을 데워야 '켜져 있다'가 읽힌다. */}
      {lamps && (
        <pointLight color="#e8bf7c" distance={2.6} intensity={1.4} position={[0, 0.38, 0]} />
      )}
    </group>
  )
}
