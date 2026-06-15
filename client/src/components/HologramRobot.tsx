import { useState, useEffect } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { SplineScene } from '@/components/ui/splite'

interface HologramRobotProps {
  scanStatus?: 'idle' | 'detected' | 'scanning' | 'ready'
  repoUrl?: string
}

// Lightweight glowing particle background
function EnergyParticles() {
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
      {[...Array(12)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute w-1 h-1 bg-cyan-400 rounded-full opacity-35"
          style={{
            left: `${Math.random() * 100}%`,
            top: `${50 + Math.random() * 50}%`,
          }}
          animate={{
            y: [0, -150 - Math.random() * 100],
            opacity: [0, 0.7, 0],
            scale: [0.8, 1.4, 0.4]
          }}
          transition={{
            duration: 4 + Math.random() * 4,
            repeat: Infinity,
            ease: "easeOut",
            delay: Math.random() * 4
          }}
        />
      ))}
    </div>
  )
}

export default function HologramRobot({ scanStatus = 'idle', repoUrl = '' }: HologramRobotProps) {
  const [selectedNode, setSelectedNode] = useState<string | null>(null)
  const [scannedFilesCount, setScannedFilesCount] = useState(0)
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 })

  // Mouse coordinate tracking for subtle container parallax tilt
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      const x = (e.clientX / window.innerWidth) - 0.5
      const y = (e.clientY / window.innerHeight) - 0.5
      setMousePos({ x, y })
    }
    window.addEventListener('mousemove', handleMouseMove)
    return () => window.removeEventListener('mousemove', handleMouseMove)
  }, [])

  // Dynamic file analyzer counter
  useEffect(() => {
    if (scanStatus === 'scanning') {
      setScannedFilesCount(0)
      let count = 0
      const target = 23000
      const step = 600
      const interval = setInterval(() => {
        count += step
        if (count >= target) {
          count = target
          clearInterval(interval)
        }
        setScannedFilesCount(count)
      }, 50)
      return () => clearInterval(interval)
    } else if (scanStatus === 'idle') {
      setScannedFilesCount(0)
    } else if (scanStatus === 'ready') {
      setScannedFilesCount(23000)
    }
  }, [scanStatus])

  const getRepoName = () => {
    if (!repoUrl) return 'repopilot/workspace'
    let name = repoUrl.trim()
    if (name.startsWith('https://github.com/')) {
      name = name.replace('https://github.com/', '')
    }
    if (name.endsWith('.git')) {
      name = name.substring(0, name.length - 4)
    }
    return name
  }

  // Define the configuration for the holographic orbital rings
  const RINGS = [
    {
      rx: 135,
      ry: 32,
      tilt: 12,
      dash: "6 6",
      color: "rgba(34, 211, 238, 0.45)",
      speed: 0.4,
      labels: [
        { text: "Repository Understanding", offset: 0 },
        { text: "Guided Setup", offset: Math.PI }
      ]
    },
    {
      rx: 185,
      ry: 42,
      tilt: -8,
      dash: "12 6 4 6",
      color: "rgba(34, 211, 238, 0.6)",
      speed: -0.5,
      labels: [
        { text: "Architecture Mapping", offset: 0 },
        { text: "AI Assistant", offset: (2 * Math.PI) / 3 },
        { text: "API Discovery", offset: (4 * Math.PI) / 3 }
      ]
    },
    {
      rx: 235,
      ry: 52,
      tilt: 16,
      dash: "15 8",
      color: "rgba(59, 130, 246, 0.45)",
      speed: 0.3,
      labels: [
        { text: "Environment Analysis", offset: 0 },
        { text: "Smart File Prioritization", offset: (2 * Math.PI) / 3 },
        { text: "Repository Insights", offset: (4 * Math.PI) / 3 }
      ]
    }
  ]

  // Helper function to generate SVG paths for the front/back halves of the tilted orbital rings
  const getArcPath = (rx: number, ry: number, tilt: number, half: 'back' | 'front') => {
    const rad = (tilt * Math.PI) / 180
    const cos = Math.cos(rad)
    const sin = Math.sin(rad)
    
    const x1 = -rx * cos
    const y1 = -rx * sin
    const x2 = rx * cos
    const y2 = rx * sin

    if (half === 'back') {
      return `M ${x1} ${y1} A ${rx} ${ry} ${tilt} 0 1 ${x2} ${y2}`
    } else {
      return `M ${x2} ${y2} A ${rx} ${ry} ${tilt} 0 1 ${x1} ${y1}`
    }
  }

  // Animation phase loop (updates angle smoothly at 60 FPS)
  const [angle, setAngle] = useState(0)

  useEffect(() => {
    let animId: number
    const update = () => {
      setAngle(prev => (prev + 0.01) % (Math.PI * 2))
      animId = requestAnimationFrame(update)
    }
    animId = requestAnimationFrame(update)
    return () => cancelAnimationFrame(animId)
  }, [])

  const orbitStyles = `
    @keyframes orbit-dash-cw {
      to { stroke-dashoffset: -80; }
    }
    @keyframes orbit-dash-ccw {
      to { stroke-dashoffset: 80; }
    }
    .orbit-cw {
      animation: orbit-dash-cw 12s linear infinite;
    }
    .orbit-ccw {
      animation: orbit-dash-ccw 12s linear infinite;
    }
  `

  return (
    <div className="relative w-full h-[360px] md:h-[460px] flex items-center justify-center select-none overflow-visible">
      
      <style dangerouslySetInnerHTML={{ __html: orbitStyles }} />

      {/* SVG for BACK arcs of orbital rings (z-index: 5) */}
      <svg 
        viewBox="-300 -250 600 500" 
        className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[500px] pointer-events-none z-5"
        style={{ overflow: 'visible' }}
      >
        {RINGS.map((ring, idx) => (
          <path
            key={`back-${idx}`}
            d={getArcPath(ring.rx, ring.ry, ring.tilt, 'back')}
            fill="none"
            stroke={ring.color}
            strokeWidth="1.5"
            strokeDasharray={ring.dash}
            className={ring.speed > 0 ? 'orbit-cw' : 'orbit-ccw'}
            style={{
              filter: 'drop-shadow(0 0 4px rgba(34, 211, 238, 0.3))'
            }}
          />
        ))}
      </svg>

      {/* 3D Holographic Projected Container */}
      <motion.div
        animate={{
          y: [0, -8, 0],
        }}
        transition={{
          duration: 5,
          repeat: Infinity,
          ease: "easeInOut"
        }}
        style={{
          transform: `translate3d(${mousePos.x * 12}px, ${mousePos.y * 12}px, 0)`,
          filter: 'drop-shadow(0 0 20px rgba(34, 211, 238, 0.45)) saturate(1.1) brightness(1.05)',
        }}
        className="w-[92%] h-[92%] relative rounded-2xl overflow-hidden bg-slate-950/20 border border-cyan-500/10 backdrop-blur-[2px] z-10"
      >
        {/* Hologram project overlays */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(34,211,238,0.1)_0%,transparent_70%)] pointer-events-none z-0" />
        <div className="absolute inset-0 scanlines opacity-[0.06] pointer-events-none z-20" />
        
        {/* Animated scanning beam overlay */}
        {scanStatus === 'scanning' && (
          <motion.div
            initial={{ top: '-10%' }}
            animate={{ top: '110%' }}
            transition={{ duration: 1.8, repeat: Infinity, ease: 'linear' }}
            className="absolute left-0 w-full h-[3px] bg-gradient-to-r from-transparent via-cyan-400 to-transparent shadow-[0_0_12px_#22d3ee] z-20 pointer-events-none opacity-90"
          />
        )}

        <EnergyParticles />

        {/* 21st.dev Premium Spline Robot Centerpiece */}
        <div className="w-full h-full relative z-10 overflow-hidden rounded-2xl">
          <SplineScene 
            scene="https://prod.spline.design/kZDDjO5HuC9GJUM2/scene.splinecode"
            className="w-full h-full object-cover"
          />
        </div>
      </motion.div>

      {/* SVG for FRONT arcs of orbital rings (z-index: 30) */}
      <svg 
        viewBox="-300 -250 600 500" 
        className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[500px] pointer-events-none z-30"
        style={{ overflow: 'visible' }}
      >
        {RINGS.map((ring, idx) => (
          <path
            key={`front-${idx}`}
            d={getArcPath(ring.rx, ring.ry, ring.tilt, 'front')}
            fill="none"
            stroke={ring.color}
            strokeWidth="1.5"
            strokeDasharray={ring.dash}
            className={ring.speed > 0 ? 'orbit-cw' : 'orbit-ccw'}
            style={{
              filter: 'drop-shadow(0 0 6px rgba(34, 211, 238, 0.45))'
            }}
          />
        ))}
      </svg>

      {/* Orbit Labels container (uses absolute positioning) */}
      <div 
        className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[500px] pointer-events-none"
        style={{ overflow: 'visible' }}
      >
        {RINGS.map((ring, ringIdx) => {
          const radTilt = (ring.tilt * Math.PI) / 180
          const cosTilt = Math.cos(radTilt)
          const sinTilt = Math.sin(radTilt)
          
          return ring.labels.map((label, labelIdx) => {
            // Calculate label position on the ring based on time/angle
            const labelAngle = (angle * ring.speed + label.offset) % (Math.PI * 2)
            const xPrime = ring.rx * Math.cos(labelAngle)
            const yPrime = ring.ry * Math.sin(labelAngle)
            
            // Apply 3D tilt rotation
            const x = xPrime * cosTilt - yPrime * sinTilt
            const y = xPrime * sinTilt + yPrime * cosTilt
            
            // Check if label is in front or back of the orbit (yPrime > 0 means in front, < 0 means behind)
            const isFront = Math.sin(labelAngle) > 0
            const opacity = isFront ? 0.95 : 0.22
            const scale = isFront ? 1.0 : 0.8
            const zIndex = isFront ? 30 : 5
            const filterEffect = isFront ? 'none' : 'blur(0.5px)'

            return (
              <div
                key={`label-${ringIdx}-${labelIdx}`}
                className="absolute pointer-events-auto"
                style={{
                  left: `${300 + x}px`,
                  top: `${250 + y}px`,
                  transform: `translate(-50%, -50%) scale(${scale})`,
                  opacity: opacity,
                  zIndex: zIndex,
                  filter: filterEffect,
                  transition: 'opacity 0.25s, filter 0.25s'
                }}
              >
                <button 
                  type="button"
                  onClick={() => setSelectedNode(label.text)}
                  className="bg-[#0B1220]/95 border border-cyan-500/35 hover:border-cyan-400 text-[9px] font-mono font-bold tracking-wider px-2.5 py-1.5 rounded-lg text-cyan-400 hover:text-white shadow-[0_0_15px_rgba(34,211,238,0.25)] cursor-pointer flex items-center gap-1.5 transition-all active:scale-95 whitespace-nowrap"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
                  {label.text}
                </button>
              </div>
            )
          })
        })}
      </div>

      {/* Floating projection logs node */}
      <AnimatePresence>
        {selectedNode && (
          <motion.div 
            initial={{ opacity: 0, y: -20, x: '-50%' }}
            animate={{ opacity: 1, y: 0, x: '-50%' }}
            exit={{ opacity: 0, y: -20, x: '-50%' }}
            className="absolute top-2 left-1/2 bg-slate-950/95 border border-cyan-500/40 px-3.5 py-2 rounded-lg font-mono text-[9px] text-cyan-400 flex items-center space-x-2 shadow-2xl z-30"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-ping" />
            <span>AI SCANNING NODE: <strong>{selectedNode.toUpperCase()}</strong></span>
            <button 
              onClick={() => setSelectedNode(null)}
              className="text-slate-500 hover:text-white font-bold ml-2 cursor-pointer"
            >
              ✕
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Repository Scanning Holographic HUD Panel */}
      <AnimatePresence>
        {scanStatus !== 'idle' && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 15 }}
            transition={{ type: 'spring', stiffness: 100, damping: 15 }}
            className="absolute bottom-4 left-1/2 -translate-x-1/2 w-[90%] max-w-[340px] bg-slate-950/95 border border-cyan-500/30 rounded-xl p-4 shadow-[0_0_30px_rgba(34,211,238,0.15)] backdrop-blur-md z-30 font-mono text-left"
          >
            <div className="flex items-center justify-between border-b border-slate-900 pb-2 mb-3">
              <span className="text-[10px] text-cyan-400 font-bold tracking-widest flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping" />
                SYSTEM ANALYSIS STATUS
              </span>
              <span className="text-[9px] text-slate-500 uppercase">
                {scanStatus}
              </span>
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-400">REPO:</span>
                <span className="text-white font-bold truncate max-w-[180px]">
                  {getRepoName()}
                </span>
              </div>

              {scanStatus === 'detected' && (
                <div className="text-yellow-400 animate-pulse text-[11px] py-1 text-center font-bold">
                  REPOSITORY DETECTED — INITIATING SCAN...
                </div>
              )}

              {(scanStatus === 'scanning' || scanStatus === 'ready') && (
                <>
                  <div className="flex justify-between">
                    <span className="text-slate-400">LANGUAGE:</span>
                    <span className="text-cyan-400">JavaScript / TS</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">FILES DETECTED:</span>
                    <span className="text-white">{scannedFilesCount.toLocaleString()} / 23,000</span>
                  </div>

                  <div className="border-t border-slate-900 my-2 pt-2 space-y-1 text-[10px]">
                    <div className="flex items-center gap-2 text-[#10B981]">
                      <span className="font-bold">✓</span>
                      <span>ARCHITECTURE MAPPED</span>
                    </div>
                    <div className="flex items-center gap-2 text-[#10B981]">
                      <span className="font-bold">✓</span>
                      <span>SETUP CHECKLIST LOADED</span>
                    </div>
                    <div className="flex items-center gap-2 text-[#10B981]">
                      <span className="font-bold">✓</span>
                      <span>AI ASSISTANT READY</span>
                    </div>
                  </div>
                </>
              )}

              {scanStatus === 'ready' && (
                <div className="text-[#10B981] text-center font-bold text-[11px] border-t border-slate-900 pt-2 animate-pulse">
                  READY TO BEGIN ANALYSIS
                </div>
              )}
            </div>

            {/* Scanning progress bar */}
            {scanStatus === 'scanning' && (
              <div className="mt-3 w-full bg-slate-900 h-1.5 rounded-full overflow-hidden border border-slate-800">
                <motion.div 
                  initial={{ width: '0%' }}
                  animate={{ width: `${(scannedFilesCount / 23000) * 100}%` }}
                  className="bg-cyan-500 h-full shadow-[0_0_8px_#22d3ee]"
                />
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* HUD System spec tickers */}
      <div className="absolute top-2 left-2 font-mono text-[9px] text-cyan-400/50 flex flex-col gap-0.5">
        <span>SYS.SEC: ONBOARD_AI_V4</span>
        <span>SYS.LNK: ACTIVE</span>
      </div>
      <div className="absolute bottom-2 right-2 font-mono text-[9px] text-blue-400/50 flex flex-col items-end gap-0.5">
        <span>RAD.STC: ROT_RAD_Z</span>
        <span>SCANNER: {scanStatus !== 'idle' ? scanStatus : 'active'}</span>
      </div>
    </div>
  )
}
