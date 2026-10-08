'use client'

import * as React from 'react'
import { SavedBookmark, removeRepositoryBookmark } from '@/lib/firebase'
import {
  BookMarked,
  X,
  ExternalLink,
  Trash2,
  Star,
  GitFork,
  Circle,
} from 'lucide-react'
import { Button } from '@/components/ui/button'

interface BookmarksModalProps {
  isOpen: boolean
  onClose: () => void
  bookmarks: SavedBookmark[]
  userId?: string
}

export function BookmarksModal({
  isOpen,
  onClose,
  bookmarks,
  userId,
}: BookmarksModalProps) {
  if (!isOpen) return null

  const handleRemove = async (repoId: number) => {
    if (!userId) return
    try {
      await removeRepositoryBookmark(userId, repoId)
    } catch (err) {
      console.error('Failed to remove bookmark:', err)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-in fade-in-0">
      <div className="relative w-full max-w-xl rounded-2xl border border-border bg-card shadow-2xl flex flex-col max-h-[85vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border bg-muted/20">
          <div className="flex items-center gap-2.5">
            <div className="size-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
              <BookMarked className="size-4" />
            </div>
            <div>
              <h3 className="font-semibold text-sm">Saved Bookmarks</h3>
              <p className="text-[11px] text-muted-foreground">
                Persisted securely in Firebase Cloud Firestore
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted"
          >
            <X className="size-4" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {bookmarks.length === 0 ? (
            <div className="text-center py-12 space-y-2">
              <div className="size-12 rounded-full bg-muted mx-auto flex items-center justify-center text-muted-foreground">
                <BookMarked className="size-5" />
              </div>
              <p className="text-sm font-medium">No saved repositories yet</p>
              <p className="text-xs text-muted-foreground max-w-xs mx-auto">
                Click the bookmark icon on any repository card to save it to your Firestore database.
              </p>
            </div>
          ) : (
            bookmarks.map((b) => (
              <div
                key={b.id}
                className="p-3.5 rounded-xl border border-border bg-background hover:border-foreground/20 transition-all flex items-start justify-between gap-3"
              >
                <div className="min-w-0 space-y-1">
                  <div className="flex items-center gap-2">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={b.ownerAvatarUrl || '/placeholder-user.jpg'}
                      alt={b.ownerLogin}
                      className="size-5 rounded-full border border-border"
                    />
                    <a
                      href={b.htmlUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="font-semibold text-xs text-foreground hover:underline truncate"
                    >
                      {b.fullName}
                    </a>
                  </div>

                  <p className="text-[11px] text-muted-foreground line-clamp-2">
                    {b.description || 'No description provided.'}
                  </p>

                  <div className="flex items-center gap-3 text-[10px] text-muted-foreground pt-1">
                    <span className="flex items-center gap-1">
                      <Star className="size-3 text-amber-500 fill-amber-500/20" />
                      <span>{b.stars}</span>
                    </span>
                    <span className="flex items-center gap-1">
                      <GitFork className="size-3" />
                      <span>{b.forks}</span>
                    </span>
                    {b.language && (
                      <span className="flex items-center gap-1">
                        <Circle className="size-2 fill-primary text-primary" />
                        <span>{b.language}</span>
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  <a
                    href={b.htmlUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted"
                    title="Open on GitHub"
                  >
                    <ExternalLink className="size-3.5" />
                  </a>
                  <button
                    type="button"
                    onClick={() => handleRemove(b.repoId)}
                    className="p-1.5 rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                    title="Remove from Firestore bookmarks"
                  >
                    <Trash2 className="size-3.5" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
