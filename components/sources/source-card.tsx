"use client"

import { ExternalLink, FileText, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

interface SourceCardProps {
  source: {
    id: string
    name: string
    description: string | null
    category: string | null
    url: string | null
    docsUrl: string | null
    auth: string
    rateLimit: string | null
    formats: string[]
    isFree: boolean
    tags: string[]
    notionUrl: string
  }
  onDelete: (id: string) => void
}

const categoryColors: Record<string, string> = {
  'Government': 'bg-blue-500/20 text-blue-400',
  'Academic': 'bg-purple-500/20 text-purple-400',
  'Finance': 'bg-green-500/20 text-green-400',
  'Health': 'bg-red-500/20 text-red-400',
  'Weather': 'bg-cyan-500/20 text-cyan-400',
  'Geographic': 'bg-orange-500/20 text-orange-400',
  'Social': 'bg-pink-500/20 text-pink-400',
  'Scientific': 'bg-indigo-500/20 text-indigo-400',
}

const authColors: Record<string, string> = {
  'None': 'text-green-400',
  'API Key': 'text-yellow-400',
  'OAuth': 'text-orange-400',
  'Token': 'text-blue-400',
}

export function SourceCard({ source, onDelete }: SourceCardProps) {
  const categoryClass = categoryColors[source.category || ''] || 'bg-zinc-500/20 text-zinc-400'
  const authClass = authColors[source.auth] || 'text-zinc-400'

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-4 hover:border-zinc-700 transition-colors">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2 flex-wrap">
            <h3 className="font-medium text-zinc-100">{source.name}</h3>
            {source.isFree && (
              <Badge className="bg-green-500/20 text-green-400 border-green-500/30 text-xs">
                Free
              </Badge>
            )}
            {source.category && (
              <Badge className={`${categoryClass} border-0 text-xs`}>
                {source.category}
              </Badge>
            )}
          </div>

          {source.description && (
            <p className="text-sm text-zinc-400 mb-3 line-clamp-2">{source.description}</p>
          )}

          <div className="flex items-center gap-4 flex-wrap text-sm mb-3">
            {source.url && (
              <a
                href={source.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-zinc-400 hover:text-zinc-200 transition-colors"
              >
                <ExternalLink className="h-3.5 w-3.5" />
                <span>API</span>
              </a>
            )}
            {source.docsUrl && (
              <a
                href={source.docsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-zinc-400 hover:text-zinc-200 transition-colors"
              >
                <FileText className="h-3.5 w-3.5" />
                <span>Docs</span>
              </a>
            )}
            <span className={`${authClass}`}>
              Auth: {source.auth}
            </span>
            {source.rateLimit && (
              <span className="text-zinc-500">
                {source.rateLimit}
              </span>
            )}
          </div>

          {source.formats.length > 0 && (
            <div className="flex items-center gap-2 flex-wrap">
              {source.formats.map((format) => (
                <span
                  key={format}
                  className="text-xs px-2 py-0.5 bg-zinc-800 text-zinc-400 rounded"
                >
                  {format}
                </span>
              ))}
            </div>
          )}

          {source.tags.length > 0 && (
            <div className="flex items-center gap-2 flex-wrap mt-2">
              {source.tags.map((tag) => (
                <span
                  key={tag}
                  className="text-xs text-zinc-500"
                >
                  #{tag}
                </span>
              ))}
            </div>
          )}
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          <a
            href={source.notionUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-zinc-500 hover:text-zinc-300 transition-colors"
          >
            <ExternalLink className="h-4 w-4" />
          </a>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onDelete(source.id)}
            className="text-zinc-500 hover:text-red-400"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}
