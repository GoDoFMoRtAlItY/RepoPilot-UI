import React, { useRef } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { Sphere, MeshDistortMaterial } from '@react-three/drei'
import * as THREE from 'three'

function AnimatedCore() {
  const meshRef = useRef<THREE.Mesh>(null)

  useFrame((state) => {
    if (!meshRef.current) return
    
    // Slow rotation
    meshRef.current.rotation.x = state.clock.getElapsedTime() * 0.2
    meshRef.current.rotation.y = state.clock.getElapsedTime() * 0.3
  })

  return (
    <Sphere ref={meshRef} args={[1, 64, 64]} scale={1.2}>
      <MeshDistortMaterial
        color="#8b5cf6"
        attach="material"
        distort={0.4}
        speed={2.5}
        roughness={0.2}
        metalness={0.8}
      />
    </Sphere>
  )
}

function OrbitingRings() {
  const ringsRef = useRef<THREE.Group>(null)

  useFrame((state) => {
    if (!ringsRef.current) return
    ringsRef.current.rotation.z = state.clock.getElapsedTime() * 0.15
    ringsRef.current.rotation.x = Math.sin(state.clock.getElapsedTime() * 0.2) * 0.2
    ringsRef.current.rotation.y = state.clock.getElapsedTime() * 0.1
  })

  return (
    <group ref={ringsRef}>
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[2.2, 0.015, 16, 100]} />
        <meshStandardMaterial color="#3b82f6" emissive="#3b82f6" emissiveIntensity={0.8} />
      </mesh>
      <mesh rotation={[0, Math.PI / 4, 0]}>
        <torusGeometry args={[2.6, 0.015, 16, 100]} />
        <meshStandardMaterial color="#ec4899" emissive="#ec4899" emissiveIntensity={0.8} />
      </mesh>
      <mesh rotation={[Math.PI / 3, Math.PI / 3, 0]}>
        <torusGeometry args={[3.0, 0.015, 16, 100]} />
        <meshStandardMaterial color="#10b981" emissive="#10b981" emissiveIntensity={0.8} />
      </mesh>
    </group>
  )
}

function SceneGroup() {
  const groupRef = useRef<THREE.Group>(null)

  useFrame((state) => {
    if (!groupRef.current) return
    
    // Make the entire model look towards the cursor gently
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
        <ambientLight intensity={0.5} />
        <directionalLight position={[10, 10, 5]} intensity={1.5} />
        <pointLight position={[-10, -10, -5]} intensity={1} color="#8b5cf6" />
        <pointLight position={[0, 10, -5]} intensity={1} color="#3b82f6" />
        
        <SceneGroup />
      </Canvas>
    </div>
  )
}
