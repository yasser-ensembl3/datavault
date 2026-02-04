"use client"

import { useState } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  ExternalLink,
  FileText,
  Search,
  Database,
  BarChart3,
  FileJson,
  Globe,
  BookOpen,
  Lightbulb,
  File,
  X,
  FileSpreadsheet,
  ChevronDown,
  ChevronUp
} from "lucide-react"
import { getColorFromString } from "@/lib/utils"

interface ContentItemProps {
  item: {
    id: string
    title: string
    url: string | null
    type: string | null
    source: string | null
    status: string
    dateAdded: string
    description?: string | null
    tags?: string[]
    notionUrl: string
  }
}

// Research-focused type icons
const typeIcons: Record<string, React.ReactNode> = {
  "Web Search": <Search className="h-4 w-4" />,
  "API Data": <FileJson className="h-4 w-4" />,
  "Dataset": <Database className="h-4 w-4" />,
  "Analysis": <BarChart3 className="h-4 w-4" />,
  "Article": <FileText className="h-4 w-4" />,
  "Paper": <BookOpen className="h-4 w-4" />,
  "Website": <Globe className="h-4 w-4" />,
  "Insight": <Lightbulb className="h-4 w-4" />,
  "Other": <File className="h-4 w-4" />,
}

// Research-focused type colors
const typeColors: Record<string, string> = {
  "Web Search": "bg-blue-500/20 text-blue-400 border-blue-500/30",
  "API Data": "bg-purple-500/20 text-purple-400 border-purple-500/30",
  "Dataset": "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
  "Analysis": "bg-orange-500/20 text-orange-400 border-orange-500/30",
  "Article": "bg-cyan-500/20 text-cyan-400 border-cyan-500/30",
  "Paper": "bg-amber-500/20 text-amber-400 border-amber-500/30",
  "Website": "bg-indigo-500/20 text-indigo-400 border-indigo-500/30",
  "Insight": "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
  "Other": "bg-zinc-500/20 text-zinc-400 border-zinc-500/30",
}

// Research-focused status colors
const statusColors: Record<string, string> = {
  "To Review": "bg-yellow-500/20 text-yellow-400",
  "Reviewing": "bg-blue-500/20 text-blue-400",
  "Validated": "bg-green-500/20 text-green-400",
  "Archived": "bg-zinc-700/20 text-zinc-500",
  "Important": "bg-red-500/20 text-red-400",
}

type LinkType = "notion" | "google-doc" | "google-sheet" | "external"

function detectLinkType(url: string | null): LinkType {
  if (!url) return "external"
  if (url.includes("notion.so") || url.includes("notion.site")) return "notion"
  if (url.includes("docs.google.com/document")) return "google-doc"
  if (url.includes("docs.google.com/spreadsheets")) return "google-sheet"
  return "external"
}

function getEmbedUrl(url: string, linkType: LinkType): string {
  if (linkType === "google-doc" || linkType === "google-sheet") {
    if (url.includes("/edit")) {
      return url.replace("/edit", "/preview")
    }
    if (!url.includes("/preview")) {
      return url + (url.includes("?") ? "&" : "?") + "embedded=true"
    }
  }
  return url
}

function getLinkIcon(linkType: LinkType) {
  switch (linkType) {
    case "notion":
      return <Database className="h-3 w-3" />
    case "google-doc":
      return <FileText className="h-3 w-3" />
    case "google-sheet":
      return <FileSpreadsheet className="h-3 w-3" />
    default:
      return <ExternalLink className="h-3 w-3" />
  }
}

function getLinkLabel(linkType: LinkType) {
  switch (linkType) {
    case "notion": return "Notion"
    case "google-doc": return "Google Doc"
    case "google-sheet": return "Google Sheet"
    default: return null
  }
}

function getRelativeTime(dateString: string): string {
  const date = new Date(dateString)
  const now = new Date()
  const diffInMs = now.getTime() - date.getTime()
  const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24))

  if (diffInDays === 0) return "Today"
  if (diffInDays === 1) return "Yesterday"
  if (diffInDays < 7) return `${diffInDays} days ago`
  if (diffInDays < 30) return `${Math.floor(diffInDays / 7)} weeks ago`
  if (diffInDays < 365) return `${Math.floor(diffInDays / 30)} months ago`
  return `${Math.floor(diffInDays / 365)} years ago`
}

export function ContentItem({ item }: ContentItemProps) {
  const [showPreview, setShowPreview] = useState(false)
  const [expanded, setExpanded] = useState(false)

  const linkType = detectLinkType(item.url)
  const hasDescription = item.description && item.description.length > 0
  const [embedError, setEmbedError] = useState(false)

  const handleClick = () => {
    if (!item.url) {
      window.open(item.notionUrl, "_blank", "noopener,noreferrer")
      return
    }

    setEmbedError(false)
    setShowPreview(true)
  }

  const handleOpenExternal = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (item.url) {
      window.open(item.url, "_blank", "noopener,noreferrer")
    }
  }

  const toggleExpand = (e: React.MouseEvent) => {
    e.stopPropagation()
    setExpanded(!expanded)
  }

  const closePreview = () => {
    setShowPreview(false)
    setEmbedError(false)
  }

  return (
    <>
      <div className="w-full text-left p-4 rounded-lg border border-zinc-800 bg-zinc-900/50 hover:bg-zinc-800/50 hover:border-zinc-700 transition-all duration-200 group">
        <button
          onClick={handleClick}
          className="w-full text-left focus:outline-none"
        >
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-2 flex-wrap">
                {item.type && (
                  <Badge
                    variant="outline"
                    className={`${typeColors[item.type] || getColorFromString(item.type, true)} flex items-center gap-1 text-xs`}
                  >
                    {typeIcons[item.type] || typeIcons.Other}
                    {item.type}
                  </Badge>
                )}
                {getLinkLabel(linkType) && (
                  <Badge
                    variant="outline"
                    className="bg-zinc-700/30 text-zinc-400 border-zinc-600 flex items-center gap-1 text-xs"
                  >
                    {getLinkIcon(linkType)}
                    {getLinkLabel(linkType)}
                  </Badge>
                )}
              </div>

              <h3 className="font-medium text-zinc-100 group-hover:text-white mb-2">
                {item.title}
              </h3>

              <div className="flex items-center gap-2 text-sm text-zinc-500 flex-wrap">
                {item.source && (
                  <Badge variant="secondary" className={`${getColorFromString(item.source)} text-xs`}>
                    {item.source}
                  </Badge>
                )}
                <Badge variant="secondary" className={`${statusColors[item.status] || getColorFromString(item.status)} text-xs`}>
                  {item.status}
                </Badge>
                <span className="text-zinc-500">{getRelativeTime(item.dateAdded)}</span>
              </div>
            </div>

            <div className="flex items-center gap-1 flex-shrink-0 mt-1">
              <span
                onClick={handleOpenExternal}
                className="p-1 rounded hover:bg-zinc-700 text-zinc-500 hover:text-zinc-300 cursor-pointer"
                title="Open in new tab"
              >
                <ExternalLink className="h-4 w-4" />
              </span>
            </div>
          </div>
        </button>

        {/* Description section */}
        {hasDescription && (
          <div className="mt-3 pt-3 border-t border-zinc-800">
            <button
              onClick={toggleExpand}
              className="flex items-center gap-1 text-xs text-zinc-500 hover:text-zinc-300 transition"
            >
              {expanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
              {expanded ? "Hide description" : "Show description"}
            </button>
            {expanded && (
              <p className="mt-2 text-sm text-zinc-400 whitespace-pre-wrap">
                {item.description}
              </p>
            )}
          </div>
        )}

        {/* Tags */}
        {item.tags && item.tags.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1">
            {item.tags.map((tag) => (
              <Badge
                key={tag}
                variant="outline"
                className="text-xs bg-zinc-800/50 text-zinc-500 border-zinc-700"
              >
                #{tag}
              </Badge>
            ))}
          </div>
        )}
      </div>

      {/* Preview Modal */}
      {showPreview && item.url && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
          onClick={closePreview}
        >
          <div
            className="relative w-full max-w-4xl h-[90vh] bg-zinc-900 rounded-lg overflow-hidden border border-zinc-700"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-3 border-b border-zinc-700 bg-zinc-800">
              <div className="flex items-center gap-2">
                {getLinkIcon(linkType)}
                <span className="text-sm text-zinc-300 truncate max-w-md">
                  {item.title}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleOpenExternal}
                  className="text-zinc-400 hover:text-zinc-200 gap-1"
                >
                  <ExternalLink className="h-4 w-4" />
                  Open
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={closePreview}
                  className="text-zinc-400 hover:text-zinc-200"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div className="h-[calc(100%-52px)] relative">
              {embedError ? (
                <div className="flex flex-col items-center justify-center h-full text-zinc-400 gap-4">
                  <Globe className="h-12 w-12 text-zinc-600" />
                  <p className="text-center">
                    Ce site ne peut pas être affiché dans un iframe.<br />
                    <span className="text-zinc-500 text-sm">Le site bloque l&apos;intégration externe.</span>
                  </p>
                  <Button
                    onClick={handleOpenExternal}
                    className="gap-2"
                  >
                    <ExternalLink className="h-4 w-4" />
                    Ouvrir dans un nouvel onglet
                  </Button>
                </div>
              ) : (
                <iframe
                  src={getEmbedUrl(item.url, linkType)}
                  className="w-full h-full bg-white"
                  title={item.title}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  onError={() => setEmbedError(true)}
                />
              )}
            </div>
          </div>
        </div>
      )}
    </>
  )
}
