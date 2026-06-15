import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  MessageSquareCode, 
  Send, 
  Bot, 
  User, 
  Loader2, 
  Copy, 
  Check, 
  Compass,
  ArrowRight,
  Key,
  Lock,
  ExternalLink
} from 'lucide-react'
import { useRepoStore } from '../store/useRepoStore'

export default function AiAssistantTab() {
  const { chatMessages, sendChatMessage, aiKey, setAiKey, isAnalyzing } = useRepoStore()
  const [inputText, setInputText] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const [copiedCodeId, setCopiedCodeId] = useState<string | null>(null)
  
  const [tempKey, setTempKey] = useState('')
  
  const chatEndRef = useRef<HTMLDivElement>(null)

  const suggestedQuestions = [
    'How does authentication work?',
    'Explain the database schema.',
    'Where are the API routes defined?'
  ]

  // Scroll to bottom whenever messages update
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [chatMessages, isTyping])

  const handleSend = async (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    if (!inputText.trim()) return

    const userText = inputText
    setInputText('')
    setIsTyping(true)
    await sendChatMessage(userText)
    setIsTyping(false)
  }

  const handleSelectSuggestion = async (q: string) => {
    setIsTyping(true)
    await sendChatMessage(q)
    setIsTyping(false)
  }

  const handleSaveKey = (e: React.FormEvent) => {
    e.preventDefault()
    if (tempKey.trim()) {
      setAiKey(tempKey.trim())
    }
  }

  if (!aiKey) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="h-full flex items-center justify-center font-mono p-4"
      >
        <div className="glass-panel p-8 rounded-2xl max-w-md w-full relative overflow-hidden text-center space-y-6">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 via-cyan-400 to-purple-500" />
          
          <div className="mx-auto w-16 h-16 bg-slate-900 border border-slate-800 rounded-full flex items-center justify-center shadow-[0_0_20px_rgba(34,211,238,0.15)]">
            <Key className="w-8 h-8 text-cyan-400" />
          </div>

          <div className="space-y-2">
            <h2 className="text-xl font-bold text-white font-sans">AI Mentor Authorization</h2>
            <p className="text-xs text-slate-400 leading-relaxed font-sans">
              To unlock the intelligent codebase assistant, please provide your Google Gemini API key. Keys are stored locally in your browser session.
            </p>
          </div>

          <form onSubmit={handleSaveKey} className="space-y-4">
            <div className="relative text-left">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input
                type="password"
                value={tempKey}
                onChange={(e) => setTempKey(e.target.value)}
                placeholder="Paste your Gemini API key..."
                className="w-full bg-slate-950 border border-slate-800 focus:border-cyan-400 rounded-lg pl-10 pr-4 py-3 text-sm text-white placeholder-slate-600 outline-none transition-colors"
                required
              />
            </div>
            <button
              type="submit"
              className="w-full py-3 bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 text-white text-sm font-bold rounded-lg transition-all active:scale-[0.98] shadow-lg shadow-cyan-500/20"
            >
              INITIALIZE AI CONNECTION
            </button>
          </form>
          
          <div className="text-[10px] text-slate-500 pt-4 border-t border-slate-800/80">
            Don't have an API key? Get one from <a href="https://aistudio.google.com/" target="_blank" rel="noreferrer" className="text-cyan-400 hover:underline">Google AI Studio</a>.
          </div>
        </div>
      </motion.div>
    )
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
            <p className="text-[10px] text-slate-500 font-mono">MODEL: GEMINI-PRO | STATUS: AUTHENTICATED</p>
          </div>
        </div>
        <div className="flex items-center space-x-3">
          <button 
            onClick={() => setAiKey('')} 
            className="text-[9px] text-slate-500 hover:text-red-400 transition-colors uppercase border-b border-slate-700 hover:border-red-400/50 pb-0.5"
          >
            Clear Key
          </button>
          <span className="inline-flex items-center space-x-1.5 text-[8px] bg-green-500/10 border border-green-500/20 text-green-400 px-2 py-0.5 rounded font-bold font-mono">
            <span>AI_AGENT_ONLINE</span>
          </span>
        </div>
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
                  {msg.mode && (
                    <>
                      <span>•</span>
                      <span className={`px-1.5 py-0.5 rounded uppercase font-bold tracking-widest border ${
                        msg.mode === 'advanced' ? 'bg-purple-500/10 border-purple-500/30 text-purple-400' : 'bg-slate-800 border-slate-700 text-slate-400'
                      }`}>
                        {msg.mode} MODE
                      </span>
                    </>
                  )}
                </div>
                
                <div className={`p-4 rounded-xl text-xs leading-relaxed border font-sans ${
                  isAi 
                    ? 'bg-[#0B1220]/75 border-slate-850/80 text-slate-200' 
                    : 'bg-blue-600/15 border-blue-500/30 text-white'
                }`}>
                  <p className="whitespace-pre-wrap">{msg.text}</p>

                  {/* Citations */}
                  {msg.citations && msg.citations.length > 0 && (
                    <div className="mt-4 pt-3 border-t border-slate-800/60 space-y-2">
                      <p className="text-[10px] text-slate-500 font-mono tracking-widest uppercase mb-1">Sources Cited:</p>
                      <div className="flex flex-wrap gap-2">
                        {msg.citations.map((cite, i) => (
                          <a 
                            key={i}
                            href={cite.githubUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center space-x-1.5 px-2 py-1 bg-slate-900 border border-slate-800 hover:border-cyan-500/50 rounded text-[10px] font-mono text-slate-400 hover:text-cyan-400 transition-colors group"
                          >
                            <span>{cite.file}{cite.line ? `:${cite.line}` : ''}</span>
                            <ExternalLink className="w-2.5 h-2.5 opacity-50 group-hover:opacity-100" />
                          </a>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Attachment code block rendering (if we had it, but we render text) */}
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
              <span className="animate-pulse">Consulting codebase knowledge graph...</span>
            </div>
          </div>
        )}

        <div ref={chatEndRef} />
      </div>

      {/* Suggested prompts row */}
      {chatMessages.length <= 2 && !isTyping && (
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
          placeholder={isAnalyzing ? "Waiting for analysis..." : "Ask AI technical mentor about files, code architectures, database schemas..."}
          disabled={isTyping || isAnalyzing}
          className="w-full bg-slate-950 border border-slate-800 hover:border-slate-750 focus:border-cyan-400 rounded-xl pl-4 pr-14 py-3 text-xs md:text-sm text-slate-200 placeholder-slate-500 transition-all font-mono outline-none shadow-2xl disabled:opacity-50 disabled:cursor-not-allowed"
        />
        <button
          type="submit"
          disabled={isTyping || isAnalyzing || !inputText.trim()}
          className="absolute right-2.5 p-2 bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 rounded-lg text-white transition-all cursor-pointer active:scale-95 shadow-[0_0_10px_rgba(34,211,238,0.2)] disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Send className="w-4 h-4" />
        </button>
      </form>
    </motion.div>
  )
}
