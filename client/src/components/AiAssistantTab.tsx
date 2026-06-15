import { useState, useRef, useEffect } from 'react'
import { motion } from 'framer-motion'
import { 
  MessageSquareCode, 
  Send, 
  Bot, 
  User, 
  Loader2, 
  Copy, 
  Check, 
  Compass,
  ArrowRight
} from 'lucide-react'
import { useRepoStore } from '../store/useRepoStore'

export default function AiAssistantTab() {
  const { chatMessages, sendChatMessage } = useRepoStore()
  const [inputText, setInputText] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const [copiedCodeId, setCopiedCodeId] = useState<string | null>(null)
  
  const chatEndRef = useRef<HTMLDivElement>(null)

  const suggestedQuestions = [
    'How does authentication work?',
    'Explain project architecture.',
    'How do I run db migrations?'
  ]

  // Scroll to bottom whenever messages update
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [chatMessages, isTyping])

  const handleSend = (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    if (!inputText.trim()) return

    const userText = inputText
    setInputText('')
    sendChatMessage(userText)
    setIsTyping(true)

    // Simulate analysis response delay
    setTimeout(() => {
      setIsTyping(false)
    }, 1200)
  }

  const handleSelectSuggestion = (q: string) => {
    sendChatMessage(q)
    setIsTyping(true)
    setTimeout(() => {
      setIsTyping(false)
    }, 1200)
  }

  const handleCopyCode = (code: string, id: string) => {
    navigator.clipboard.writeText(code)
    setCopiedCodeId(id)
    setTimeout(() => setCopiedCodeId(null), 1500)
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="h-[calc(100vh-120px)] flex flex-col font-mono text-slate-300 text-left select-none relative"
    >
      {/* Top HUD Stats Panel */}
      <div className="glass-panel p-4 rounded-xl border-slate-800/80 flex items-center justify-between shrink-0 mb-4 bg-[#0B1220]/60">
        <div className="flex items-center space-x-2">
          <MessageSquareCode className="w-5 h-5 text-cyan-400" />
          <div>
            <h2 className="text-white font-sans font-bold text-sm tracking-wide">RepoPilot Technical Mentor</h2>
            <p className="text-[10px] text-slate-500 font-mono">MODEL: CONTEXT-INGEST-V4 | ACTIVE_NODES: ALL</p>
          </div>
        </div>
        <span className="inline-flex items-center space-x-1.5 text-[8px] bg-green-500/10 border border-green-500/20 text-green-400 px-2 py-0.5 rounded font-bold font-mono">
          <span>AI_AGENT_ONLINE</span>
        </span>
      </div>

      {/* Main Chat Log scrollbox */}
      <div className="flex-1 glass-panel rounded-xl border-slate-800/80 p-4 md:p-5 overflow-y-auto mb-4 space-y-4 select-text">
        {chatMessages.map((msg) => {
          const isAi = msg.sender === 'assistant'
          return (
            <div 
              key={msg.id}
              className={`flex items-start gap-3.5 max-w-3xl ${isAi ? 'mr-auto text-left' : 'ml-auto flex-row-reverse text-right'}`}
            >
              {/* Profile icon */}
              <div className={`p-2 rounded-lg border shrink-0 ${
                isAi 
                  ? 'bg-blue-600/10 border-blue-500/35 text-cyan-400' 
                  : 'bg-purple-600/10 border-purple-500/35 text-purple-400'
              }`}>
                {isAi ? <Bot className="w-4.5 h-4.5" /> : <User className="w-4.5 h-4.5" />}
              </div>

              {/* Message content panel */}
              <div className="space-y-1.5 flex-1 min-w-0">
                <div className={`flex items-center gap-2 text-[10px] text-slate-500 ${isAi ? 'justify-start' : 'justify-end'}`}>
                  <span className="font-semibold text-slate-400">{isAi ? 'REPOPILOT MENTOR' : 'DEVELOPER'}</span>
                  <span>•</span>
                  <span>{msg.timestamp}</span>
                </div>
                
                <div className={`p-4 rounded-xl text-xs leading-relaxed border font-sans ${
                  isAi 
                    ? 'bg-[#0B1220]/75 border-slate-850/80 text-slate-200' 
                    : 'bg-blue-600/15 border-blue-500/30 text-white'
                }`}>
                  <p className="whitespace-pre-wrap">{msg.text}</p>

                  {/* Attachment code block rendering */}
                  {msg.codeBlock && (
                    <div className="mt-3.5 bg-slate-950 border border-slate-850 rounded-lg overflow-hidden font-mono text-[11px] text-left">
                      <div className="bg-slate-900 px-3.5 py-1.5 flex items-center justify-between border-b border-slate-900">
                        <span className="text-[9px] text-slate-500 uppercase tracking-widest">{msg.codeBlock.language}</span>
                        <button
                          onClick={() => handleCopyCode(msg.codeBlock!.code, msg.id)}
                          className="p-1 rounded hover:bg-slate-800 text-slate-500 hover:text-cyan-400 cursor-pointer transition-colors"
                        >
                          {copiedCodeId === msg.id ? <Check className="w-3 h-3 text-green-400" /> : <Copy className="w-3 h-3" />}
                        </button>
                      </div>
                      <pre className="p-3.5 overflow-x-auto whitespace-pre leading-normal max-h-60 text-cyan-400/95 font-medium select-all">
                        <code>{msg.codeBlock.code}</code>
                      </pre>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )
        })}

        {/* Typing Loading Simulator */}
        {isTyping && (
          <div className="flex items-start gap-3.5 mr-auto max-w-lg">
            <div className="p-2 rounded-lg border bg-blue-600/10 border-blue-500/30 text-cyan-400 shrink-0">
              <Bot className="w-4.5 h-4.5 animate-bounce" />
            </div>
            <div className="p-3.5 rounded-xl bg-[#0B1220]/80 border border-slate-850/80 text-slate-400 text-xs flex items-center space-x-2 font-mono">
              <Loader2 className="w-3.5 h-3.5 animate-spin text-cyan-400" />
              <span className="animate-pulse">Mentoring compiler scanning codebase...</span>
            </div>
          </div>
        )}

        <div ref={chatEndRef} />
      </div>

      {/* Suggested prompts row */}
      {chatMessages.length === 1 && !isTyping && (
        <div className="shrink-0 mb-3 space-y-2">
          <div className="flex items-center space-x-1.5 text-[10px] text-slate-500">
            <Compass className="w-3.5 h-3.5 text-cyan-500" />
            <span>SUGGESTED DISPATCH QUERIES:</span>
          </div>
          <div className="flex flex-wrap gap-2.5">
            {suggestedQuestions.map((q) => (
              <button
                key={q}
                onClick={() => handleSelectSuggestion(q)}
                className="px-3.5 py-2 rounded-lg bg-slate-950 border border-slate-800 hover:border-cyan-500/50 hover:bg-slate-900 text-slate-300 hover:text-white transition-all text-xs flex items-center space-x-1.5 cursor-pointer active:scale-95"
              >
                <span>{q}</span>
                <ArrowRight className="w-3 h-3 text-cyan-400" />
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Chat bottom input bar */}
      <form onSubmit={handleSend} className="shrink-0 relative flex items-center">
        <input
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder="Ask AI technical mentor about files, code architectures, database schemas..."
          className="w-full bg-slate-950 border border-slate-800 hover:border-slate-750 focus:border-cyan-400 rounded-xl pl-4 pr-14 py-3 text-xs md:text-sm text-slate-200 placeholder-slate-500 transition-all font-mono outline-none shadow-2xl"
        />
        <button
          type="submit"
          className="absolute right-2.5 p-2 bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 rounded-lg text-white transition-all cursor-pointer active:scale-95 shadow-[0_0_10px_rgba(34,211,238,0.2)]"
        >
          <Send className="w-4 h-4" />
        </button>
      </form>
    </motion.div>
  )
}
