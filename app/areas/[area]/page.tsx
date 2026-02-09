"use client"

import { useEffect, useState, useCallback } from "react"
import { useParams } from "next/navigation"
import { Loader2, Inbox, RefreshCw, FileText, Calendar } from "lucide-react"
import { Button } from "@/components/ui/button"
import { AreaBadge } from "@/components/areas/area-badge"

interface Paper {
  id: string
  title: string
  description: string
  authors: string
  pdfLink: string
  date: string
}

export default function AreaDetailPage() {
  const params = useParams()
  const area = decodeURIComponent(params.area as string)

  const [papers, setPapers] = useState<Paper[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Date range — default: last 30 days
  const today = new Date().toISOString().split("T")[0]
  const twoWeeksAgo = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString().split("T")[0]
  const [dateFrom, setDateFrom] = useState(twoWeeksAgo)
  const [dateTo, setDateTo] = useState(today)

  const fetchPapers = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      const params = new URLSearchParams({ tag: area })
      if (dateFrom) params.set("from", dateFrom)
      if (dateTo) params.set("to", dateTo)
      const response = await fetch(`/api/areas/papers?${params.toString()}`)
      if (!response.ok) throw new Error("Failed to fetch papers")

      const data = await response.json()
      setPapers(data.papers)
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred")
    } finally {
      setLoading(false)
    }
  }, [area, dateFrom, dateTo])

  useEffect(() => {
    fetchPapers()
  }, [fetchPapers])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return

      if (e.key === "r" && !e.metaKey && !e.ctrlKey) {
        e.preventDefault()
        fetchPapers()
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [fetchPapers])

  return (
    <div className="p-4 md:p-6">
      <header className="mb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div>
              <h1 className="text-lg font-semibold text-zinc-100">{area}</h1>
              <p className="text-xs text-zinc-500">Research papers</p>
            </div>
            <AreaBadge name={area} isActive />
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={fetchPapers}
            disabled={loading}
            className="text-zinc-500 hover:text-zinc-300 h-8 w-8"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
          </Button>
        </div>
      </header>

      {/* Date Range Filter */}
      <div className="flex items-center gap-3 mb-4 flex-wrap">
        <div className="flex items-center gap-1.5">
          <label className="text-xs text-zinc-500">From</label>
          <input
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            className="px-2 py-1 bg-zinc-800 border border-zinc-700 rounded text-xs text-zinc-200 focus:outline-none focus:border-zinc-500 [color-scheme:dark]"
          />
        </div>
        <div className="flex items-center gap-1.5">
          <label className="text-xs text-zinc-500">To</label>
          <input
            type="date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            className="px-2 py-1 bg-zinc-800 border border-zinc-700 rounded text-xs text-zinc-200 focus:outline-none focus:border-zinc-500 [color-scheme:dark]"
          />
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={fetchPapers}
          disabled={loading}
          className="text-xs h-7 text-zinc-400 hover:text-zinc-200 gap-1"
        >
          <RefreshCw className={`h-3 w-3 ${loading ? "animate-spin" : ""}`} />
          Search
        </Button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-5 w-5 animate-spin text-zinc-500" />
        </div>
      ) : error ? (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <p className="text-red-400 text-sm mb-3">{error}</p>
          <Button onClick={fetchPapers} variant="outline" size="sm" className="gap-1.5 text-xs">
            <RefreshCw className="h-3 w-3" />
            Retry
          </Button>
        </div>
      ) : papers.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <Inbox className="h-8 w-8 text-zinc-600 mb-3" />
          <p className="text-zinc-400 text-sm mb-1">No papers found</p>
          <p className="text-zinc-500 text-xs">No results from n8n for this area</p>
        </div>
      ) : (
        <>
          <div className="text-xs text-zinc-500 mb-3">
            {papers.length} paper{papers.length !== 1 ? "s" : ""}
          </div>
          <div className="space-y-2">
            {papers.map((paper) => (
              <div key={paper.id} className="bg-zinc-900 border border-zinc-800 rounded-lg p-3 hover:border-zinc-700 transition-colors">
                <h3 className="text-sm font-medium text-zinc-100 mb-1.5 leading-snug">
                  {paper.title}
                </h3>
                {paper.authors && (
                  <p className="text-xs text-zinc-500 mb-1.5 truncate">{paper.authors}</p>
                )}
                {paper.description && (
                  <p className="text-xs text-zinc-400 mb-2 line-clamp-2">{paper.description}</p>
                )}
                <div className="flex items-center gap-3 flex-wrap text-xs">
                  {paper.date && (
                    <span className="flex items-center gap-1 text-zinc-500">
                      <Calendar className="h-3 w-3" />
                      {paper.date}
                    </span>
                  )}
                  {paper.pdfLink && (
                    <a
                      href={paper.pdfLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 text-zinc-500 hover:text-zinc-300 transition-colors"
                    >
                      <FileText className="h-3 w-3" />
                      <span>PDF</span>
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      <footer className="mt-8 pt-4 border-t border-zinc-800 text-xs text-zinc-600">
        Press <kbd className="px-1 py-0.5 bg-zinc-800 rounded text-zinc-400 text-[10px]">R</kbd> to refresh
      </footer>
    </div>
  )
}
