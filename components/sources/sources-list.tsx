"use client"

import { useEffect, useState, useCallback } from "react"
import { SourceCard } from "./source-card"
import { AddSourceForm } from "./add-source-form"
import { Loader2, Inbox, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

interface SourceData {
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
  createdAt: string
  notionUrl: string
}

interface ApiResponse {
  items: SourceData[]
  filters: {
    categories: string[]
    authMethods: string[]
  }
}

export function SourcesList() {
  const [items, setItems] = useState<SourceData[]>([])
  const [filteredItems, setFilteredItems] = useState<SourceData[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [categories, setCategories] = useState<string[]>([])
  const [authMethods, setAuthMethods] = useState<string[]>([])

  const [selectedCategory, setSelectedCategory] = useState("all")
  const [selectedAuth, setSelectedAuth] = useState("all")
  const [showFreeOnly, setShowFreeOnly] = useState(false)

  const fetchSources = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch("/api/sources")
      if (!response.ok) throw new Error("Failed to fetch sources")

      const data: ApiResponse = await response.json()
      setItems(data.items)
      setFilteredItems(data.items)
      setCategories(data.filters.categories)
      setAuthMethods(data.filters.authMethods)
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchSources()
  }, [fetchSources])

  useEffect(() => {
    let result = items

    if (selectedCategory !== "all") {
      result = result.filter((item) => item.category === selectedCategory)
    }

    if (selectedAuth !== "all") {
      result = result.filter((item) => item.auth === selectedAuth)
    }

    if (showFreeOnly) {
      result = result.filter((item) => item.isFree)
    }

    setFilteredItems(result)
  }, [items, selectedCategory, selectedAuth, showFreeOnly])

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this source?")) return

    try {
      const response = await fetch(`/api/sources?id=${id}`, {
        method: "DELETE",
      })

      if (!response.ok) throw new Error("Failed to delete source")

      setItems((prev) => prev.filter((item) => item.id !== id))
    } catch (error) {
      console.error("Error deleting source:", error)
    }
  }

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement || e.target instanceof HTMLSelectElement) return

      if (e.key === "r" && !e.metaKey && !e.ctrlKey) {
        e.preventDefault()
        fetchSources()
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [fetchSources])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-zinc-500" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <p className="text-red-400 mb-4">{error}</p>
        <Button onClick={fetchSources} variant="outline" className="gap-2">
          <RefreshCw className="h-4 w-4" />
          Retry
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex items-center gap-3 flex-wrap">
          <Select value={selectedCategory} onValueChange={setSelectedCategory}>
            <SelectTrigger className="w-[140px] bg-zinc-900 border-zinc-700">
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent className="bg-zinc-900 border-zinc-700">
              <SelectItem value="all">All Categories</SelectItem>
              {categories.map((cat) => (
                <SelectItem key={cat} value={cat}>
                  {cat}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={selectedAuth} onValueChange={setSelectedAuth}>
            <SelectTrigger className="w-[140px] bg-zinc-900 border-zinc-700">
              <SelectValue placeholder="Auth" />
            </SelectTrigger>
            <SelectContent className="bg-zinc-900 border-zinc-700">
              <SelectItem value="all">All Auth</SelectItem>
              {authMethods.map((auth) => (
                <SelectItem key={auth} value={auth}>
                  {auth}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <label className="flex items-center gap-2 cursor-pointer text-sm text-zinc-400">
            <input
              type="checkbox"
              checked={showFreeOnly}
              onChange={(e) => setShowFreeOnly(e.target.checked)}
              className="rounded border-zinc-600 bg-zinc-800 text-green-500 focus:ring-zinc-600"
            />
            Free only
          </label>

          <Button
            variant="ghost"
            size="icon"
            onClick={fetchSources}
            className="text-zinc-500 hover:text-zinc-300"
            title="Refresh (R)"
          >
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Add Source */}
      <AddSourceForm onSuccess={fetchSources} />

      {/* Stats */}
      <div className="text-sm text-zinc-500">
        {filteredItems.length} source{filteredItems.length !== 1 ? "s" : ""}
        {(selectedCategory !== "all" || selectedAuth !== "all" || showFreeOnly) && (
          <span> (filtered from {items.length})</span>
        )}
      </div>

      {/* List */}
      {filteredItems.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <Inbox className="h-12 w-12 text-zinc-600 mb-4" />
          <p className="text-zinc-400 mb-2">No sources found</p>
          <p className="text-zinc-500 text-sm">
            {selectedCategory !== "all" || selectedAuth !== "all" || showFreeOnly
              ? "Try adjusting your filters"
              : "Add your first data source above"}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredItems.map((item) => (
            <SourceCard
              key={item.id}
              source={item}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}
    </div>
  )
}
