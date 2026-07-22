import { useEffect, useState } from 'react'
import { motion, useSpring } from 'framer-motion'
import Robot3D from './Robot3D'

export default function InteractiveBackground({ children }: { children: React.ReactNode }) {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 })

  // Use springs for smooth following effect without lagging
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
      
      {/* Light Mode Mountain/Pastel Landscape */}
      <div className="absolute inset-0 z-0 pointer-events-none opacity-100 dark:opacity-0 transition-opacity duration-500">
        <div className="absolute inset-0 bg-gradient-to-b from-[#C7DBF7] via-[#BFC7DE] to-[#C59594]" />
        
        <div className="absolute inset-0 bg-gradient-to-b from-[#C7DBF7] via-[#BFC7DE] to-[#C59594]" />
        
        {/* CSS Mountains */}
        <svg
          className="absolute bottom-0 w-full h-[50vh] md:h-[65vh]"
          preserveAspectRatio="none"
          viewBox="0 0 1440 320"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            fill="#75708C"
            fillOpacity="0.4"
            d="M0,256L48,229.3C96,203,192,149,288,154.7C384,160,480,224,576,218.7C672,213,768,139,864,128C960,117,1056,171,1152,197.3C1248,224,1344,224,1392,224L1440,224L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"
          ></path>
          <path
            fill="#5a566b"
            fillOpacity="0.6"
            d="M0,288L60,266.7C120,245,240,203,360,202.7C480,203,600,245,720,240C840,235,960,181,1080,170.7C1200,160,1320,192,1380,208L1440,224L1440,320L1380,320C1320,320,1200,320,1080,320C960,320,840,320,720,320C600,320,480,320,360,320C240,320,120,320,60,320L0,320Z"
          ></path>
        </svg>
      </div>

      {/* Interactive Spotlight (Only visible in Dark Mode) */}
      <div className="hidden dark:block">
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
      </div>
      
      {/* Base Grid / Texture (Subtle) */}
      <div className="absolute inset-0 z-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none" />

      {/* Global 3D Core Layer */}
      <div className="fixed inset-0 flex items-center justify-center z-0 pointer-events-none opacity-50 dark:opacity-70 scale-90 md:scale-100 mix-blend-multiply dark:mix-blend-normal">
        <div className="w-[800px] h-[800px]">
          <Robot3D />
        </div>
      </div>

      {/* Main Content */}
      <div className="relative z-10 h-full w-full">
        {children}
      </div>
    </div>
  )
}
