import { NextResponse } from "next/server"

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const url = searchParams.get("url")
  const title = searchParams.get("title") || "paper"

  if (!url) {
    return NextResponse.json({ error: "URL is required" }, { status: 400 })
  }

  try {
    const response = await fetch(url)
    if (!response.ok) throw new Error(`Failed to fetch PDF: ${response.status}`)

    const pdf = await response.arrayBuffer()
    const filename = `${title.replace(/[^a-zA-Z0-9-_ ]/g, "").slice(0, 80)}.pdf`

    return new NextResponse(pdf, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    })
  } catch (error) {
    console.error("Error downloading PDF:", error)
    return NextResponse.json({ error: "Failed to download PDF" }, { status: 500 })
  }
}
