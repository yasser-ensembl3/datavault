"use client"

import { useState } from "react"
import { Plus, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

interface AddSourceFormProps {
  onSuccess: () => void
}

const CATEGORIES = ["Government", "Academic", "Finance", "Health", "Weather", "Geographic", "Social", "Scientific"]
const AUTH_METHODS = ["None", "API Key", "OAuth", "Token"]
const FORMATS = ["JSON", "CSV", "XML", "GraphQL"]

export function AddSourceForm({ onSuccess }: AddSourceFormProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [category, setCategory] = useState("")
  const [url, setUrl] = useState("")
  const [docsUrl, setDocsUrl] = useState("")
  const [auth, setAuth] = useState("None")
  const [selectedFormats, setSelectedFormats] = useState<string[]>(["JSON"])
  const [isFree, setIsFree] = useState(true)

  const toggleFormat = (format: string) => {
    setSelectedFormats((prev) =>
      prev.includes(format)
        ? prev.filter((f) => f !== format)
        : [...prev, format]
    )
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return

    setLoading(true)
    try {
      const response = await fetch("/api/sources", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          description: description.trim() || undefined,
          category: category || undefined,
          url: url.trim() || undefined,
          docsUrl: docsUrl.trim() || undefined,
          auth,
          formats: selectedFormats,
          isFree,
        }),
      })

      if (!response.ok) throw new Error("Failed to create source")

      setName("")
      setDescription("")
      setCategory("")
      setUrl("")
      setDocsUrl("")
      setAuth("None")
      setSelectedFormats(["JSON"])
      setIsFree(true)
      setIsOpen(false)
      onSuccess()
    } catch (error) {
      console.error("Error creating source:", error)
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
        Add Data Source
      </Button>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="bg-zinc-900 border border-zinc-700 rounded-lg p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-medium text-zinc-300">New Data Source</h3>
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
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="API/Source name..."
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

        <div className="grid grid-cols-2 gap-3">
          <Input
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="API URL..."
            className="bg-zinc-800 border-zinc-700 text-zinc-100"
          />
          <Input
            value={docsUrl}
            onChange={(e) => setDocsUrl(e.target.value)}
            placeholder="Documentation URL..."
            className="bg-zinc-800 border-zinc-700 text-zinc-100"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs text-zinc-500 mb-1 block">Category</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full px-2 py-1.5 bg-zinc-800 border border-zinc-700 rounded text-sm text-zinc-300 focus:outline-none focus:ring-1 focus:ring-zinc-600"
            >
              <option value="">Select category...</option>
              {CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs text-zinc-500 mb-1 block">Auth Method</label>
            <select
              value={auth}
              onChange={(e) => setAuth(e.target.value)}
              className="w-full px-2 py-1.5 bg-zinc-800 border border-zinc-700 rounded text-sm text-zinc-300 focus:outline-none focus:ring-1 focus:ring-zinc-600"
            >
              {AUTH_METHODS.map((method) => (
                <option key={method} value={method}>{method}</option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className="text-xs text-zinc-500 mb-2 block">Formats</label>
          <div className="flex gap-2 flex-wrap">
            {FORMATS.map((format) => (
              <button
                key={format}
                type="button"
                onClick={() => toggleFormat(format)}
                className={`text-xs px-2 py-1 rounded transition-colors ${
                  selectedFormats.includes(format)
                    ? "bg-zinc-600 text-zinc-200"
                    : "bg-zinc-800 text-zinc-500 hover:text-zinc-400"
                }`}
              >
                {format}
              </button>
            ))}
          </div>
        </div>

        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={isFree}
            onChange={(e) => setIsFree(e.target.checked)}
            className="rounded border-zinc-600 bg-zinc-800 text-green-500 focus:ring-zinc-600"
          />
          <span className="text-sm text-zinc-400">Free API</span>
        </label>

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
            disabled={!name.trim() || loading}
            className="flex-1 bg-zinc-700 hover:bg-zinc-600"
          >
            {loading ? "Adding..." : "Add"}
          </Button>
        </div>
      </div>
    </form>
  )
}
