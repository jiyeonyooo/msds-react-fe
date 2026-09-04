import {
  Clone,
  ContactShadows,
  Html,
  OrbitControls,
  RoundedBox,
  useAnimations,
  useGLTF,
  useTexture,
} from '@react-three/drei'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import {
  ACESFilmicToneMapping,
  CatmullRomCurve3,
  Color,
  Fog,
  MathUtils,
  RepeatWrapping,
  SRGBColorSpace,
  Vector3,
  type AmbientLight,
  type DirectionalLight,
  type Group,
  type HemisphereLight,
  type Texture,
} from 'three'
import {
  createContext,
  Suspense,
  useEffect,
  useContext,
  useMemo,
  useRef,
  useState,
  type ComponentRef,
  type Dispatch,
  type SetStateAction,
} from 'react'
import facilityLounge from '../../assets/facility7.png'
import facilityStudio from '../../assets/facility2.png'
import concreteTexture from '../../assets/3d/concrete.svg'
import grassTexture from '../../assets/3d/grass.svg'
import metalTexture from '../../assets/3d/metal-panels.svg'
import stoneTexture from '../../assets/3d/stone-pavers.svg'
import woodTexture from '../../assets/3d/wood.svg'
import meditationCourtyard from '../../assets/home/meditation-courtyard.png'
import oceanSuite from '../../assets/home/ocean-suite.png'
import coast from '../../assets/msds-coast.png'

type PlaceId = 'stay' | 'wellness' | 'meditation' | 'studio' | 'ocean' | 'pond' | 'wildlife'
type CampusTimeMode = 'day' | 'sunset' | 'night'

type CampusTimePreset = {
  background: string
  fog: string
  ambient: number
  hemisphereSky: string
  hemisphereGround: string
  hemisphereIntensity: number
  sun: string
  sunIntensity: number
  sunPosition: [number, number, number]
  fill: string
  fillIntensity: number
}

type CampusPlace = {
  id: PlaceId
  index: string
  label: string
  name: string
  description: string
  detail: string
  image: string
  position: [number, number, number]
  labelPosition: [number, number, number]
  focus: [number, number, number]
  radius: number
}

type CampusTextures = {
  concrete: Texture
  grass: Texture
  metal: Texture
  stone: Texture
  wood: Texture
}

const CampusTextureContext = createContext<CampusTextures | null>(null)
const CampusTimeContext = createContext<CampusTimeMode>('sunset')

const timeOptions: Array<{ id: CampusTimeMode; label: string; symbol: string }> = [
  { id: 'day', label: '낮', symbol: '☀' },
  { id: 'sunset', label: '노을', symbol: '◐' },
  { id: 'night', label: '밤', symbol: '☾' },
]

const timePresets: Record<CampusTimeMode, CampusTimePreset> = {
  day: {
    background: '#8ba9b8',
    fog: '#7899aa',
    ambient: 0.82,
    hemisphereSky: '#edf5f5',
    hemisphereGround: '#807361',
    hemisphereIntensity: 0.96,
    sun: '#fff0cd',
    sunIntensity: 3.15,
    sunPosition: [-8, 15, 8],
    fill: '#b8d7e2',
    fillIntensity: 0.95,
  },
  sunset: {
    background: '#314b60',
    fog: '#2a455b',
    ambient: 0.56,
    hemisphereSky: '#e5c5a2',
    hemisphereGround: '#273440',
    hemisphereIntensity: 0.74,
    sun: '#ffc17d',
    sunIntensity: 2.75,
    sunPosition: [-11, 8, 10],
    fill: '#789ab5',
    fillIntensity: 0.72,
  },
  night: {
    background: '#07182a',
    fog: '#0b1d30',
    ambient: 0.28,
    hemisphereSky: '#67829e',
    hemisphereGround: '#101a25',
    hemisphereIntensity: 0.48,
    sun: '#9ebddb',
    sunIntensity: 1.35,
    sunPosition: [9, 12, -8],
    fill: '#4f7396',
    fillIntensity: 0.58,
  },
}

const places: CampusPlace[] = [
  {
    id: 'stay',
    index: '01',
    label: 'STAY',
    name: '스테이 빌리지',
    description: '오션 스위트와 숲의 객실',
    detail: '빛과 바다를 천천히 들이는 객실이 작은 마을처럼 이어집니다.',
    image: oceanSuite,
    position: [4.1, 0.06, -2.35],
    labelPosition: [0.2, 3.05, 0],
    focus: [3.1, 0.55, -1.7],
    radius: 2.25,
  },
  {
    id: 'wellness',
    index: '02',
    label: 'WELLNESS',
    name: '웰니스 하우스',
    description: '리셉션 · 티 라운지 · 스파',
    detail: '차와 온기, 조용한 환대가 머무름의 속도를 낮추는 중심 공간입니다.',
    image: facilityLounge,
    position: [-0.2, 0.06, -0.2],
    labelPosition: [0, 3.1, 0],
    focus: [-0.15, 0.48, -0.15],
    radius: 2.3,
  },
  {
    id: 'meditation',
    index: '03',
    label: 'MEDITATION',
    name: '명상 정원',
    description: '호흡과 사색을 위한 고요한 마당',
    detail: '낮은 처마와 열린 중정 사이로 자연의 소리만 가볍게 머뭅니다.',
    image: meditationCourtyard,
    position: [-4.45, 0.06, 2.35],
    labelPosition: [0, 2.55, 0],
    focus: [-3.35, 0.35, 1.75],
    radius: 1.75,
  },
  {
    id: 'studio',
    index: '04',
    label: 'STUDIO',
    name: '프로그램 스튜디오',
    description: '움직임과 워크숍이 열리는 공간',
    detail: '큰 창과 긴 테이블을 중심으로 몸과 마음을 깨우는 프로그램이 열립니다.',
    image: facilityStudio,
    position: [-0.35, 0.06, 3.35],
    labelPosition: [0, 2.55, 0],
    focus: [-0.3, 0.4, 2.55],
    radius: 1.95,
  },
  {
    id: 'ocean',
    index: '05',
    label: 'OCEAN DECK',
    name: '오션 데크',
    description: '물과 바다를 마주하는 산책과 휴식',
    detail: '수평선과 가장 가까운 자리에서 천천히 걷고 오래 바라보는 공간입니다.',
    image: coast,
    position: [4.75, 0.06, 3.45],
    labelPosition: [0, 2.35, 0],
    focus: [3.55, 0.32, 2.6],
    radius: 1.8,
  },
  {
    id: 'pond',
    index: '06',
    label: 'POND GARDEN',
    name: '생태 연못 정원',
    description: '연꽃과 작은 생명이 머무는 물의 정원',
    detail: '연꽃 사이의 물고기와 작은 수중 생물, 물가의 개구리를 확대해 살펴보세요.',
    image: meditationCourtyard,
    position: [2.0, 0.06, 4.65],
    labelPosition: [0, 1.72, 0],
    focus: [2.0, 0.22, 4.65],
    radius: 1.85,
  },
  {
    id: 'wildlife',
    index: '07',
    label: 'WILDLIFE MEADOW',
    name: '야생동물 초지',
    description: '동물마다 다른 속도로 움직이는 넓은 생태 구역',
    detail: '느긋한 고양이부터 달리는 사슴과 늑대, 호랑이의 추격 동선까지 확대해 관찰해 보세요.',
    image: coast,
    position: [7.45, 0.06, 1.35],
    labelPosition: [0, 2.25, 0],
    focus: [7.2, 0.34, 1.3],
    radius: 2.65,
  },
]

const placeById = Object.fromEntries(places.map((place) => [place.id, place])) as Record<
  PlaceId,
  CampusPlace
>

const pinePositions: Array<[number, number, number, number, number]> = [
  [-6.7, 0, -4.25, 0.86, -0.3],
  [-6.72, 0, -2.75, 0.72, 0.18],
  [-3.35, 0, -4.85, 0.82, -0.12],
  [-2.8, 0, -4.72, 0.7, 0.2],
  [1.35, 0, -4.7, 0.8, -0.22],
  [2.85, 0, -4.55, 0.68, 0.14],
  [6.45, 0, -4.05, 0.92, -0.08],
  [6.82, 0, -1.65, 0.72, 0.2],
  [6.88, 0, 0.4, 0.82, -0.18],
  [6.75, 0, 2.2, 0.7, 0.12],
  [6.35, 0, 4.45, 0.88, -0.14],
  [2.45, 0, 5.25, 0.7, 0.16],
  [-2.5, 0, 5.15, 0.76, -0.15],
  [-4.4, 0, 4.7, 0.9, 0.08],
  [-6.55, 0, 3.75, 0.76, -0.18],
  [-6.85, 0, 1.2, 0.82, 0.14],
  [-6.85, 0, -1.35, 0.7, -0.12],
  [-9.15, 0, -5.7, 0.92, -0.2],
  [-9.35, 0, -2.4, 0.78, 0.14],
  [-9.4, 0, 1.15, 0.9, -0.16],
  [-8.8, 0, 5.25, 0.82, 0.12],
  [-5.5, 0, 6.85, 0.88, -0.1],
  [-1.55, 0, 7.15, 0.76, 0.18],
  [3.0, 0, 7.05, 0.9, -0.18],
  [7.3, 0, 6.35, 0.84, 0.14],
  [9.35, 0, 4.05, 0.92, -0.08],
  [9.6, 0, -0.1, 0.8, 0.16],
  [9.15, 0, -4.7, 0.88, -0.12],
  [5.25, 0, -6.65, 0.78, 0.12],
  [0.2, 0, -7.1, 0.84, -0.16],
  [-5.0, 0, -6.8, 0.8, 0.16],
]

export default function CampusModel() {
  const [canvasKey, setCanvasKey] = useState(0)
  const [contextLost, setContextLost] = useState(false)
  const [isTouring, setIsTouring] = useState(false)
  const [selectedId, setSelectedId] = useState<PlaceId | null>(null)
  const [viewResetKey, setViewResetKey] = useState(0)
  const [zoomLevel, setZoomLevel] = useState(0)
  const [timeMode, setTimeMode] = useState<CampusTimeMode>('sunset')
  const selectedPlace = selectedId ? placeById[selectedId] : null

  useEffect(() => {
    if (!isTouring) return

    const advanceTour = () => {
      setSelectedId((current) => {
        const currentIndex = places.findIndex((place) => place.id === current)
        return places[(currentIndex + 1 + places.length) % places.length].id
      })
    }

    advanceTour()
    const interval = window.setInterval(advanceTour, 3600)
    return () => window.clearInterval(interval)
  }, [isTouring])

  const retryRenderer = () => {
    setContextLost(false)
    setCanvasKey((current) => current + 1)
  }

  const resetView = () => {
    setIsTouring(false)
    setSelectedId(null)
    setZoomLevel(0)
    setViewResetKey((current) => current + 1)
  }

  const selectPlace = (id: PlaceId) => {
    setIsTouring(false)
    setSelectedId(id)
  }

  const togglePlace = (id: PlaceId) => {
    setIsTouring(false)
    setSelectedId((current) => (current === id ? null : id))
  }

  const changeZoom = (direction: -1 | 1) => {
    setIsTouring(false)
    setZoomLevel((current) => Math.max(-2, Math.min(7, current + direction)))
  }

  return (
    <section className="overflow-hidden bg-[#eeeae1] px-6 py-20 md:px-12 md:py-[112px]">
      <div className="mx-auto max-w-[1088px]">
        <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
          <div>
            <p className="text-[11px] font-medium tracking-[0.2em] text-gold-500">EXPLORE MSDS</p>
            <h2 className="mt-3 font-display text-[2.25rem] leading-tight text-navy-900 md:text-[2.75rem]">
              머무름의 모든 장면을 한눈에
            </h2>
          </div>
          <p className="max-w-[380px] text-sm leading-7 text-muted">
            MSDS의 공간을 담은 3D 조감도입니다. 드래그해 돌리고 휠이나 핀치로 확대·축소한 뒤,
            공간을 선택해 머무름의 장면을 만나보세요.
          </p>
        </div>

        <div className="mt-10 overflow-hidden border border-[#c7b78f]/40 bg-navy-900 p-2 shadow-[0_34px_90px_-42px_rgba(14,34,57,0.8)] md:p-3">
          <div className="relative h-[470px] overflow-hidden bg-[radial-gradient(circle_at_62%_18%,#28445c_0%,#142d48_34%,#0e2239_76%)] md:h-[620px]">
            <div className="pointer-events-none absolute left-4 top-4 z-10 border border-white/15 bg-navy-900/45 px-3 py-2 text-[9px] tracking-[0.16em] text-white/65 backdrop-blur-md md:left-6 md:top-6 md:text-[10px]">
              <span className="md:hidden">회전 · 확대 · 두 손가락 이동</span>
              <span className="hidden md:inline">
                드래그 회전 · 우클릭 이동 · 휠 확대 · 공간 선택
              </span>
            </div>
            <div
              aria-label="3D 캠퍼스 시간대"
              className="absolute left-4 top-[58px] z-10 flex overflow-hidden border border-white/15 bg-navy-900/45 p-1 backdrop-blur-md md:left-6 md:top-[72px]"
              role="group"
            >
              {timeOptions.map((option) => {
                const active = option.id === timeMode
                return (
                  <button
                    aria-pressed={active}
                    className={
                      active
                        ? 'flex items-center gap-1.5 bg-white/12 px-2.5 py-1.5 text-[9px] tracking-[0.1em] text-gold-300 shadow-inner md:px-3 md:text-[10px]'
                        : 'flex items-center gap-1.5 px-2.5 py-1.5 text-[9px] tracking-[0.1em] text-white/55 transition-colors duration-500 hover:bg-white/5 hover:text-white md:px-3 md:text-[10px]'
                    }
                    key={option.id}
                    onClick={() => setTimeMode(option.id)}
                    type="button"
                  >
                    <span aria-hidden="true" className="text-[11px] text-gold-300/90">
                      {option.symbol}
                    </span>
                    {option.label}
                  </button>
                )
              })}
            </div>
            <div className="absolute right-4 top-4 z-10 flex items-center gap-1.5 md:right-6 md:top-6">
              <button
                aria-label="3D 화면 축소"
                className="flex size-8 items-center justify-center border border-white/15 bg-navy-900/55 text-base text-white/75 backdrop-blur-md transition-colors hover:border-gold-300/45 hover:text-gold-300"
                onClick={() => changeZoom(-1)}
                type="button"
              >
                −
              </button>
              <button
                aria-label="3D 화면 확대"
                className="flex size-8 items-center justify-center border border-white/15 bg-navy-900/55 text-base text-white/75 backdrop-blur-md transition-colors hover:border-gold-300/45 hover:text-gold-300"
                onClick={() => changeZoom(1)}
                type="button"
              >
                +
              </button>
              <button
                aria-label={isTouring ? '자동 투어 멈춤' : '자동 투어 시작'}
                aria-pressed={isTouring}
                className={
                  isTouring
                    ? 'border border-gold-300 bg-gold-300 px-3 py-2 text-[9px] tracking-[0.12em] text-navy-900 shadow-lg md:text-[10px]'
                    : 'border border-gold-300/35 bg-navy-900/55 px-3 py-2 text-[9px] tracking-[0.12em] text-gold-300 backdrop-blur-md transition-colors hover:bg-navy-800 md:text-[10px]'
                }
                onClick={() => setIsTouring((current) => !current)}
                type="button"
              >
                <span className="sm:hidden">{isTouring ? '■' : '▶'}</span>
                <span className="hidden sm:inline">{isTouring ? '투어 멈춤' : '자동 투어'}</span>
              </button>
              <button
                aria-label="3D 시점 초기화"
                className="border border-gold-300/35 bg-navy-900/55 px-3 py-2 text-[9px] tracking-[0.12em] text-gold-300 backdrop-blur-md transition-colors hover:bg-navy-800 md:text-[10px]"
                onClick={resetView}
                type="button"
              >
                <span className="sm:hidden">↺</span>
                <span className="hidden sm:inline">시점 초기화</span>
              </button>
            </div>

            <Canvas
              camera={{ far: 90, near: 0.1, position: [12, 8.2, 14], zoom: 52 }}
              dpr={[1, 1.25]}
              frameloop="demand"
              gl={{
                antialias: true,
                outputColorSpace: SRGBColorSpace,
                powerPreference: 'default',
                stencil: false,
                toneMapping: ACESFilmicToneMapping,
                toneMappingExposure: 1.06,
              }}
              key={canvasKey}
              onPointerMissed={() => {
                setIsTouring(false)
                setSelectedId(null)
              }}
              orthographic
              shadows
            >
              <ContextLifecycle onStatusChange={setContextLost} />
              <Suspense fallback={null}>
                <Scene selectedId={selectedId} onSelect={selectPlace} timeMode={timeMode} />
              </Suspense>
              <CalmCamera
                isTouring={isTouring}
                onInteractionStart={() => setIsTouring(false)}
                resetKey={viewResetKey}
                selectedPlace={selectedPlace}
                zoomLevel={zoomLevel}
              />
            </Canvas>

            {selectedPlace && (
              <aside
                aria-live="polite"
                className="absolute inset-x-4 bottom-4 z-10 flex max-h-[142px] overflow-hidden border border-white/15 bg-navy-900/88 text-white shadow-2xl backdrop-blur-xl md:inset-x-auto md:bottom-6 md:left-6 md:max-h-none md:w-[430px]"
              >
                <img
                  alt=""
                  className="w-[108px] shrink-0 object-cover md:w-[142px]"
                  src={selectedPlace.image}
                />
                <div className="min-w-0 px-4 py-3 md:px-5 md:py-4">
                  <p className="text-[9px] tracking-[0.18em] text-gold-300">
                    {selectedPlace.index} · {selectedPlace.label}
                  </p>
                  <h3 className="mt-1 font-display text-xl text-white md:text-2xl">
                    {selectedPlace.name}
                  </h3>
                  <p className="mt-1 text-[11px] leading-5 text-white/65 md:mt-2 md:text-xs">
                    {selectedPlace.detail}
                  </p>
                </div>
              </aside>
            )}

            {contextLost && (
              <div className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-4 bg-navy-900/92 px-6 text-center text-white backdrop-blur-sm">
                <p className="text-sm leading-6">3D 조감도를 다시 준비하고 있습니다.</p>
                <button
                  className="border border-gold-300/40 bg-white/5 px-5 py-2 text-xs tracking-[0.08em] transition-colors hover:bg-white/10"
                  onClick={retryRenderer}
                  type="button"
                >
                  3D 다시 불러오기
                </button>
              </div>
            )}
          </div>

          <nav
            aria-label="MSDS 3D 공간 선택"
            className="grid grid-cols-2 border-t border-white/10 md:grid-cols-[repeat(7,minmax(0,1fr))]"
          >
            {places.map((place) => {
              const isSelected = selectedId === place.id
              return (
                <button
                  aria-pressed={isSelected}
                  className={
                    isSelected
                      ? 'border-b border-gold-300 bg-white/10 px-4 py-4 text-left text-gold-300 md:border-b-0 md:border-t'
                      : 'border-b border-white/10 px-4 py-4 text-left text-white/55 transition-colors hover:bg-white/5 hover:text-white md:border-b-0'
                  }
                  key={place.id}
                  onClick={() => togglePlace(place.id)}
                  type="button"
                >
                  <span className="block text-[9px] tracking-[0.16em] text-gold-300/75">
                    {place.index}
                  </span>
                  <span className="mt-1 block text-[10px] tracking-[0.12em]">{place.label}</span>
                </button>
              )
            })}
          </nav>
        </div>

        <p className="mt-4 text-center text-xs leading-6 text-muted">
          공간의 배치는 전체 경험을 이해하기 위한 조감도이며, 실제 이용 동선과 운영 상황은 달라질 수
          있습니다.
        </p>
      </div>
    </section>
  )
}

function ContextLifecycle({
  onStatusChange,
}: {
  onStatusChange: Dispatch<SetStateAction<boolean>>
}) {
  const { gl, invalidate } = useThree()

  useEffect(() => {
    const canvas = gl.domElement
    let lostTimer = 0

    const handleLost = (event: Event) => {
      event.preventDefault()
      window.clearTimeout(lostTimer)
      lostTimer = window.setTimeout(() => onStatusChange(true), 350)
    }
    const handleRestored = () => {
      window.clearTimeout(lostTimer)
      onStatusChange(false)
      invalidate()
    }

    canvas.addEventListener('webglcontextlost', handleLost)
    canvas.addEventListener('webglcontextrestored', handleRestored)
    return () => {
      window.clearTimeout(lostTimer)
      canvas.removeEventListener('webglcontextlost', handleLost)
      canvas.removeEventListener('webglcontextrestored', handleRestored)
    }
  }, [gl, invalidate, onStatusChange])

  return null
}

function CalmCamera({
  isTouring,
  onInteractionStart,
  resetKey,
  selectedPlace,
  zoomLevel,
}: {
  isTouring: boolean
  onInteractionStart: () => void
  resetKey: number
  selectedPlace: CampusPlace | null
  zoomLevel: number
}) {
  const controlsRef = useRef<ComponentRef<typeof OrbitControls>>(null)
  const { camera, invalidate, size } = useThree()

  useEffect(() => {
    const controls = controlsRef.current
    if (!controls || !('zoom' in camera)) return

    const compact = size.width < 640
    const baseZoom = compact ? 25 : size.width < 900 ? 34 : 43

    if (resetKey > 0 && !selectedPlace) {
      controls.reset()
      invalidate()
    }

    const target = selectedPlace ? new Vector3(...selectedPlace.focus) : new Vector3(0, 0.34, 0)
    const focusZoom = selectedPlace
      ? baseZoom *
        (selectedPlace.id === 'pond' ? (compact ? 1.14 : 1.28) : compact ? 1.06 : 1.16)
      : baseZoom
    const targetZoom = focusZoom * Math.pow(1.18, zoomLevel)
    const initialTarget = controls.target.clone()
    const initialZoom = camera.zoom
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const duration = reduceMotion ? 0 : 980
    const startedAt = performance.now()
    let animationFrame = 0

    const animate = (time: number) => {
      const progress = duration === 0 ? 1 : Math.min((time - startedAt) / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 3)
      controls.target.lerpVectors(initialTarget, target, eased)
      camera.zoom = MathUtils.lerp(initialZoom, targetZoom, eased)
      camera.updateProjectionMatrix()
      controls.update()
      invalidate()
      if (progress < 1) animationFrame = requestAnimationFrame(animate)
    }

    animationFrame = requestAnimationFrame(animate)
    return () => cancelAnimationFrame(animationFrame)
  }, [camera, invalidate, resetKey, selectedPlace, size.width, zoomLevel])

  return (
    <OrbitControls
      ref={controlsRef}
      autoRotate={isTouring}
      autoRotateSpeed={0.45}
      dampingFactor={0.07}
      enableDamping
      enablePan
      enableZoom
      maxPolarAngle={Math.PI / 2.3}
      maxZoom={190}
      minPolarAngle={Math.PI / 7}
      minZoom={22}
      onStart={onInteractionStart}
      panSpeed={0.55}
      rotateSpeed={0.34}
      screenSpacePanning
      zoomSpeed={0.65}
    />
  )
}

function Scene({
  selectedId,
  onSelect,
  timeMode,
}: {
  selectedId: PlaceId | null
  onSelect: (id: PlaceId) => void
  timeMode: CampusTimeMode
}) {
  const [concrete, grass, metal, stone, wood] = useTexture([
    concreteTexture,
    grassTexture,
    metalTexture,
    stoneTexture,
    woodTexture,
  ])
  const textures = useMemo(
    () => ({ concrete, grass, metal, stone, wood }),
    [concrete, grass, metal, stone, wood],
  )

  useEffect(() => {
    const repeats: Array<[Texture, number, number]> = [
      [concrete, 3.5, 3.5],
      [grass, 8, 8],
      [metal, 4, 4],
      [stone, 5, 5],
      [wood, 4, 4],
    ]

    repeats.forEach(([texture, x, y]) => {
      texture.wrapS = RepeatWrapping
      texture.wrapT = RepeatWrapping
      texture.repeat.set(x, y)
      texture.colorSpace = SRGBColorSpace
      texture.anisotropy = 4
      texture.needsUpdate = true
    })
  }, [concrete, grass, metal, stone, wood])

  return (
    <CampusTimeContext.Provider value={timeMode}>
      <CampusTextureContext.Provider value={textures}>
        <Atmosphere timeMode={timeMode} />

        <OceanStage />
        <ContourGround />
        <SiteCourtyards />
        <GoldPath />
        <WaterCourt />
        <FormalGarden />
        <WildlifeMeadow />
        <LandscapeDetails />
        <TopographicGardens />
        <WildlifeClock />
        <WildlifeScene />

        {places.map((place) => (
          <CampusPlaceModel
            key={place.id}
            onSelect={onSelect}
            place={place}
            selectedId={selectedId}
          />
        ))}

        {pinePositions.map(([x, y, z, scale, rotation], index) => (
          <CoastalPine
            key={String(x) + '-' + String(z)}
            muted={Boolean(selectedId)}
            position={[x, y, z]}
            rotation={rotation}
            scale={scale}
            tone={index % 3}
          />
        ))}

        <ContactShadows
          color="#081726"
          far={8}
          frames={1}
          opacity={timeMode === 'night' ? 0.34 : 0.52}
          position={[0, 0.025, 0]}
          resolution={512}
          scale={32}
        />
      </CampusTextureContext.Provider>
    </CampusTimeContext.Provider>
  )
}

function Atmosphere({ timeMode }: { timeMode: CampusTimeMode }) {
  const ambientRef = useRef<AmbientLight>(null)
  const hemisphereRef = useRef<HemisphereLight>(null)
  const sunRef = useRef<DirectionalLight>(null)
  const fillRef = useRef<DirectionalLight>(null)
  const backgroundRef = useRef<Color>(null)
  const fogRef = useRef<Fog>(null)
  const transitionUntil = useRef(0)
  const { invalidate } = useThree()
  const preset = timePresets[timeMode]
  const targets = useMemo(
    () => ({
      background: new Color(preset.background),
      fill: new Color(preset.fill),
      fog: new Color(preset.fog),
      ground: new Color(preset.hemisphereGround),
      sky: new Color(preset.hemisphereSky),
      sun: new Color(preset.sun),
      sunPosition: new Vector3(...preset.sunPosition),
    }),
    [preset],
  )

  useEffect(() => {
    transitionUntil.current = performance.now() + 1600
    invalidate()
  }, [invalidate, timeMode])

  useFrame((_, delta) => {
    const blend = 1 - Math.exp(-delta * 3.1)

    if (backgroundRef.current) backgroundRef.current.lerp(targets.background, blend)
    if (fogRef.current) fogRef.current.color.lerp(targets.fog, blend)
    if (ambientRef.current) {
      ambientRef.current.intensity = MathUtils.lerp(
        ambientRef.current.intensity,
        preset.ambient,
        blend,
      )
    }
    if (hemisphereRef.current) {
      hemisphereRef.current.color.lerp(targets.sky, blend)
      hemisphereRef.current.groundColor.lerp(targets.ground, blend)
      hemisphereRef.current.intensity = MathUtils.lerp(
        hemisphereRef.current.intensity,
        preset.hemisphereIntensity,
        blend,
      )
    }
    if (sunRef.current) {
      sunRef.current.color.lerp(targets.sun, blend)
      sunRef.current.position.lerp(targets.sunPosition, blend)
      sunRef.current.intensity = MathUtils.lerp(
        sunRef.current.intensity,
        preset.sunIntensity,
        blend,
      )
    }
    if (fillRef.current) {
      fillRef.current.color.lerp(targets.fill, blend)
      fillRef.current.intensity = MathUtils.lerp(
        fillRef.current.intensity,
        preset.fillIntensity,
        blend,
      )
    }

    if (performance.now() < transitionUntil.current) invalidate()
  })

  const nightGlow = timeMode === 'night' ? 2.1 : timeMode === 'sunset' ? 0.7 : 0

  return (
    <>
      <color ref={backgroundRef} attach="background" args={['#314b60']} />
      <fog ref={fogRef} attach="fog" args={['#2a455b', 24, 42]} />
      <ambientLight ref={ambientRef} intensity={timePresets.sunset.ambient} />
      <hemisphereLight
        ref={hemisphereRef}
        args={[
          timePresets.sunset.hemisphereSky,
          timePresets.sunset.hemisphereGround,
          timePresets.sunset.hemisphereIntensity,
        ]}
      />
      <directionalLight
        ref={sunRef}
        castShadow
        color={timePresets.sunset.sun}
        intensity={timePresets.sunset.sunIntensity}
        position={timePresets.sunset.sunPosition}
        shadow-bias={-0.0004}
        shadow-camera-bottom={-11}
        shadow-camera-far={40}
        shadow-camera-left={-12}
        shadow-camera-right={12}
        shadow-camera-top={11}
        shadow-mapSize={[1024, 1024]}
      />
      <directionalLight
        ref={fillRef}
        color={timePresets.sunset.fill}
        intensity={timePresets.sunset.fillIntensity}
        position={[10, 7, -9]}
      />
      <pointLight color="#eebf78" intensity={nightGlow} position={[-0.2, 2.4, -0.2]} />
      <pointLight color="#f3c887" intensity={nightGlow * 0.75} position={[4, 2.2, -2]} />
      <pointLight color="#d7b170" intensity={nightGlow * 0.55} position={[-3.9, 1.8, 2.4]} />
    </>
  )
}

function OceanStage() {
  const timeMode = useContext(CampusTimeContext)
  const oceanColor = timeMode === 'night' ? '#071b2e' : timeMode === 'sunset' ? '#173a50' : '#2e6575'

  return (
    <group>
      <mesh position={[0, -2.22, 0]} receiveShadow rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[54, 44, 1, 1]} />
        <meshPhysicalMaterial
          clearcoat={0.8}
          clearcoatRoughness={0.3}
          color={oceanColor}
          metalness={0.12}
          roughness={0.3}
        />
      </mesh>
      {[9.5, 12.5, 15.5].map((radius, index) => (
        <mesh
          key={radius}
          position={[3.5, -2.195 + index * 0.002, 0]}
          rotation={[-Math.PI / 2, 0, 0]}
        >
          <ringGeometry args={[radius, radius + 0.015, 128]} />
          <meshBasicMaterial color="#8fa9b5" opacity={0.2 - index * 0.04} transparent />
        </mesh>
      ))}
    </group>
  )
}

function ContourGround() {
  return (
    <group>
      <mesh castShadow position={[-0.15, -1.08, 0]} receiveShadow scale={[1.04, 1, 0.82]}>
        <cylinderGeometry args={[10.25, 11.15, 2.12, 64, 3]} />
        <CliffMaterial />
      </mesh>
      <mesh position={[-0.15, -0.025, 0]} receiveShadow scale={[1.035, 1, 0.825]}>
        <cylinderGeometry args={[10.22, 10.22, 0.08, 64]} />
        <GrassMaterial tone={0} />
      </mesh>
    </group>
  )
}

function SiteCourtyards() {
  return (
    <group>
      <RoundedBox
        args={[4.9, 0.055, 3.8]}
        position={[4.05, 0.065, -2.32]}
        radius={0.24}
        receiveShadow
        rotation={[0, -0.06, 0]}
      >
        <StonePaverMaterial />
      </RoundedBox>
      <RoundedBox
        args={[5.05, 0.055, 3.7]}
        position={[-0.2, 0.064, -0.18]}
        radius={0.24}
        receiveShadow
        rotation={[0, 0.04, 0]}
      >
        <StonePaverMaterial />
      </RoundedBox>
      <RoundedBox
        args={[4.55, 0.055, 2.85]}
        position={[-0.35, 0.063, 3.35]}
        radius={0.22}
        receiveShadow
        rotation={[0, -0.08, 0]}
      >
        <StonePaverMaterial />
      </RoundedBox>
      <mesh position={[-4.45, 0.066, 2.35]} receiveShadow>
        <cylinderGeometry args={[2, 2.06, 0.055, 64]} />
        <StonePaverMaterial />
      </mesh>
    </group>
  )
}

function GoldPath() {
  const curve = useMemo(
    () =>
      new CatmullRomCurve3([
        new Vector3(5.95, 0.08, -3.35),
        new Vector3(4.35, 0.085, -1.7),
        new Vector3(2.1, 0.09, -0.65),
        new Vector3(-0.3, 0.095, -0.15),
        new Vector3(-2.0, 0.095, 1.1),
        new Vector3(-4.1, 0.09, 2.55),
        new Vector3(-2.25, 0.095, 3.55),
        new Vector3(0.05, 0.095, 3.35),
        new Vector3(2.25, 0.09, 3.15),
        new Vector3(4.85, 0.085, 3.8),
      ]),
    [],
  )
  const pavers = useMemo(
    () =>
      Array.from({ length: 38 }, (_, index) => {
        const progress = index / 37
        const point = curve.getPoint(progress)
        const tangent = curve.getTangent(progress)
        return {
          position: [point.x, point.y + 0.015, point.z] as [number, number, number],
          rotation: Math.atan2(tangent.x, tangent.z),
        }
      }),
    [curve],
  )

  return (
    <group>
      {pavers.map(({ position, rotation }, index) => (
        <mesh
          key={index}
          position={position}
          receiveShadow
          rotation={[0, rotation, 0]}
        >
          <boxGeometry args={[0.54, 0.045, 0.28]} />
          <StonePaverMaterial />
        </mesh>
      ))}
      <mesh>
        <tubeGeometry args={[curve, 128, 0.026, 8, false]} />
        <meshStandardMaterial
          color="#c7aa72"
          emissive="#8c6a36"
          emissiveIntensity={0.5}
          metalness={0.42}
          roughness={0.38}
        />
      </mesh>
      {[3, 9, 15, 21, 27, 33].map((index) => (
        <PathLight key={index} position={pavers[index].position} />
      ))}
    </group>
  )
}

function PathLight({ position }: { position: [number, number, number] }) {
  const timeMode = useContext(CampusTimeContext)
  const glow = timeMode === 'night' ? 3.4 : timeMode === 'sunset' ? 1.15 : 0.12

  return (
    <group position={[position[0] + 0.34, position[1], position[2] + 0.24]}>
      <mesh castShadow position={[0, 0.18, 0]}>
        <cylinderGeometry args={[0.035, 0.055, 0.34, 12]} />
        <meshStandardMaterial color="#263746" metalness={0.48} roughness={0.42} />
      </mesh>
      <mesh position={[0, 0.37, 0]}>
        <sphereGeometry args={[0.07, 16, 12]} />
        <meshStandardMaterial
          color="#f6e2b2"
          emissive="#ffd889"
          emissiveIntensity={glow}
          roughness={0.22}
        />
      </mesh>
    </group>
  )
}

function WaterCourt() {
  const timeMode = useContext(CampusTimeContext)
  const waterColor = timeMode === 'night' ? '#15354d' : timeMode === 'sunset' ? '#416b78' : '#74a7b0'

  return (
    <group position={[2.35, 0.09, 0.55]} rotation={[0, -0.08, 0]}>
      <RoundedBox args={[2.45, 0.13, 0.92]} castShadow radius={0.08} receiveShadow>
        <meshStandardMaterial color="#d9cdb9" roughness={0.82} />
      </RoundedBox>
      <mesh position={[0, 0.075, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[2.17, 0.67]} />
        <meshPhysicalMaterial
          clearcoat={1}
          clearcoatRoughness={0.08}
          color={waterColor}
          metalness={0.18}
          opacity={0.92}
          roughness={0.12}
          transparent
        />
      </mesh>
      {[-0.21, 0, 0.21].map((z) => (
        <mesh key={z} position={[0, 0.081, z]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[1.7, 0.007]} />
          <meshBasicMaterial color="#d7edf1" opacity={0.42} transparent />
        </mesh>
      ))}
    </group>
  )
}

function PondGarden({ muted }: { muted: boolean }) {
  const timeMode = useContext(CampusTimeContext)
  const waterColor = muted
    ? '#344a52'
    : timeMode === 'night'
      ? '#123951'
      : timeMode === 'sunset'
        ? '#3f7884'
        : '#4f929b'
  const lotusPositions: Array<[number, number, number, number]> = [
    [-0.92, 0.775, -0.28, 0.82],
    [-0.54, 0.775, 0.34, 0.68],
    [0.18, 0.775, -0.43, 0.76],
    [0.72, 0.775, 0.24, 0.86],
    [1.02, 0.775, -0.18, 0.62],
    [-0.05, 0.775, 0.42, 0.56],
    [0.48, 0.775, -0.04, 0.48],
  ]

  return (
    <group>
      <mesh castShadow position={[0, 0.38, 0]} receiveShadow scale={[1, 1, 0.64]}>
        <cylinderGeometry args={[1.68, 1.84, 0.7, 64]} />
        <meshStandardMaterial color="#625c50" roughness={0.98} />
      </mesh>
      <mesh
        position={[0, 0.742, 0]}
        receiveShadow
        rotation={[-Math.PI / 2, 0, 0]}
        scale={[1, 0.64, 1]}
      >
        <circleGeometry args={[1.53, 64]} />
        <meshPhysicalMaterial
          clearcoat={1}
          clearcoatRoughness={0.04}
          color={waterColor}
          metalness={0.12}
          reflectivity={0.82}
          roughness={0.1}
        />
      </mesh>
      <mesh position={[0, 0.748, 0]} rotation={[-Math.PI / 2, 0, 0]} scale={[1, 0.64, 1]}>
        <ringGeometry args={[0.92, 1.38, 64]} />
        <meshBasicMaterial color="#c9e5df" opacity={muted ? 0.08 : 0.2} transparent />
      </mesh>

      {Array.from({ length: 22 }, (_, index) => {
        const angle = (Math.PI * 2 * index) / 22
        const irregularity = index % 3 === 0 ? 0.08 : index % 2 === 0 ? -0.03 : 0.03
        return (
          <mesh
            castShadow
            key={index}
            position={[
              Math.cos(angle) * (1.64 + irregularity),
              0.78 + (index % 4) * 0.008,
              Math.sin(angle) * (1.04 + irregularity * 0.5),
            ]}
            rotation={[0, -angle, index % 2 ? 0.08 : -0.06]}
            scale={[0.85 + (index % 3) * 0.09, 0.52 + (index % 2) * 0.08, 0.72]}
          >
            <dodecahedronGeometry args={[0.2, 1]} />
            <meshStandardMaterial
              color={index % 3 === 0 ? '#aa9d83' : index % 2 ? '#928a78' : '#b9ad94'}
              roughness={0.98}
            />
          </mesh>
        )
      })}

      {[0.5, 0.87, 1.18].map((radius, index) => (
        <mesh
          key={radius}
          position={[0.12 - index * 0.08, 0.755 + index * 0.002, -0.05 + index * 0.06]}
          rotation={[-Math.PI / 2, 0, index * 0.24]}
          scale={[1, 0.56, 1]}
        >
          <ringGeometry args={[radius, radius + 0.014, 64]} />
          <meshBasicMaterial color="#d8ece8" opacity={0.3 - index * 0.055} transparent />
        </mesh>
      ))}

      {lotusPositions.map(([x, y, z, scale], index) => (
        <LotusPlant key={index} position={[x, y, z]} scale={scale} />
      ))}
      <Frog position={[-0.64, 0.82, 0.29]} rotation={0.5} />
      <Frog position={[0.82, 0.81, -0.24]} rotation={-0.8} />
      <SwimmingPondCreature kind="fish" phase={0.2} radius={0.78} speed={0.42} />
      <SwimmingPondCreature kind="fish" phase={2.4} radius={1.02} speed={0.32} />
      <SwimmingPondCreature kind="fish" phase={4.1} radius={0.62} speed={0.48} />
      <SwimmingPondCreature kind="squid" phase={1.25} radius={0.9} speed={0.28} />
      <SwimmingPondCreature kind="octopus" phase={3.15} radius={0.46} speed={0.2} />
      <SwimmingCrocodile />

      {[-1.4, -1.2, 1.23, 1.46].map((x, index) => (
        <group key={x} position={[x, 0.67, index % 2 ? 0.25 : -0.3]}>
          {[0, 0.12, 0.24].map((offset) => (
            <mesh key={offset} position={[offset * 0.2, 0.34 + offset, offset - 0.1]}>
              <cylinderGeometry args={[0.012, 0.02, 0.66, 8]} />
              <meshStandardMaterial color="#5f7756" roughness={0.94} />
            </mesh>
          ))}
        </group>
      ))}
    </group>
  )
}

function LotusPlant({
  position,
  scale,
}: {
  position: [number, number, number]
  scale: number
}) {
  return (
    <group position={position} scale={scale}>
      <mesh rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[0.2, 24]} />
        <meshStandardMaterial color="#5f825d" roughness={0.9} side={2} />
      </mesh>
      <mesh position={[0.05, 0.06, 0.01]}>
        <sphereGeometry args={[0.055, 16, 10]} />
        <meshStandardMaterial color="#e5b8b0" roughness={0.72} />
      </mesh>
      {Array.from({ length: 6 }, (_, index) => {
        const angle = (Math.PI * 2 * index) / 6
        return (
          <mesh
            key={index}
            position={[Math.cos(angle) * 0.065 + 0.05, 0.055, Math.sin(angle) * 0.065]}
            rotation={[0, -angle, 0]}
            scale={[0.75, 0.45, 1.25]}
          >
            <sphereGeometry args={[0.055, 12, 8]} />
            <meshStandardMaterial color={index % 2 ? '#f3d7d3' : '#e8c2bd'} roughness={0.74} />
          </mesh>
        )
      })}
    </group>
  )
}

function Frog({ position, rotation }: { position: [number, number, number]; rotation: number }) {
  return (
    <group position={position} rotation={[0, rotation, 0]} scale={0.72}>
      <mesh castShadow scale={[1.25, 0.62, 1]}>
        <sphereGeometry args={[0.09, 14, 10]} />
        <meshStandardMaterial color="#668850" roughness={0.88} />
      </mesh>
      <mesh castShadow position={[0, 0.04, 0.1]} scale={[1, 0.76, 0.82]}>
        <sphereGeometry args={[0.075, 14, 10]} />
        <meshStandardMaterial color="#7ca05e" roughness={0.86} />
      </mesh>
      {[-0.04, 0.04].map((x) => (
        <mesh key={x} position={[x, 0.085, 0.13]}>
          <sphereGeometry args={[0.018, 10, 8]} />
          <meshStandardMaterial color="#17261a" roughness={0.5} />
        </mesh>
      ))}
    </group>
  )
}

function SwimmingPondCreature({
  kind,
  phase,
  radius,
  speed,
}: {
  kind: 'fish' | 'squid' | 'octopus'
  phase: number
  radius: number
  speed: number
}) {
  const groupRef = useRef<Group>(null)

  useFrame(({ clock }) => {
    const group = groupRef.current
    if (!group) return
    const angle = clock.elapsedTime * speed + phase
    group.position.x = Math.cos(angle) * radius
    group.position.z = Math.sin(angle) * radius * 0.46
    group.position.y = 0.78 + Math.sin(angle * 2.2) * 0.012
    group.rotation.y = -angle + Math.PI / 2
  })

  return (
    <group ref={groupRef} scale={kind === 'fish' ? 1 : 0.72}>
      {kind === 'fish' && <FishModel color={phase > 3 ? '#d9a24d' : '#b96f4f'} />}
      {kind === 'squid' && <SquidModel />}
      {kind === 'octopus' && <OctopusModel />}
    </group>
  )
}

function FishModel({ color }: { color: string }) {
  return (
    <group scale={0.62}>
      <mesh castShadow scale={[0.72, 0.55, 1.55]}>
        <sphereGeometry args={[0.12, 16, 10]} />
        <meshStandardMaterial color={color} metalness={0.06} roughness={0.58} />
      </mesh>
      <mesh position={[0, 0, -0.23]} rotation={[Math.PI / 2, 0, 0]}>
        <coneGeometry args={[0.13, 0.2, 3]} />
        <meshStandardMaterial color="#d7a35b" roughness={0.64} />
      </mesh>
    </group>
  )
}

function SquidModel() {
  return (
    <group scale={0.65}>
      <mesh scale={[0.68, 0.5, 1.4]}>
        <sphereGeometry args={[0.14, 14, 10]} />
        <meshStandardMaterial color="#c89a86" roughness={0.66} />
      </mesh>
      {[-0.09, -0.03, 0.03, 0.09].map((x) => (
        <mesh key={x} position={[x, -0.01, -0.2]} rotation={[Math.PI / 2.3, 0, x * 2]}>
          <cylinderGeometry args={[0.012, 0.022, 0.22, 8]} />
          <meshStandardMaterial color="#d3aa99" roughness={0.7} />
        </mesh>
      ))}
    </group>
  )
}

function OctopusModel() {
  return (
    <group scale={0.62}>
      <mesh scale={[1, 0.7, 1]}>
        <sphereGeometry args={[0.15, 16, 10]} />
        <meshStandardMaterial color="#9b716e" roughness={0.72} />
      </mesh>
      {Array.from({ length: 8 }, (_, index) => {
        const angle = (Math.PI * 2 * index) / 8
        return (
          <mesh
            key={index}
            position={[Math.cos(angle) * 0.12, -0.05, Math.sin(angle) * 0.12]}
            rotation={[0, -angle, Math.PI / 2.7]}
          >
            <cylinderGeometry args={[0.012, 0.028, 0.25, 8]} />
            <meshStandardMaterial color="#a77b77" roughness={0.74} />
          </mesh>
        )
      })}
    </group>
  )
}

function SwimmingCrocodile() {
  const groupRef = useRef<Group>(null)

  useFrame(({ clock }) => {
    const group = groupRef.current
    if (!group) return
    const angle = clock.elapsedTime * 0.085 + 4.2
    group.position.x = Math.cos(angle) * 0.86
    group.position.y = 0.79 + Math.sin(angle * 2) * 0.008
    group.position.z = Math.sin(angle) * 0.31
    group.rotation.y = -angle + Math.PI / 2
  })

  return (
    <group ref={groupRef} scale={0.48}>
      <mesh castShadow scale={[0.64, 0.26, 1.7]}>
        <sphereGeometry args={[0.22, 18, 12]} />
        <meshStandardMaterial color="#526c42" roughness={0.92} />
      </mesh>
      <mesh castShadow position={[0, 0.01, 0.43]} scale={[0.78, 0.22, 1.2]}>
        <boxGeometry args={[0.42, 0.24, 0.55]} />
        <meshStandardMaterial color="#607a49" roughness={0.9} />
      </mesh>
      {[-0.11, 0.11].map((x) => (
        <mesh key={x} position={[x, 0.13, 0.68]}>
          <sphereGeometry args={[0.035, 10, 8]} />
          <meshStandardMaterial color="#152114" roughness={0.5} />
        </mesh>
      ))}
      {[-0.36, -0.15, 0.08, 0.28].map((z, index) => (
        <mesh key={z} position={[0, 0.16, z]} rotation={[0, 0, Math.PI / 4]}>
          <octahedronGeometry args={[0.08 - index * 0.007, 0]} />
          <meshStandardMaterial color="#71845a" roughness={0.94} />
        </mesh>
      ))}
      {[0.18, 0.4, 0.61].map((offset, index) => (
        <mesh
          key={offset}
          position={[0, -0.01, -0.42 - offset]}
          rotation={[Math.PI / 2, 0, index % 2 ? 0.18 : -0.14]}
        >
          <coneGeometry args={[0.13 - index * 0.025, 0.34, 8]} />
          <meshStandardMaterial color="#49613e" roughness={0.93} />
        </mesh>
      ))}
    </group>
  )
}

function FormalGarden() {
  return (
    <group>
      <FlowerBed position={[-2.65, 0.09, -3.65]} rotation={0.12} tone="pink" />
      <FlowerBed position={[-1.85, 0.09, -3.95]} rotation={-0.15} tone="white" />
      <FlowerBed position={[5.75, 0.09, 1.75]} rotation={0.22} tone="gold" />
      <FlowerBed position={[0.45, 0.09, 5.15]} rotation={-0.12} tone="pink" />
      <HedgeRow position={[-1.4, 0.1, -4.38]} rotation={0.02} />
      <HedgeRow position={[4.95, 0.1, 1.55]} rotation={Math.PI / 2.1} />
    </group>
  )
}

function WildlifeMeadow() {
  const timeMode = useContext(CampusTimeContext)
  const grassColor = timeMode === 'night' ? '#314d3b' : timeMode === 'sunset' ? '#66815c' : '#79976a'

  return (
    <group position={[7.25, 0.075, 1.3]}>
      <mesh receiveShadow scale={[1, 1, 0.72]}>
        <cylinderGeometry args={[2.7, 2.78, 0.08, 64]} />
        <meshStandardMaterial color={grassColor} roughness={0.98} />
      </mesh>
      <mesh position={[0, 0.047, 0]} rotation={[-Math.PI / 2, 0, 0]} scale={[1, 0.72, 1]}>
        <ringGeometry args={[2.35, 2.56, 64]} />
        <meshBasicMaterial color="#b3a77e" opacity={0.38} transparent />
      </mesh>
      {Array.from({ length: 24 }, (_, index) => {
        const angle = (Math.PI * 2 * index) / 24
        const radius = 1.25 + (index % 4) * 0.32
        return (
          <group
            key={index}
            position={[Math.cos(angle) * radius, 0.08, Math.sin(angle) * radius * 0.68]}
            rotation={[0, -angle, 0]}
          >
            <mesh position={[0, 0.12, 0]}>
              <coneGeometry args={[0.045, 0.3 + (index % 3) * 0.05, 6]} />
              <meshStandardMaterial color={index % 2 ? '#72875d' : '#87946a'} roughness={0.96} />
            </mesh>
          </group>
        )
      })}
      <group position={[1.55, 0.1, -0.7]} rotation={[0, -0.2, 0]}>
        <mesh castShadow position={[0, 0.16, 0]}>
          <boxGeometry args={[0.82, 0.14, 0.32]} />
          <meshStandardMaterial color="#83705c" roughness={0.94} />
        </mesh>
        <mesh position={[0, 0.24, 0]}>
          <boxGeometry args={[0.68, 0.035, 0.2]} />
          <meshPhysicalMaterial color="#537e86" roughness={0.12} clearcoat={0.8} />
        </mesh>
      </group>
    </group>
  )
}

function FlowerBed({
  position,
  rotation,
  tone,
}: {
  position: [number, number, number]
  rotation: number
  tone: 'pink' | 'white' | 'gold'
}) {
  const flowerColors = {
    pink: ['#d99ba4', '#efd1d4'],
    white: ['#eee8db', '#d8cdb8'],
    gold: ['#cfaa58', '#e3cd8e'],
  }[tone]

  return (
    <group position={position} rotation={[0, rotation, 0]}>
      <RoundedBox args={[1.5, 0.1, 0.52]} castShadow radius={0.16} receiveShadow>
        <meshStandardMaterial color="#574b3c" roughness={1} />
      </RoundedBox>
      {Array.from({ length: 11 }, (_, index) => {
        const x = -0.62 + (index % 6) * 0.25
        const z = index < 6 ? -0.12 : 0.12
        return (
          <group key={index} position={[x, 0.11, z]}>
            <mesh position={[0, 0.11, 0]}>
              <cylinderGeometry args={[0.008, 0.012, 0.22, 6]} />
              <meshStandardMaterial color="#52704c" roughness={0.9} />
            </mesh>
            <mesh castShadow position={[0, 0.23, 0]}>
              <sphereGeometry args={[0.045, 10, 8]} />
              <meshStandardMaterial color={flowerColors[index % 2]} roughness={0.72} />
            </mesh>
          </group>
        )
      })}
    </group>
  )
}

function HedgeRow({
  position,
  rotation,
}: {
  position: [number, number, number]
  rotation: number
}) {
  return (
    <group position={position} rotation={[0, rotation, 0]}>
      {Array.from({ length: 8 }, (_, index) => (
        <mesh castShadow key={index} position={[(index - 3.5) * 0.34, 0.2, 0]}>
          <dodecahedronGeometry args={[0.24, 1]} />
          <meshStandardMaterial color={index % 2 ? '#486b4e' : '#587858'} roughness={0.97} />
        </mesh>
      ))}
    </group>
  )
}

function WildlifeClock() {
  const { invalidate } = useThree()

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    let animationFrame = 0
    let previous = 0
    const tick = (time: number) => {
      if (time - previous > 32) {
        previous = time
        invalidate()
      }
      animationFrame = requestAnimationFrame(tick)
    }
    animationFrame = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(animationFrame)
  }, [invalidate])

  return null
}

function WildlifeScene() {
  return (
    <group>
      <AnimatedDeer anchor={[-6.9, 0.34, 4.7]} phase={0.2} radius={0.82} scale={0.5} speed={0.07} />
      <AnimatedDeer anchor={[-5.8, 0.33, 5.2]} phase={2.2} radius={0.62} scale={0.43} speed={0.055} />
      <AnimatedDeer anchor={[7.25, 0.35, 1.3]} phase={0.72} radius={1.62} scale={0.48} speed={0.18} />

      <AnimatedAssetAnimal
        anchor={[7.25, 0.34, 1.3]}
        modelPath="/models/animals/wolf.gltf"
        phase={0.24}
        radius={1.62}
        routeDepth={0.62}
        scale={0.5}
        speed={0.18}
      />
      <AnimatedAssetAnimal
        anchor={[-7.65, 0.34, -3.9]}
        modelPath="/models/animals/wolf.gltf"
        phase={3.2}
        radius={0.78}
        routeDepth={0.5}
        scale={0.46}
        speed={0.065}
      />
      <AnimatedAssetAnimal
        anchor={[-7.4, 0.31, -1.75]}
        animationHint="idle"
        modelPath="/models/animals/cat.gltf"
        phase={1.5}
        radius={0.52}
        routeDepth={0.44}
        scale={0.72}
        speed={0.035}
      />
      <AnimatedAssetAnimal
        anchor={[7.8, 0.31, -3.65]}
        animationHint="idle"
        modelPath="/models/animals/cat.gltf"
        phase={4.6}
        radius={0.46}
        routeDepth={0.48}
        scale={0.66}
        speed={0.028}
      />

      <RoamingAnimal anchor={[7.25, 0.37, 1.3]} kind="tiger" phase={3.55} radius={2.05} speed={0.135} />
      <RoamingAnimal anchor={[7.25, 0.34, 1.3]} kind="boar" phase={4.08} radius={2.05} speed={0.135} />
      <RoamingAnimal anchor={[6.2, 0.32, -2.3]} kind="pig" phase={2.7} radius={0.52} />
      <RoamingAnimal anchor={[-6.5, 0.32, 0.4]} kind="pig" phase={4.4} radius={0.5} />
      <RoamingAnimal anchor={[-7.1, 0.31, 2.15]} kind="chicken" phase={0.8} radius={0.42} />
      <RoamingAnimal anchor={[-6.5, 0.31, 2.0]} kind="chicken" phase={3.1} radius={0.36} />
      <RoamingAnimal anchor={[0.05, 0.31, 5.5]} kind="peacock" phase={0.2} radius={0.4} />
      <RoamingAnimal anchor={[4.1, 0.31, 5.35]} kind="peacock" phase={1.4} radius={0.36} />
      <RoamingAnimal anchor={[-6.8, 0.31, -5.0]} kind="peacock" phase={2.7} radius={0.4} />
      <RoamingAnimal anchor={[-7.45, 0.31, 1.05]} kind="peacock" phase={4.5} radius={0.34} />
      <RoamingAnimal anchor={[2.1, 0.31, -5.55]} kind="peacock" phase={5.6} radius={0.4} />
      <RoamingAnimal anchor={[-1.75, 0.31, 5.9]} kind="peacock" phase={3.7} radius={0.34} />
      <RoamingAnimal anchor={[8.6, 0.31, 4.65]} kind="peacock" phase={5.1} radius={0.34} />
    </group>
  )
}

function AnimatedDeer({
  anchor,
  phase,
  radius,
  scale,
  speed = 0.09,
}: {
  anchor: [number, number, number]
  phase: number
  radius: number
  scale: number
  speed?: number
}) {
  const groupRef = useRef<Group>(null)
  const { animations, scene } = useGLTF('/models/animals/deer.gltf')
  const { actions, names } = useAnimations(animations, groupRef)

  useEffect(() => {
    const walkName = names.find((name) => name.toLowerCase().includes('walk')) ?? names[0]
    const action = walkName ? actions[walkName] : undefined
    action?.reset().fadeIn(0.35).play()
    return () => {
      action?.fadeOut(0.2)
    }
  }, [actions, names])

  useFrame(({ clock }) => {
    const group = groupRef.current
    if (!group) return
    const angle = clock.elapsedTime * speed + phase
    group.position.x = anchor[0] + Math.cos(angle) * radius
    group.position.y = anchor[1]
    group.position.z = anchor[2] + Math.sin(angle) * radius * 0.55
    group.rotation.y = -angle + Math.PI / 2
  })

  return (
    <group ref={groupRef} scale={scale}>
      <Clone castShadow object={scene} receiveShadow />
    </group>
  )
}

function AnimatedAssetAnimal({
  anchor,
  animationHint = 'walk',
  modelPath,
  phase,
  radius,
  routeDepth,
  scale,
  speed,
}: {
  anchor: [number, number, number]
  animationHint?: string
  modelPath: string
  phase: number
  radius: number
  routeDepth: number
  scale: number
  speed: number
}) {
  const groupRef = useRef<Group>(null)
  const { animations, scene } = useGLTF(modelPath)
  const { actions, names } = useAnimations(animations, groupRef)

  useEffect(() => {
    const actionName =
      names.find((name) => name.toLowerCase().includes(animationHint)) ??
      names.find((name) => name.toLowerCase().includes('walk')) ??
      names[0]
    const action = actionName ? actions[actionName] : undefined
    action?.reset().fadeIn(0.3).play()
    return () => {
      action?.fadeOut(0.2)
    }
  }, [actions, animationHint, names])

  useFrame(({ clock }) => {
    const group = groupRef.current
    if (!group) return
    const angle = clock.elapsedTime * speed + phase
    group.position.x = anchor[0] + Math.cos(angle) * radius
    group.position.y = anchor[1] + Math.sin(angle * 2.4) * 0.012
    group.position.z = anchor[2] + Math.sin(angle) * radius * routeDepth
    group.rotation.y = -angle + Math.PI / 2
  })

  return (
    <group ref={groupRef} scale={scale}>
      <Clone castShadow object={scene} receiveShadow />
    </group>
  )
}

function RoamingAnimal({
  anchor,
  kind,
  phase,
  radius,
  speed: speedOverride,
}: {
  anchor: [number, number, number]
  kind: 'boar' | 'pig' | 'chicken' | 'peacock' | 'tiger'
  phase: number
  radius: number
  speed?: number
}) {
  const groupRef = useRef<Group>(null)
  const speed = speedOverride ?? (kind === 'chicken' ? 0.22 : kind === 'peacock' ? 0.1 : 0.14)

  useFrame(({ clock }) => {
    const group = groupRef.current
    if (!group) return
    const angle = clock.elapsedTime * speed + phase
    group.position.x = anchor[0] + Math.cos(angle) * radius
    group.position.y = anchor[1] + Math.sin(angle * 3) * 0.01
    group.position.z = anchor[2] + Math.sin(angle) * radius * 0.58
    group.rotation.y = -angle + Math.PI / 2
  })

  return (
    <group ref={groupRef}>
      {kind === 'boar' && <PigModel wild />}
      {kind === 'pig' && <PigModel />}
      {kind === 'chicken' && <ChickenModel />}
      {kind === 'peacock' && <PeacockModel phase={phase} />}
      {kind === 'tiger' && <TigerModel />}
    </group>
  )
}

function PigModel({ wild = false }: { wild?: boolean }) {
  const body = wild ? '#59463a' : '#c99083'
  return (
    <group scale={wild ? 0.52 : 0.46}>
      <mesh castShadow scale={[1.5, 0.85, 0.92]}>
        <sphereGeometry args={[0.32, 18, 12]} />
        <meshStandardMaterial color={body} roughness={0.9} />
      </mesh>
      <mesh castShadow position={[0, 0.02, 0.34]} scale={[0.9, 0.85, 0.75]}>
        <sphereGeometry args={[0.22, 16, 10]} />
        <meshStandardMaterial color={body} roughness={0.88} />
      </mesh>
      <mesh position={[0, -0.02, 0.53]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.1, 0.13, 0.09, 14]} />
        <meshStandardMaterial color={wild ? '#41342c' : '#b87670'} roughness={0.82} />
      </mesh>
      {[-0.25, 0.25].flatMap((x) =>
        [-0.18, 0.2].map((z) => (
          <mesh castShadow key={String(x) + z} position={[x, -0.28, z]}>
            <cylinderGeometry args={[0.045, 0.052, 0.35, 8]} />
            <meshStandardMaterial color={wild ? '#3e332d' : '#a76f68'} roughness={0.9} />
          </mesh>
        )),
      )}
      {wild &&
        [-0.11, 0.11].map((x) => (
          <mesh key={x} position={[x, -0.02, 0.6]} rotation={[Math.PI / 2.5, 0, x * 2]}>
            <coneGeometry args={[0.025, 0.13, 9]} />
            <meshStandardMaterial color="#e7d8ba" roughness={0.54} />
          </mesh>
        ))}
    </group>
  )
}

function TigerModel() {
  const stripePositions = [-0.42, -0.18, 0.08, 0.34]

  return (
    <group scale={0.72}>
      <mesh castShadow position={[0, 0.32, 0]} scale={[1.55, 0.68, 0.78]}>
        <sphereGeometry args={[0.42, 24, 16]} />
        <meshStandardMaterial color="#ce8137" roughness={0.78} />
      </mesh>
      {stripePositions.map((z, index) => (
        <mesh
          key={z}
          position={[index % 2 ? 0.17 : -0.12, 0.47, z]}
          rotation={[0.05, 0, index % 2 ? 0.32 : -0.26]}
          scale={[0.78, 0.18, 0.13]}
        >
          <sphereGeometry args={[0.28, 12, 8]} />
          <meshStandardMaterial color="#29241f" roughness={0.9} />
        </mesh>
      ))}
      <mesh castShadow position={[0, 0.43, 0.5]} scale={[0.94, 0.84, 0.9]}>
        <sphereGeometry args={[0.3, 20, 14]} />
        <meshStandardMaterial color="#d88b3f" roughness={0.76} />
      </mesh>
      <mesh position={[0, 0.35, 0.75]} scale={[0.82, 0.55, 0.48]}>
        <sphereGeometry args={[0.22, 18, 12]} />
        <meshStandardMaterial color="#e2b27a" roughness={0.8} />
      </mesh>
      {[-0.2, 0.2].map((x) => (
        <group key={x} position={[x, 0.66, 0.45]}>
          <mesh rotation={[0, 0, x > 0 ? -0.25 : 0.25]}>
            <coneGeometry args={[0.11, 0.24, 5]} />
            <meshStandardMaterial color="#bd6e31" roughness={0.82} />
          </mesh>
        </group>
      ))}
      {[-0.25, 0.25].flatMap((x) =>
        [-0.25, 0.28].map((z) => (
          <group key={String(x) + z} position={[x, 0.02, z]}>
            <mesh castShadow position={[0, 0.17, 0]}>
              <cylinderGeometry args={[0.065, 0.08, 0.46, 10]} />
              <meshStandardMaterial color="#bd7135" roughness={0.84} />
            </mesh>
            <mesh position={[0, -0.04, 0.06]} scale={[1.25, 0.55, 1.65]}>
              <sphereGeometry args={[0.075, 12, 8]} />
              <meshStandardMaterial color="#d18a49" roughness={0.86} />
            </mesh>
          </group>
        )),
      )}
      <group position={[0, 0.42, -0.58]} rotation={[0.18, 0, 0]}>
        {[0, 0.22, 0.44, 0.66].map((offset, index) => (
          <mesh key={offset} position={[0, index * 0.02, -offset]} rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.045 - index * 0.004, 0.055, 0.26, 9]} />
            <meshStandardMaterial color={index % 2 ? '#2c2721' : '#c97936'} roughness={0.82} />
          </mesh>
        ))}
      </group>
    </group>
  )
}

function ChickenModel() {
  return (
    <group scale={0.36}>
      <mesh castShadow position={[0, 0.2, 0]} scale={[0.86, 1, 1.12]}>
        <sphereGeometry args={[0.28, 16, 12]} />
        <meshStandardMaterial color="#e7dfcf" roughness={0.9} />
      </mesh>
      <mesh castShadow position={[0, 0.43, 0.22]}>
        <sphereGeometry args={[0.15, 14, 10]} />
        <meshStandardMaterial color="#eee6d6" roughness={0.88} />
      </mesh>
      <mesh position={[0, 0.41, 0.4]} rotation={[Math.PI / 2, 0, 0]}>
        <coneGeometry args={[0.065, 0.16, 4]} />
        <meshStandardMaterial color="#d4a23d" roughness={0.72} />
      </mesh>
      <mesh position={[0, 0.59, 0.22]}>
        <sphereGeometry args={[0.055, 10, 8]} />
        <meshStandardMaterial color="#a7463c" roughness={0.76} />
      </mesh>
      {[-0.08, 0.08].map((x) => (
        <mesh key={x} position={[x, -0.06, 0]}>
          <cylinderGeometry args={[0.018, 0.018, 0.34, 6]} />
          <meshStandardMaterial color="#b98b3d" roughness={0.8} />
        </mesh>
      ))}
    </group>
  )
}

function PeacockModel({ phase }: { phase: number }) {
  return (
    <group scale={0.58}>
      <group position={[0, 0.28, -0.13]} rotation={[0, 0, Math.sin(phase) * 0.08]}>
        {Array.from({ length: 11 }, (_, index) => {
          const angle = -0.92 + (index / 10) * 1.84
          const length = 0.78 + Math.cos(angle) * 0.22
          return (
            <group key={index} rotation={[0, 0, angle]}>
              <mesh castShadow position={[0, length * 0.46, 0]} scale={[0.16, length, 0.06]}>
                <sphereGeometry args={[0.22, 12, 8]} />
                <meshStandardMaterial
                  color={index % 2 ? '#39735e' : '#326b61'}
                  metalness={0.12}
                  roughness={0.55}
                />
              </mesh>
              <mesh position={[0, length * 0.88, -0.02]} scale={[1, 0.76, 0.32]}>
                <sphereGeometry args={[0.09, 12, 8]} />
                <meshStandardMaterial
                  color="#c59c42"
                  emissive="#204e68"
                  emissiveIntensity={0.35}
                  metalness={0.22}
                  roughness={0.42}
                />
              </mesh>
            </group>
          )
        })}
      </group>
      <mesh castShadow position={[0, 0.32, 0.08]} scale={[0.72, 0.9, 1.1]}>
        <sphereGeometry args={[0.22, 16, 12]} />
        <meshStandardMaterial color="#174a61" metalness={0.18} roughness={0.48} />
      </mesh>
      <mesh castShadow position={[0, 0.63, 0.19]} scale={[0.52, 1.25, 0.58]}>
        <sphereGeometry args={[0.18, 16, 12]} />
        <meshStandardMaterial color="#1b6172" metalness={0.18} roughness={0.46} />
      </mesh>
      <mesh castShadow position={[0, 0.87, 0.22]}>
        <sphereGeometry args={[0.12, 14, 10]} />
        <meshStandardMaterial color="#285b70" metalness={0.14} roughness={0.52} />
      </mesh>
      <mesh position={[0, 0.86, 0.36]} rotation={[Math.PI / 2, 0, 0]}>
        <coneGeometry args={[0.045, 0.13, 5]} />
        <meshStandardMaterial color="#b99547" roughness={0.68} />
      </mesh>
      {[-0.07, 0, 0.07].map((x) => (
        <mesh key={x} position={[x, 1.03, 0.2]}>
          <cylinderGeometry args={[0.008, 0.012, 0.2, 6]} />
          <meshStandardMaterial color="#315e65" roughness={0.68} />
        </mesh>
      ))}
      {[-0.07, 0.07].map((x) => (
        <mesh key={x} position={[x, 0.03, 0.09]}>
          <cylinderGeometry args={[0.016, 0.018, 0.42, 7]} />
          <meshStandardMaterial color="#a88a55" roughness={0.76} />
        </mesh>
      ))}
    </group>
  )
}

function LandscapeDetails() {
  const timeMode = useContext(CampusTimeContext)
  const shrubPositions: Array<[number, number, number, number]> = [
    [-6.05, 0.08, -0.9, 0.68],
    [-3.15, 0.08, -2.8, 0.52],
    [-2.65, 0.08, -3.65, 0.72],
    [-1.7, 0.08, -3.35, 0.52],
    [0.35, 0.08, -3.65, 0.66],
    [1.15, 0.08, -3.35, 0.48],
    [5.65, 0.08, -0.35, 0.64],
    [5.72, 0.08, 1.05, 0.52],
    [3.1, 0.08, 1.55, 0.48],
    [2.78, 0.08, 2.1, 0.62],
    [-2.82, 0.08, 4.35, 0.64],
    [1.55, 0.08, 4.72, 0.58],
  ]
  const foliage = timeMode === 'night' ? '#456253' : timeMode === 'sunset' ? '#71866d' : '#789775'

  return (
    <group>
      {shrubPositions.map(([x, y, z, scale], index) => (
        <group key={String(x) + '-' + String(z)} position={[x, y, z]} scale={scale}>
          <mesh castShadow position={[-0.18, 0.16, 0.05]}>
            <dodecahedronGeometry args={[0.3, 1]} />
            <meshStandardMaterial color={foliage} roughness={0.96} />
          </mesh>
          <mesh castShadow position={[0.17, 0.13, -0.04]}>
            <dodecahedronGeometry args={[0.25 + (index % 3) * 0.025, 1]} />
            <meshStandardMaterial color={index % 2 ? '#8f9f78' : foliage} roughness={0.96} />
          </mesh>
        </group>
      ))}
      <group position={[5.82, 0.1, -3.55]} rotation={[0, -0.55, 0]}>
        <RoundedBox args={[1.7, 0.12, 0.82]} castShadow radius={0.08} receiveShadow>
          <LimestoneMaterial muted={false} tone="warm" />
        </RoundedBox>
        <mesh castShadow position={[0.48, 0.72, 0]}>
          <boxGeometry args={[0.08, 1.25, 0.54]} />
          <RoofMaterial muted={false} />
        </mesh>
        <mesh position={[0.43, 0.75, 0]}>
          <boxGeometry args={[0.012, 0.54, 0.34]} />
          <meshStandardMaterial
            color="#d7bc7d"
            emissive="#c89c4f"
            emissiveIntensity={timeMode === 'night' ? 1.4 : 0.35}
            metalness={0.42}
            roughness={0.36}
          />
        </mesh>
      </group>
    </group>
  )
}

function TopographicGardens() {
  return (
    <group>
      <ContourGarden position={[6.15, 0.03, 1.45]} rotation={0.25} scale={[0.86, 0.8, 0.42]} />
      <ContourGarden position={[1.9, 0.03, -2.8]} rotation={-0.2} scale={[1.3, 0.8, 0.58]} />
      <ContourGarden position={[0.15, 0.03, 5.0]} rotation={0.14} scale={[0.82, 0.8, 0.4]} />
    </group>
  )
}

function ContourGarden({
  position,
  rotation,
  scale,
}: {
  position: [number, number, number]
  rotation: number
  scale: [number, number, number]
}) {
  return (
    <group position={position} rotation={[0, rotation, 0]} scale={scale}>
      {[1, 0.76, 0.52].map((radius, index) => (
        <mesh key={radius} position={[0.08 * index, 0.025 * index, 0]} receiveShadow>
          <cylinderGeometry args={[radius, radius + 0.03, 0.035, 48]} />
          <GrassMaterial tone={index} />
        </mesh>
      ))}
    </group>
  )
}

function CampusPlaceModel({
  place,
  selectedId,
  onSelect,
}: {
  place: CampusPlace
  selectedId: PlaceId | null
  onSelect: (id: PlaceId) => void
}) {
  const [hovered, setHovered] = useState(false)
  const liftedGroup = useGentleLift(selectedId === place.id, hovered)
  const selected = selectedId === place.id
  const muted = Boolean(selectedId && !selected)

  const labelClass = selected
    ? 'border border-gold-300 bg-gold-300 px-2.5 py-1.5 text-[8px] font-medium tracking-[0.13em] text-navy-900 shadow-xl'
    : muted
      ? 'border border-white/10 bg-navy-900/55 px-2.5 py-1.5 text-[8px] tracking-[0.13em] text-white/35 backdrop-blur-md'
      : 'border border-white/20 bg-navy-900/72 px-2.5 py-1.5 text-[8px] tracking-[0.13em] text-white/85 shadow-lg backdrop-blur-md transition-colors hover:border-gold-300/60 hover:text-gold-300'

  return (
    <group position={place.position}>
      <group
        onClick={(event) => {
          event.stopPropagation()
          onSelect(place.id)
        }}
        onPointerOut={() => {
          document.body.style.cursor = 'auto'
          setHovered(false)
        }}
        onPointerOver={(event) => {
          event.stopPropagation()
          document.body.style.cursor = 'pointer'
          setHovered(true)
        }}
        ref={liftedGroup}
      >
        {place.id === 'stay' && <StayVillage muted={muted} />}
        {place.id === 'wellness' && <WellnessHouse muted={muted} />}
        {place.id === 'meditation' && <MeditationGarden muted={muted} />}
        {place.id === 'studio' && <ProgramStudio muted={muted} />}
        {place.id === 'ocean' && <OceanDeck muted={muted} />}
        {place.id === 'pond' && <PondGarden muted={muted} />}
      </group>

      <mesh position={[0, 0.04, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[place.radius, place.radius + 0.055, 64]} />
        <meshBasicMaterial
          color="#d7c59e"
          opacity={selected ? 0.95 : hovered ? 0.42 : 0}
          transparent
        />
      </mesh>

      <Html center position={place.labelPosition} style={{ pointerEvents: 'auto' }}>
        <button
          aria-label={place.name + ' 자세히 보기'}
          aria-pressed={selected}
          className={labelClass}
          onClick={(event) => {
            event.stopPropagation()
            onSelect(place.id)
          }}
          type="button"
        >
          {place.index} · {place.label}
        </button>
      </Html>
    </group>
  )
}

function useGentleLift(selected: boolean, hovered: boolean) {
  const groupRef = useRef<Group>(null)
  const { invalidate } = useThree()

  useEffect(() => {
    const group = groupRef.current
    if (!group) return

    const from = group.position.y
    const to = selected ? 0.26 : hovered ? 0.08 : 0
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const duration = reduceMotion ? 0 : 700
    const startedAt = performance.now()
    let animationFrame = 0

    const animate = (time: number) => {
      const progress = duration === 0 ? 1 : Math.min((time - startedAt) / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 3)
      group.position.y = MathUtils.lerp(from, to, eased)
      invalidate()
      if (progress < 1) animationFrame = requestAnimationFrame(animate)
    }

    animationFrame = requestAnimationFrame(animate)
    return () => cancelAnimationFrame(animationFrame)
  }, [hovered, invalidate, selected])

  return groupRef
}

function StayVillage({ muted }: { muted: boolean }) {
  return (
    <group rotation={[0, -0.08, 0]}>
      <SuiteWing muted={muted} position={[-0.65, 0, -0.55]} size={[2.25, 2.2, 1.5]} />
      <SuiteWing muted={muted} position={[1.15, 0, -0.15]} size={[1.45, 1.55, 1.25]} />
      <SuiteWing muted={muted} position={[-1.15, 0, 1.05]} size={[1.65, 1.25, 1.05]} />
      <SuiteWing muted={muted} position={[1.12, 0, 1.15]} size={[1.42, 1.1, 1]} />
      <mesh castShadow position={[-0.1, 0.13, 0.55]}>
        <boxGeometry args={[3.7, 0.12, 0.65]} />
        <WoodMaterial muted={muted} />
      </mesh>
      <SlattedScreen
        count={9}
        height={0.88}
        muted={muted}
        position={[-0.9, 0.57, 1.42]}
        spacing={0.15}
      />
    </group>
  )
}

function SuiteWing({
  muted,
  position,
  size,
}: {
  muted: boolean
  position: [number, number, number]
  size: [number, number, number]
}) {
  const [width, height, depth] = size
  return (
    <group position={position}>
      <RoundedBox
        args={[width, height, depth]}
        castShadow
        position={[0, height / 2 + 0.12, 0]}
        radius={0.045}
        receiveShadow
      >
        <LimestoneMaterial muted={muted} />
      </RoundedBox>
      <mesh position={[0.05, height * 0.55, depth / 2 + 0.025]}>
        <boxGeometry args={[width * 0.72, height * 0.55, 0.04]} />
        <WarmGlassMaterial muted={muted} />
      </mesh>
      <WindowMullions
        height={height * 0.55}
        muted={muted}
        position={[0.05, height * 0.55, depth / 2 + 0.052]}
        width={width * 0.72}
      />
      <mesh castShadow position={[0.12, height + 0.17, -0.03]}>
        <boxGeometry args={[width + 0.25, 0.13, depth + 0.25]} />
        <RoofMaterial muted={muted} />
      </mesh>
      <mesh castShadow position={[0.05, 0.15, depth / 2 + 0.35]}>
        <boxGeometry args={[width * 0.82, 0.09, 0.58]} />
        <WoodMaterial muted={muted} />
      </mesh>
      <BalconyRail
        muted={muted}
        position={[0.05, 0.38, depth / 2 + 0.62]}
        width={width * 0.8}
      />
    </group>
  )
}

function WellnessHouse({ muted }: { muted: boolean }) {
  return (
    <group rotation={[0, 0.04, 0]}>
      <BuildingBlock muted={muted} position={[0, 0, -0.78]} size={[4.0, 1.75, 1.0]} />
      <BuildingBlock muted={muted} position={[-1.55, 0, 0.42]} size={[0.95, 1.3, 2.25]} />
      <BuildingBlock muted={muted} position={[1.55, 0, 0.42]} size={[0.95, 1.3, 2.25]} />
      <mesh position={[0, 0.58, 0.4]}>
        <boxGeometry args={[1.85, 0.92, 0.08]} />
        <WarmGlassMaterial muted={muted} />
      </mesh>
      <mesh castShadow position={[0, 1.18, 0.35]}>
        <boxGeometry args={[2.12, 0.12, 0.85]} />
        <RoofMaterial muted={muted} />
      </mesh>
      <SlattedScreen
        count={11}
        height={1.05}
        muted={muted}
        position={[0, 0.66, 0.81]}
        spacing={0.16}
      />
      <mesh position={[0, 0.08, 0.15]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.55, 0.61, 48]} />
        <GoldMaterial muted={muted} />
      </mesh>
      <mesh castShadow position={[0, 2.07, -0.82]}>
        <boxGeometry args={[4.3, 0.14, 1.22]} />
        <RoofMaterial muted={muted} />
      </mesh>
      {[-1.25, 0, 1.25].map((x) => (
        <mesh key={x} position={[x, 2.16, -0.82]}>
          <boxGeometry args={[0.62, 0.035, 0.52]} />
          <meshPhysicalMaterial
            clearcoat={0.9}
            color={muted ? '#526068' : '#78939c'}
            metalness={0.24}
            roughness={0.16}
          />
        </mesh>
      ))}
    </group>
  )
}

function BuildingBlock({
  muted,
  position,
  size,
}: {
  muted: boolean
  position: [number, number, number]
  size: [number, number, number]
}) {
  const [width, height, depth] = size
  return (
    <group position={position}>
      <RoundedBox
        args={size}
        castShadow
        position={[0, height / 2 + 0.12, 0]}
        radius={0.04}
        receiveShadow
      >
        <LimestoneMaterial muted={muted} />
      </RoundedBox>
      <mesh position={[0, height * 0.55, depth / 2 + 0.025]}>
        <boxGeometry args={[width * 0.68, height * 0.5, 0.04]} />
        <WarmGlassMaterial muted={muted} />
      </mesh>
      <WindowMullions
        height={height * 0.5}
        muted={muted}
        position={[0, height * 0.55, depth / 2 + 0.052]}
        width={width * 0.68}
      />
    </group>
  )
}

function MeditationGarden({ muted }: { muted: boolean }) {
  const columns = Array.from({ length: 10 }, (_, index) => {
    const angle = (Math.PI * 2 * index) / 10
    return [Math.cos(angle) * 0.98, Math.sin(angle) * 0.98] as const
  })

  return (
    <group>
      <mesh castShadow position={[0, 0.12, 0]} receiveShadow>
        <cylinderGeometry args={[1.45, 1.55, 0.18, 64]} />
        <LimestoneMaterial muted={muted} tone="warm" />
      </mesh>
      <mesh position={[0, 0.225, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.45, 1.12, 64]} />
        <WoodMaterial muted={muted} />
      </mesh>
      {columns.map(([x, z], index) => (
        <mesh castShadow key={index} position={[x, 0.85, z]}>
          <cylinderGeometry args={[0.045, 0.055, 1.45, 12]} />
          <WoodMaterial muted={muted} />
        </mesh>
      ))}
      <mesh castShadow position={[0, 1.58, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[1.19, 0.23, 14, 64]} />
        <RoofMaterial muted={muted} />
      </mesh>
      <mesh position={[0, 0.26, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[0.34, 48]} />
        <meshStandardMaterial
          color={muted ? '#505b61' : '#17354d'}
          metalness={0.08}
          roughness={0.28}
        />
      </mesh>
      <mesh position={[0, 0.285, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.37, 0.4, 48]} />
        <GoldMaterial muted={muted} />
      </mesh>
    </group>
  )
}

function ProgramStudio({ muted }: { muted: boolean }) {
  return (
    <group rotation={[0, -0.08, 0]}>
      <RoundedBox
        args={[3.8, 1.35, 1.95]}
        castShadow
        position={[0, 0.79, 0]}
        radius={0.045}
        receiveShadow
      >
        <LimestoneMaterial muted={muted} />
      </RoundedBox>
      <mesh position={[0.15, 0.8, 1]}>
        <boxGeometry args={[3.15, 0.92, 0.045]} />
        <WarmGlassMaterial muted={muted} />
      </mesh>
      <WindowMullions
        height={0.92}
        muted={muted}
        position={[0.15, 0.8, 1.04]}
        width={3.15}
      />
      <SlattedScreen
        count={13}
        height={1.02}
        muted={muted}
        position={[0.15, 0.82, 1.06]}
        spacing={0.23}
      />
      <mesh castShadow position={[0.1, 1.63, -0.02]} rotation={[0, 0, -0.055]}>
        <boxGeometry args={[4.15, 0.14, 2.2]} />
        <RoofMaterial muted={muted} />
      </mesh>
      <mesh castShadow position={[-1.35, 1.9, -0.05]} rotation={[0, 0, -0.055]}>
        <boxGeometry args={[0.42, 0.13, 1.3]} />
        <WarmGlassMaterial muted={muted} />
      </mesh>
      <mesh castShadow position={[0, 0.14, 1.28]}>
        <boxGeometry args={[3.35, 0.1, 0.45]} />
        <WoodMaterial muted={muted} />
      </mesh>
      {[-1.25, -0.42, 0.42, 1.25].map((x) => (
        <mesh key={x} position={[x, 1.72 + x * -0.055, -0.03]} rotation={[0, 0, -0.055]}>
          <boxGeometry args={[0.55, 0.035, 1.18]} />
          <meshPhysicalMaterial
            clearcoat={0.88}
            color={muted ? '#4b5960' : '#66828d'}
            metalness={0.26}
            roughness={0.15}
          />
        </mesh>
      ))}
    </group>
  )
}

function OceanDeck({ muted }: { muted: boolean }) {
  return (
    <group>
      <mesh castShadow position={[0, 0.13, 0]} receiveShadow>
        <boxGeometry args={[3.55, 0.16, 2.65]} />
        <WoodMaterial muted={muted} />
      </mesh>
      <mesh position={[0.55, 0.225, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[1.65, 2.1]} />
        <meshPhysicalMaterial
          clearcoat={0.8}
          color={muted ? '#344b5d' : '#1c5068'}
          metalness={0.08}
          roughness={0.22}
        />
      </mesh>
      {[-1.35, -0.2].flatMap((x) =>
        [-0.92, 0.92].map((z) => (
          <mesh castShadow key={String(x) + '-' + String(z)} position={[x, 0.86, z]}>
            <boxGeometry args={[0.065, 1.45, 0.065]} />
            <RoofMaterial muted={muted} />
          </mesh>
        )),
      )}
      <mesh castShadow position={[-0.78, 1.62, 0]}>
        <boxGeometry args={[1.9, 0.12, 2.18]} />
        <RoofMaterial muted={muted} />
      </mesh>
      {[-0.65, -0.3, 0.05].map((x) => (
        <mesh castShadow key={x} position={[x, 1.5, 0]} rotation={[0, 0, -0.04]}>
          <boxGeometry args={[0.055, 0.14, 2.2]} />
          <GoldMaterial muted={muted} />
        </mesh>
      ))}
      {[-0.65, 0.5].map((z) => (
        <group key={z} position={[-0.78, 0.24, z]} rotation={[0, -0.08, 0]}>
          <mesh castShadow rotation={[0.12, 0, 0]}>
            <boxGeometry args={[0.72, 0.08, 0.33]} />
            <LimestoneMaterial muted={muted} />
          </mesh>
          <mesh castShadow position={[0, 0.13, -0.17]} rotation={[-0.52, 0, 0]}>
            <boxGeometry args={[0.72, 0.08, 0.34]} />
            <LimestoneMaterial muted={muted} />
          </mesh>
        </group>
      ))}
    </group>
  )
}

function SlattedScreen({
  count,
  height,
  muted,
  position,
  spacing,
}: {
  count: number
  height: number
  muted: boolean
  position: [number, number, number]
  spacing: number
}) {
  return (
    <group position={position}>
      {Array.from({ length: count }, (_, index) => (
        <mesh castShadow key={index} position={[(index - (count - 1) / 2) * spacing, 0, 0]}>
          <boxGeometry args={[0.045, height, 0.07]} />
          <WoodMaterial muted={muted} />
        </mesh>
      ))}
    </group>
  )
}

function CoastalPine({
  muted,
  position,
  rotation,
  scale,
  tone,
}: {
  muted: boolean
  position: [number, number, number]
  rotation: number
  scale: number
  tone: number
}) {
  const foliage = ['#7e917e', '#90a08a', '#6f8779'][tone]
  const mutedFoliage = ['#66716c', '#737c74', '#5f6e69'][tone]

  return (
    <group position={position} rotation={[0, rotation, 0]} scale={scale}>
      <mesh castShadow position={[0, 0.72, 0]} rotation={[0, 0, -0.075]}>
        <cylinderGeometry args={[0.055, 0.11, 1.44, 12]} />
        <meshStandardMaterial color={muted ? '#605d56' : '#776b5b'} roughness={0.95} />
      </mesh>
      <mesh castShadow position={[0.1, 1.54, 0]} scale={[0.78, 1.08, 0.7]}>
        <dodecahedronGeometry args={[0.58, 1]} />
        <meshStandardMaterial
          color={muted ? mutedFoliage : foliage}
          opacity={muted ? 0.62 : 0.88}
          roughness={0.94}
          transparent
        />
      </mesh>
      <mesh castShadow position={[-0.38, 1.3, 0.06]} scale={[0.92, 0.62, 0.68]}>
        <dodecahedronGeometry args={[0.48, 1]} />
        <meshStandardMaterial
          color={muted ? mutedFoliage : foliage}
          opacity={muted ? 0.58 : 0.82}
          roughness={0.94}
          transparent
        />
      </mesh>
      <mesh castShadow position={[0.49, 1.18, -0.08]} scale={[0.96, 0.58, 0.7]}>
        <dodecahedronGeometry args={[0.44, 1]} />
        <meshStandardMaterial
          color={muted ? mutedFoliage : foliage}
          opacity={muted ? 0.56 : 0.8}
          roughness={0.94}
          transparent
        />
      </mesh>
      <mesh castShadow position={[0.25, 1.82, -0.08]} scale={[0.58, 0.72, 0.55]}>
        <dodecahedronGeometry args={[0.4, 1]} />
        <meshStandardMaterial
          color={muted ? mutedFoliage : tone === 1 ? '#83977d' : '#718b75'}
          opacity={muted ? 0.58 : 0.84}
          roughness={0.95}
          transparent
        />
      </mesh>
    </group>
  )
}

function WindowMullions({
  height,
  muted,
  position,
  width,
}: {
  height: number
  muted: boolean
  position: [number, number, number]
  width: number
}) {
  const divisions = Math.max(2, Math.round(width / 0.48))

  return (
    <group position={position}>
      {Array.from({ length: divisions - 1 }, (_, index) => (
        <mesh key={index} position={[-width / 2 + ((index + 1) * width) / divisions, 0, 0]}>
          <boxGeometry args={[0.026, height, 0.022]} />
          <meshStandardMaterial
            color={muted ? '#3c464c' : '#24343e'}
            metalness={0.55}
            roughness={0.38}
          />
        </mesh>
      ))}
      <mesh>
        <boxGeometry args={[width, 0.025, 0.022]} />
        <meshStandardMaterial
          color={muted ? '#3c464c' : '#24343e'}
          metalness={0.55}
          roughness={0.38}
        />
      </mesh>
    </group>
  )
}

function BalconyRail({
  muted,
  position,
  width,
}: {
  muted: boolean
  position: [number, number, number]
  width: number
}) {
  const postCount = Math.max(3, Math.round(width / 0.36))

  return (
    <group position={position}>
      <mesh castShadow position={[0, 0.17, 0]}>
        <boxGeometry args={[width, 0.025, 0.025]} />
        <meshStandardMaterial
          color={muted ? '#566063' : '#27373d'}
          metalness={0.58}
          roughness={0.34}
        />
      </mesh>
      {Array.from({ length: postCount }, (_, index) => (
        <mesh
          castShadow
          key={index}
          position={[-width / 2 + (index * width) / (postCount - 1), 0, 0]}
        >
          <boxGeometry args={[0.02, 0.36, 0.02]} />
          <meshStandardMaterial
            color={muted ? '#566063' : '#27373d'}
            metalness={0.58}
            roughness={0.34}
          />
        </mesh>
      ))}
    </group>
  )
}

function useCampusTextures() {
  const textures = useContext(CampusTextureContext)
  if (!textures) throw new Error('3D 캠퍼스 텍스처가 준비되지 않았습니다.')
  return textures
}

function LimestoneMaterial({ muted, tone = 'light' }: { muted: boolean; tone?: 'light' | 'warm' }) {
  const { concrete } = useCampusTextures()
  const color = muted ? '#aaa9a2' : tone === 'warm' ? '#e0d3bf' : '#f2eadf'
  return <meshStandardMaterial color={color} map={concrete} metalness={0.02} roughness={0.82} />
}

function CliffMaterial() {
  const { concrete } = useCampusTextures()
  return (
    <meshStandardMaterial
      color="#6f6252"
      map={concrete}
      metalness={0.02}
      roughness={0.98}
    />
  )
}

function WoodMaterial({ muted }: { muted: boolean }) {
  const { wood } = useCampusTextures()
  return (
    <meshStandardMaterial
      color={muted ? '#807970' : '#c69b73'}
      map={wood}
      metalness={0.03}
      roughness={0.68}
    />
  )
}

function RoofMaterial({ muted }: { muted: boolean }) {
  const { metal } = useCampusTextures()
  const timeMode = useContext(CampusTimeContext)
  return (
    <meshStandardMaterial
      color={muted ? '#879092' : timeMode === 'day' ? '#7c8a8b' : '#aeb9bb'}
      emissive={muted ? '#26333b' : '#17364f'}
      emissiveIntensity={muted ? 0.04 : timeMode === 'night' ? 0.16 : 0.06}
      map={metal}
      metalness={0.46}
      roughness={0.38}
    />
  )
}

function StonePaverMaterial() {
  const { stone } = useCampusTextures()
  return <meshStandardMaterial color="#d8d0c2" map={stone} roughness={0.92} />
}

function GrassMaterial({ tone }: { tone: number }) {
  const { grass } = useCampusTextures()
  const colors = ['#91a084', '#a5ae91', '#c1bda0']
  return <meshStandardMaterial color={colors[tone] ?? colors[0]} map={grass} roughness={0.96} />
}

function WarmGlassMaterial({ muted }: { muted: boolean }) {
  const timeMode = useContext(CampusTimeContext)
  const glow = timeMode === 'night' ? 1.75 : timeMode === 'sunset' ? 0.92 : 0.2

  return (
    <meshPhysicalMaterial
      clearcoat={0.82}
      clearcoatRoughness={0.16}
      color={muted ? '#334b5a' : timeMode === 'day' ? '#4f7079' : '#274c5b'}
      emissive={muted ? '#24313a' : '#d89d52'}
      emissiveIntensity={muted ? glow * 0.16 : glow}
      metalness={0.16}
      opacity={muted ? 0.72 : 0.9}
      roughness={0.14}
      transparent
    />
  )
}

function GoldMaterial({ muted }: { muted: boolean }) {
  return (
    <meshStandardMaterial color={muted ? '#66645c' : '#c1a36c'} metalness={0.5} roughness={0.34} />
  )
}

useGLTF.preload('/models/animals/deer.gltf')
useGLTF.preload('/models/animals/wolf.gltf')
useGLTF.preload('/models/animals/cat.gltf')
