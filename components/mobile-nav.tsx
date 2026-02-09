"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Globe, Bookmark, Lightbulb, Database } from "lucide-react"

const navItems = [
  { href: "/areas", label: "Areas", icon: Globe },
  { href: "/saved", label: "Saved", icon: Bookmark },
  { href: "/assumptions", label: "Assumptions", icon: Lightbulb },
  { href: "/apis-dataset", label: "APIs / Dataset", icon: Database },
]

export function MobileNav() {
  const pathname = usePathname()

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-zinc-900 border-t border-zinc-800 z-50">
      <div className="flex items-center justify-around py-2">
        {navItems.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + "/")
          const Icon = item.icon

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center gap-0.5 px-3 py-1 ${
                isActive ? "text-zinc-100" : "text-zinc-500"
              }`}
            >
              <Icon className="h-4 w-4" />
              <span className="text-[10px]">{item.label}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
