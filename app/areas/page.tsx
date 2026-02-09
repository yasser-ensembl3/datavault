"use client"

import { useEffect, useState, useCallback } from "react"
import { Globe, Loader2, Inbox, Search, Plus, X, ExternalLink, Calendar, Download, Bookmark, BookMarked } from "lucide-react"
import { Button } from "@/components/ui/button"
import { AreaBadge } from "@/components/areas/area-badge"

interface Area {
  id: string
  name: string
  active: boolean
}

interface Paper {
  id: string
  title: string
  description: string
  authors: string
  pdfLink: string
  date: string
}

interface CacheEntry {
  papers: Paper[]
  timestamp: number
}

const CACHE_KEY = "areas-papers-cache"
const CACHE_TTL = 24 * 60 * 60 * 1000 // 24 hours

function getCacheKey(tag: string, from: string, to: string) {
  return `${tag}|${from}|${to}`
}

function getCache(): Record<string, CacheEntry> {
  try {
    const raw = localStorage.getItem(CACHE_KEY)
    if (!raw) return {}
    return JSON.parse(raw)
  } catch {
    return {}
  }
}

function setCache(key: string, papers: Paper[]) {
  try {
    const cache = getCache()
    cache[key] = { papers, timestamp: Date.now() }
    localStorage.setItem(CACHE_KEY, JSON.stringify(cache))
  } catch {
    // localStorage full or unavailable
  }
}

function getCached(key: string): Paper[] | null {
  const cache = getCache()
  const entry = cache[key]
  if (!entry) return null
  if (Date.now() - entry.timestamp > CACHE_TTL) {
    // Expired — clean up
    delete cache[key]
    try { localStorage.setItem(CACHE_KEY, JSON.stringify(cache)) } catch {}
    return null
  }
  return entry.papers
}

export default function AreasPage() {
  const [areas, setAreas] = useState<Area[]>([])
  const [selectedArea, setSelectedArea] = useState<Area | null>(null)
  const [papers, setPapers] = useState<Paper[]>([])
  const [loadingAreas, setLoadingAreas] = useState(true)
  const [loadingPapers, setLoadingPapers] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [hasSearched, setHasSearched] = useState(false)
  const [fromCache, setFromCache] = useState(false)
  const [selectedPaper, setSelectedPaper] = useState<Paper | null>(null)
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set())
  const [newAreaName, setNewAreaName] = useState("")
  const [adding, setAdding] = useState(false)

  // Date range — default: last 2 weeks
  const today = new Date().toISOString().split("T")[0]
  const twoWeeksAgo = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString().split("T")[0]
  const [dateFrom, setDateFrom] = useState(twoWeeksAgo)
  const [dateTo, setDateTo] = useState(today)

  const fetchAreas = useCallback(async () => {
    setLoadingAreas(true)
    try {
      const res = await fetch("/api/areas")
      if (!res.ok) throw new Error("Failed to fetch areas")
      const data = await res.json()
      setAreas(data.areas || [])
    } catch {
      setAreas([])
    } finally {
      setLoadingAreas(false)
    }
  }, [])

  const fetchPapers = useCallback(async (areaName: string, forceRefresh = false) => {
    const cacheKey = getCacheKey(areaName, dateFrom, dateTo)

    // Check cache first (unless forcing refresh)
    if (!forceRefresh) {
      const cached = getCached(cacheKey)
      if (cached) {
        setPapers(cached)
        setHasSearched(true)
        setFromCache(true)
        setError(null)
        return
      }
    }

    setLoadingPapers(true)
    setError(null)
    setHasSearched(true)
    setFromCache(false)
    try {
      const params = new URLSearchParams({ tag: areaName })
      if (dateFrom) params.set("from", dateFrom)
      if (dateTo) params.set("to", dateTo)
      const res = await fetch(`/api/areas/papers?${params.toString()}`)
      if (!res.ok) throw new Error("Failed to fetch papers")
      const data = await res.json()
      const results = data.papers || []
      setPapers(results)
      // Save to cache
      setCache(cacheKey, results)
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred")
      setPapers([])
    } finally {
      setLoadingPapers(false)
    }
  }, [dateFrom, dateTo])

  useEffect(() => {
    fetchAreas()
  }, [fetchAreas])

  // Load saved paper IDs from server on mount
  useEffect(() => {
    fetch("/api/saved")
      .then(res => res.ok ? res.json() : { papers: [] })
      .then(data => setSavedIds(new Set((data.papers || []).map((p: Paper) => p.title))))
      .catch(() => {})
  }, [])

  const toggleSave = async (paper: Paper) => {
    const isSaved = savedIds.has(paper.title)

    if (isSaved) {
      setSavedIds(prev => { const next = new Set(prev); next.delete(paper.title); return next })
      await fetch(`/api/saved?title=${encodeURIComponent(paper.title)}`, { method: "DELETE" })
    } else {
      setSavedIds(prev => new Set(prev).add(paper.title))
      await fetch("/api/saved", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(paper),
      })
    }
  }

  const handleSelectArea = (area: Area) => {
    if (selectedArea?.id === area.id) {
      setSelectedArea(null)
      setPapers([])
      setHasSearched(false)
      setFromCache(false)
    } else {
      setSelectedArea(area)
      setFromCache(false)

      // Auto-load from cache if available
      const cacheKey = getCacheKey(area.name, dateFrom, dateTo)
      const cached = getCached(cacheKey)
      if (cached) {
        setPapers(cached)
        setHasSearched(true)
        setFromCache(true)
        setError(null)
      } else {
        setPapers([])
        setHasSearched(false)
      }
    }
  }

  const handleSearch = () => {
    if (selectedArea) {
      fetchPapers(selectedArea.name, true) // force refresh
    }
  }

  const handleAddArea = async (e: React.FormEvent) => {
    e.preventDefault()
    const name = newAreaName.trim()
    if (!name) return

    setAdding(true)
    try {
      const id = name.toLowerCase().replace(/\s+/g, "-")
      setAreas(prev => [...prev, { id, name, active: true }])
      setNewAreaName("")
    } finally {
      setAdding(false)
    }
  }

  const handleDeleteArea = (areaId: string) => {
    setAreas(prev => prev.filter(a => a.id !== areaId))
    if (selectedArea?.id === areaId) {
      setSelectedArea(null)
      setPapers([])
      setHasSearched(false)
      setFromCache(false)
    }
  }

  return (
    <div className="p-4 md:p-6">
      <header className="mb-6">
        <h1 className="text-lg font-semibold text-zinc-100">Areas</h1>
        <p className="text-xs text-zinc-500">Select an area, pick a date range, then search</p>
      </header>

      {/* Add Area — always visible */}
      <form onSubmit={handleAddArea} className="mb-5 flex items-center gap-2">
        <Plus className="h-4 w-4 text-zinc-500 flex-shrink-0" />
        <input
          type="text"
          value={newAreaName}
          onChange={(e) => setNewAreaName(e.target.value)}
          placeholder="Add new area (e.g. Robotics, Genetics...)"
          className="flex-1 px-3 py-1.5 bg-zinc-800 border border-zinc-700 rounded text-xs text-zinc-200 placeholder:text-zinc-500 focus:outline-none focus:border-zinc-500"
        />
        <Button type="submit" size="sm" disabled={!newAreaName.trim() || adding} className="text-xs h-7 px-3">
          Add
        </Button>
      </form>

      {/* Area Tags */}
      {loadingAreas ? (
        <div className="flex items-center justify-center py-6">
          <Loader2 className="h-4 w-4 animate-spin text-zinc-500" />
        </div>
      ) : areas.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <Globe className="h-8 w-8 text-zinc-600 mb-3" />
          <p className="text-zinc-400 text-sm mb-1">No areas yet</p>
          <p className="text-zinc-500 text-xs">Add a research area above to get started</p>
        </div>
      ) : (
        <div className="flex flex-wrap gap-2 mb-6">
          {areas.filter(a => a.active).map((area) => (
            <div key={area.id} className="relative group">
              <AreaBadge
                name={area.name}
                isActive={selectedArea?.id === area.id}
                onClick={() => handleSelectArea(area)}
              />
              <button
                onClick={(e) => { e.stopPropagation(); handleDeleteArea(area.id) }}
                className="absolute -top-1.5 -right-1.5 h-4 w-4 bg-zinc-700 rounded-full items-center justify-center text-zinc-400 hover:text-red-400 hover:bg-zinc-600 hidden group-hover:flex transition-all"
              >
                <X className="h-2.5 w-2.5" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Date Range + Search */}
      {selectedArea && (
        <div className="bg-zinc-800/50 border border-zinc-700/50 rounded-lg p-4 mb-6">
          <div className="flex items-center gap-2 mb-3">
            <Calendar className="h-3.5 w-3.5 text-zinc-400" />
            <span className="text-xs font-medium text-zinc-300">
              Searching: <span className="text-zinc-100">{selectedArea.name}</span>
            </span>
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex items-center gap-1.5">
              <label className="text-xs text-zinc-500">From</label>
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="px-2 py-1.5 bg-zinc-900 border border-zinc-700 rounded text-xs text-zinc-200 focus:outline-none focus:border-zinc-500 [color-scheme:dark]"
              />
            </div>
            <div className="flex items-center gap-1.5">
              <label className="text-xs text-zinc-500">To</label>
              <input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className="px-2 py-1.5 bg-zinc-900 border border-zinc-700 rounded text-xs text-zinc-200 focus:outline-none focus:border-zinc-500 [color-scheme:dark]"
              />
            </div>
            <Button
              onClick={handleSearch}
              disabled={loadingPapers}
              size="sm"
              className="text-xs h-8 px-4 gap-1.5 bg-zinc-100 hover:bg-white text-zinc-900"
            >
              <Search className={`h-3.5 w-3.5 ${loadingPapers ? "animate-spin" : ""}`} />
              {loadingPapers ? "Searching..." : "Search"}
            </Button>
          </div>
        </div>
      )}

      {/* Papers Section */}
      {selectedArea && hasSearched && (
        <div>
          {loadingPapers ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-5 w-5 animate-spin text-zinc-500" />
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <p className="text-red-400 text-sm mb-3">{error}</p>
              <Button onClick={handleSearch} variant="outline" size="sm" className="gap-1.5 text-xs">
                Retry
              </Button>
            </div>
          ) : papers.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <Inbox className="h-6 w-6 text-zinc-600 mb-2" />
              <p className="text-zinc-400 text-sm mb-1">No papers found</p>
              <p className="text-zinc-500 text-xs">Try a different date range</p>
            </div>
          ) : (
            <>
              <div className="flex items-center gap-2 text-xs text-zinc-500 mb-3">
                <span>{papers.length} paper{papers.length !== 1 ? "s" : ""}</span>
                {fromCache && (
                  <span className="px-1.5 py-0.5 bg-zinc-800 border border-zinc-700 rounded text-[10px] text-zinc-500">
                    cached
                  </span>
                )}
              </div>
              <div className="space-y-2">
                {papers.map((paper) => (
                  <button
                    key={paper.id}
                    onClick={() => setSelectedPaper(paper)}
                    className="w-full text-left bg-zinc-900 border border-zinc-800 rounded-lg p-4 hover:border-zinc-600 transition-colors cursor-pointer"
                  >
                    <h3 className="text-sm font-medium text-zinc-100 mb-1.5 leading-snug">
                      {paper.title}
                    </h3>
                    {paper.authors && (
                      <p className="text-xs text-zinc-500 mb-1.5 truncate">{paper.authors}</p>
                    )}
                    {paper.date && (
                      <span className="flex items-center gap-1 text-[11px] text-zinc-600">
                        <Calendar className="h-3 w-3" />
                        {paper.date}
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      )}

      {/* Prompt when area selected but not searched yet */}
      {selectedArea && !hasSearched && (
        <div className="flex flex-col items-center justify-center py-8 text-center">
          <Search className="h-6 w-6 text-zinc-600 mb-2" />
          <p className="text-zinc-400 text-sm">Pick your date range and hit Search</p>
        </div>
      )}

      {/* Empty state when no area selected */}
      {!selectedArea && areas.length > 0 && (
        <div className="flex flex-col items-center justify-center py-8 text-center">
          <p className="text-zinc-400 text-sm mb-1">Select an area to get started</p>
          <p className="text-zinc-500 text-xs">Click on a tag above, then choose dates</p>
        </div>
      )}

      {/* Paper Modal */}
      {selectedPaper && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm"
          onClick={() => setSelectedPaper(null)}
        >
          <div
            className="bg-zinc-900 border border-zinc-700 rounded-xl w-full max-w-lg mx-4 max-h-[80vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-start justify-between p-5 border-b border-zinc-800">
              <h2 className="text-base font-semibold text-zinc-100 leading-snug pr-4">
                {selectedPaper.title}
              </h2>
              <button
                onClick={() => setSelectedPaper(null)}
                className="text-zinc-500 hover:text-zinc-300 flex-shrink-0 mt-0.5"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 space-y-4">
              {selectedPaper.authors && (
                <div>
                  <p className="text-xs text-zinc-500 mb-1">Authors</p>
                  <p className="text-sm text-zinc-300">{selectedPaper.authors}</p>
                </div>
              )}

              {selectedPaper.date && (
                <div>
                  <p className="text-xs text-zinc-500 mb-1">Published</p>
                  <p className="text-sm text-zinc-300">{selectedPaper.date}</p>
                </div>
              )}

              {selectedPaper.description && (
                <div>
                  <p className="text-xs text-zinc-500 mb-1">Abstract</p>
                  <p className="text-sm text-zinc-400 leading-relaxed">{selectedPaper.description}</p>
                </div>
              )}
            </div>

            {/* Modal Actions */}
            <div className="p-5 border-t border-zinc-800 flex gap-3">
              <button
                onClick={() => toggleSave(selectedPaper)}
                className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 border rounded-lg text-sm transition-colors ${
                  savedIds.has(selectedPaper.title)
                    ? "bg-zinc-100 text-zinc-900 border-zinc-100 font-medium"
                    : "bg-zinc-800 hover:bg-zinc-700 border-zinc-700 text-zinc-200"
                }`}
              >
                {savedIds.has(selectedPaper.title) ? (
                  <><BookMarked className="h-4 w-4" /> Saved</>
                ) : (
                  <><Bookmark className="h-4 w-4" /> Save</>
                )}
              </button>
              {selectedPaper.pdfLink && (
                <>
                  <a
                    href={selectedPaper.pdfLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 rounded-lg text-sm text-zinc-200 transition-colors"
                  >
                    <ExternalLink className="h-4 w-4" />
                    See PDF
                  </a>
                  <a
                    href={`/api/areas/download?url=${encodeURIComponent(selectedPaper.pdfLink)}&title=${encodeURIComponent(selectedPaper.title)}`}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 rounded-lg text-sm text-zinc-200 transition-colors"
                  >
                    <Download className="h-4 w-4" />
                    Download
                  </a>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      <footer className="mt-8 pt-4 border-t border-zinc-800 text-xs text-zinc-600">
        Press <kbd className="px-1 py-0.5 bg-zinc-800 rounded text-zinc-400 text-[10px]">R</kbd> to refresh
      </footer>
    </div>
  )
}
