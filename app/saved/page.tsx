"use client"

import { useEffect, useState, useCallback } from "react"
import { Bookmark, Inbox, X, ExternalLink, Download, Calendar, Trash2, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"

interface Paper {
  id: string
  title: string
  description: string
  authors: string
  pdfLink: string
  date: string
}

export default function SavedPage() {
  const [papers, setPapers] = useState<Paper[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedPaper, setSelectedPaper] = useState<Paper | null>(null)

  const fetchSaved = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch("/api/saved")
      if (res.ok) {
        const data = await res.json()
        setPapers(data.papers || [])
      }
    } catch {} finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchSaved()
  }, [fetchSaved])

  const removePaper = async (title: string) => {
    setPapers(prev => prev.filter(p => p.title !== title))
    if (selectedPaper?.title === title) setSelectedPaper(null)
    await fetch(`/api/saved?title=${encodeURIComponent(title)}`, { method: "DELETE" })
  }

  const clearAll = async () => {
    setPapers([])
    setSelectedPaper(null)
    await fetch("/api/saved", { method: "PATCH" })
  }

  return (
    <div className="p-4 md:p-6">
      <header className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-lg font-semibold text-zinc-100">Saved Papers</h1>
            <p className="text-xs text-zinc-500">{papers.length} paper{papers.length !== 1 ? "s" : ""} saved</p>
          </div>
          {papers.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearAll}
              className="text-xs h-7 text-zinc-500 hover:text-red-400 gap-1.5"
            >
              <Trash2 className="h-3.5 w-3.5" />
              Clear all
            </Button>
          )}
        </div>
      </header>

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-5 w-5 animate-spin text-zinc-500" />
        </div>
      ) : papers.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <Bookmark className="h-8 w-8 text-zinc-600 mb-3" />
          <p className="text-zinc-400 text-sm mb-1">No saved papers yet</p>
          <p className="text-zinc-500 text-xs">Save papers from the Areas page to find them here</p>
        </div>
      ) : (
        <div className="space-y-2">
          {papers.map((paper) => (
            <div
              key={paper.title}
              className="flex items-start gap-3 bg-zinc-900 border border-zinc-800 rounded-lg p-4 hover:border-zinc-600 transition-colors"
            >
              <button
                onClick={() => setSelectedPaper(paper)}
                className="flex-1 text-left cursor-pointer"
              >
                <h3 className="text-sm font-medium text-zinc-100 mb-1.5 leading-snug">
                  {paper.title}
                </h3>
                {paper.authors && (
                  <p className="text-xs text-zinc-500 mb-1 truncate">{paper.authors}</p>
                )}
                {paper.date && (
                  <span className="flex items-center gap-1 text-[11px] text-zinc-600">
                    <Calendar className="h-3 w-3" />
                    {paper.date}
                  </span>
                )}
              </button>
              <button
                onClick={() => removePaper(paper.title)}
                className="text-zinc-600 hover:text-red-400 transition-colors flex-shrink-0 mt-1"
                title="Remove"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          ))}
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

            <div className="p-5 border-t border-zinc-800 flex gap-3">
              <button
                onClick={() => removePaper(selectedPaper.title)}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 rounded-lg text-sm text-red-400 transition-colors"
              >
                <Trash2 className="h-4 w-4" />
                Remove
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
    </div>
  )
}
