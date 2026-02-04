import { SourcesList } from "@/components/sources/sources-list"

export default function SourcesPage() {
  return (
    <div className="p-8">
      <header className="mb-8">
        <h1 className="text-2xl font-bold text-zinc-100 mb-1">Data Sources</h1>
        <p className="text-zinc-500">Index of free APIs and data sources for research</p>
      </header>

      <SourcesList />

      <footer className="mt-12 pt-6 border-t border-zinc-800 text-sm text-zinc-600">
        Press <kbd className="px-1.5 py-0.5 bg-zinc-800 rounded text-zinc-400">R</kbd> to refresh
      </footer>
    </div>
  )
}
