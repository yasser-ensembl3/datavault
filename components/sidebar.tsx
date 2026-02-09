"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Database, Globe, Lightbulb, Bookmark, BookOpen } from "lucide-react"

const navItems = [
  { href: "/areas", label: "Areas", icon: Globe },
  { href: "/saved", label: "Saved", icon: Bookmark },
  { href: "/assumptions", label: "Assumptions", icon: Lightbulb },
  { href: "/apis-dataset", label: "APIs / Dataset", icon: Database },
  { href: "/docs", label: "Docs", icon: BookOpen },
]

export function Sidebar() {
  const pathname = usePathname()

  return (
    <aside className="fixed left-0 top-0 h-screen w-48 bg-zinc-900 border-r border-zinc-800 flex flex-col hidden md:flex">
      {/* Logo */}
      <div className="p-4 border-b border-zinc-800">
        <div className="flex items-center gap-2">
          <Database className="h-4 w-4 text-blue-400" />
          <span className="font-semibold text-sm text-zinc-100">Research Vault</span>
        </div>
      </div>

      {/* Nav Items */}
      <nav className="flex-1 p-2 space-y-0.5 overflow-y-auto">
        {navItems.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + "/")
          const Icon = item.icon

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-2 px-2 py-1.5 rounded text-xs transition-colors ${
                isActive
                  ? "bg-zinc-800 text-zinc-100"
                  : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50"
              }`}
            >
              <Icon className="h-3.5 w-3.5" />
              {item.label}
            </Link>
          )
        })}
      </nav>

      {/* Footer */}
      <div className="p-3 border-t border-zinc-800">
        <p className="text-[10px] text-zinc-600">Press R to refresh</p>
      </div>
    </aside>
  )
}
