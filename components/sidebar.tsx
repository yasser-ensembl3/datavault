"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useEffect, useState } from "react"
import { Database, Rss, Lightbulb, Server, BookOpen, ChevronDown, Plus } from "lucide-react"

interface Keyword {
  id: string
  name: string
  active: boolean
}

const navItems = [
  { href: "/assumptions", label: "Assumptions", icon: Lightbulb },
  { href: "/sources", label: "Sources", icon: Server },
  { href: "/docs", label: "Docs", icon: BookOpen },
]

export function Sidebar() {
  const pathname = usePathname()
  const [keywords, setKeywords] = useState<Keyword[]>([])
  const [feedExpanded, setFeedExpanded] = useState(true)
  const [newKeyword, setNewKeyword] = useState("")
  const [adding, setAdding] = useState(false)

  useEffect(() => {
    fetch("/api/feed/keywords")
      .then(res => res.ok ? res.json() : { keywords: [] })
      .then(data => setKeywords(data.keywords || []))
      .catch(() => setKeywords([]))
  }, [])

  const handleAddKeyword = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newKeyword.trim()) return

    setAdding(true)
    try {
      const res = await fetch("/api/feed/keywords", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newKeyword.trim() }),
      })
      if (res.ok) {
        const updated = await fetch("/api/feed/keywords").then(r => r.json())
        setKeywords(updated.keywords || [])
        setNewKeyword("")
      }
    } finally {
      setAdding(false)
    }
  }

  const isFeedActive = pathname.startsWith("/feed")

  return (
    <aside className="fixed left-0 top-0 h-screen w-48 bg-zinc-900 border-r border-zinc-800 flex flex-col hidden md:flex">
      {/* Logo */}
      <div className="p-4 border-b border-zinc-800">
        <div className="flex items-center gap-2">
          <Database className="h-4 w-4 text-blue-400" />
          <span className="font-semibold text-sm text-zinc-100">Research Vault</span>
        </div>
      </div>

      {/* Nav Items */}
      <nav className="flex-1 p-2 space-y-0.5 overflow-y-auto">
        {/* Feed Section with Keywords */}
        <div>
          <button
            onClick={() => setFeedExpanded(!feedExpanded)}
            className={`w-full flex items-center justify-between px-2 py-1.5 rounded text-xs transition-colors ${
              isFeedActive
                ? "bg-zinc-800 text-zinc-100"
                : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50"
            }`}
          >
            <div className="flex items-center gap-2">
              <Rss className="h-3.5 w-3.5" />
              Feed
            </div>
            <ChevronDown className={`h-3 w-3 transition-transform ${feedExpanded ? "" : "-rotate-90"}`} />
          </button>

          {feedExpanded && (
            <div className="mt-0.5 ml-2 border-l border-zinc-700">
              {keywords.filter(k => k.active).map((keyword) => (
                <Link
                  key={keyword.id}
                  href={`/feed/${encodeURIComponent(keyword.name)}`}
                  className={`block pl-3 py-1 text-xs transition-colors ${
                    pathname === `/feed/${encodeURIComponent(keyword.name)}`
                      ? "text-zinc-100 bg-zinc-800/50"
                      : "text-zinc-500 hover:text-zinc-300"
                  }`}
                >
                  {keyword.name}
                </Link>
              ))}

              {/* Add keyword form */}
              <form onSubmit={handleAddKeyword} className="flex items-center gap-1 pl-3 py-1">
                <input
                  type="text"
                  value={newKeyword}
                  onChange={(e) => setNewKeyword(e.target.value)}
                  placeholder="Add topic..."
                  className="flex-1 px-1.5 py-0.5 bg-transparent border-b border-zinc-700 text-xs text-zinc-300 placeholder:text-zinc-600 focus:outline-none focus:border-zinc-500"
                />
                <button
                  type="submit"
                  disabled={!newKeyword.trim() || adding}
                  className="p-0.5 text-zinc-500 hover:text-zinc-300 disabled:opacity-50"
                >
                  <Plus className="h-3 w-3" />
                </button>
              </form>
            </div>
          )}
        </div>

        {/* Other Nav Items */}
        {navItems.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + "/")
          const Icon = item.icon

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-2 px-2 py-1.5 rounded text-xs transition-colors ${
                isActive
                  ? "bg-zinc-800 text-zinc-100"
                  : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50"
              }`}
            >
              <Icon className="h-3.5 w-3.5" />
              {item.label}
            </Link>
          )
        })}
      </nav>

      {/* Footer */}
      <div className="p-3 border-t border-zinc-800">
        <p className="text-[10px] text-zinc-600">Press R to refresh</p>
      </div>
    </aside>
  )
}
