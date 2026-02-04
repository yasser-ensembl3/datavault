"use client"

import { useState } from "react"
import { Plus, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

interface AddAssumptionFormProps {
  onSuccess: () => void
}

export function AddAssumptionForm({ onSuccess }: AddAssumptionFormProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [confidence, setConfidence] = useState("Medium")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim()) return

    setLoading(true)
    try {
      const response = await fetch("/api/assumptions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim() || undefined,
          status: "Pending",
          confidence,
        }),
      })

      if (!response.ok) throw new Error("Failed to create assumption")

      setTitle("")
      setDescription("")
      setConfidence("Medium")
      setIsOpen(false)
      onSuccess()
    } catch (error) {
      console.error("Error creating assumption:", error)
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) {
    return (
      <Button
        onClick={() => setIsOpen(true)}
        variant="outline"
        className="w-full border-dashed border-zinc-700 text-zinc-400 hover:text-zinc-300 hover:border-zinc-600"
      >
        <Plus className="h-4 w-4 mr-2" />
        Add Assumption
      </Button>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="bg-zinc-900 border border-zinc-700 rounded-lg p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-medium text-zinc-300">New Assumption</h3>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={() => setIsOpen(false)}
          className="h-6 w-6 text-zinc-500 hover:text-zinc-300"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>

      <div className="space-y-3">
        <Input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Assumption title..."
          className="bg-zinc-800 border-zinc-700 text-zinc-100"
          autoFocus
        />

        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Description (optional)..."
          className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-md text-zinc-100 placeholder:text-zinc-500 text-sm resize-none focus:outline-none focus:ring-1 focus:ring-zinc-600"
          rows={2}
        />

        <div className="flex items-center gap-3">
          <label className="text-sm text-zinc-400">Confidence:</label>
          <select
            value={confidence}
            onChange={(e) => setConfidence(e.target.value)}
            className="px-2 py-1 bg-zinc-800 border border-zinc-700 rounded text-sm text-zinc-300 focus:outline-none focus:ring-1 focus:ring-zinc-600"
          >
            <option value="Low">Low</option>
            <option value="Medium">Medium</option>
            <option value="High">High</option>
          </select>
        </div>

        <div className="flex gap-2 pt-2">
          <Button
            type="button"
            variant="ghost"
            onClick={() => setIsOpen(false)}
            className="flex-1 text-zinc-400"
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={!title.trim() || loading}
            className="flex-1 bg-zinc-700 hover:bg-zinc-600"
          >
            {loading ? "Adding..." : "Add"}
          </Button>
        </div>
      </div>
    </form>
  )
}
