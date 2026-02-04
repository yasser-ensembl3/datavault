import { SourcesList } from "@/components/sources/sources-list"

export default function SourcesPage() {
  return (
    <div className="p-4 md:p-6">
      <header className="mb-4">
        <h1 className="text-lg font-semibold text-zinc-100">Data Sources</h1>
        <p className="text-xs text-zinc-500">Index of free APIs and data sources</p>
      </header>

      <SourcesList />

      <footer className="mt-8 pt-4 border-t border-zinc-800 text-xs text-zinc-600">
        Press <kbd className="px-1 py-0.5 bg-zinc-800 rounded text-zinc-400 text-[10px]">R</kbd> to refresh
      </footer>
    </div>
  )
}
