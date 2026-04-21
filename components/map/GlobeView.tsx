"use client"

import { useRef, useState, useMemo, useCallback, Suspense } from "react"
import { Canvas, useFrame } from "@react-three/fiber"
import { OrbitControls, Stars, Html, useTexture } from "@react-three/drei"
import * as THREE from "three"
import { formatDate } from "@/lib/utils"

// ─── Types ────────────────────────────────────────────────────────────────────
interface Memory {
  id: string
  title: string
  story?: string
  latitude: number
  longitude: number
  date: string
  emotion?: string
  photos?: { url: string }[]
  user?: { name: string; inventories?: any[] }
}

type CardTheme = {
    border: string
    background: string
    shadow: string
    imageFilter: string
    radius: string
    contentPadding: string
    titleColor: string
    storyColor: string
    footerBorder: string
    footerTextColor: string
}

function parseTheme(rawValue: string | null | undefined): CardTheme | null {
    if (!rawValue) return null
    try { return JSON.parse(rawValue) } catch { return null }
}

interface GlobeViewProps {
  memories: Memory[]
}

// ─── Constants ────────────────────────────────────────────────────────────────
const GLOBE_RADIUS = 2.2
const DOT_RADIUS = 0.028

/**
 * Jarak minimum antar-pin (world-space). DOT_RADIUS * 2.8 memberi
 * sedikit ruang antar-pin agar tidak saling menyentuh.
 */
const MIN_SEPARATION = DOT_RADIUS * 2.8

/**
 * Ambang jarak sudut (radian) untuk menganggap dua pin "berdekatan".
 * ~0.08 rad ≈ ~500 km di permukaan bumi.
 */
const CLUSTER_ANGLE_THRESHOLD = 0.08

// ─── Helpers ──────────────────────────────────────────────────────────────────
function latLngToVec3(lat: number, lng: number, radius: number): THREE.Vector3 {
  const phi = (90 - lat) * (Math.PI / 180)
  const theta = (lng + 180) * (Math.PI / 180)
  return new THREE.Vector3(
    -(radius * Math.sin(phi) * Math.cos(theta)),
    radius * Math.cos(phi),
    radius * Math.sin(phi) * Math.sin(theta)
  )
}

/** Jarak sudut (radian) antara dua titik lat/lng — Haversine */
function angularDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const toRad = (d: number) => (d * Math.PI) / 180
  const dLat = toRad(lat2 - lat1)
  const dLng = toRad(lng2 - lng1)
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2
  return 2 * Math.asin(Math.sqrt(a))
}

/**
 * Hitung posisi akhir setiap pin dengan algoritma spiral Fibonacci
 * agar pin yang berdekatan tidak tumpang tindih.
 *
 * - Pin pertama di setiap cluster tetap di posisi asli.
 * - Pin berikutnya disebar melingkar dengan golden-angle spiral
 *   pada tangent-plane di titik pusat cluster.
 * - Hasil diproyeksikan kembali ke permukaan bola.
 */
function computeSpreadPositions(memories: Memory[]): Map<string, THREE.Vector3> {
  const result = new Map<string, THREE.Vector3>()
  const assigned = new Set<string>()

  for (let i = 0; i < memories.length; i++) {
    if (assigned.has(memories[i].id)) continue

    // Kumpulkan semua pin dalam radius cluster dari memories[i]
    const group: Memory[] = [memories[i]]
    for (let j = i + 1; j < memories.length; j++) {
      if (assigned.has(memories[j].id)) continue
      const dist = angularDistance(
        memories[i].latitude, memories[i].longitude,
        memories[j].latitude, memories[j].longitude
      )
      if (dist < CLUSTER_ANGLE_THRESHOLD) group.push(memories[j])
    }

    group.forEach((m) => assigned.add(m.id))

    // Hanya satu pin — posisi normal
    if (group.length === 1) {
      result.set(
        group[0].id,
        latLngToVec3(group[0].latitude, group[0].longitude, GLOBE_RADIUS + DOT_RADIUS * 0.5)
      )
      continue
    }

    // Pusat cluster (rata-rata lat/lng)
    const centerLat = group.reduce((s, m) => s + m.latitude, 0) / group.length
    const centerLng = group.reduce((s, m) => s + m.longitude, 0) / group.length
    const centerVec = latLngToVec3(centerLat, centerLng, GLOBE_RADIUS + DOT_RADIUS * 0.5)

    // Bangun basis lokal (tangent plane) di titik pusat
    const normal = centerVec.clone().normalize()
    let tangentU = new THREE.Vector3().crossVectors(new THREE.Vector3(0, 1, 0), normal).normalize()
    if (tangentU.lengthSq() < 0.001) {
      // normal sejajar dengan sumbu Y — pakai Z sebagai gantinya
      tangentU = new THREE.Vector3().crossVectors(new THREE.Vector3(0, 0, 1), normal).normalize()
    }
    const tangentV = new THREE.Vector3().crossVectors(normal, tangentU).normalize()

    // Susun pin secara spiral golden-angle
    group.forEach((mem, idx) => {
      if (idx === 0) {
        // Pin pertama di pusat cluster
        result.set(mem.id, centerVec.clone())
        return
      }

      // Golden angle spiral: setiap pin bergeser ~137.508° dari sebelumnya
      const angleRad = (idx * 137.508 * Math.PI) / 180
      const ring = Math.ceil(idx / 6)            // semakin banyak pin → semakin jauh
      const spreadRadius = MIN_SEPARATION * ring * 1.1

      const offset = tangentU
        .clone()
        .multiplyScalar(Math.cos(angleRad) * spreadRadius)
        .add(tangentV.clone().multiplyScalar(Math.sin(angleRad) * spreadRadius))

      // Proyeksikan ke permukaan bola
      const displaced = centerVec.clone().add(offset)
      displaced.normalize().multiplyScalar(GLOBE_RADIUS + DOT_RADIUS * 0.5)

      result.set(mem.id, displaced)
    })
  }

  return result
}

// ─── Emotion → Color ──────────────────────────────────────────────────────────
const emotionColors: Record<string, string> = {
  Bahagia: "#fbbf24",
  Nostalgia: "#a78bfa",
  Romantis: "#f472b6",
  Petualangan: "#34d399",
  Sedih: "#60a5fa",
  Haru: "#f87171",
  Marah: "#ef4444",
  Takjub: "#22d3ee",
  default: "#818cf8",
}

function getEmotionColor(emotion?: string): string {
  if (!emotion) return emotionColors.default
  return emotionColors[emotion] ?? emotionColors.default
}

// ─── Earth Globe with Texture ─────────────────────────────────────────────────
function Globe() {
  const [colorMap, normalMap, specularMap] = useTexture([
    "https://unpkg.com/three-globe/example/img/earth-blue-marble.jpg",
    "https://unpkg.com/three-globe/example/img/earth-topology.png",
    "https://unpkg.com/three-globe/example/img/earth-water.png",
  ])

  return (
    <mesh receiveShadow>
      <sphereGeometry args={[GLOBE_RADIUS, 64, 64]} />
      <meshPhongMaterial
        map={colorMap}
        bumpMap={normalMap}
        bumpScale={0.05}
        specularMap={specularMap}
        specular={new THREE.Color(0x4488aa)}
        shininess={12}
      />
    </mesh>
  )
}

// ─── Globe Wireframe Grid ─────────────────────────────────────────────────────
function GlobeGrid() {
  const points = useMemo(() => {
    const lines: THREE.BufferGeometry[] = []
    const R = GLOBE_RADIUS + 0.002

    for (let lat = -80; lat <= 80; lat += 20) {
      const pts: THREE.Vector3[] = []
      for (let lng = 0; lng <= 360; lng += 3) pts.push(latLngToVec3(lat, lng - 180, R))
      lines.push(new THREE.BufferGeometry().setFromPoints(pts))
    }
    for (let lng = -180; lng < 180; lng += 20) {
      const pts: THREE.Vector3[] = []
      for (let lat = -90; lat <= 90; lat += 3) pts.push(latLngToVec3(lat, lng, R))
      lines.push(new THREE.BufferGeometry().setFromPoints(pts))
    }
    return lines
  }, [])

  return (
    <group>
      {points.map((geo, i) => (
        <line key={i}>
          <primitive object={geo} attach="geometry" />
          <lineBasicMaterial attach="material" color="#8899cc" transparent opacity={0.15} />
        </line>
      ))}
    </group>
  )
}

// ─── Atmosphere Glow ─────────────────────────────────────────────────────────
function Atmosphere() {
  const material = useMemo(
    () =>
      new THREE.MeshPhongMaterial({
        color: new THREE.Color(0x4488cc),
        transparent: true,
        opacity: 0.08,
        side: THREE.FrontSide,
        depthWrite: false,
      }),
    []
  )
  return (
    <mesh>
      <sphereGeometry args={[GLOBE_RADIUS * 1.045, 48, 48]} />
      <primitive object={material} attach="material" />
    </mesh>
  )
}

// ─── Night Lights Layer ───────────────────────────────────────────────────────
function NightLights() {
  const nightMap = useTexture("https://unpkg.com/three-globe/example/img/earth-night.jpg")
  const material = useMemo(
    () =>
      new THREE.MeshBasicMaterial({
        map: nightMap,
        transparent: true,
        opacity: 0.35,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      }),
    [nightMap]
  )
  return (
    <mesh>
      <sphereGeometry args={[GLOBE_RADIUS + 0.001, 64, 64]} />
      <primitive object={material} attach="material" />
    </mesh>
  )
}

// ─── Memory Dot ───────────────────────────────────────────────────────────────
interface MemoryDotProps {
  memory: Memory
  position: THREE.Vector3
  onHover: (memory: Memory | null, position: THREE.Vector3 | null) => void
}

function MemoryDot({ memory, position, onHover }: MemoryDotProps) {
  const meshRef = useRef<THREE.Mesh>(null)
  const [hovered, setHovered] = useState(false)
  const color = getEmotionColor(memory.emotion)

  useFrame((state) => {
    if (!meshRef.current) return
    const t = state.clock.getElapsedTime()
    const pulse = 1 + (hovered ? 0.5 : 0.2) * Math.sin(t * 3 + memory.latitude)
    meshRef.current.scale.setScalar(pulse)
  })

  const mat = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: new THREE.Color(color),
        emissive: new THREE.Color(color),
        emissiveIntensity: hovered ? 3.5 : 1.8,
        roughness: 0.1,
        metalness: 0.3,
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [color, hovered]
  )

  return (
    <mesh
      ref={meshRef}
      position={position}
      onPointerEnter={(e) => {
        e.stopPropagation()
        setHovered(true)
        onHover(memory, position)
        document.body.style.cursor = "pointer"
      }}
      onPointerLeave={(e) => {
        e.stopPropagation()
        setHovered(false)
        onHover(null, null)
        document.body.style.cursor = "default"
      }}
    >
      <sphereGeometry args={[DOT_RADIUS, 12, 12]} />
      <primitive object={mat} attach="material" />
    </mesh>
  )
}

// ─── Hover Card ───────────────────────────────────────────────────────────────
interface HoverCardProps {
  memory: Memory
  position: THREE.Vector3
}

function HoverCard({ memory, position }: HoverCardProps) {
  const rawTheme = memory.user?.inventories?.[0]?.item?.value ?? null
  const theme = parseTheme(rawTheme)
  const footerBorderColor = theme ? (
      theme.footerBorder.includes("neutral-200") ? "rgba(200,200,200,0.3)" :
      theme.footerBorder.includes("amber-900") ? "rgba(100,60,10,0.4)" :
      theme.footerBorder.includes("indigo") ? "rgba(99,102,241,0.2)" :
      "rgba(255,255,255,0.08)"
  ) : "rgba(255,255,255,0.06)"

  const photos = (memory.photos ?? []).map((p: any) => {
      try {
          const parsed = JSON.parse(p.url)
          return { ...p, url: parsed.url || parsed.path, bucket: parsed.bucket }
      } catch {
          return p
      }
  })

  return (
    <Html
      position={position}
      distanceFactor={6}
      style={{ pointerEvents: "none" }}
      zIndexRange={[100, 200]}
      occlude={false}
    >
      <div
        style={{
          width: "220px",
          background: theme?.background ?? "rgba(8,8,20,0.92)",
          border: theme?.border ?? "1px solid rgba(99,102,241,0.3)",
          borderRadius: theme?.radius ?? "16px",
          backdropFilter: "blur(20px)",
          boxShadow: theme?.shadow ?? "0 20px 60px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.04)",
          overflow: "hidden",
          transform: "translate(-50%, calc(-100% - 20px))",
          fontFamily: "Outfit, sans-serif",
        }}
      >
        {photos.length > 0 && (
          <div style={{ width: "100%", height: "90px", overflow: "hidden", position: "relative" }}>
            <img
              src={photos[0].url}
              alt=""
              style={{ width: "100%", height: "100%", objectFit: "cover" }}
            />
            <div
              style={{
                position: "absolute",
                inset: 0,
                background: "linear-gradient(to top, rgba(0,0,0,0.8), transparent)",
              }}
            />
          </div>
        )}
        <div style={{ ...(!theme && { padding: "12px" }), ...(theme && { padding: theme.contentPadding.includes("pb-6") ? "12px 12px 24px 12px" : "12px" }) }}>
          <p
            style={{
              margin: 0,
              fontSize: "13px",
              fontWeight: 700,
              color: theme?.titleColor ?? "#fff",
              lineHeight: 1.3,
              marginBottom: "4px",
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}
          >
            {memory.title}
          </p>
          {memory.story && (
            <p
              style={{
                margin: 0,
                fontSize: "11px",
                color: theme?.storyColor ?? "#94a3b8",
                lineHeight: 1.5,
                display: "-webkit-box",
                WebkitLineClamp: 2,
                WebkitBoxOrient: "vertical",
                overflow: "hidden",
                marginBottom: "8px",
              }}
            >
              {memory.story}
            </p>
          )}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              paddingTop: "8px",
              borderTop: `1px solid ${footerBorderColor}`,
            }}
          >
            <span style={{ fontSize: "10px", color: theme?.storyColor ?? "#6366f1", fontWeight: 600 }}>
              {memory.user?.name ?? "Anonim"}
            </span>
            <span style={{ fontSize: "10px", color: theme?.storyColor ?? "#475569" }}>
              {formatDate(memory.date)}
            </span>
          </div>
        </div>
        <div
          style={{
            position: "absolute",
            bottom: "-8px",
            left: "50%",
            transform: "translateX(-50%)",
            width: 0,
            height: 0,
            borderLeft: "8px solid transparent",
            borderRight: "8px solid transparent",
            borderTop: "8px solid rgba(99,102,241,0.3)",
          }}
        />
      </div>
    </Html>
  )
}

// ─── Auto-rotating Globe Group ────────────────────────────────────────────────
interface GlobeGroupProps {
  memories: Memory[]
  spreadPositions: Map<string, THREE.Vector3>
  onHover: (memory: Memory | null, position: THREE.Vector3 | null) => void
  isInteracting: boolean
  isPinHovered: boolean
}

function GlobeGroup({ memories, spreadPositions, onHover, isInteracting, isPinHovered }: GlobeGroupProps) {
  const groupRef = useRef<THREE.Group>(null)

  useFrame((_, delta) => {
    if (!groupRef.current || isInteracting || isPinHovered) return
    groupRef.current.rotation.y += delta * 0.08
  })

  return (
    <group ref={groupRef}>
      <Globe />
      <NightLights />
      <GlobeGrid />
      <Atmosphere />
      {memories.map((mem) => {
        const pos = spreadPositions.get(mem.id)
        if (!pos) return null
        return <MemoryDot key={mem.id} memory={mem} position={pos} onHover={onHover} />
      })}
    </group>
  )
}

// ─── Scene ────────────────────────────────────────────────────────────────────
interface SceneProps {
  memories: Memory[]
}

function Scene({ memories }: SceneProps) {
  const [hoveredMemory, setHoveredMemory] = useState<Memory | null>(null)
  const [hoveredPosition, setHoveredPosition] = useState<THREE.Vector3 | null>(null)
  const [isInteracting, setIsInteracting] = useState(false)

  // Hitung posisi spread satu kali — di-memoize agar tidak re-compute setiap frame
  const spreadPositions = useMemo(() => computeSpreadPositions(memories), [memories])

  const handleHover = useCallback(
    (memory: Memory | null, position: THREE.Vector3 | null) => {
      setHoveredMemory(memory)
      setHoveredPosition(position)
    },
    []
  )

  return (
    <>
      <ambientLight intensity={0.4} />
      <directionalLight position={[5, 3, 5]} intensity={2.0} color="#fff5e0" castShadow />
      <directionalLight position={[-4, -2, -4]} intensity={0.15} color="#aabbd0" />
      <pointLight position={[0, 6, 0]} intensity={0.2} color="#9ab0d0" distance={20} />

      <Stars radius={80} depth={50} count={3000} factor={3} saturation={0} fade speed={0.3} />

      <GlobeGroup
        memories={memories}
        spreadPositions={spreadPositions}
        onHover={handleHover}
        isInteracting={isInteracting}
        isPinHovered={hoveredMemory !== null}
      />

      {hoveredMemory && hoveredPosition && (
        <HoverCard memory={hoveredMemory} position={hoveredPosition} />
      )}

      <OrbitControls
        enablePan={false}
        enableZoom={true}
        minDistance={3.5}
        maxDistance={9}
        rotateSpeed={0.6}
        zoomSpeed={0.8}
        onStart={() => setIsInteracting(true)}
        onEnd={() => setIsInteracting(false)}
        makeDefault
      />
    </>
  )
}

// ─── Main Export ──────────────────────────────────────────────────────────────
export default function GlobeView({ memories }: GlobeViewProps) {
  const safeMemories = useMemo(
    () =>
      (Array.isArray(memories) ? memories : []).filter(
        (m) => m.latitude != null && m.longitude != null
      ),
    [memories]
  )

  return (
    <div className="w-full h-full" style={{ background: "transparent" }}>
      <Canvas
        camera={{ position: [0, 0, 6.5], fov: 45, near: 0.1, far: 200 }}
        gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
        dpr={[1, 2]}
        style={{ background: "transparent" }}
      >
        <Suspense fallback={null}>
          <Scene memories={safeMemories} />
        </Suspense>
      </Canvas>

      <div
        className="absolute top-6 right-6 z-20 hidden sm:flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium text-neutral-400 backdrop-blur-md border border-white/10 pointer-events-none"
        style={{ background: "rgba(8,8,16,0.7)" }}
      >
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
          <circle cx="7" cy="7" r="6" stroke="currentColor" strokeWidth="1.2" />
          <path d="M5 7h4M7 5v4" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
        </svg>
        Drag untuk putar · Scroll untuk zoom
      </div>
    </div>
  )
}