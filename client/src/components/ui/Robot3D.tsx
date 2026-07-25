import React, { useRef } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { Sphere, MeshDistortMaterial } from '@react-three/drei'
import * as THREE from 'three'

function AnimatedCore() {
  const meshRef = useRef<THREE.Mesh>(null)

  useFrame((state) => {
    if (!meshRef.current) return
    meshRef.current.rotation.x = state.clock.getElapsedTime() * 0.18
    meshRef.current.rotation.y = state.clock.getElapsedTime() * 0.25
  })

  return (
    <Sphere ref={meshRef} args={[1, 64, 64]} scale={1.2}>
      <MeshDistortMaterial
        color="#7c3aed"
        attach="material"
        distort={0.35}
        speed={2.2}
        roughness={0.15}
        metalness={0.85}
      />
    </Sphere>
  )
}

function OrbitingRings() {
  const ringsRef = useRef<THREE.Group>(null)

  useFrame((state) => {
    if (!ringsRef.current) return
    const t = state.clock.getElapsedTime()
    ringsRef.current.rotation.z = t * 0.18
    ringsRef.current.rotation.x = Math.sin(t * 0.22) * 0.25
    ringsRef.current.rotation.y = t * 0.12
  })

  return (
    <group ref={ringsRef}>
      {/* Blue Ring */}
      <mesh rotation={[Math.PI / 2.2, 0.2, 0]}>
        <torusGeometry args={[2.3, 0.028, 32, 160]} />
        <meshStandardMaterial
          color="#3b82f6"
          emissive="#3b82f6"
          emissiveIntensity={1.8}
          roughness={0.1}
        />
      </mesh>

      {/* Prominent Smooth Pink Orbital Loop */}
      <mesh rotation={[0.4, Math.PI / 3.2, -0.2]}>
        <torusGeometry args={[2.75, 0.032, 32, 180]} />
        <meshStandardMaterial
          color="#ec4899"
          emissive="#ec4899"
          emissiveIntensity={2.2}
          roughness={0.1}
        />
      </mesh>

      {/* Prominent Smooth Green Orbital Loop */}
      <mesh rotation={[-Math.PI / 3, Math.PI / 2.5, 0.4]}>
        <torusGeometry args={[3.2, 0.034, 32, 200]} />
        <meshStandardMaterial
          color="#10b981"
          emissive="#10b981"
          emissiveIntensity={2.4}
          roughness={0.1}
        />
      </mesh>
    </group>
  )
}

function SceneGroup() {
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
      <AnimatedCore />
      <OrbitingRings />
    </group>
  )
}

export default function Robot3D() {
  return (
    <div className="w-full h-full pointer-events-none">
      <Canvas camera={{ position: [0, 0, 9], fov: 45 }}>
        <ambientLight intensity={0.7} />
        <directionalLight position={[10, 10, 5]} intensity={2.0} />
        <pointLight position={[-10, -10, -5]} intensity={1.5} color="#ec4899" />
        <pointLight position={[0, 10, -5]} intensity={1.5} color="#10b981" />
        <SceneGroup />
      </Canvas>
    </div>
  )
}
