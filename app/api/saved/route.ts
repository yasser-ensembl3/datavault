import { NextResponse } from "next/server"

const NOTION_TOKEN = process.env.NOTION_TOKEN!
const DATABASE_ID = process.env.NOTION_SAVED_DATABASE_ID!

const headers = {
  Authorization: `Bearer ${NOTION_TOKEN}`,
  "Notion-Version": "2022-06-28",
  "Content-Type": "application/json",
}

interface Paper {
  id: string
  title: string
  description: string
  authors: string
  pdfLink: string
  date: string
}

function pageToaper(page: any): Paper {
  const props = page.properties
  return {
    id: page.id,
    title: props.Title?.title?.[0]?.plain_text || "",
    authors: props.Authors?.rich_text?.[0]?.plain_text || "",
    description: props.Description?.rich_text?.[0]?.plain_text || "",
    pdfLink: props["pdf Link"]?.url || "",
    date: props.Submission?.date?.start || "",
  }
}

// GET — list all saved papers
export async function GET() {
  try {
    const res = await fetch(`https://api.notion.com/v1/databases/${DATABASE_ID}/query`, {
      method: "POST",
      headers,
      body: JSON.stringify({
        sorts: [{ timestamp: "created_time", direction: "descending" }],
      }),
      cache: "no-store",
    })

    if (!res.ok) {
      const err = await res.text()
      console.error("Notion query error:", err)
      return NextResponse.json({ papers: [] })
    }

    const data = await res.json()
    const papers = data.results
      .filter((p: any) => !p.archived)
      .map(pageToaper)

    return NextResponse.json({ papers })
  } catch (error) {
    console.error("Error fetching saved papers:", error)
    return NextResponse.json({ papers: [] })
  }
}

// POST — save a paper
export async function POST(request: Request) {
  try {
    const paper = await request.json()
    if (!paper.title) {
      return NextResponse.json({ error: "Title is required" }, { status: 400 })
    }

    // Check for duplicates
    const checkRes = await fetch(`https://api.notion.com/v1/databases/${DATABASE_ID}/query`, {
      method: "POST",
      headers,
      body: JSON.stringify({
        filter: {
          property: "Title",
          title: { equals: paper.title },
        },
      }),
      cache: "no-store",
    })

    if (checkRes.ok) {
      const checkData = await checkRes.json()
      const existing = checkData.results.filter((p: any) => !p.archived)
      if (existing.length > 0) {
        return NextResponse.json({ success: true, message: "Already saved" })
      }
    }

    // Create page
    const properties: any = {
      Title: {
        title: [{ text: { content: paper.title } }],
      },
    }

    if (paper.authors) {
      properties.Authors = {
        rich_text: [{ text: { content: paper.authors.slice(0, 2000) } }],
      }
    }

    if (paper.description) {
      properties.Description = {
        rich_text: [{ text: { content: paper.description.slice(0, 2000) } }],
      }
    }

    if (paper.pdfLink) {
      properties["pdf Link"] = { url: paper.pdfLink }
    }

    if (paper.date) {
      // Convert date strings like "29 January, 2026" to ISO format "2026-01-29"
      const parsed = new Date(paper.date)
      const isoDate = !isNaN(parsed.getTime())
        ? parsed.toISOString().split("T")[0]
        : paper.date
      properties.Submission = { date: { start: isoDate } }
    }

    const createRes = await fetch("https://api.notion.com/v1/pages", {
      method: "POST",
      headers,
      body: JSON.stringify({
        parent: { database_id: DATABASE_ID },
        properties,
      }),
    })

    if (!createRes.ok) {
      const err = await createRes.text()
      console.error("Notion create error:", err)
      return NextResponse.json({ error: "Failed to save" }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error saving paper:", error)
    return NextResponse.json({ error: "Failed to save" }, { status: 500 })
  }
}

// DELETE — remove a paper by title
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const title = searchParams.get("title")

    if (!title) {
      return NextResponse.json({ error: "Title is required" }, { status: 400 })
    }

    // Find the page by title
    const queryRes = await fetch(`https://api.notion.com/v1/databases/${DATABASE_ID}/query`, {
      method: "POST",
      headers,
      body: JSON.stringify({
        filter: {
          property: "Title",
          title: { equals: title },
        },
      }),
      cache: "no-store",
    })

    if (!queryRes.ok) {
      return NextResponse.json({ error: "Failed to find paper" }, { status: 500 })
    }

    const queryData = await queryRes.json()
    const pages = queryData.results.filter((p: any) => !p.archived)

    if (pages.length === 0) {
      return NextResponse.json({ error: "Paper not found" }, { status: 404 })
    }

    // Archive the page (Notion's way of deleting)
    const archiveRes = await fetch(`https://api.notion.com/v1/pages/${pages[0].id}`, {
      method: "PATCH",
      headers,
      body: JSON.stringify({ archived: true }),
    })

    if (!archiveRes.ok) {
      return NextResponse.json({ error: "Failed to delete" }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting paper:", error)
    return NextResponse.json({ error: "Failed to delete" }, { status: 500 })
  }
}

// PATCH — clear all saved papers
export async function PATCH() {
  try {
    // Get all pages
    const queryRes = await fetch(`https://api.notion.com/v1/databases/${DATABASE_ID}/query`, {
      method: "POST",
      headers,
      body: JSON.stringify({}),
      cache: "no-store",
    })

    if (!queryRes.ok) {
      return NextResponse.json({ error: "Failed to fetch papers" }, { status: 500 })
    }

    const data = await queryRes.json()
    const pages = data.results.filter((p: any) => !p.archived)

    // Archive all pages
    await Promise.all(
      pages.map((page: any) =>
        fetch(`https://api.notion.com/v1/pages/${page.id}`, {
          method: "PATCH",
          headers,
          body: JSON.stringify({ archived: true }),
        })
      )
    )

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error clearing papers:", error)
    return NextResponse.json({ error: "Failed to clear" }, { status: 500 })
  }
}
