"use client"

import { useEffect, useState, useCallback } from "react"
import { AssumptionCard } from "./assumption-card"
import { AddAssumptionForm } from "./add-assumption-form"
import { Loader2, Inbox, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

interface AssumptionData {
  id: string
  title: string
  description: string | null
  status: string
  confidence: string
  evidence: string | null
  createdAt: string
  notionUrl: string
}

interface ApiResponse {
  items: AssumptionData[]
  filters: {
    statuses: string[]
    confidences: string[]
  }
}

export function AssumptionsList() {
  const [items, setItems] = useState<AssumptionData[]>([])
  const [filteredItems, setFilteredItems] = useState<AssumptionData[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [statuses, setStatuses] = useState<string[]>([])
  const [confidences, setConfidences] = useState<string[]>([])

  const [selectedStatus, setSelectedStatus] = useState("all")
  const [selectedConfidence, setSelectedConfidence] = useState("all")

  const fetchAssumptions = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch("/api/assumptions")
      if (!response.ok) throw new Error("Failed to fetch assumptions")

      const data: ApiResponse = await response.json()
      setItems(data.items)
      setFilteredItems(data.items)
      setStatuses(data.filters.statuses)
      setConfidences(data.filters.confidences)
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchAssumptions()
  }, [fetchAssumptions])

  useEffect(() => {
    let result = items

    if (selectedStatus !== "all") {
      result = result.filter((item) => item.status === selectedStatus)
    }

    if (selectedConfidence !== "all") {
      result = result.filter((item) => item.confidence === selectedConfidence)
    }

    setFilteredItems(result)
  }, [items, selectedStatus, selectedConfidence])

  const handleStatusChange = async (id: string, status: string) => {
    try {
      const response = await fetch("/api/assumptions", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status }),
      })

      if (!response.ok) throw new Error("Failed to update status")

      setItems((prev) =>
        prev.map((item) => (item.id === id ? { ...item, status } : item))
      )
    } catch (error) {
      console.error("Error updating status:", error)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this assumption?")) return

    try {
      const response = await fetch(`/api/assumptions?id=${id}`, {
        method: "DELETE",
      })

      if (!response.ok) throw new Error("Failed to delete assumption")

      setItems((prev) => prev.filter((item) => item.id !== id))
    } catch (error) {
      console.error("Error deleting assumption:", error)
    }
  }

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement || e.target instanceof HTMLSelectElement) return

      if (e.key === "r" && !e.metaKey && !e.ctrlKey) {
        e.preventDefault()
        fetchAssumptions()
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [fetchAssumptions])

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
        <Button onClick={fetchAssumptions} variant="outline" className="gap-2">
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
        <div className="flex items-center gap-3">
          <Select value={selectedStatus} onValueChange={setSelectedStatus}>
            <SelectTrigger className="w-[140px] bg-zinc-900 border-zinc-700">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent className="bg-zinc-900 border-zinc-700">
              <SelectItem value="all">All Status</SelectItem>
              {statuses.map((status) => (
                <SelectItem key={status} value={status}>
                  {status}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={selectedConfidence} onValueChange={setSelectedConfidence}>
            <SelectTrigger className="w-[140px] bg-zinc-900 border-zinc-700">
              <SelectValue placeholder="Confidence" />
            </SelectTrigger>
            <SelectContent className="bg-zinc-900 border-zinc-700">
              <SelectItem value="all">All Confidence</SelectItem>
              {confidences.map((confidence) => (
                <SelectItem key={confidence} value={confidence}>
                  {confidence}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Button
            variant="ghost"
            size="icon"
            onClick={fetchAssumptions}
            className="text-zinc-500 hover:text-zinc-300"
            title="Refresh (R)"
          >
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Add Assumption */}
      <AddAssumptionForm onSuccess={fetchAssumptions} />

      {/* Stats */}
      <div className="text-sm text-zinc-500">
        {filteredItems.length} assumption{filteredItems.length !== 1 ? "s" : ""}
        {(selectedStatus !== "all" || selectedConfidence !== "all") && (
          <span> (filtered from {items.length})</span>
        )}
      </div>

      {/* List */}
      {filteredItems.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <Inbox className="h-12 w-12 text-zinc-600 mb-4" />
          <p className="text-zinc-400 mb-2">No assumptions found</p>
          <p className="text-zinc-500 text-sm">
            {selectedStatus !== "all" || selectedConfidence !== "all"
              ? "Try adjusting your filters"
              : "Add your first assumption above"}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredItems.map((item) => (
            <AssumptionCard
              key={item.id}
              assumption={item}
              onStatusChange={handleStatusChange}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}
    </div>
  )
}
