'use client'

import * as React from 'react'
import { User } from 'firebase/auth'
import { logOut } from '@/lib/firebase'
import {
  LogOut,
  BookMarked,
  ShieldCheck,
  ChevronDown,
  User as UserIcon,
} from 'lucide-react'
import { Button } from '@/components/ui/button'

interface UserProfileMenuProps {
  user: User
  bookmarksCount: number
  onOpenBookmarks: () => void
}

export function UserProfileMenu({
  user,
  bookmarksCount,
  onOpenBookmarks,
}: UserProfileMenuProps) {
  const [isOpen, setIsOpen] = React.useState(false)
  const menuRef = React.useRef<HTMLDivElement>(null)

  React.useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleSignOut = async () => {
    setIsOpen(false)
    try {
      await logOut()
    } catch (err) {
      console.error('Error signing out:', err)
    }
  }

  return (
    <div ref={menuRef} className="relative">
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="flex items-center gap-2 p-1 pl-1.5 rounded-full hover:bg-muted border border-border/80 transition-all select-none"
        aria-label="User account menu"
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={user.photoURL || '/placeholder-user.jpg'}
          alt={user.displayName || 'User'}
          className="size-6 rounded-full border border-border/80 object-cover"
        />
        <span className="text-xs font-medium max-w-[100px] truncate hidden md:inline">
          {user.displayName?.split(' ')[0] || 'Account'}
        </span>
        <ChevronDown className="size-3 text-muted-foreground mr-0.5" />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-64 rounded-2xl border border-border bg-card shadow-xl p-3 z-30 animate-in fade-in-0 zoom-in-95 space-y-3">
          {/* User Details */}
          <div className="flex items-center gap-2.5 p-1.5 border-b border-border/70 pb-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={user.photoURL || '/placeholder-user.jpg'}
              alt={user.displayName || 'User'}
              className="size-9 rounded-full border border-border object-cover"
            />
            <div className="min-w-0">
              <p className="font-semibold text-xs text-foreground truncate">
                {user.displayName || 'Developer'}
              </p>
              <p className="text-[11px] text-muted-foreground truncate">
                {user.email}
              </p>
            </div>
          </div>

          {/* Account Status */}
          <div className="p-2 rounded-xl bg-muted/30 border border-border/60 space-y-1.5 text-[11px]">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Provider:</span>
              <span className="font-medium text-foreground flex items-center gap-1">
                <ShieldCheck className="size-3 text-emerald-500" /> Google Auth
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Cloud Bookmarks:</span>
              <span className="font-semibold text-foreground font-mono">
                {bookmarksCount} saved
              </span>
            </div>
          </div>

          {/* Actions */}
          <div className="space-y-1 pt-1">
            <button
              type="button"
              onClick={() => {
                setIsOpen(false)
                onOpenBookmarks()
              }}
              className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs text-foreground hover:bg-muted transition-colors font-medium"
            >
              <span className="flex items-center gap-2">
                <BookMarked className="size-3.5 text-primary" />
                <span>Saved Bookmarks</span>
              </span>
              <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-muted">
                {bookmarksCount}
              </span>
            </button>

            <button
              type="button"
              onClick={handleSignOut}
              className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs text-destructive hover:bg-destructive/10 transition-colors font-medium"
            >
              <LogOut className="size-3.5" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
