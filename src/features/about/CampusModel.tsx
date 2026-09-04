import { ContactShadows, Html, OrbitControls, RoundedBox } from '@react-three/drei'
import { Canvas, useThree } from '@react-three/fiber'
import {
  ACESFilmicToneMapping,
  CatmullRomCurve3,
  MathUtils,
  SRGBColorSpace,
  Vector3,
  type Group,
} from 'three'
import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type ComponentRef,
  type Dispatch,
  type SetStateAction,
} from 'react'
import facilityLounge from '../../assets/facility7.png'
import facilityStudio from '../../assets/facility2.png'
import meditationCourtyard from '../../assets/home/meditation-courtyard.png'
import oceanSuite from '../../assets/home/ocean-suite.png'
import coast from '../../assets/msds-coast.png'

type PlaceId = 'stay' | 'wellness' | 'meditation' | 'studio' | 'ocean'

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
]

const placeById = Object.fromEntries(places.map((place) => [place.id, place])) as Record<
  PlaceId,
  CampusPlace
>

const pinePositions: Array<[number, number, number, number, number]> = [
  [-6.7, 0, -4.25, 0.86, -0.3],
  [-5.55, 0, -4.65, 0.72, 0.18],
  [-4.15, 0, -4.5, 0.92, -0.12],
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
]

export default function CampusModel() {
  const [canvasKey, setCanvasKey] = useState(0)
  const [contextLost, setContextLost] = useState(false)
  const [selectedId, setSelectedId] = useState<PlaceId | null>(null)
  const selectedPlace = selectedId ? placeById[selectedId] : null

  const retryRenderer = () => {
    setContextLost(false)
    setCanvasKey((current) => current + 1)
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
            MSDS의 공간을 담은 3D 조감도입니다. 좌우로 천천히 돌려보고, 공간을 선택해 머무름의
            장면을 만나보세요.
          </p>
        </div>

        <div className="mt-10 overflow-hidden border border-[#c7b78f]/40 bg-navy-900 p-2 shadow-[0_34px_90px_-42px_rgba(14,34,57,0.8)] md:p-3">
          <div className="relative h-[470px] overflow-hidden bg-[radial-gradient(circle_at_62%_18%,#28445c_0%,#142d48_34%,#0e2239_76%)] md:h-[620px]">
            <div className="pointer-events-none absolute left-4 top-4 z-10 border border-white/15 bg-navy-900/45 px-3 py-2 text-[9px] tracking-[0.16em] text-white/65 backdrop-blur-md md:left-6 md:top-6 md:text-[10px]">
              DRAG SIDEWAYS · SELECT A PLACE
            </div>
            {selectedId && (
              <button
                className="absolute right-4 top-4 z-10 border border-gold-300/35 bg-navy-900/55 px-3 py-2 text-[9px] tracking-[0.14em] text-gold-300 backdrop-blur-md transition-colors hover:bg-navy-800 md:right-6 md:top-6 md:text-[10px]"
                onClick={() => setSelectedId(null)}
                type="button"
              >
                RESET VIEW
              </button>
            )}

            <Canvas
              camera={{ far: 90, near: 0.1, position: [11, 10, 12], zoom: 52 }}
              dpr={[1, 1.5]}
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
              onPointerMissed={() => setSelectedId(null)}
              orthographic
              shadows
            >
              <color attach="background" args={['#102941']} />
              <fog attach="fog" args={['#102941', 24, 42]} />
              <ContextLifecycle onStatusChange={setContextLost} />
              <Scene selectedId={selectedId} onSelect={setSelectedId} />
              <CalmCamera selectedPlace={selectedPlace} />
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
            className="grid grid-cols-2 border-t border-white/10 md:grid-cols-5"
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
                  onClick={() => setSelectedId(isSelected ? null : place.id)}
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

function CalmCamera({ selectedPlace }: { selectedPlace: CampusPlace | null }) {
  const controlsRef = useRef<ComponentRef<typeof OrbitControls>>(null)
  const { camera, invalidate, size } = useThree()

  useEffect(() => {
    const controls = controlsRef.current
    if (!controls || !('zoom' in camera)) return

    const compact = size.width < 640
    const baseZoom = compact ? 29 : size.width < 900 ? 40 : 52
    const target = selectedPlace ? new Vector3(...selectedPlace.focus) : new Vector3(0, 0.34, 0)
    const targetZoom = selectedPlace ? baseZoom * (compact ? 1.06 : 1.16) : baseZoom
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
  }, [camera, invalidate, selectedPlace, size.width])

  return (
    <OrbitControls
      ref={controlsRef}
      dampingFactor={0.07}
      enableDamping
      enablePan={false}
      enableZoom={false}
      maxAzimuthAngle={1.3}
      maxPolarAngle={Math.PI / 3.55}
      minAzimuthAngle={0.18}
      minPolarAngle={Math.PI / 3.55}
      rotateSpeed={0.34}
    />
  )
}

function Scene({
  selectedId,
  onSelect,
}: {
  selectedId: PlaceId | null
  onSelect: (id: PlaceId) => void
}) {
  return (
    <>
      <ambientLight intensity={0.66} />
      <hemisphereLight args={['#dfe8ed', '#172638', 0.8]} />
      <directionalLight
        castShadow
        color="#ffe8c0"
        intensity={3.8}
        position={[-8, 14, 9]}
        shadow-bias={-0.0004}
        shadow-camera-bottom={-11}
        shadow-camera-far={40}
        shadow-camera-left={-12}
        shadow-camera-right={12}
        shadow-camera-top={11}
        shadow-mapSize={[1536, 1536]}
      />
      <directionalLight color="#87a7c0" intensity={0.9} position={[10, 7, -9]} />

      <OceanStage />
      <ContourGround />
      <GoldPath />
      <TopographicGardens />

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
        opacity={0.52}
        position={[0, 0.025, 0]}
        resolution={1024}
        scale={25}
      />
    </>
  )
}

function OceanStage() {
  return (
    <group>
      <mesh position={[0, -0.8, 0]} receiveShadow rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[54, 44, 1, 1]} />
        <meshPhysicalMaterial
          clearcoat={0.8}
          clearcoatRoughness={0.3}
          color="#102b43"
          metalness={0.12}
          roughness={0.3}
        />
      </mesh>
      {[9.5, 12.5, 15.5].map((radius, index) => (
        <mesh
          key={radius}
          position={[3.5, -0.775 + index * 0.002, 0]}
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
      <RoundedBox
        args={[18.2, 0.24, 14.8]}
        position={[-0.15, -0.56, 0.05]}
        radius={0.9}
        receiveShadow
        rotation={[0, 0.035, 0]}
      >
        <meshStandardMaterial color="#5d554a" roughness={0.92} />
      </RoundedBox>
      <RoundedBox
        args={[17.85, 0.22, 14.35]}
        position={[-0.28, -0.38, -0.04]}
        radius={0.82}
        receiveShadow
        rotation={[0, -0.018, 0]}
      >
        <meshStandardMaterial color="#b7aa94" roughness={0.9} />
      </RoundedBox>
      <RoundedBox
        args={[17.35, 0.28, 13.9]}
        position={[-0.18, -0.16, 0]}
        radius={0.72}
        receiveShadow
      >
        <meshStandardMaterial color="#e6ddce" roughness={0.86} />
      </RoundedBox>
      <RoundedBox
        args={[15.7, 0.055, 12.35]}
        position={[-0.35, 0.01, -0.06]}
        radius={0.6}
        receiveShadow
        rotation={[0, 0.012, 0]}
      >
        <meshStandardMaterial color="#eee7da" roughness={0.9} />
      </RoundedBox>
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

  return (
    <mesh>
      <tubeGeometry args={[curve, 128, 0.045, 10, false]} />
      <meshStandardMaterial
        color="#c7aa72"
        emissive="#8c6a36"
        emissiveIntensity={0.5}
        metalness={0.42}
        roughness={0.38}
      />
    </mesh>
  )
}

function TopographicGardens() {
  return (
    <group>
      <ContourGarden position={[-3.9, 0.03, -1.35]} rotation={0.25} scale={[1.65, 0.8, 0.7]} />
      <ContourGarden position={[1.9, 0.03, -2.8]} rotation={-0.2} scale={[1.3, 0.8, 0.58]} />
      <ContourGarden position={[2.0, 0.03, 4.25]} rotation={0.14} scale={[1.1, 0.8, 0.48]} />
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
          <meshStandardMaterial color={['#86917d', '#a8ad98', '#cbc7ae'][index]} roughness={0.96} />
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
      <mesh castShadow position={[0.12, height + 0.17, -0.03]}>
        <boxGeometry args={[width + 0.25, 0.13, depth + 0.25]} />
        <RoofMaterial muted={muted} />
      </mesh>
      <mesh castShadow position={[0.05, 0.15, depth / 2 + 0.35]}>
        <boxGeometry args={[width * 0.82, 0.09, 0.58]} />
        <WoodMaterial muted={muted} />
      </mesh>
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
      <mesh castShadow position={[0, 0.75, 0]} rotation={[0, 0, -0.05]}>
        <cylinderGeometry args={[0.06, 0.12, 1.5, 10]} />
        <meshStandardMaterial color={muted ? '#605d56' : '#776b5b'} roughness={0.95} />
      </mesh>
      <mesh castShadow position={[0.12, 1.52, 0]} rotation={[0.06, 0, -0.08]}>
        <coneGeometry args={[0.58, 0.9, 8]} />
        <meshStandardMaterial
          color={muted ? mutedFoliage : foliage}
          opacity={muted ? 0.62 : 0.88}
          roughness={0.94}
          transparent
        />
      </mesh>
      <mesh castShadow position={[-0.32, 1.32, 0.04]} rotation={[0.08, 0.18, Math.PI / 2.8]}>
        <coneGeometry args={[0.38, 0.82, 8]} />
        <meshStandardMaterial
          color={muted ? mutedFoliage : foliage}
          opacity={muted ? 0.58 : 0.82}
          roughness={0.94}
          transparent
        />
      </mesh>
      <mesh castShadow position={[0.46, 1.18, -0.05]} rotation={[-0.12, -0.2, -Math.PI / 2.7]}>
        <coneGeometry args={[0.34, 0.75, 8]} />
        <meshStandardMaterial
          color={muted ? mutedFoliage : foliage}
          opacity={muted ? 0.56 : 0.8}
          roughness={0.94}
          transparent
        />
      </mesh>
    </group>
  )
}

function LimestoneMaterial({ muted, tone = 'light' }: { muted: boolean; tone?: 'light' | 'warm' }) {
  const color = muted ? '#96958e' : tone === 'warm' ? '#d4c8b4' : '#e8dfd0'
  return <meshStandardMaterial color={color} metalness={0.02} roughness={0.82} />
}

function WoodMaterial({ muted }: { muted: boolean }) {
  return (
    <meshStandardMaterial color={muted ? '#716b63' : '#a47a52'} metalness={0.03} roughness={0.68} />
  )
}

function RoofMaterial({ muted }: { muted: boolean }) {
  return (
    <meshStandardMaterial color={muted ? '#4d575d' : '#315069'} metalness={0.22} roughness={0.48} />
  )
}

function WarmGlassMaterial({ muted }: { muted: boolean }) {
  return (
    <meshStandardMaterial
      color={muted ? '#334b5a' : '#274c5b'}
      emissive={muted ? '#24313a' : '#c28b45'}
      emissiveIntensity={muted ? 0.08 : 0.72}
      metalness={0.1}
      opacity={muted ? 0.72 : 0.94}
      roughness={0.2}
      transparent
    />
  )
}

function GoldMaterial({ muted }: { muted: boolean }) {
  return (
    <meshStandardMaterial color={muted ? '#66645c' : '#c1a36c'} metalness={0.5} roughness={0.34} />
  )
}
