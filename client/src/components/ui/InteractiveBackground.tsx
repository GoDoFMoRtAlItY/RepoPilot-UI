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

      {/* ── LIGHT MODE background — premium warm neutral ── */}
      {isLight && (
        <div className="absolute inset-0 z-0 pointer-events-none">
          {/* Subtle warm gradient — barely perceptible */}
          <div className="absolute inset-0 bg-gradient-to-br from-[#F5F7FA] via-[#F0F4FF] to-[#F5F7FA]" />

          {/* Very subtle violet accent bloom — top-right */}
          <div
            className="absolute top-0 right-0 w-[600px] h-[400px] pointer-events-none"
            style={{
              background: 'radial-gradient(ellipse at top right, rgba(91, 80, 232, 0.07) 0%, transparent 70%)',
            }}
          />
          {/* Subtle cyan bloom — bottom-left */}
          <div
            className="absolute bottom-0 left-0 w-[500px] h-[350px] pointer-events-none"
            style={{
              background: 'radial-gradient(ellipse at bottom left, rgba(8, 145, 178, 0.05) 0%, transparent 70%)',
            }}
          />
        </div>
      )}

      {/* ── DARK MODE background — Interactive spotlight ── */}
      {!isLight && (
        <motion.div
          className="pointer-events-none fixed inset-0 z-0 opacity-40"
          style={{
            background: 'radial-gradient(500px circle at 0px 0px, rgba(255, 255, 255, 0.04), transparent 50%)',
            x: springX,
            y: springY,
            marginLeft: '-250px',
            marginTop: '-250px',
          }}
        />
      )}

      {/* ── Grid texture — barely visible in both modes ── */}
      <div
        className="absolute inset-0 z-0 pointer-events-none"
        style={{
          backgroundImage: 'linear-gradient(to right, #80808009 1px, transparent 1px), linear-gradient(to bottom, #80808009 1px, transparent 1px)',
          backgroundSize: '28px 28px',
          opacity: isLight ? 0.6 : 1,
        }}
      />

      {/* ── Global 3D Robot layer ────────────────────────
          Dark: mix-blend-normal at 70% opacity
          Light: mix-blend-multiply at 12% — barely decorative
      ── */}
      <div
        className="fixed inset-0 flex items-center justify-center z-0 pointer-events-none scale-90 md:scale-100"
        style={{
          opacity: isLight ? (isDashboard ? 0.3 : 0.12) : 0.70,
          mixBlendMode: isLight ? 'multiply' : 'normal',
        }}
      >
        <div className="w-[1000px] h-[1000px] max-w-full">
          <Robot3D />
        </div>
      </div>

      {/* ── Main Content ──────────────────────────────── */}
      <div className="relative z-10 h-full w-full">
        {children}
      </div>
    </div>
  )
}
