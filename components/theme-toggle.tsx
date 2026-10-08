'use client'

import * as React from 'react'
import { Sun, Moon } from 'lucide-react'
import { cn } from '@/lib/utils'

export function ThemeToggle({ className }: { className?: string }) {
  const [isDark, setIsDark] = React.useState(false)
  const [mounted, setMounted] = React.useState(false)

  React.useEffect(() => {
    setMounted(true)
    const storedTheme = localStorage.getItem('gitfinder_theme')
    if (storedTheme) {
      const activeDark = storedTheme === 'dark'
      setIsDark(activeDark)
      if (activeDark) {
        document.documentElement.classList.add('dark')
        document.documentElement.classList.remove('light')
      } else {
        document.documentElement.classList.add('light')
        document.documentElement.classList.remove('dark')
      }
    } else {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
      setIsDark(prefersDark)
      if (prefersDark) {
        document.documentElement.classList.add('dark')
        document.documentElement.classList.remove('light')
      } else {
        document.documentElement.classList.add('light')
        document.documentElement.classList.remove('dark')
      }
    }
  }, [])

  const toggleTheme = () => {
    const nextDark = !isDark
    setIsDark(nextDark)
    if (nextDark) {
      document.documentElement.classList.add('dark')
      document.documentElement.classList.remove('light')
      localStorage.setItem('gitfinder_theme', 'dark')
    } else {
      document.documentElement.classList.add('light')
      document.documentElement.classList.remove('dark')
      localStorage.setItem('gitfinder_theme', 'light')
    }
  }

  if (!mounted) {
    return (
      <div className={cn('w-14 h-7 rounded-full bg-muted border border-border shrink-0', className)} />
    )
  }

  return (
    <button
      type="button"
      role="switch"
      aria-checked={isDark}
      aria-label="Toggle dark and light theme"
      title={isDark ? 'Switch to Light mode' : 'Switch to Dark mode'}
      onClick={toggleTheme}
      className={cn(
        'group relative inline-flex h-7 w-14 shrink-0 cursor-pointer items-center rounded-full border border-border/80 p-0.5 transition-colors duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 select-none',
        isDark ? 'bg-zinc-800' : 'bg-zinc-200/90',
        className
      )}
    >
      {/* Background Icons */}
      <div className="absolute inset-0 flex items-center justify-between px-1.5 pointer-events-none">
        <Sun
          className={cn(
            'size-3.5 transition-opacity duration-200',
            isDark ? 'opacity-30 text-zinc-400' : 'opacity-100 text-amber-500'
          )}
        />
        <Moon
          className={cn(
            'size-3.5 transition-opacity duration-200',
            isDark ? 'opacity-100 text-blue-400' : 'opacity-30 text-zinc-400'
          )}
        />
      </div>

      {/* Sliding Thumb */}
      <span
        className={cn(
          'pointer-events-none z-10 flex size-6 items-center justify-center rounded-full bg-background shadow-md transition-transform duration-300 ease-in-out border border-border/50',
          isDark ? 'translate-x-7' : 'translate-x-0'
        )}
      >
        {isDark ? (
          <Moon className="size-3 text-blue-400 fill-blue-400/20" />
        ) : (
          <Sun className="size-3 text-amber-500 fill-amber-500/20" />
        )}
      </span>
    </button>
  )
}
