import { Rss } from "lucide-react"

export default function FeedPage() {
  return (
    <div className="p-4 md:p-6">
      <header className="mb-4">
        <h1 className="text-lg font-semibold text-zinc-100">Feed</h1>
        <p className="text-xs text-zinc-500">Research papers by topic</p>
      </header>

      <div className="flex flex-col items-center justify-center py-12 text-center">
        <Rss className="h-8 w-8 text-zinc-600 mb-3" />
        <p className="text-zinc-400 text-sm mb-1">Select a topic from the sidebar</p>
        <p className="text-zinc-500 text-xs">
          Add topics using the input field under Feed
        </p>
      </div>
    </div>
  )
}
