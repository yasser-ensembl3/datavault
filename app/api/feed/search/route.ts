import { NextResponse } from "next/server"
import { searchArxiv, searchArxivByKeywords } from "@/lib/apis/arxiv"

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const query = searchParams.get("q")
  const keywordsParam = searchParams.get("keywords")
  const maxResults = parseInt(searchParams.get("limit") || "20", 10)

  try {
    let papers

    if (keywordsParam) {
      // Search by keywords (comma-separated)
      const keywords = keywordsParam.split(",").map(k => k.trim()).filter(Boolean)
      papers = await searchArxivByKeywords(keywords, maxResults)
    } else if (query) {
      // Search by query
      papers = await searchArxiv(query, maxResults)
    } else {
      return NextResponse.json(
        { error: "Query or keywords required" },
        { status: 400 }
      )
    }

    return NextResponse.json({ papers })
  } catch (error) {
    console.error("Error searching arXiv:", error)
    return NextResponse.json(
      { error: "Failed to search arXiv" },
      { status: 500 }
    )
  }
}
