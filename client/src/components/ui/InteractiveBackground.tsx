import { useEffect, useState } from 'react'
import { motion, useSpring } from 'framer-motion'
import { useLocation } from 'react-router-dom'
import Robot3D from './Robot3D'
import { useUIStore } from '../../store/useUIStore'

export default function InteractiveBackground({ children }: { children: React.ReactNode }) {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 })
  const { theme } = useUIStore()
  const isLight = theme === 'light'
  
  const location = useLocation()
  const isDashboard = location.pathname.startsWith('/repo')

  const springX = useSpring(0, { stiffness: 50, damping: 20 })
  const springY = useSpring(0, { stiffness: 50, damping: 20 })

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({ x: e.clientX, y: e.clientY })
    }
    window.addEventListener('mousemove', handleMouseMove)
    return () => window.removeEventListener('mousemove', handleMouseMove)
  }, [])

  useEffect(() => {
    springX.set(mousePosition.x)
    springY.set(mousePosition.y)
  }, [mousePosition, springX, springY])

  return (
    <div className="relative min-h-screen w-full bg-[var(--bg-primary)] overflow-hidden text-[var(--text-primary)] transition-colors duration-500">

      {/* ── LIGHT MODE background — Soft Pink & Sky Blue Aurora Borealis Glow ── */}
      {isLight && (
        <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
          <div className="absolute inset-0 bg-[#F8FAFC]" />

          {/* Subtly Centered Aurora Glow behind Orbits — Soft Pink & Sky Blue */}
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[520px] h-[520px] pointer-events-none z-0">
            {/* Blob 1: Soft Pink Glow Layer */}
            <motion.div
              animate={{
                scale: [1, 1.12, 0.95, 1],
                rotate: [0, 90, 180, 360],
                opacity: [0.35, 0.45, 0.35]
              }}
              transition={{ duration: 18, repeat: Infinity, ease: 'easeInOut' }}
              className="absolute inset-0 rounded-full blur-[80px]"
              style={{
                background: 'radial-gradient(circle at 40% 40%, rgba(244, 114, 182, 0.45) 0%, rgba(236, 72, 153, 0.25) 45%, transparent 70%)',
              }}
            />
            {/* Blob 2: Sky Blue Glow Layer */}
            <motion.div
              animate={{
                scale: [1.1, 0.95, 1.15, 1.1],
                rotate: [360, 270, 90, 0],
                opacity: [0.30, 0.42, 0.30]
              }}
              transition={{ duration: 22, repeat: Infinity, ease: 'easeInOut' }}
              className="absolute inset-0 rounded-full blur-[80px]"
              style={{
                background: 'radial-gradient(circle at 60% 60%, rgba(56, 189, 248, 0.45) 0%, rgba(96, 165, 250, 0.25) 45%, transparent 70%)',
              }}
            />
          </div>
        </div>
      )}

      {/* ── DARK MODE background — Violet & Turquoise Aurora Borealis Glow ── */}
      {!isLight && (
        <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
          {/* Deep dark space base */}
          <div className="absolute inset-0 bg-[#0b0f19]" />

          {/* Subtly Centered Aurora Glow behind Orbits — Violet & Turquoise */}
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[550px] h-[550px] pointer-events-none z-0">
            {/* Blob 1: Deep Violet Glow Core */}
            <motion.div
              animate={{
                scale: [1, 1.12, 0.95, 1],
                rotate: [0, 120, 240, 360],
                opacity: [0.35, 0.45, 0.35]
              }}
              transition={{ duration: 18, repeat: Infinity, ease: 'easeInOut' }}
              className="absolute inset-0 rounded-full blur-[85px]"
              style={{
                background: 'radial-gradient(circle at 40% 35%, rgba(139, 92, 246, 0.40) 0%, rgba(168, 85, 247, 0.22) 50%, transparent 75%)',
              }}
            />
            {/* Blob 2: Turquoise Glow Wave */}
            <motion.div
              animate={{
                scale: [1.1, 0.92, 1.12],
                rotate: [360, 180, 0],
                opacity: [0.30, 0.42, 0.30]
              }}
              transition={{ duration: 22, repeat: Infinity, ease: 'easeInOut' }}
              className="absolute inset-0 rounded-full blur-[85px]"
              style={{
                background: 'radial-gradient(circle at 60% 65%, rgba(6, 182, 212, 0.40) 0%, rgba(34, 211, 238, 0.22) 50%, transparent 75%)',
              }}
            />
          </div>

          {/* Interactive Mouse Spotlight */}
          <motion.div
            className="pointer-events-none fixed inset-0 z-0 opacity-30"
            style={{
              background: 'radial-gradient(400px circle at 0px 0px, rgba(139, 92, 246, 0.12), transparent 65%)',
              x: springX,
              y: springY,
              marginLeft: '-200px',
              marginTop: '-200px',
            }}
          />
        </div>
      )}

      {/* ── Grid texture ── */}
      <div
        className="absolute inset-0 z-0 pointer-events-none"
        style={{
          backgroundImage: isLight
            ? 'linear-gradient(to right, #00000010 1px, transparent 1px), linear-gradient(to bottom, #00000010 1px, transparent 1px)'
            : 'linear-gradient(to right, #ffffff0c 1px, transparent 1px), linear-gradient(to bottom, #ffffff0c 1px, transparent 1px)',
          backgroundSize: '32px 32px',
          opacity: 1,
        }}
      />

      {/* ── Global 3D Robot / Orbits layer ── */}
      <div
        className="fixed inset-0 flex items-center justify-center z-0 pointer-events-none scale-95 md:scale-105"
        style={{
          opacity: 1,
          mixBlendMode: 'normal',
        }}
      >
        <div className="w-[1000px] h-[1000px] max-w-full">
          <Robot3D />
        </div>
      </div>

      {/* ── Main Content ──────────────────────────────── */}
      <div className="relative h-full w-full z-10">
        {children}
      </div>
    </div>
  )
}
