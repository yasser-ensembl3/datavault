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
    <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-4 hover:border-zinc-700 transition-colors">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <h3 className="font-medium text-zinc-100 mb-2 leading-tight">
            {paper.title}
          </h3>

          {paper.authors && (
            <p className="text-sm text-zinc-500 mb-2">{paper.authors}</p>
          )}

          {paper.description && (
            <p className="text-sm text-zinc-400 mb-3 line-clamp-3">
              {paper.description}
            </p>
          )}

          <div className="flex items-center gap-4 flex-wrap text-sm">
            {paper.subject && (
              <span className="text-xs px-2 py-0.5 bg-zinc-800 text-zinc-400 rounded">
                {paper.subject}
              </span>
            )}

            <a
              href={paper.notionUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 text-zinc-400 hover:text-zinc-200 transition-colors"
            >
              <ExternalLink className="h-3.5 w-3.5" />
              <span>Notion</span>
            </a>

            {paper.pdfLink && (
              <a
                href={paper.pdfLink}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-zinc-400 hover:text-zinc-200 transition-colors"
              >
                <FileText className="h-3.5 w-3.5" />
                <span>PDF</span>
              </a>
            )}
          </div>
        </div>
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
    <div className="p-8">
      <header className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-zinc-100 mb-1">{topic}</h1>
            <p className="text-zinc-500">Research papers from Notion</p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={fetchPapers}
            disabled={loading}
            className="text-zinc-500 hover:text-zinc-300"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          </Button>
        </div>
      </header>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-zinc-500" />
        </div>
      ) : error ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <p className="text-red-400 mb-4">{error}</p>
          <Button onClick={fetchPapers} variant="outline" className="gap-2">
            <RefreshCw className="h-4 w-4" />
            Retry
          </Button>
        </div>
      ) : papers.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <Inbox className="h-12 w-12 text-zinc-600 mb-4" />
          <p className="text-zinc-400 mb-2">No papers found</p>
          <p className="text-zinc-500 text-sm">Add papers to your Notion database</p>
        </div>
      ) : (
        <>
          <div className="text-sm text-zinc-500 mb-4">
            {papers.length} paper{papers.length !== 1 ? "s" : ""}
          </div>
          <div className="space-y-3">
            {papers.map((paper) => (
              <PaperCard key={paper.id} paper={paper} />
            ))}
          </div>
        </>
      )}

      <footer className="mt-12 pt-6 border-t border-zinc-800 text-sm text-zinc-600">
        Press <kbd className="px-1.5 py-0.5 bg-zinc-800 rounded text-zinc-400">R</kbd> to refresh
      </footer>
    </div>
  )
}
