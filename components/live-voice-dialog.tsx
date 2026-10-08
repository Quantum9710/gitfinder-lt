'use client'

import * as React from 'react'
import {
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  X,
  Sparkles,
  Loader2,
  Radio,
  MessageSquare,
  Bot,
  User,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface LiveVoiceDialogProps {
  isOpen: boolean
  onClose: () => void
}

interface MessageTurn {
  id: string
  role: 'user' | 'model'
  text: string
}

export function LiveVoiceDialog({ isOpen, onClose }: LiveVoiceDialogProps) {
  const [isRecording, setIsRecording] = React.useState(false)
  const [isProcessing, setIsProcessing] = React.useState(false)
  const [isPlayingAudio, setIsPlayingAudio] = React.useState(false)
  const [conversation, setConversation] = React.useState<MessageTurn[]>([
    {
      id: 'init',
      role: 'model',
      text: "Hello! I'm your Live AI voice assistant powered by gemini-3.8-live. Speak to me to explore GitHub projects, architectures, or open-source trends.",
    },
  ])

  const audioRef = React.useRef<HTMLAudioElement | null>(null)
  const mediaRecorderRef = React.useRef<MediaRecorder | null>(null)
  const chunksRef = React.useRef<Blob[]>([])

  if (!isOpen) return null

  const handleStartRecording = async () => {
    try {
      if (audioRef.current) {
        audioRef.current.pause()
        setIsPlayingAudio(false)
      }

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      chunksRef.current = []

      const mimeType = MediaRecorder.isTypeSupported('audio/webm')
        ? 'audio/webm'
        : MediaRecorder.isTypeSupported('audio/mp4')
          ? 'audio/mp4'
          : ''

      const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined)
      mediaRecorderRef.current = recorder

      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) chunksRef.current.push(e.data)
      }

      recorder.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop())
        if (chunksRef.current.length === 0) return

        setIsProcessing(true)
        const blob = new Blob(chunksRef.current, { type: recorder.mimeType || 'audio/webm' })
        const reader = new FileReader()

        reader.onloadend = async () => {
          const base64Audio = reader.result as string
          try {
            // First transcribe or pass audio directly
            const res = await fetch('/api/gemini/live', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                audioData: base64Audio,
                mimeType: blob.type || 'audio/webm',
                conversation: conversation.slice(-6).map((c) => ({
                  role: c.role,
                  text: c.text,
                })),
              }),
            })

            const data = await res.json()
            if (!res.ok) throw new Error(data.error || 'Live API interaction failed')

            // Add user turn note if not provided
            setConversation((prev) => [
              ...prev,
              {
                id: String(Date.now()),
                role: 'user',
                text: '[Voice message transmitted]',
              },
              {
                id: String(Date.now() + 1),
                role: 'model',
                text: data.text || 'I heard your voice message.',
              },
            ])

            if (data.audio) {
              if (audioRef.current) {
                audioRef.current.src = data.audio
                audioRef.current.play()
                setIsPlayingAudio(true)
              }
            }
          } catch (err) {
            console.error('Live turn failed:', err)
          } finally {
            setIsProcessing(false)
          }
        }

        reader.readAsDataURL(blob)
      }

      recorder.start()
      setIsRecording(true)
    } catch (err) {
      console.error('Microphone error:', err)
    }
  }

  const handleStopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop()
      setIsRecording(false)
    }
  }

  const handleSendPromptText = async (promptText: string) => {
    setIsProcessing(true)
    setConversation((prev) => [
      ...prev,
      { id: String(Date.now()), role: 'user', text: promptText },
    ])

    try {
      const res = await fetch('/api/gemini/live', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: promptText,
          conversation: conversation.slice(-6).map((c) => ({
            role: c.role,
            text: c.text,
          })),
        }),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Live conversation failed')

      setConversation((prev) => [
        ...prev,
        {
          id: String(Date.now() + 1),
          role: 'model',
          text: data.text,
        },
      ])

      if (data.audio) {
        if (audioRef.current) {
          audioRef.current.src = data.audio
          audioRef.current.play()
          setIsPlayingAudio(true)
        }
      }
    } catch (err) {
      console.error(err)
    } finally {
      setIsProcessing(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-in fade-in-0">
      <audio
        ref={audioRef}
        onEnded={() => setIsPlayingAudio(false)}
        className="hidden"
      />

      <div className="relative w-full max-w-lg rounded-2xl border border-border bg-card shadow-2xl flex flex-col max-h-[85vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border bg-muted/30">
          <div className="flex items-center gap-2.5">
            <div className="size-8 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <Radio className="size-4 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h3 className="font-semibold text-sm">Live Voice Conversation</h3>
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-medium">
                  gemini-3.8-live
                </span>
              </div>
              <p className="text-[11px] text-muted-foreground">
                Real-time conversational voice interaction
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              if (audioRef.current) audioRef.current.pause()
              onClose()
            }}
            className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted"
          >
            <X className="size-4" />
          </button>
        </div>

        {/* Scrollable Conversation Stream */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3 min-h-[220px]">
          {conversation.map((turn) => (
            <div
              key={turn.id}
              className={cn(
                'flex gap-2.5 max-w-[85%]',
                turn.role === 'user' ? 'ml-auto flex-row-reverse' : 'mr-auto'
              )}
            >
              <div
                className={cn(
                  'size-6 rounded-full flex items-center justify-center shrink-0 text-[10px]',
                  turn.role === 'user'
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted text-foreground'
                )}
              >
                {turn.role === 'user' ? <User className="size-3" /> : <Bot className="size-3" />}
              </div>
              <div
                className={cn(
                  'rounded-xl px-3.5 py-2 text-xs leading-relaxed',
                  turn.role === 'user'
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted/80 text-foreground border border-border/60'
                )}
              >
                {turn.text}
              </div>
            </div>
          ))}

          {isProcessing && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground italic">
              <Loader2 className="size-3.5 animate-spin" />
              <span>gemini-3.8-live is responding...</span>
            </div>
          )}
        </div>

        {/* Live Voice Reactive Controls */}
        <div className="p-5 border-t border-border bg-muted/20 flex flex-col items-center justify-center space-y-4">
          <div className="relative flex items-center justify-center">
            {isRecording && (
              <div className="absolute size-20 rounded-full bg-destructive/20 animate-ping pointer-events-none" />
            )}
            {isPlayingAudio && (
              <div className="absolute size-20 rounded-full bg-emerald-500/20 animate-pulse pointer-events-none" />
            )}

            <button
              type="button"
              onClick={isRecording ? handleStopRecording : handleStartRecording}
              disabled={isProcessing}
              className={cn(
                'relative z-10 size-16 rounded-full flex items-center justify-center transition-all shadow-md',
                isRecording
                  ? 'bg-destructive text-white scale-105'
                  : 'bg-primary text-primary-foreground hover:scale-105'
              )}
            >
              {isRecording ? <MicOff className="size-7" /> : <Mic className="size-7" />}
            </button>
          </div>

          <div className="text-center space-y-1">
            <p className="text-xs font-medium text-foreground">
              {isRecording
                ? 'Listening... Click to stop speaking'
                : isProcessing
                  ? 'Processing audio with Live API...'
                  : isPlayingAudio
                    ? 'Speaking response...'
                    : 'Tap microphone to speak'}
            </p>
            <p className="text-[11px] text-muted-foreground">
              Real-time voice dialogue powered by gemini-3.8-live
            </p>
          </div>

          {/* Preset Prompts */}
          <div className="flex flex-wrap items-center justify-center gap-1.5 pt-1">
            {[
              'Trending GitHub repos today',
              'Explain Next.js server components',
              'Best practices for open source',
            ].map((p) => (
              <button
                key={p}
                type="button"
                disabled={isRecording || isProcessing}
                onClick={() => handleSendPromptText(p)}
                className="text-[10px] px-2 py-0.5 rounded-full border border-border bg-background hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
              >
                {p}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
