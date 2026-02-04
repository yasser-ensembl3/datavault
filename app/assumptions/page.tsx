import { AssumptionsList } from "@/components/assumptions/assumptions-list"

export default function AssumptionsPage() {
  return (
    <div className="p-8">
      <header className="mb-8">
        <h1 className="text-2xl font-bold text-zinc-100 mb-1">Assumptions</h1>
        <p className="text-zinc-500">Track and validate your research hypotheses</p>
      </header>

      <AssumptionsList />

      <footer className="mt-12 pt-6 border-t border-zinc-800 text-sm text-zinc-600">
        Press <kbd className="px-1.5 py-0.5 bg-zinc-800 rounded text-zinc-400">R</kbd> to refresh
      </footer>
    </div>
  )
}
