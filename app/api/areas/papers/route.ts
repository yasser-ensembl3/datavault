import { NextResponse } from "next/server"

const N8N_WEBHOOK_URL = process.env.N8N_WEBHOOK_URL

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const tag = searchParams.get("tag")
  const from = searchParams.get("from")
  const to = searchParams.get("to")

  if (!tag) {
    return NextResponse.json({ error: "Tag is required" }, { status: 400 })
  }

  if (!N8N_WEBHOOK_URL) {
    return NextResponse.json({ error: "n8n webhook not configured" }, { status: 500 })
  }

  try {
    // Build query params for n8n: tag1, tag2, tag3... (one word per param), from, to (YYYY-MM-DD)
    const words = tag.trim().split(/\s+/)
    const params = new URLSearchParams()
    words.forEach((word, i) => params.set(`tag${i + 1}`, word))
    if (from) params.set("from", from)
    if (to) params.set("to", to)

    const url = `${N8N_WEBHOOK_URL}?${params.toString()}`
    const response = await fetch(url, { cache: "no-store" })

    if (!response.ok) {
      throw new Error(`n8n returned ${response.status}`)
    }

    const data = await response.json()

    // Map n8n response to our paper format
    const papers = (Array.isArray(data) ? data : []).map((item: Record<string, string>, index: number) => ({
      id: `n8n-${index}-${Date.now()}`,
      title: item.title || "",
      authors: item.authors || "",
      description: item.abstract || "",
      date: item.date || "",
      pdfLink: item.pdf_url || "",
    })).filter((p: { title: string }) => p.title)

    return NextResponse.json({ papers })
  } catch (error) {
    console.error("Error fetching papers from n8n:", error)
    return NextResponse.json(
      { error: "Failed to fetch papers" },
      { status: 500 }
    )
  }
}
