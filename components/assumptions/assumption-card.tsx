"use client"

import { ExternalLink, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"

interface AssumptionCardProps {
  assumption: {
    id: string
    title: string
    description: string | null
    status: string
    confidence: string
    evidence: string | null
    createdAt: string
    notionUrl: string
  }
  onStatusChange: (id: string, status: string) => void
  onDelete: (id: string) => void
}

const statusColors: Record<string, string> = {
  'Pending': 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  'Testing': 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  'Validated': 'bg-green-500/20 text-green-400 border-green-500/30',
  'Invalidated': 'bg-red-500/20 text-red-400 border-red-500/30',
}

const confidenceColors: Record<string, string> = {
  'Low': 'text-zinc-500',
  'Medium': 'text-zinc-400',
  'High': 'text-zinc-300',
}

export function AssumptionCard({ assumption, onStatusChange, onDelete }: AssumptionCardProps) {
  const statusClass = statusColors[assumption.status] || statusColors['Pending']
  const confidenceClass = confidenceColors[assumption.confidence] || confidenceColors['Medium']

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-4 hover:border-zinc-700 transition-colors">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2">
            <h3 className="font-medium text-zinc-100 truncate">{assumption.title}</h3>
            <a
              href={assumption.notionUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-zinc-500 hover:text-zinc-300 transition-colors flex-shrink-0"
            >
              <ExternalLink className="h-4 w-4" />
            </a>
          </div>

          {assumption.description && (
            <p className="text-sm text-zinc-400 mb-3 line-clamp-2">{assumption.description}</p>
          )}

          <div className="flex items-center gap-3 flex-wrap">
            <select
              value={assumption.status}
              onChange={(e) => onStatusChange(assumption.id, e.target.value)}
              className={`text-xs px-2 py-1 rounded border ${statusClass} bg-transparent cursor-pointer focus:outline-none focus:ring-1 focus:ring-zinc-600`}
            >
              <option value="Pending" className="bg-zinc-900">Pending</option>
              <option value="Testing" className="bg-zinc-900">Testing</option>
              <option value="Validated" className="bg-zinc-900">Validated</option>
              <option value="Invalidated" className="bg-zinc-900">Invalidated</option>
            </select>

            <span className={`text-xs ${confidenceClass}`}>
              {assumption.confidence} confidence
            </span>

            <span className="text-xs text-zinc-600">
              {new Date(assumption.createdAt).toLocaleDateString()}
            </span>
          </div>

          {assumption.evidence && (
            <div className="mt-3 pt-3 border-t border-zinc-800">
              <p className="text-xs text-zinc-500">
                <span className="text-zinc-400">Evidence:</span> {assumption.evidence}
              </p>
            </div>
          )}
        </div>

        <Button
          variant="ghost"
          size="icon"
          onClick={() => onDelete(assumption.id)}
          className="text-zinc-500 hover:text-red-400 flex-shrink-0"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}
