'use client'

import * as React from 'react'
import { SearchInput, SearchType, SortOption } from '@/components/search-input'
import {
  GitHubResults,
  GitHubRepoItem,
  GitHubUserItem,
} from '@/components/github-results'
import { AIAdvisorDrawer } from '@/components/ai-advisor-drawer'
import { LiveVoiceDialog } from '@/components/live-voice-dialog'
import { BookmarksModal } from '@/components/bookmarks-modal'
import { ShortcutsDialog } from '@/components/shortcuts-dialog'
import { AuthDialog } from '@/components/auth-dialog'
import { UserProfileMenu } from '@/components/user-profile-menu'
import { ThemeToggle } from '@/components/theme-toggle'
import { TrendingRepositories } from '@/components/trending-repositories'
import {
  auth,
  signInWithGoogle,
  logOut,
  testFirebaseConnection,
  subscribeToBookmarks,
  saveRepositoryBookmark,
  removeRepositoryBookmark,
  SavedBookmark,
} from '@/lib/firebase'
import { onAuthStateChanged, User } from 'firebase/auth'
import {
  Search,
  Sparkles,
  GitBranch,
  Bot,
  Radio,
  BookMarked,
  LogIn,
  LogOut,
  Globe,
  Mic,
  ShieldCheck,
  Keyboard,
} from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function Page() {
  const [query, setQuery] = React.useState('')
  const [isLoading, setIsLoading] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const [rateLimitReset, setRateLimitReset] = React.useState<number | undefined>(undefined)
  const [results, setResults] = React.useState<{
    type: SearchType
    items: (GitHubRepoItem | GitHubUserItem)[]
    total_count: number
    query: string
  } | null>(null)

  // Firebase auth & firestore bookmarks
  const [currentUser, setCurrentUser] = React.useState<User | null>(null)
  const [authLoading, setAuthLoading] = React.useState(true)
  const [bookmarks, setBookmarks] = React.useState<SavedBookmark[]>([])
  const [firebaseConnected, setFirebaseConnected] = React.useState<boolean | null>(null)

  // Dialog / Drawer states
  const [isAIDrawerOpen, setIsAIDrawerOpen] = React.useState(false)
  const [isLiveVoiceOpen, setIsLiveVoiceOpen] = React.useState(false)
  const [isBookmarksOpen, setIsBookmarksOpen] = React.useState(false)
  const [isShortcutsOpen, setIsShortcutsOpen] = React.useState(false)
  const [isAuthDialogOpen, setIsAuthDialogOpen] = React.useState(false)
  const [aiContextRepo, setAiContextRepo] = React.useState<string | undefined>(undefined)

  // Global Keyboard Shortcuts (Escape, ?, Cmd+J, Cmd+B, Cmd+Shift+V)
  React.useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      const isCmdOrCtrl = e.metaKey || e.ctrlKey

      // Escape key to dismiss modals/drawers
      if (e.key === 'Escape') {
        if (isAuthDialogOpen) setIsAuthDialogOpen(false)
        else if (isShortcutsOpen) setIsShortcutsOpen(false)
        else if (isBookmarksOpen) setIsBookmarksOpen(false)
        else if (isLiveVoiceOpen) setIsLiveVoiceOpen(false)
        else if (isAIDrawerOpen) setIsAIDrawerOpen(false)
        return
      }

      // '?' key or Cmd+/ (when not typing in an input) toggles shortcuts dialog
      if (
        (e.key === '?' || (isCmdOrCtrl && e.key === '/')) &&
        document.activeElement?.tagName !== 'INPUT' &&
        document.activeElement?.tagName !== 'TEXTAREA'
      ) {
        e.preventDefault()
        setIsShortcutsOpen((prev) => !prev)
        return
      }

      // Cmd+J toggles AI Advisor
      if (isCmdOrCtrl && e.key.toLowerCase() === 'j') {
        e.preventDefault()
        setIsAIDrawerOpen((prev) => !prev)
        return
      }

      // Cmd+B toggles Bookmarks
      if (isCmdOrCtrl && e.key.toLowerCase() === 'b') {
        e.preventDefault()
        setIsBookmarksOpen((prev) => !prev)
        return
      }

      // Cmd+Shift+V toggles Live Voice dialog
      if (isCmdOrCtrl && e.shiftKey && e.key.toLowerCase() === 'v') {
        e.preventDefault()
        setIsLiveVoiceOpen((prev) => !prev)
        return
      }
    }

    window.addEventListener('keydown', handleGlobalKeyDown)
    return () => window.removeEventListener('keydown', handleGlobalKeyDown)
  }, [isAuthDialogOpen, isShortcutsOpen, isBookmarksOpen, isLiveVoiceOpen, isAIDrawerOpen])

  // Monitor Firebase auth & test connection
  React.useEffect(() => {
    testFirebaseConnection().then(setFirebaseConnected)

    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user)
      setAuthLoading(false)
    })

    return () => unsubscribeAuth()
  }, [])

  // Subscribe to user's Firestore bookmarks
  React.useEffect(() => {
    if (!currentUser) {
      setBookmarks([])
      return
    }

    const unsubscribeBookmarks = subscribeToBookmarks(
      currentUser.uid,
      (items) => setBookmarks(items),
      (err) => console.error('Firestore bookmarks subscription error:', err)
    )

    return () => unsubscribeBookmarks()
  }, [currentUser])

  const bookmarkedIds = React.useMemo(() => {
    return new Set(bookmarks.map((b) => b.repoId))
  }, [bookmarks])

  const handleSearch = async (
    searchQuery: string,
    type: SearchType = 'repositories',
    sort: SortOption = 'stars'
  ) => {
    if (!searchQuery.trim()) return

    setIsLoading(true)
    setError(null)

    try {
      const params = new URLSearchParams({
        q: searchQuery.trim(),
        type,
        sort,
      })

      const res = await fetch(`/api/github/search?${params.toString()}`)
      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Failed to fetch search results from GitHub')
        setRateLimitReset(data.rateLimitReset)
        setIsLoading(false)
        return
      }

      setResults({
        type,
        items: data.items || [],
        total_count: data.total_count || 0,
        query: searchQuery.trim(),
      })
    } catch (err) {
      console.error('Search error:', err)
      setError('An error occurred while connecting to the GitHub API.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleSearchPreset = (presetQuery: string, type: SearchType) => {
    setQuery(presetQuery)
    handleSearch(presetQuery, type, 'stars')
  }

  const handleBookmarkToggle = async (repo: GitHubRepoItem) => {
    if (!currentUser) {
      setIsAuthDialogOpen(true)
      return
    }

    if (bookmarkedIds.has(repo.id)) {
      await removeRepositoryBookmark(currentUser.uid, repo.id)
    } else {
      await saveRepositoryBookmark(currentUser, repo)
    }
  }

  const handleAskAI = (repoFullName: string) => {
    setAiContextRepo(repoFullName)
    setIsAIDrawerOpen(true)
  }

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      {/* Top Navigation Bar */}
      <header className="border-b border-border/70 sticky top-0 z-20 bg-background/85 backdrop-blur-md">
        <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between gap-3">
          {/* Brand */}
          <div className="flex items-center gap-2.5">
            <div className="size-8 rounded-lg bg-foreground text-background flex items-center justify-center font-bold text-sm tracking-tight shadow-xs">
              <Search className="size-4" />
            </div>
            <div>
              <span className="font-semibold text-sm tracking-tight">GitFinder</span>
              <span className="text-[10px] font-mono ml-1 px-1.5 py-0.5 rounded bg-muted text-muted-foreground border border-border">
                LT
              </span>
            </div>
          </div>

          {/* Quick Feature Action Buttons */}
          <div className="flex items-center gap-1.5 sm:gap-2">
            {/* Live Voice API Button */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsLiveVoiceOpen(true)}
              className="h-8 gap-1.5 text-xs text-emerald-600 dark:text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/10"
              title="Live Voice Conversation (gemini-3.8-live) - Shortcut: Cmd+Shift+V"
            >
              <Radio className="size-3.5 animate-pulse text-emerald-500" />
              <span className="hidden sm:inline">Live Voice</span>
              <kbd className="hidden lg:inline text-[9px] font-mono px-1 py-0.2 bg-muted/60 border border-border rounded opacity-75">
                ⌘⇧V
              </kbd>
            </Button>

            {/* AI Advisor with Search Grounding Button */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setAiContextRepo(undefined)
                setIsAIDrawerOpen(true)
              }}
              className="h-8 gap-1.5 text-xs"
              title="AI Advisor with Google Search Grounding - Shortcut: Cmd+J"
            >
              <Bot className="size-3.5 text-primary" />
              <span className="hidden sm:inline">AI Advisor</span>
              <span className="hidden md:inline-flex items-center gap-0.5 text-[9px] bg-blue-500/10 text-blue-600 dark:text-blue-400 px-1 py-0.2 rounded font-medium">
                <Globe className="size-2.5" /> Grounded
              </span>
              <kbd className="hidden lg:inline text-[9px] font-mono px-1 py-0.2 bg-muted/60 border border-border rounded opacity-75">
                ⌘J
              </kbd>
            </Button>

            {/* Bookmarks Modal Button */}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsBookmarksOpen(true)}
              className="h-8 gap-1.5 text-xs relative"
              title="Saved Firestore Bookmarks - Shortcut: Cmd+B"
            >
              <BookMarked className="size-3.5" />
              <span className="hidden sm:inline">Bookmarks</span>
              {bookmarks.length > 0 && (
                <span className="size-4 rounded-full bg-primary text-primary-foreground text-[10px] flex items-center justify-center font-bold">
                  {bookmarks.length}
                </span>
              )}
              <kbd className="hidden lg:inline text-[9px] font-mono px-1 py-0.2 bg-muted/60 border border-border rounded opacity-75">
                ⌘B
              </kbd>
            </Button>

            {/* Keyboard Shortcuts Cheat Sheet Button */}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsShortcutsOpen(true)}
              className="h-8 px-2 text-xs text-muted-foreground hover:text-foreground"
              title="Keyboard Shortcuts Cheat Sheet (?)"
            >
              <Keyboard className="size-3.5" />
              <kbd className="hidden md:inline text-[9px] font-mono px-1 py-0.2 bg-muted/60 border border-border rounded opacity-75">
                ?
              </kbd>
            </Button>

            {/* Sliding Theme Toggle (Dark / Light) */}
            <ThemeToggle />

            <div className="h-4 w-px bg-border mx-0.5" />

            {/* Firebase Google Auth Button & Profile Menu */}
            {authLoading ? (
              <div className="size-8 rounded-full bg-muted animate-pulse" />
            ) : currentUser ? (
              <UserProfileMenu
                user={currentUser}
                bookmarksCount={bookmarks.length}
                onOpenBookmarks={() => setIsBookmarksOpen(true)}
              />
            ) : (
              <Button
                variant="default"
                size="sm"
                onClick={() => setIsAuthDialogOpen(true)}
                className="h-8 gap-1.5 text-xs shadow-xs"
              >
                <LogIn className="size-3.5" />
                <span>Sign In</span>
              </Button>
            )}
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-5xl w-full mx-auto px-4 py-8 sm:py-12 space-y-8">
        {/* Hero Section */}
        <div className="text-center space-y-3 max-w-2xl mx-auto pt-2">
          <div className="inline-flex flex-wrap items-center justify-center gap-2">
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-muted border border-border/80 text-muted-foreground">
              <Sparkles className="size-3 text-amber-500" />
              <span>GitHub Exploration</span>
            </span>
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
              <Globe className="size-2.5" />
              <span>Google Search Grounding</span>
            </span>
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
              <Radio className="size-2.5" />
              <span>Live API Voice</span>
            </span>
          </div>

          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-foreground">
            Discover GitHub repositories
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
            Search millions of projects, dictate via microphone with <span className="font-mono text-xs">gemini-3.5-transcribe</span>, analyze with grounded AI, or hold real-time voice conversations.
          </p>
        </div>

        {/* Search Component Section with Mic Audio Recording */}
        <div className="max-w-3xl mx-auto">
          <SearchInput
            value={query}
            onChange={setQuery}
            onSearch={handleSearch}
            isLoading={isLoading}
          />
        </div>

        {/* Auth prompt banner when not logged in */}
        {!authLoading && !currentUser && (
          <div className="max-w-3xl mx-auto p-3.5 rounded-xl border border-border/80 bg-muted/20 backdrop-blur-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2.5 text-muted-foreground">
              <div className="size-7 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                <ShieldCheck className="size-4" />
              </div>
              <div>
                <p className="font-semibold text-foreground">Sign in with Google to enable Cloud Bookmarks</p>
                <p className="text-[11px]">Save repositories directly to your private Firebase Cloud Firestore collection.</p>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsAuthDialogOpen(true)}
              className="h-7.5 text-xs font-medium shrink-0 self-end sm:self-auto gap-1.5"
            >
              <LogIn className="size-3.5" />
              <span>Sign In</span>
            </Button>
          </div>
        )}

        {/* Feature Highlights Grid */}
        {!results && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 max-w-4xl mx-auto pt-2">
            <div
              onClick={() => setIsAIDrawerOpen(true)}
              className="p-4 rounded-xl border border-border bg-card/50 hover:bg-card hover:border-foreground/20 cursor-pointer transition-all space-y-1.5"
            >
              <div className="size-8 rounded-lg bg-blue-500/10 text-blue-500 flex items-center justify-center">
                <Globe className="size-4" />
              </div>
              <h4 className="font-semibold text-xs text-foreground">Search Grounding</h4>
              <p className="text-[11px] text-muted-foreground leading-relaxed">
                Ground repository inquiries with Google Search data using gemini-3.5-flash for up-to-date facts.
              </p>
            </div>

            <div
              onClick={() => setIsLiveVoiceOpen(true)}
              className="p-4 rounded-xl border border-border bg-card/50 hover:bg-card hover:border-foreground/20 cursor-pointer transition-all space-y-1.5"
            >
              <div className="size-8 rounded-lg bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
                <Radio className="size-4 animate-pulse" />
              </div>
              <h4 className="font-semibold text-xs text-foreground">Live Voice Conversations</h4>
              <p className="text-[11px] text-muted-foreground leading-relaxed">
                Speak directly to the AI in real time using the gemini-3.8-live model with spoken responses.
              </p>
            </div>

            <div
              onClick={() => setIsBookmarksOpen(true)}
              className="p-4 rounded-xl border border-border bg-card/50 hover:bg-card hover:border-foreground/20 cursor-pointer transition-all space-y-1.5"
            >
              <div className="size-8 rounded-lg bg-amber-500/10 text-amber-500 flex items-center justify-center">
                <BookMarked className="size-4" />
              </div>
              <h4 className="font-semibold text-xs text-foreground">Firebase Cloud Persistence</h4>
              <p className="text-[11px] text-muted-foreground leading-relaxed">
                Sign in with Google to save repository bookmarks securely to Firebase Cloud Firestore.
              </p>
            </div>
          </div>
        )}

        {/* Results Section */}
        <div className="max-w-4xl mx-auto">
          {results ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Button
                  variant="ghost"
                  size="xs"
                  onClick={() => setResults(null)}
                  className="text-xs text-muted-foreground hover:text-foreground"
                >
                  &larr; Back to Trending Repositories
                </Button>
              </div>
              <GitHubResults
                isLoading={isLoading}
                error={error}
                rateLimitReset={rateLimitReset}
                results={results}
                onSearchPreset={handleSearchPreset}
                onBookmarkToggle={handleBookmarkToggle}
                bookmarkedIds={bookmarkedIds}
                onAskAI={handleAskAI}
              />
            </div>
          ) : (
            <TrendingRepositories
              onBookmarkToggle={handleBookmarkToggle}
              bookmarkedIds={bookmarkedIds}
              onAskAI={handleAskAI}
            />
          )}
        </div>
      </main>

      {/* Slide-over Drawers and Modals */}
      <AIAdvisorDrawer
        isOpen={isAIDrawerOpen}
        onClose={() => setIsAIDrawerOpen(false)}
        initialContext={aiContextRepo}
      />

      <LiveVoiceDialog
        isOpen={isLiveVoiceOpen}
        onClose={() => setIsLiveVoiceOpen(false)}
      />

      <BookmarksModal
        isOpen={isBookmarksOpen}
        onClose={() => setIsBookmarksOpen(false)}
        bookmarks={bookmarks}
        userId={currentUser?.uid}
      />

      <ShortcutsDialog
        isOpen={isShortcutsOpen}
        onClose={() => setIsShortcutsOpen(false)}
      />

      <AuthDialog
        isOpen={isAuthDialogOpen}
        onClose={() => setIsAuthDialogOpen(false)}
      />

      {/* Footer */}
      <footer className="border-t border-border/60 py-6 text-center text-xs text-muted-foreground mt-auto">
        <div className="max-w-5xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <p>
            GitFinder LT &mdash; Next.js &bull; Tailwind &bull; shadcn &bull; Firebase &bull; Gemini AI
          </p>
          <div className="flex items-center gap-3 text-[11px]">
            <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
              <ShieldCheck className="size-3" /> Firestore Active
            </span>
            <span>&bull;</span>
            <a
              href="https://github.com/Quantum9710/gitfinder-lt"
              target="_blank"
              rel="noreferrer"
              className="hover:underline flex items-center gap-1"
            >
              <GitBranch className="size-3" /> Quantum9710/gitfinder-lt
            </a>
          </div>
        </div>
      </footer>
    </div>
  )
}
