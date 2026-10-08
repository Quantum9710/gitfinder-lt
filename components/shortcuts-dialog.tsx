'use client'

import * as React from 'react'
import { Command, X, Keyboard } from 'lucide-react'

interface ShortcutsDialogProps {
  isOpen: boolean
  onClose: () => void
}

interface ShortcutItem {
  keys: string[]
  description: string
}

const SHORTCUTS: ShortcutItem[] = [
  { keys: ['⌘', 'K'], description: 'Focus repository search input' },
  { keys: ['/'], description: 'Quick focus search (when not in an input)' },
  { keys: ['⌘', 'Enter'], description: 'Execute search immediately' },
  { keys: ['Esc'], description: 'Close open dialogs or unfocus search' },
  { keys: ['⌘', 'J'], description: 'Toggle AI Advisor chat drawer' },
  { keys: ['⌘', 'B'], description: 'Toggle saved Firestore bookmarks' },
  { keys: ['⌘', 'Shift', 'V'], description: 'Toggle Live Voice conversation dialog' },
  { keys: ['⌘', '1'], description: 'Switch search mode to Repositories' },
  { keys: ['⌘', '2'], description: 'Switch search mode to Users & Orgs' },
  { keys: ['?'], description: 'Toggle this keyboard shortcuts cheat sheet' },
]

export function ShortcutsDialog({ isOpen, onClose }: ShortcutsDialogProps) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-in fade-in-0">
      <div className="relative w-full max-w-md rounded-2xl border border-border bg-card shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border bg-muted/20">
          <div className="flex items-center gap-2.5">
            <div className="size-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
              <Keyboard className="size-4" />
            </div>
            <div>
              <h3 className="font-semibold text-sm">Keyboard Shortcuts</h3>
              <p className="text-[11px] text-muted-foreground">
                Speed up navigation across GitFinder LT
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

        {/* Shortcuts List */}
        <div className="p-4 space-y-2.5 max-h-[60vh] overflow-y-auto">
          {SHORTCUTS.map((item, idx) => (
            <div
              key={idx}
              className="flex items-center justify-between py-1.5 px-2 rounded-lg hover:bg-muted/40 transition-colors text-xs"
            >
              <span className="text-foreground/90 font-medium">{item.description}</span>
              <div className="flex items-center gap-1 shrink-0">
                {item.keys.map((k, kIdx) => (
                  <kbd
                    key={kIdx}
                    className="inline-flex items-center justify-center min-w-5 h-5 px-1.5 text-[10px] font-mono font-semibold bg-muted border border-border/80 rounded shadow-2xs text-muted-foreground"
                  >
                    {k}
                  </kbd>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-border bg-muted/10 text-center">
          <p className="text-[11px] text-muted-foreground">
            On Windows &amp; Linux, use <kbd className="font-mono font-semibold text-foreground">Ctrl</kbd> instead of <kbd className="font-mono font-semibold text-foreground">⌘</kbd>.
          </p>
        </div>
      </div>
    </div>
  )
}
