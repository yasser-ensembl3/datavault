"use client"

import { useState } from "react"
import { Plus, X, Pencil, Trash2, Inbox } from "lucide-react"
import { Button } from "@/components/ui/button"

interface Assumption {
  id: string
  assumption: string
  alias: string
  textExperiment: string
  insightsData: string
  status: "Pending" | "Testing" | "Validated" | "Invalidated"
}

const statusOptions = ["Pending", "Testing", "Validated", "Invalidated"] as const

const emptyForm: { assumption: string; alias: string; textExperiment: string; insightsData: string; status: Assumption["status"] } = { assumption: "", alias: "", textExperiment: "", insightsData: "", status: "Pending" }

export default function AssumptionsPage() {
  const [items, setItems] = useState<Assumption[]>([])
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState(emptyForm)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.assumption.trim()) return

    if (editingId) {
      setItems(prev => prev.map(item =>
        item.id === editingId ? { ...item, ...form } : item
      ))
      setEditingId(null)
    } else {
      setItems(prev => [...prev, { id: Date.now().toString(), ...form }])
    }

    setForm(emptyForm)
    setShowForm(false)
  }

  const startEdit = (item: Assumption) => {
    setForm({
      assumption: item.assumption,
      alias: item.alias,
      textExperiment: item.textExperiment,
      insightsData: item.insightsData,
      status: item.status,
    })
    setEditingId(item.id)
    setShowForm(true)
  }

  const deleteItem = (id: string) => {
    setItems(prev => prev.filter(item => item.id !== id))
    if (editingId === id) {
      setEditingId(null)
      setForm(emptyForm)
      setShowForm(false)
    }
  }

  const cancelForm = () => {
    setShowForm(false)
    setEditingId(null)
    setForm(emptyForm)
  }

  return (
    <div className="p-4 md:p-6">
      <header className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-lg font-semibold text-zinc-100">Assumptions</h1>
            <p className="text-xs text-zinc-500">
              {items.length} assumption{items.length !== 1 ? "s" : ""}
            </p>
          </div>
          {!showForm && (
            <Button
              onClick={() => setShowForm(true)}
              variant="outline"
              size="sm"
              className="text-xs h-7 gap-1.5 border-zinc-700 text-zinc-400 hover:text-zinc-200"
            >
              <Plus className="h-3.5 w-3.5" />
              Add
            </Button>
          )}
        </div>
      </header>

      {/* Add / Edit Form */}
      {showForm && (
        <form onSubmit={handleSubmit} className="mb-6 bg-zinc-900 border border-zinc-700 rounded-lg p-4 space-y-3">
          <div className="flex items-center justify-between mb-1">
            <h3 className="text-sm font-medium text-zinc-300">
              {editingId ? "Edit Assumption" : "New Assumption"}
            </h3>
            <button type="button" onClick={cancelForm} className="text-zinc-500 hover:text-zinc-300">
              <X className="h-4 w-4" />
            </button>
          </div>

          <input
            value={form.assumption}
            onChange={e => setForm({ ...form, assumption: e.target.value })}
            placeholder="Assumption..."
            className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-md text-sm text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:border-zinc-500"
            autoFocus
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <input
              value={form.alias}
              onChange={e => setForm({ ...form, alias: e.target.value })}
              placeholder="Alias..."
              className="px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-md text-sm text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:border-zinc-500"
            />
            <select
              value={form.status}
              onChange={e => setForm({ ...form, status: e.target.value as Assumption["status"] })}
              className="px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-md text-sm text-zinc-300 focus:outline-none focus:border-zinc-500"
            >
              {statusOptions.map(s => (
                <option key={s} value={s} className="bg-zinc-900">{s}</option>
              ))}
            </select>
          </div>

          <textarea
            value={form.textExperiment}
            onChange={e => setForm({ ...form, textExperiment: e.target.value })}
            placeholder="Text / Experiment..."
            rows={2}
            className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-md text-sm text-zinc-100 placeholder:text-zinc-500 resize-none focus:outline-none focus:border-zinc-500"
          />

          <textarea
            value={form.insightsData}
            onChange={e => setForm({ ...form, insightsData: e.target.value })}
            placeholder="Insights / Data..."
            rows={2}
            className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-md text-sm text-zinc-100 placeholder:text-zinc-500 resize-none focus:outline-none focus:border-zinc-500"
          />

          <div className="flex gap-2 pt-1">
            <Button type="button" variant="ghost" onClick={cancelForm} className="flex-1 text-zinc-400 text-sm">
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={!form.assumption.trim()}
              className="flex-1 bg-zinc-700 hover:bg-zinc-600 text-sm"
            >
              {editingId ? "Update" : "Add"}
            </Button>
          </div>
        </form>
      )}

      {/* Table */}
      {items.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <Inbox className="h-8 w-8 text-zinc-600 mb-3" />
          <p className="text-zinc-400 text-sm mb-1">No assumptions yet</p>
          <p className="text-zinc-500 text-xs">Add your first assumption to start tracking</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-zinc-800">
                <th className="text-left py-3 px-4 text-sm font-medium text-zinc-500 w-10">#</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-zinc-500">Assumption</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-zinc-500 hidden md:table-cell">Insights / Data</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-zinc-500">Status</th>
                <th className="py-3 px-4 w-20" />
              </tr>
            </thead>
            <tbody>
              {items.map((item, index) => (
                <tr key={item.id} className="border-b border-zinc-800/50 hover:bg-zinc-900/50 transition-colors">
                  <td className="py-4 px-4 text-base text-zinc-600">{index}</td>
                  <td className="py-4 px-4">
                    <p className="text-base text-zinc-100 font-medium">{item.assumption}</p>
                    {item.alias && (
                      <p className="text-sm text-zinc-500 mt-0.5">{item.alias}</p>
                    )}
                    {item.textExperiment && (
                      <p className="text-sm text-zinc-500 mt-1 md:hidden">{item.textExperiment}</p>
                    )}
                  </td>
                  <td className="py-4 px-4 text-sm text-zinc-400 hidden md:table-cell max-w-[300px]">
                    {item.insightsData || "—"}
                  </td>
                  <td className="py-4 px-4">
                    <span className={`text-sm px-2.5 py-1 rounded border ${
                      item.status === "Validated" ? "border-zinc-600 text-zinc-300" :
                      item.status === "Invalidated" ? "border-zinc-700 text-zinc-500 line-through" :
                      item.status === "Testing" ? "border-zinc-600 text-zinc-400" :
                      "border-zinc-700 text-zinc-500"
                    }`}>
                      {item.status}
                    </span>
                  </td>
                  <td className="py-4 px-4">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => startEdit(item)}
                        className="p-1.5 text-zinc-600 hover:text-zinc-300 transition-colors"
                        title="Edit"
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => deleteItem(item.id)}
                        className="p-1.5 text-zinc-600 hover:text-red-400 transition-colors"
                        title="Delete"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
