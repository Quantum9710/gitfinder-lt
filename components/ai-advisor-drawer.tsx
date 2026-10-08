'use client'

import * as React from 'react'
import {
  Bot,
  User,
  Send,
  Loader2,
  Sparkles,
  Globe,
  ExternalLink,
  X,
  RotateCcw,
  Sliders,
  CheckCircle2,
} from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { AudioRecorder } from '@/components/audio-recorder'
import { cn } from '@/lib/utils'

interface SourceItem {
  uri?: string
  title?: string
}

interface ChatMessage {
  id: string
  role: 'user' | 'model'
  content: string
  sources?: SourceItem[]
  modelUsed?: string
  timestamp: string
}

interface AIAdvisorDrawerProps {
  isOpen: boolean
  onClose: () => void
  initialContext?: string
}

export function AIAdvisorDrawer({
  isOpen,
  onClose,
  initialContext,
}: AIAdvisorDrawerProps) {
  const [model, setModel] = React.useState<'gemini-3.5-flash' | 'gemini-3.1-flash-lite' | 'gemini-3.1-pro-preview'>('gemini-3.5-flash')
  const [useSearchGrounding, setUseSearchGrounding] = React.useState(true)
  const [input, setInput] = React.useState('')
  const [isLoading, setIsLoading] = React.useState(false)
  const [messages, setMessages] = React.useState<ChatMessage[]>([
    {
      id: 'welcome',
      role: 'model',
      content:
        'Welcome to **GitFinder AI Advisor**! I can help you discover repositories, explain architectures, compare libraries, and ground answers with real-time Google Search data.',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ])

  const scrollRef = React.useRef<HTMLDivElement>(null)

  React.useEffect(() => {
    if (initialContext && isOpen) {
      setInput(`Can you evaluate and summarize the GitHub repository: ${initialContext}?`)
    }
  }, [initialContext, isOpen])

  React.useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' })
  }, [messages, isLoading])

  if (!isOpen) return null

  const handleSend = async (textToSend?: string) => {
    const content = (textToSend || input).trim()
    if (!content || isLoading) return

    const userMsg: ChatMessage = {
      id: String(Date.now()),
      role: 'user',
      content,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    }

    const updated = [...messages, userMsg]
    setMessages(updated)
    setInput('')
    setIsLoading(true)

    try {
      const res = await fetch('/api/gemini/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: updated
            .filter((m) => m.id !== 'welcome')
            .map((m) => ({ role: m.role, content: m.content })),
          model: useSearchGrounding ? 'gemini-3.5-flash' : model,
          useSearchGrounding,
        }),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to generate response')

      setMessages((prev) => [
        ...prev,
        {
          id: String(Date.now() + 1),
          role: 'model',
          content: data.text || 'No response generated.',
          sources: data.sources || [],
          modelUsed: data.modelUsed,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ])
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Error communicating with AI Advisor'
      setMessages((prev) => [
        ...prev,
        {
          id: String(Date.now() + 1),
          role: 'model',
          content: `⚠️ ${msg}`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ])
    } finally {
      setIsLoading(false)
    }
  }

  const handleResetChat = () => {
    setMessages([
      {
        id: 'welcome',
        role: 'model',
        content:
          'Chat reset! Ask me anything about repositories, GitHub trends, or codebases.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      },
    ])
  }

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-background/50 backdrop-blur-xs animate-in fade-in-0">
      <div className="relative w-full max-w-md h-full bg-card border-l border-border shadow-2xl flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-border bg-muted/30 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="size-8 rounded-lg bg-primary text-primary-foreground flex items-center justify-center shadow-xs">
              <Bot className="size-4" />
            </div>
            <div>
              <h3 className="font-semibold text-sm">GitFinder AI Advisor</h3>
              <p className="text-[11px] text-muted-foreground">
                Repository intelligence &amp; search assistant
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={handleResetChat}
              title="Reset conversation"
              className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted"
            >
              <RotateCcw className="size-3.5" />
            </button>
            <button
              type="button"
              onClick={onClose}
              title="Close drawer"
              className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted"
            >
              <X className="size-4" />
            </button>
          </div>
        </div>

        {/* Model & Search Grounding Controls Bar */}
        <div className="px-4 py-2.5 border-b border-border/80 bg-muted/15 flex flex-wrap items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-1.5">
            <span className="text-[11px] text-muted-foreground">Model:</span>
            <select
              aria-label="Select AI Model"
              value={model}
              onChange={(e) => setModel(e.target.value as typeof model)}
              disabled={useSearchGrounding}
              className="bg-transparent border border-border rounded px-1.5 py-0.5 text-[11px] text-foreground font-mono focus:outline-none"
            >
              <option value="gemini-3.5-flash">gemini-3.5-flash (General)</option>
              <option value="gemini-3.1-flash-lite">gemini-3.1-flash-lite (Fast)</option>
              <option value="gemini-3.1-pro-preview">gemini-3.1-pro-preview (Complex)</option>
            </select>
          </div>

          {/* Search Grounding Toggle */}
          <label className="flex items-center gap-1.5 cursor-pointer text-[11px] select-none">
            <input
              type="checkbox"
              checked={useSearchGrounding}
              onChange={(e) => setUseSearchGrounding(e.target.checked)}
              className="rounded border-border size-3.5 accent-primary"
            />
            <span className="flex items-center gap-1 font-medium text-foreground">
              <Globe className="size-3 text-blue-500" />
              Search Grounding
            </span>
          </label>
        </div>

        {/* Messages List */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4 text-xs">
          {messages.map((m) => (
            <div
              key={m.id}
              className={cn(
                'flex gap-2.5 max-w-[90%]',
                m.role === 'user' ? 'ml-auto flex-row-reverse' : 'mr-auto'
              )}
            >
              <div
                className={cn(
                  'size-6 rounded-full flex items-center justify-center shrink-0 text-[10px]',
                  m.role === 'user'
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted text-foreground'
                )}
              >
                {m.role === 'user' ? <User className="size-3" /> : <Bot className="size-3" />}
              </div>

              <div className="space-y-1.5">
                <div
                  className={cn(
                    'rounded-xl px-3.5 py-2.5 leading-relaxed whitespace-pre-wrap break-words',
                    m.role === 'user'
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted/70 text-foreground border border-border/60'
                  )}
                >
                  {m.content}
                </div>

                {/* Grounding Sources */}
                {m.sources && m.sources.length > 0 && (
                  <div className="p-2 rounded-lg bg-background border border-border/80 space-y-1 text-[11px]">
                    <span className="font-semibold text-muted-foreground flex items-center gap-1 text-[10px]">
                      <Globe className="size-3 text-blue-500" /> Grounded Search Sources:
                    </span>
                    <div className="flex flex-col gap-1 max-h-24 overflow-y-auto">
                      {m.sources.map((s, idx) => (
                        <a
                          key={idx}
                          href={s.uri}
                          target="_blank"
                          rel="noreferrer"
                          className="text-blue-500 hover:underline truncate flex items-center gap-1"
                        >
                          <ExternalLink className="size-2.5 shrink-0" />
                          <span className="truncate">{s.title || s.uri}</span>
                        </a>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex items-center gap-2 text-[10px] text-muted-foreground/80 px-1">
                  <span>{m.timestamp}</span>
                  {m.modelUsed && <span>&bull; {m.modelUsed}</span>}
                </div>
              </div>
            </div>
          ))}

          {isLoading && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground py-2 italic">
              <Loader2 className="size-3.5 animate-spin text-primary" />
              <span>{useSearchGrounding ? 'Grounding with Google Search...' : 'Thinking...'}</span>
            </div>
          )}
        </div>

        {/* Input Footer */}
        <div className="p-3 border-t border-border bg-background">
          <form
            onSubmit={(e) => {
              e.preventDefault()
              handleSend()
            }}
            className="flex items-center gap-1.5"
          >
            {/* Microphone Transcribe Button */}
            <AudioRecorder
              variant="outline"
              size="sm"
              onTranscribeComplete={(transcribedText) => {
                setInput((prev) => (prev ? `${prev} ${transcribedText}` : transcribedText))
              }}
            />

            <Input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about repositories, frameworks, or code..."
              className="flex-1 text-xs h-9"
            />

            <Button
              type="submit"
              size="sm"
              disabled={isLoading || !input.trim()}
              className="h-9 px-3 shrink-0"
            >
              <Send className="size-3.5" />
            </Button>
          </form>

          <p className="text-[10px] text-muted-foreground text-center mt-1.5">
            Mic transcription powered by <span className="font-mono">gemini-3.5-transcribe</span>
          </p>
        </div>
      </div>
    </div>
  )
}
