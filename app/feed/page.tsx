import { Rss } from "lucide-react"

export default function FeedPage() {
  return (
    <div className="p-8">
      <header className="mb-8">
        <h1 className="text-2xl font-bold text-zinc-100 mb-1">Feed</h1>
        <p className="text-zinc-500">Research papers organized by topic</p>
      </header>

      <div className="flex flex-col items-center justify-center py-20 text-center">
        <Rss className="h-12 w-12 text-zinc-600 mb-4" />
        <p className="text-zinc-400 mb-2">Select a topic from the sidebar</p>
        <p className="text-zinc-500 text-sm">
          Add topics using the input field under Feed
        </p>
      </div>
    </div>
  )
}
