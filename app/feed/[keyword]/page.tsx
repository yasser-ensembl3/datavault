"use client"

import { useEffect, useState, useCallback } from "react"
import { useParams } from "next/navigation"
import { Loader2, Inbox, RefreshCw, ExternalLink, FileText } from "lucide-react"
import { Button } from "@/components/ui/button"

interface Paper {
  id: string
  title: string
  description: string
  authors: string
  pdfLink: string
  subject: string
  notionUrl: string
  createdAt: string
}

function PaperCard({ paper }: { paper: Paper }) {
  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-3 hover:border-zinc-700 transition-colors">
      <h3 className="text-sm font-medium text-zinc-100 mb-1.5 leading-snug">
        {paper.title}
      </h3>

      {paper.authors && (
        <p className="text-xs text-zinc-500 mb-1.5 truncate">{paper.authors}</p>
      )}

      {paper.description && (
        <p className="text-xs text-zinc-400 mb-2 line-clamp-2">
          {paper.description}
        </p>
      )}

      <div className="flex items-center gap-3 flex-wrap text-xs">
        {paper.subject && (
          <span className="px-1.5 py-0.5 bg-zinc-800 text-zinc-400 rounded text-[10px]">
            {paper.subject}
          </span>
        )}

        <a
          href={paper.notionUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1 text-zinc-500 hover:text-zinc-300 transition-colors"
        >
          <ExternalLink className="h-3 w-3" />
          <span>Notion</span>
        </a>

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
  )
}

export default function TopicFeedPage() {
  const params = useParams()
  const topic = decodeURIComponent(params.keyword as string)

  const [papers, setPapers] = useState<Paper[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchPapers = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch(`/api/feed/papers?topic=${encodeURIComponent(topic)}`)
      if (!response.ok) throw new Error("Failed to fetch papers")

      const data = await response.json()
      setPapers(data.papers)
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred")
    } finally {
      setLoading(false)
    }
  }, [topic])

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
          <div>
            <h1 className="text-lg font-semibold text-zinc-100">{topic}</h1>
            <p className="text-xs text-zinc-500">Research papers</p>
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
          <p className="text-zinc-500 text-xs">Add papers to your Notion database</p>
        </div>
      ) : (
        <>
          <div className="text-xs text-zinc-500 mb-3">
            {papers.length} paper{papers.length !== 1 ? "s" : ""}
          </div>
          <div className="space-y-2">
            {papers.map((paper) => (
              <PaperCard key={paper.id} paper={paper} />
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
