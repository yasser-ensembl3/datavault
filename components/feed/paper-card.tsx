"use client"

import { ExternalLink, FileText, Save } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useState } from "react"

interface PaperCardProps {
  paper: {
    id: string
    title: string
    summary: string
    authors: string[]
    published: string
    link: string
    pdfLink: string
    categories: string[]
  }
  onSaveToVault?: (paper: PaperCardProps["paper"]) => void
}

export function PaperCard({ paper, onSaveToVault }: PaperCardProps) {
  const [expanded, setExpanded] = useState(false)
  const [saving, setSaving] = useState(false)

  const handleSave = async () => {
    if (!onSaveToVault) return
    setSaving(true)
    try {
      await onSaveToVault(paper)
    } finally {
      setSaving(false)
    }
  }

  const formattedDate = new Date(paper.published).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  })

  const truncatedSummary = paper.summary.length > 300
    ? paper.summary.slice(0, 300) + "..."
    : paper.summary

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-4 hover:border-zinc-700 transition-colors">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <h3 className="font-medium text-zinc-100 mb-2 leading-tight">
            {paper.title}
          </h3>

          <div className="text-sm text-zinc-500 mb-2">
            {paper.authors.slice(0, 3).join(", ")}
            {paper.authors.length > 3 && ` +${paper.authors.length - 3} more`}
          </div>

          <p className="text-sm text-zinc-400 mb-3">
            {expanded ? paper.summary : truncatedSummary}
            {paper.summary.length > 300 && (
              <button
                onClick={() => setExpanded(!expanded)}
                className="text-zinc-500 hover:text-zinc-300 ml-1"
              >
                {expanded ? "Show less" : "Show more"}
              </button>
            )}
          </p>

          <div className="flex items-center gap-4 flex-wrap text-sm">
            <span className="text-zinc-500">{formattedDate}</span>

            <a
              href={paper.link}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 text-zinc-400 hover:text-zinc-200 transition-colors"
            >
              <ExternalLink className="h-3.5 w-3.5" />
              <span>arXiv</span>
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

            {paper.categories.length > 0 && (
              <div className="flex gap-1 flex-wrap">
                {paper.categories.slice(0, 3).map((cat) => (
                  <span
                    key={cat}
                    className="text-xs px-1.5 py-0.5 bg-zinc-800 text-zinc-500 rounded"
                  >
                    {cat}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>

        {onSaveToVault && (
          <Button
            variant="ghost"
            size="icon"
            onClick={handleSave}
            disabled={saving}
            className="text-zinc-500 hover:text-green-400 flex-shrink-0"
            title="Save to Vault"
          >
            <Save className={`h-4 w-4 ${saving ? "animate-pulse" : ""}`} />
          </Button>
        )}
      </div>
    </div>
  )
}
