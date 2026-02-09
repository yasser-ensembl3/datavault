"use client"

interface AreaBadgeProps {
  name: string
  isActive?: boolean
  onClick?: () => void
}

export function AreaBadge({ name, isActive = false, onClick }: AreaBadgeProps) {
  return (
    <button
      onClick={onClick}
      className={`px-3 py-1 rounded-full text-xs font-medium border transition-all cursor-pointer ${
        isActive
          ? "bg-zinc-100 text-zinc-900 border-zinc-100"
          : "bg-zinc-800 text-zinc-400 border-zinc-700 hover:text-zinc-200 hover:border-zinc-500"
      }`}
    >
      {name}
    </button>
  )
}
