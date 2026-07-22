import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Bot, User, Loader2, Cpu, Check, Copy } from 'lucide-react'

interface ConversationStep {
  sender: 'user' | 'assistant'
  text: string
  code?: string
}

const mockCode = `// middleware/jwtAuth.js
const jwt = require('jsonwebtoken');

function jwtAuth(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) return res.status(401).json({ error: 'Auth token missing' });

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ error: 'Invalid token' });
    req.user = user;
    next();
  });
}`

const conversationSteps: ConversationStep[] = [
  {
    sender: 'user',
    text: 'How does authentication work in this codebase?'
  },
  {
    sender: 'assistant',
    text: 'Authentication begins in routes/auth.js and is validated using jwtAuth middleware. Here is the active validation handler:',
    code: mockCode
  }
]

export default function AiPreviewSection() {
  const [messages, setMessages] = useState<ConversationStep[]>([])
  const [typing, setTyping] = useState(false)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    let active = true
    const runSimulation = async () => {
      // Clear previous messages
      setMessages([])
      
      // Step 1: Wait, then add User message
      await new Promise(r => setTimeout(r, 1500))
      if (!active) return
      setMessages([conversationSteps[0]])

      // Step 2: Show typing spinner
      await new Promise(r => setTimeout(r, 1200))
      if (!active) return
      setTyping(true)

      // Step 3: Stream AI reply
      await new Promise(r => setTimeout(r, 1500))
      if (!active) return
      setTyping(false)
      setMessages(prev => [...prev, conversationSteps[1]])
    }

    runSimulation()

    // Loop the simulation every 12 seconds
    const interval = setInterval(() => {
      runSimulation()
    }, 12000)

    return () => {
      active = false
      clearInterval(interval)
    }
  }, [])

  const handleCopy = () => {
    navigator.clipboard.writeText(mockCode)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  return (
    <section className="py-20 px-4 md:px-8 bg-[#05070A] relative overflow-hidden">
      {/* Background gradients */}
      <div className="absolute top-[40%] right-[-5%] w-[45%] h-[300px] bg-blue-500/[0.02] filter blur-[100px] pointer-events-none" />

      <div className="max-w-4xl mx-auto w-full space-y-8 relative z-10 text-left">
        <div className="text-center max-w-2xl mx-auto space-y-3">
          <h2 className="text-xs font-mono tracking-widest text-cyan-400 uppercase flex items-center justify-center space-x-1.5">
            <Cpu className="w-3.5 h-3.5 animate-pulse" />
            <span>AI_ASSISTANT_PREVIEW</span>
          </h2>
          <h3 className="text-3xl font-bold text-white tracking-tight font-sans">
            Talk to an AI that knows the entire codebase.
          </h3>
          <p className="text-slate-400 text-xs md:text-sm font-sans">
            RepoPilot indexes repository functions, files, routes, and Docker config trees to answers queries instantly.
          </p>
        </div>

        {/* Console / IDE Frame mockup */}
        <div className="glass-panel rounded-xl overflow-hidden border-slate-800 shadow-[0_20px_50px_rgba(0,0,0,0.5)] font-mono">
          {/* Header bar */}
          <div className="bg-slate-950 px-4 py-3 border-b border-slate-850 flex items-center justify-between">
            <div className="flex items-center space-x-2 text-xs">
              <span className="w-2.5 h-2.5 rounded-full bg-red-500/60" />
              <span className="w-2.5 h-2.5 rounded-full bg-yellow-500/60" />
              <span className="w-2.5 h-2.5 rounded-full bg-green-500/60" />
              <span className="text-slate-400 text-[10px] pl-2">AI_PREVIEW.SH</span>
            </div>
            <div className="text-[9px] text-slate-500">PING: 10ms | PORT: 3000</div>
          </div>

          {/* Chat area */}
          <div className="p-4 md:p-6 min-h-[340px] flex flex-col justify-end space-y-4 bg-slate-950/40 font-sans text-xs md:text-sm">
            
            {messages.length === 0 && !typing && (
              <div className="flex-1 flex flex-col items-center justify-center text-slate-500 text-xs gap-2 font-mono">
                <Loader2 className="w-4 h-4 animate-spin text-cyan-500" />
                <span>Initializing chat vector handshake...</span>
              </div>
            )}

            <AnimatePresence>
              {messages.map((msg, idx) => {
                const isUser = msg.sender === 'user'
                return (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                    className={`flex items-start gap-3 max-w-2xl ${isUser ? 'ml-auto flex-row-reverse text-right' : 'mr-auto text-left'}`}
                  >
                    {/* Avatar */}
                    <div className={`p-2 rounded-lg border shrink-0 ${
                      isUser 
                        ? 'bg-purple-500/10 border-purple-500/30 text-purple-400' 
                        : 'bg-blue-500/10 border-blue-500/30 text-cyan-400'
                    }`}>
                      {isUser ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                    </div>

                    {/* Chat Bubble content */}
                    <div className="space-y-1">
                      <div className={`text-[10px] text-slate-500 font-mono ${isUser ? 'text-right' : 'text-left'}`}>
                        {isUser ? 'DEVELOPER' : 'REPOPILOT MENTOR'}
                      </div>
                      <div className={`p-3.5 rounded-xl border leading-relaxed ${
                        isUser 
                          ? 'bg-blue-600/10 border-blue-500/30 text-white' 
                          : 'bg-[#0B1220]/80 border-slate-850/80 text-slate-200 shadow-xl'
                      }`}>
                        <p className="font-sans text-xs md:text-sm">{msg.text}</p>

                        {/* Attachment code block */}
                        {msg.code && (
                          <div className="mt-3 bg-slate-950 border border-slate-850 rounded-lg overflow-hidden font-mono text-[11px] text-left">
                            <div className="bg-slate-900/60 px-3 py-1 flex items-center justify-between border-b border-slate-900">
                              <span className="text-[9px] text-slate-500 uppercase tracking-widest">javascript</span>
                              <button
                                onClick={handleCopy}
                                className="p-1 rounded hover:bg-slate-800 text-slate-500 hover:text-cyan-400 cursor-pointer"
                              >
                                {copied ? <Check className="w-3 h-3 text-green-400" /> : <Copy className="w-3 h-3" />}
                              </button>
                            </div>
                            <pre className="p-3 overflow-x-auto whitespace-pre leading-normal max-h-52 text-cyan-400/90 font-medium select-all">
                              <code>{msg.code}</code>
                            </pre>
                          </div>
                        )}
                      </div>
                    </div>
                  </motion.div>
                )
              })}
            </AnimatePresence>

            {/* AI Typing loading simulator */}
            {typing && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-start gap-3 mr-auto"
              >
                <div className="p-2 rounded-lg border bg-blue-500/10 border-blue-500/30 text-cyan-400 shrink-0">
                  <Bot className="w-4 h-4 animate-bounce" />
                </div>
                <div className="p-3 rounded-xl bg-[#0B1220]/80 border border-slate-850/80 text-slate-400 text-xs flex items-center space-x-2 font-mono">
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-cyan-400" />
                  <span className="animate-pulse">Analyzing routes/auth.js structure...</span>
                </div>
              </motion.div>
            )}

          </div>
        </div>
      </div>
    </section>
  )
}
