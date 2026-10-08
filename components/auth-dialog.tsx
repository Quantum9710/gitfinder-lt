'use client'

import * as React from 'react'
import {
  X,
  ShieldCheck,
  BookMarked,
  Sparkles,
  Bot,
  AlertCircle,
  Loader2,
  CheckCircle2,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { signInWithGoogle } from '@/lib/firebase'

interface AuthDialogProps {
  isOpen: boolean
  onClose: () => void
  onSuccess?: () => void
}

export function AuthDialog({ isOpen, onClose, onSuccess }: AuthDialogProps) {
  const [isLoading, setIsLoading] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)

  if (!isOpen) return null

  const handleGoogleSignIn = async () => {
    setIsLoading(true)
    setError(null)
    try {
      await signInWithGoogle()
      onSuccess?.()
      onClose()
    } catch (err) {
      console.error('Sign-in error:', err)
      const errObj = err as { code?: string; message?: string }
      if (errObj.code === 'auth/popup-blocked') {
        setError('Popup was blocked by your browser. Please allow popups for this site and try again.')
      } else if (errObj.code === 'auth/popup-closed-by-user') {
        setError('Sign-in popup was closed before completing. Please try again.')
      } else {
        setError(errObj.message || 'Failed to sign in with Google. Please try again.')
      }
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-in fade-in-0">
      <div className="relative w-full max-w-md rounded-2xl border border-border bg-card shadow-2xl overflow-hidden animate-in zoom-in-95">
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors z-10"
          aria-label="Close authentication dialog"
        >
          <X className="size-4" />
        </button>

        {/* Modal Header */}
        <div className="p-6 text-center space-y-2 border-b border-border bg-muted/20">
          <div className="size-12 rounded-2xl bg-foreground text-background mx-auto flex items-center justify-center shadow-md font-bold text-lg">
            GF
          </div>
          <h2 className="text-xl font-bold tracking-tight text-foreground">
            Sign in to GitFinder LT
          </h2>
          <p className="text-xs text-muted-foreground max-w-xs mx-auto leading-relaxed">
            Connect your account with Google Sign-In for persistent repository discovery and cloud bookmarks.
          </p>
        </div>

        {/* Value Proposition List */}
        <div className="p-6 space-y-4">
          <div className="space-y-3">
            <div className="flex items-start gap-3 text-xs">
              <div className="size-6 rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 mt-0.5">
                <BookMarked className="size-3.5" />
              </div>
              <div>
                <p className="font-semibold text-foreground">Sync Bookmarked Repositories</p>
                <p className="text-[11px] text-muted-foreground">
                  Saved repositories are instantly persisted to your private Firebase Cloud Firestore collection.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 text-xs">
              <div className="size-6 rounded-md bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0 mt-0.5">
                <Bot className="size-3.5" />
              </div>
              <div>
                <p className="font-semibold text-foreground">Personalized AI Advisor</p>
                <p className="text-[11px] text-muted-foreground">
                  Ask deep architecture and repository questions with Google Search grounded data.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 text-xs">
              <div className="size-6 rounded-md bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0 mt-0.5">
                <ShieldCheck className="size-3.5" />
              </div>
              <div>
                <p className="font-semibold text-foreground">Secure &amp; Passwordless</p>
                <p className="text-[11px] text-muted-foreground">
                  Protected by Firebase Authentication and hardened Firestore Zero-Trust security rules.
                </p>
              </div>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="p-3 rounded-lg border border-destructive/30 bg-destructive/10 text-destructive text-xs flex items-start gap-2">
              <AlertCircle className="size-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Google Sign-in Action Button */}
          <div className="pt-2">
            <Button
              type="button"
              disabled={isLoading}
              onClick={handleGoogleSignIn}
              className="w-full h-11 rounded-xl bg-foreground text-background hover:bg-foreground/90 font-medium text-sm flex items-center justify-center gap-3 shadow-sm transition-all"
            >
              {isLoading ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  <span>Connecting with Google...</span>
                </>
              ) : (
                <>
                  <svg className="size-4.5" viewBox="0 0 24 24">
                    <path
                      fill="#4285F4"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                    />
                  </svg>
                  <span>Continue with Google</span>
                </>
              )}
            </Button>
          </div>

          <p className="text-[10px] text-muted-foreground text-center">
            By signing in, your session is authenticated via Firebase Auth.
          </p>
        </div>
      </div>
    </div>
  )
}
