import React, { useRef } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { Sphere, MeshDistortMaterial } from '@react-three/drei'
import * as THREE from 'three'
import { useUIStore } from '../../store/useUIStore'

function AnimatedCore({ isLight }: { isLight: boolean }) {
  const meshRef = useRef<THREE.Mesh>(null)

  useFrame((state) => {
    if (!meshRef.current) return
    meshRef.current.rotation.x = state.clock.getElapsedTime() * 0.2
    meshRef.current.rotation.y = state.clock.getElapsedTime() * 0.3
  })

  return (
    <Sphere ref={meshRef} args={[1, 64, 64]} scale={1.2}>
      <MeshDistortMaterial
        color={isLight ? "#a855f7" : "#8b5cf6"}
        attach="material"
        distort={0.35}
        speed={2.2}
        roughness={0.15}
        metalness={0.85}
      />
    </Sphere>
  )
}

function OrbitingRings({ isLight }: { isLight: boolean }) {
  const ringsRef = useRef<THREE.Group>(null)

  useFrame((state) => {
    if (!ringsRef.current) return
    ringsRef.current.rotation.z = state.clock.getElapsedTime() * 0.15
    ringsRef.current.rotation.x = Math.sin(state.clock.getElapsedTime() * 0.2) * 0.2
    ringsRef.current.rotation.y = state.clock.getElapsedTime() * 0.1
  })

  const ringColors = isLight
    ? { ring1: "#38bdf8", ring2: "#f472b6", ring3: "#60a5fa" }
    : { ring1: "#22d3ee", ring2: "#a855f7", ring3: "#06b6d4" }

  return (
    <group ref={ringsRef}>
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[2.2, 0.025, 16, 100]} />
        <meshStandardMaterial color={ringColors.ring1} emissive={ringColors.ring1} emissiveIntensity={1.6} />
      </mesh>
      <mesh rotation={[0, Math.PI / 4, 0]}>
        <torusGeometry args={[2.6, 0.025, 16, 100]} />
        <meshStandardMaterial color={ringColors.ring2} emissive={ringColors.ring2} emissiveIntensity={1.6} />
      </mesh>
      <mesh rotation={[Math.PI / 3, Math.PI / 3, 0]}>
        <torusGeometry args={[3.0, 0.025, 16, 100]} />
        <meshStandardMaterial color={ringColors.ring3} emissive={ringColors.ring3} emissiveIntensity={1.6} />
      </mesh>
    </group>
  )
}

function SceneGroup({ isLight }: { isLight: boolean }) {
  const groupRef = useRef<THREE.Group>(null)

  useFrame((state) => {
    if (!groupRef.current) return
    const targetX = (state.pointer.x * Math.PI) / 4
    const targetY = (state.pointer.y * Math.PI) / 4
    groupRef.current.rotation.y += 0.05 * (targetX - groupRef.current.rotation.y)
    groupRef.current.rotation.x += 0.05 * (targetY - groupRef.current.rotation.x)
  })

  return (
    <group ref={groupRef}>
      <AnimatedCore isLight={isLight} />
      <OrbitingRings isLight={isLight} />
    </group>
  )
}

export default function Robot3D() {
  const { theme } = useUIStore()
  const isLight = theme === 'light'

  return (
    <div className="w-full h-full pointer-events-none">
      <Canvas camera={{ position: [0, 0, 9], fov: 45 }}>
        <ambientLight intensity={isLight ? 0.9 : 0.6} />
        <directionalLight position={[10, 10, 5]} intensity={isLight ? 2.2 : 1.8} />
        <pointLight position={[-10, -10, -5]} intensity={2.0} color={isLight ? "#f472b6" : "#a855f7"} />
        <pointLight position={[0, 10, -5]} intensity={2.0} color={isLight ? "#38bdf8" : "#22d3ee"} />
        
        <SceneGroup isLight={isLight} />
      </Canvas>
    </div>
  )
}
