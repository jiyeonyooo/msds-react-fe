import { Html, OrbitControls, RoundedBox, useTexture } from '@react-three/drei'
import { Canvas, useThree } from '@react-three/fiber'
import { ACESFilmicToneMapping, RepeatWrapping, SRGBColorSpace, type Texture } from 'three'
import { useEffect, useState, type Dispatch, type SetStateAction } from 'react'
import concreteTextureUrl from '../../assets/3d/concrete.svg'
import grassTextureUrl from '../../assets/3d/grass.svg'
import metalTextureUrl from '../../assets/3d/metal-panels.svg'
import stoneTextureUrl from '../../assets/3d/stone-pavers.svg'
import woodTextureUrl from '../../assets/3d/wood.svg'

type CampusPlace = {
  id: string
  name: string
  description: string
  position: [number, number, number]
  size: [number, number, number]
  floors: number
}

type SurfaceTextures = {
  concrete: Texture
  grass: Texture
  metal: Texture
  stone: Texture
  wood: Texture
}

const places: CampusPlace[] = [
  {
    id: 'stay',
    name: '스테이 빌리지',
    description: '오션 스위트와 숲의 객실',
    position: [3.8, 0.15, -2.25],
    size: [3.9, 2.25, 3.2],
    floors: 3,
  },
  {
    id: 'wellness',
    name: '웰니스 하우스',
    description: '리셉션 · 티 라운지 · 스파',
    position: [-0.3, 0.15, -0.1],
    size: [4.35, 2.45, 2.75],
    floors: 3,
  },
  {
    id: 'meditation',
    name: '명상 정원',
    description: '호흡과 사색을 위한 고요한 마당',
    position: [-4.35, 0.08, 2.45],
    size: [2.8, 1.4, 2.55],
    floors: 2,
  },
  {
    id: 'studio',
    name: '프로그램 스튜디오',
    description: '움직임과 워크숍이 열리는 공간',
    position: [-0.2, 0.12, 3.35],
    size: [3.6, 1.7, 2.35],
    floors: 2,
  },
  {
    id: 'ocean',
    name: '오션 데크',
    description: '물과 바다를 마주하는 산책과 휴식',
    position: [4.9, 0.05, 3.45],
    size: [2.7, 0.7, 2.2],
    floors: 1,
  },
]

const treePositions: [number, number, number][] = [
  [-6.4, 0, -3.5],
  [-5.5, 0, -4.1],
  [-4.5, 0, -3.6],
  [-2.9, 0, -4.3],
  [0.6, 0, -4.35],
  [2.7, 0, -4.05],
  [4.6, 0, -4.25],
  [6.25, 0, -3.55],
  [6.5, 0, -1.9],
  [6.25, 0, 0.6],
  [6.7, 0, 2.2],
  [6.1, 0, 4.2],
  [4.2, 0, 4.9],
  [2.4, 0, 4.7],
  [-2.4, 0, 4.85],
  [-4.1, 0, 4.3],
  [-5.7, 0, 3.95],
  [-6.5, 0, 2.2],
  [-6.25, 0, 0.4],
  [-6.6, 0, -1.5],
]

const rockPositions: [number, number, number, number][] = [
  [-5.4, 0.12, -2.7, 0.34],
  [-3.4, 0.1, -3.65, 0.26],
  [-4.9, 0.1, 0.8, 0.28],
  [1.8, 0.08, -3.72, 0.22],
  [5.85, 0.1, -0.5, 0.3],
  [3.1, 0.08, 4.25, 0.24],
  [-3.45, 0.09, 4.15, 0.3],
]

const lampPositions: [number, number, number][] = [
  [-3.1, 0, 0.1],
  [-2.4, 0, 1.45],
  [-1.6, 0, 2.55],
  [1.1, 0, 1.7],
  [2.35, 0, 0.8],
  [3.4, 0, 0.15],
  [4.55, 0, 1.2],
]

function useSurfaceTextures(): SurfaceTextures {
  const textures = useTexture({
    concrete: concreteTextureUrl,
    grass: grassTextureUrl,
    metal: metalTextureUrl,
    stone: stoneTextureUrl,
    wood: woodTextureUrl,
  })

  useEffect(() => {
    const repeatByTexture: Array<[Texture, number, number]> = [
      [textures.concrete, 3, 3],
      [textures.grass, 9, 7],
      [textures.metal, 3, 3],
      [textures.stone, 2, 8],
      [textures.wood, 4, 2],
    ]

    repeatByTexture.forEach(([texture, repeatX, repeatY]) => {
      texture.wrapS = RepeatWrapping
      texture.wrapT = RepeatWrapping
      texture.repeat.set(repeatX, repeatY)
      texture.colorSpace = SRGBColorSpace
      texture.anisotropy = 8
      texture.needsUpdate = true
    })
  }, [textures])

  return textures
}

export default function CampusModel() {
  const [canvasKey, setCanvasKey] = useState(0)
  const [contextLost, setContextLost] = useState(false)

  const retryRenderer = () => {
    setContextLost(false)
    setCanvasKey((current) => current + 1)
  }

  return (
    <section className="overflow-hidden bg-[#e7ede9] px-6 py-20 md:px-12 md:py-[112px]">
      <div className="mx-auto max-w-[1088px]">
        <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
          <div>
            <p className="text-[11px] font-medium tracking-[0.2em] text-gold-500">EXPLORE MSDS</p>
            <h2 className="mt-3 font-display text-[2.25rem] leading-tight text-navy-900 md:text-[2.75rem]">
              머무름의 모든 장면을 한눈에
            </h2>
          </div>
          <p className="max-w-[360px] text-sm leading-7 text-muted">
            MSDS의 시설과 숙소를 실제 3D 공간으로 둘러보세요. 건물을 드래그해 회전하고, 시설 위에
            마우스를 올려보세요.
          </p>
        </div>

        <div className="mt-10 overflow-hidden rounded-[24px] border border-white/70 bg-[#ceddd9] p-3 shadow-[0_24px_70px_-32px_rgba(14,34,57,0.45)] md:p-5">
          <div className="relative h-[420px] overflow-hidden rounded-[16px] bg-[#c6d8d4] md:h-[590px]">
            <div className="pointer-events-none absolute left-5 top-5 z-10 rounded-full border border-white/70 bg-white/80 px-4 py-2 text-[11px] tracking-[0.08em] text-navy-800 backdrop-blur-sm">
              DRAG TO ROTATE · SCROLL TO ZOOM
            </div>
            <Canvas
              camera={{ far: 80, fov: 36, near: 0.1, position: [10.5, 9.5, 12.5] }}
              dpr={[1, 1.35]}
              frameloop="demand"
              gl={{
                antialias: true,
                outputColorSpace: SRGBColorSpace,
                powerPreference: 'default',
                stencil: false,
                toneMapping: ACESFilmicToneMapping,
                toneMappingExposure: 1.05,
              }}
              key={canvasKey}
              shadows
            >
              <color attach="background" args={['#c6d8d4']} />
              <fog attach="fog" args={['#c6d8d4', 19, 33]} />
              <ContextLifecycle onStatusChange={setContextLost} />
              <Scene />
              <OrbitControls
                dampingFactor={0.055}
                enableDamping
                enablePan={false}
                maxDistance={21}
                maxPolarAngle={Math.PI / 2.1}
                minDistance={8.5}
                minPolarAngle={Math.PI / 4.4}
                rotateSpeed={0.6}
                target={[0, 0.35, 0]}
                zoomSpeed={0.7}
              />
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
        </div>
        <p className="mt-4 text-center text-xs leading-6 text-muted">
          시설 위치는 조감도 이해를 돕기 위한 안내이며, 객실 배정은 예약 시점의 이용 가능 객실을
          기준으로 진행됩니다.
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

function Scene() {
  const textures = useSurfaceTextures()

  return (
    <>
      <ambientLight intensity={0.8} />
      <hemisphereLight args={['#eaf3f1', '#485b43', 1.25]} />
      <directionalLight
        castShadow
        color="#fff4dc"
        intensity={4.4}
        position={[-7, 13, 8]}
        shadow-bias={-0.00035}
        shadow-camera-bottom={-10}
        shadow-camera-far={35}
        shadow-camera-left={-10}
        shadow-camera-right={10}
        shadow-camera-top={10}
        shadow-mapSize={[1024, 1024]}
      />
      <CampusGround textures={textures} />
      {places.map((place) => (
        <CampusBuilding key={place.id} place={place} textures={textures} />
      ))}
      {treePositions.map((position, index) => (
        <Tree
          key={`${position[0]}-${position[2]}`}
          position={position}
          scale={0.72 + (index % 4) * 0.1}
          tone={index % 3}
        />
      ))}
      {rockPositions.map(([x, y, z, scale]) => (
        <Rock key={`${x}-${z}`} position={[x, y, z]} scale={scale} />
      ))}
      {lampPositions.map((position) => (
        <BollardLight key={`${position[0]}-${position[2]}`} position={position} />
      ))}
    </>
  )
}

function CampusGround({ textures }: { textures: SurfaceTextures }) {
  return (
    <group>
      <RoundedBox
        args={[17.5, 0.34, 14.5]}
        position={[-0.35, -0.19, 0]}
        radius={0.55}
        receiveShadow
      >
        <meshStandardMaterial
          bumpMap={textures.grass}
          bumpScale={0.055}
          color="#8fa482"
          map={textures.grass}
          roughness={0.96}
        />
      </RoundedBox>
      <mesh position={[7.15, -0.03, -0.15]} receiveShadow rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[5.4, 14.2]} />
        <meshPhysicalMaterial clearcoat={1} color="#4f929e" metalness={0.12} roughness={0.18} />
      </mesh>
      <mesh position={[2.2, 0.015, 0.72]} receiveShadow rotation={[-Math.PI / 2, 0, -0.5]}>
        <planeGeometry args={[0.92, 14.5]} />
        <meshStandardMaterial
          bumpMap={textures.stone}
          bumpScale={0.06}
          color="#d8d1c1"
          map={textures.stone}
          roughness={0.88}
        />
      </mesh>
      <mesh position={[-3.3, 0.02, 1.08]} receiveShadow rotation={[-Math.PI / 2, 0, 0.4]}>
        <planeGeometry args={[0.7, 9.8]} />
        <meshStandardMaterial
          bumpMap={textures.stone}
          bumpScale={0.06}
          color="#d8d1c1"
          map={textures.stone}
          roughness={0.88}
        />
      </mesh>
      <GardenBed position={[-4.4, 0.04, -0.7]} scale={[2.2, 1, 0.85]} />
      <GardenBed position={[1.7, 0.04, -2.55]} scale={[1.45, 1, 0.72]} />
      <GardenBed position={[2.35, 0.04, 3.95]} scale={[1.5, 1, 0.58]} />
      <PoolAndDeck textures={textures} />
    </group>
  )
}

function PoolAndDeck({ textures }: { textures: SurfaceTextures }) {
  return (
    <group position={[4.9, 0.04, 3.45]}>
      <mesh castShadow receiveShadow>
        <boxGeometry args={[3.35, 0.14, 2.8]} />
        <meshStandardMaterial
          bumpMap={textures.wood}
          bumpScale={0.045}
          color="#aa7c59"
          map={textures.wood}
          roughness={0.58}
        />
      </mesh>
      <mesh position={[0.42, 0.09, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[1.7, 2.35]} />
        <meshPhysicalMaterial
          clearcoat={1}
          clearcoatRoughness={0.08}
          color="#477f8b"
          metalness={0.16}
          opacity={0.94}
          roughness={0.12}
          transparent
        />
      </mesh>
      {[-0.7, 0, 0.7].map((z) => (
        <group key={z} position={[-1.05, 0.15, z]} rotation={[0, 0.12, 0]}>
          <mesh castShadow rotation={[0.12, 0, 0]}>
            <boxGeometry args={[0.62, 0.07, 0.28]} />
            <meshStandardMaterial color="#e5ded0" roughness={0.76} />
          </mesh>
          <mesh castShadow position={[0, 0.11, -0.16]} rotation={[-0.5, 0, 0]}>
            <boxGeometry args={[0.62, 0.08, 0.3]} />
            <meshStandardMaterial color="#ded5c5" roughness={0.8} />
          </mesh>
        </group>
      ))}
    </group>
  )
}

function GardenBed({
  position,
  scale,
}: {
  position: [number, number, number]
  scale: [number, number, number]
}) {
  return (
    <group position={position} scale={scale}>
      <mesh receiveShadow rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[1, 32]} />
        <meshStandardMaterial color="#455f43" roughness={1} />
      </mesh>
      {[-0.55, -0.15, 0.28, 0.62].map((x, index) => (
        <mesh castShadow key={x} position={[x, 0.14 + (index % 2) * 0.04, 0.06 * (index - 2)]}>
          <sphereGeometry args={[0.25 + (index % 2) * 0.05, 12, 8]} />
          <meshStandardMaterial color={index % 2 ? '#79916a' : '#5f7c55'} roughness={0.95} />
        </mesh>
      ))}
    </group>
  )
}

function CampusBuilding({ place, textures }: { place: CampusPlace; textures: SurfaceTextures }) {
  const [isHovered, setIsHovered] = useState(false)
  const [width, height, depth] = place.size

  return (
    <group
      onPointerOut={() => {
        document.body.style.cursor = 'auto'
        setIsHovered(false)
      }}
      onPointerOver={(event) => {
        event.stopPropagation()
        document.body.style.cursor = 'pointer'
        setIsHovered(true)
      }}
      position={place.position}
    >
      {place.id === 'stay' && (
        <StayVillage
          depth={depth}
          floors={place.floors}
          height={height}
          textures={textures}
          width={width}
        />
      )}
      {place.id !== 'stay' && place.id !== 'ocean' && (
        <ModernBuilding
          depth={depth}
          floors={place.floors}
          height={height}
          textures={textures}
          width={width}
        />
      )}
      {place.id === 'ocean' && <ModernDeckPavilion textures={textures} />}
      {isHovered && (
        <Html
          center
          distanceFactor={11}
          position={[0, height + 1.25, 0]}
          style={{ pointerEvents: 'none' }}
        >
          <div className="w-max max-w-[190px] rounded-lg border border-white/10 bg-navy-900/95 px-3 py-2 text-left text-[11px] leading-5 text-white shadow-lg backdrop-blur-sm">
            <strong className="block font-medium text-gold-300">{place.name}</strong>
            {place.description}
          </div>
        </Html>
      )}
    </group>
  )
}

function StayVillage({
  width,
  height,
  depth,
  floors,
  textures,
}: {
  width: number
  height: number
  depth: number
  floors: number
  textures: SurfaceTextures
}) {
  return (
    <group>
      <group rotation={[0, -0.04, 0]}>
        <ModernBuilding
          depth={depth * 0.6}
          floors={floors}
          height={height}
          textures={textures}
          width={width * 0.55}
        />
      </group>
      <group position={[-1.38, 0, 1.08]} rotation={[0, -0.24, 0]}>
        <ModernBuilding depth={1.04} floors={2} height={1.42} textures={textures} width={1.3} />
      </group>
      <group position={[1.42, 0, 1.02]} rotation={[0, 0.18, 0]}>
        <ModernBuilding depth={1.04} floors={2} height={1.42} textures={textures} width={1.3} />
      </group>
      <group position={[1.4, 0, -1.1]} rotation={[0, -0.12, 0]}>
        <ModernBuilding depth={1} floors={2} height={1.42} textures={textures} width={1.26} />
      </group>
    </group>
  )
}

function ModernBuilding({
  width,
  height,
  depth,
  floors,
  textures,
}: {
  width: number
  height: number
  depth: number
  floors: number
  textures: SurfaceTextures
}) {
  const facadeColumns = Array.from(
    { length: Math.max(4, Math.round(width * 2.4)) },
    (_, index) => index,
  )
  const floorHeight = height / floors
  const glassWidth = width * 0.76

  return (
    <group>
      <mesh castShadow receiveShadow position={[0, 0.06, 0]}>
        <boxGeometry args={[width + 0.44, 0.12, depth + 0.54]} />
        <meshStandardMaterial
          bumpMap={textures.stone}
          bumpScale={0.045}
          color="#c7beb0"
          map={textures.stone}
          roughness={0.84}
        />
      </mesh>
      <RoundedBox
        castShadow
        receiveShadow
        args={[width, height, depth]}
        position={[0, height / 2 + 0.12, 0]}
        radius={0.035}
      >
        <meshPhysicalMaterial
          bumpMap={textures.concrete}
          bumpScale={0.034}
          color="#e3ddd2"
          map={textures.concrete}
          roughness={0.72}
        />
      </RoundedBox>

      {Array.from({ length: floors }, (_, floor) => {
        const floorCenter = 0.12 + floorHeight * floor + floorHeight / 2
        return (
          <group key={floor}>
            <mesh position={[0.04, floorCenter, depth / 2 + 0.027]}>
              <boxGeometry args={[glassWidth, floorHeight * 0.68, 0.045]} />
              <meshPhysicalMaterial
                clearcoat={0.9}
                color={floor % 2 ? '#78949a' : '#66868d'}
                emissive="#b87638"
                emissiveIntensity={0.18}
                metalness={0.16}
                opacity={0.92}
                roughness={0.08}
                transparent
              />
            </mesh>
            <mesh position={[width / 2 + 0.027, floorCenter, 0]} rotation={[0, Math.PI / 2, 0]}>
              <boxGeometry args={[depth * 0.58, floorHeight * 0.58, 0.04]} />
              <meshPhysicalMaterial
                clearcoat={0.8}
                color="#708d92"
                metalness={0.14}
                opacity={0.88}
                roughness={0.1}
                transparent
              />
            </mesh>
            {floor > 0 && (
              <group position={[0, floorHeight * floor + 0.1, depth / 2 + 0.24]}>
                <mesh castShadow>
                  <boxGeometry args={[width * 0.78, 0.08, 0.52]} />
                  <meshStandardMaterial
                    bumpMap={textures.wood}
                    bumpScale={0.025}
                    color="#9c714f"
                    map={textures.wood}
                    roughness={0.58}
                  />
                </mesh>
                <mesh position={[0, 0.3, 0.24]}>
                  <boxGeometry args={[width * 0.72, 0.035, 0.035]} />
                  <meshPhysicalMaterial
                    color="#a8c1c3"
                    metalness={0.28}
                    opacity={0.62}
                    roughness={0.12}
                    transparent
                  />
                </mesh>
                {[-0.34, 0, 0.34].map((ratio) => (
                  <mesh key={ratio} position={[width * ratio, 0.16, 0.24]}>
                    <boxGeometry args={[0.025, 0.33, 0.025]} />
                    <meshStandardMaterial color="#404947" metalness={0.4} roughness={0.3} />
                  </mesh>
                ))}
              </group>
            )}
          </group>
        )
      })}

      {Array.from({ length: floors + 1 }, (_, level) => (
        <mesh castShadow key={level} position={[0, 0.12 + level * floorHeight, depth / 2 + 0.062]}>
          <boxGeometry args={[width * 0.88, 0.075, 0.12]} />
          <meshStandardMaterial
            color="#363f3e"
            map={textures.metal}
            metalness={0.32}
            roughness={0.38}
          />
        </mesh>
      ))}
      {facadeColumns.map((index) => {
        const x = -glassWidth / 2 + (glassWidth / (facadeColumns.length - 1)) * index
        return (
          <mesh castShadow key={index} position={[x, height / 2 + 0.12, depth / 2 + 0.074]}>
            <boxGeometry args={[0.045, height * 0.88, 0.06]} />
            <meshStandardMaterial
              bumpMap={textures.wood}
              bumpScale={0.025}
              color="#865d40"
              map={textures.wood}
              roughness={0.56}
            />
          </mesh>
        )
      })}

      <mesh castShadow position={[0.12, height + 0.21, 0]}>
        <boxGeometry args={[width + 0.48, 0.17, depth + 0.62]} />
        <meshStandardMaterial
          bumpMap={textures.metal}
          bumpScale={0.02}
          color="#4d5551"
          map={textures.metal}
          metalness={0.3}
          roughness={0.36}
        />
      </mesh>
      <mesh castShadow position={[-width / 2 + 0.15, height * 0.5, depth / 2 + 0.085]}>
        <boxGeometry args={[0.25, height * 0.86, depth * 0.045]} />
        <meshStandardMaterial
          bumpMap={textures.wood}
          bumpScale={0.04}
          color="#9c6f4c"
          map={textures.wood}
          roughness={0.6}
        />
      </mesh>
      <mesh castShadow position={[0, 0.14, depth / 2 + 0.42]}>
        <boxGeometry args={[width * 0.9, 0.11, 0.76]} />
        <meshStandardMaterial
          bumpMap={textures.wood}
          bumpScale={0.045}
          color="#a47755"
          map={textures.wood}
          roughness={0.58}
        />
      </mesh>
      {[0, 1, 2].map((step) => (
        <mesh
          castShadow
          key={step}
          position={[0, 0.058 + step * 0.038, depth / 2 + 0.84 + step * 0.12]}
        >
          <boxGeometry args={[width * 0.46, 0.075, 0.24]} />
          <meshStandardMaterial
            bumpMap={textures.stone}
            bumpScale={0.035}
            color="#cec6b8"
            map={textures.stone}
            roughness={0.86}
          />
        </mesh>
      ))}
      <group position={[width * 0.29, height + 0.38, 0]}>
        <mesh castShadow>
          <boxGeometry args={[width * 0.22, 0.32, depth * 0.42]} />
          <meshStandardMaterial color="#5d7557" roughness={0.95} />
        </mesh>
        {[-0.22, 0, 0.22].map((offset) => (
          <mesh castShadow key={offset} position={[offset * width * 0.3, 0.27, offset]}>
            <sphereGeometry args={[Math.min(0.21, width * 0.085), 16, 11]} />
            <meshStandardMaterial color="#78906b" roughness={0.96} />
          </mesh>
        ))}
      </group>
      <group position={[-width * 0.28, height + 0.35, -depth * 0.12]}>
        <mesh castShadow>
          <boxGeometry args={[width * 0.16, 0.28, depth * 0.24]} />
          <meshStandardMaterial
            color="#5a625e"
            map={textures.metal}
            metalness={0.28}
            roughness={0.4}
          />
        </mesh>
      </group>
    </group>
  )
}

function ModernDeckPavilion({ textures }: { textures: SurfaceTextures }) {
  return (
    <group position={[-1.02, 0.12, 0]}>
      {[-0.48, 0.48].flatMap((x) =>
        [-0.42, 0.42].map((z) => (
          <mesh castShadow key={`${x}-${z}`} position={[x, 0.65, z]}>
            <boxGeometry args={[0.065, 1.3, 0.065]} />
            <meshStandardMaterial
              color="#3d4645"
              map={textures.metal}
              metalness={0.32}
              roughness={0.34}
            />
          </mesh>
        )),
      )}
      <mesh castShadow position={[0, 1.33, 0]}>
        <boxGeometry args={[1.45, 0.13, 1.35]} />
        <meshStandardMaterial
          bumpMap={textures.metal}
          bumpScale={0.025}
          color="#505854"
          map={textures.metal}
          metalness={0.3}
          roughness={0.34}
        />
      </mesh>
      <mesh position={[0, 0.65, 0.48]}>
        <boxGeometry args={[1.02, 0.94, 0.025]} />
        <meshPhysicalMaterial
          clearcoat={0.7}
          color="#729399"
          opacity={0.56}
          roughness={0.08}
          transparent
        />
      </mesh>
      {[-0.44, -0.22, 0, 0.22, 0.44].map((x) => (
        <mesh castShadow key={x} position={[x, 0.67, -0.52]}>
          <boxGeometry args={[0.055, 1.12, 0.1]} />
          <meshStandardMaterial
            bumpMap={textures.wood}
            bumpScale={0.035}
            color="#9b704f"
            map={textures.wood}
            roughness={0.6}
          />
        </mesh>
      ))}
    </group>
  )
}

function Tree({
  position,
  scale,
  tone,
}: {
  position: [number, number, number]
  scale: number
  tone: number
}) {
  const foliage = ['#34583f', '#44684a', '#536f49'][tone]

  return (
    <group position={position} rotation={[0, position[0] * 0.37, 0]} scale={scale}>
      <mesh castShadow position={[0, 0.52, 0]}>
        <cylinderGeometry args={[0.1, 0.18, 1.04, 10]} />
        <meshStandardMaterial color="#684d38" roughness={0.94} />
      </mesh>
      <mesh castShadow position={[0, 1.32, 0]}>
        <icosahedronGeometry args={[0.66, 2]} />
        <meshStandardMaterial color={foliage} roughness={0.92} />
      </mesh>
      <mesh castShadow position={[0.35, 1.15, 0.16]}>
        <icosahedronGeometry args={[0.43, 2]} />
        <meshStandardMaterial color="#617d54" roughness={0.94} />
      </mesh>
      <mesh castShadow position={[-0.28, 1.13, -0.2]}>
        <icosahedronGeometry args={[0.38, 2]} />
        <meshStandardMaterial color="#3e6649" roughness={0.94} />
      </mesh>
    </group>
  )
}

function Rock({ position, scale }: { position: [number, number, number]; scale: number }) {
  return (
    <mesh
      castShadow
      position={position}
      rotation={[0.2, position[0] * 0.4, -0.08]}
      scale={[scale * 1.5, scale, scale]}
    >
      <dodecahedronGeometry args={[1, 1]} />
      <meshStandardMaterial color="#a8aaa0" roughness={0.98} />
    </mesh>
  )
}

function BollardLight({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      <mesh castShadow position={[0, 0.21, 0]}>
        <cylinderGeometry args={[0.055, 0.075, 0.42, 12]} />
        <meshStandardMaterial color="#303737" metalness={0.4} roughness={0.36} />
      </mesh>
      <mesh position={[0, 0.4, 0]}>
        <sphereGeometry args={[0.07, 12, 8]} />
        <meshStandardMaterial color="#ffe1a4" emissive="#ffb65d" emissiveIntensity={3} />
      </mesh>
    </group>
  )
}
