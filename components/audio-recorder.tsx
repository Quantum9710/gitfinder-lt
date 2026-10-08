'use client'

import * as React from 'react'
import { Mic, MicOff, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface AudioRecorderProps {
  onTranscribeComplete: (text: string) => void
  onError?: (err: string) => void
  className?: string
  size?: 'sm' | 'default' | 'icon'
  variant?: 'outline' | 'default' | 'ghost' | 'secondary'
}

export function AudioRecorder({
  onTranscribeComplete,
  onError,
  className,
  size = 'icon',
  variant = 'ghost',
}: AudioRecorderProps) {
  const [isRecording, setIsRecording] = React.useState(false)
  const [isProcessing, setIsProcessing] = React.useState(false)
  const mediaRecorderRef = React.useRef<MediaRecorder | null>(null)
  const chunksRef = React.useRef<Blob[]>([])

  const startRecording = async () => {
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Microphone access is not supported on this browser.')
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
        if (e.data && e.data.size > 0) {
          chunksRef.current.push(e.data)
        }
      }

      recorder.onstop = async () => {
        // Stop audio tracks
        stream.getTracks().forEach((track) => track.stop())

        if (chunksRef.current.length === 0) return

        setIsProcessing(true)
        try {
          const blob = new Blob(chunksRef.current, { type: recorder.mimeType || 'audio/webm' })
          const reader = new FileReader()

          reader.onloadend = async () => {
            const base64Audio = reader.result as string
            try {
              const res = await fetch('/api/gemini/transcribe', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  audioData: base64Audio,
                  mimeType: blob.type || 'audio/webm',
                }),
              })

              const data = await res.json()
              if (!res.ok) {
                throw new Error(data.error || 'Failed to transcribe audio')
              }

              if (data.transcription) {
                onTranscribeComplete(data.transcription)
              }
            } catch (err) {
              const msg = err instanceof Error ? err.message : String(err)
              onError?.(msg)
            } finally {
              setIsProcessing(false)
            }
          }

          reader.readAsDataURL(blob)
        } catch (err) {
          console.error(err)
          setIsProcessing(false)
        }
      }

      recorder.start()
      setIsRecording(true)
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Could not access microphone.'
      console.error(msg)
      onError?.(msg)
    }
  }

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop()
      setIsRecording(false)
    }
  }

  const toggleRecording = () => {
    if (isRecording) {
      stopRecording()
    } else {
      startRecording()
    }
  }

  return (
    <Button
      type="button"
      variant={isRecording ? 'destructive' : variant}
      size={size}
      disabled={isProcessing}
      onClick={toggleRecording}
      title={isRecording ? 'Click to stop and transcribe' : 'Speak with microphone (gemini-3.5-transcribe)'}
      className={cn(
        'relative transition-all',
        isRecording && 'animate-pulse ring-2 ring-destructive/40',
        className
      )}
    >
      {isProcessing ? (
        <Loader2 className="size-4 animate-spin text-muted-foreground" />
      ) : isRecording ? (
        <MicOff className="size-4 text-white" />
      ) : (
        <Mic className="size-4" />
      )}
    </Button>
  )
}
