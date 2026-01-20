import { NextResponse } from "next/server"

const NOTION_TOKEN = process.env.NOTION_TOKEN
const DATABASE_ID = process.env.NEXT_PUBLIC_NOTION_DATABASE_ID

// POST - Add new research result
export async function POST(request: Request) {
  if (!DATABASE_ID) {
    return NextResponse.json(
      { error: "Database ID not configured" },
      { status: 500 }
    )
  }

  try {
    const body = await request.json()
    const { title, url, type, status, source, description } = body

    if (!title) {
      return NextResponse.json(
        { error: "Title is required" },
        { status: 400 }
      )
    }

    const properties: Record<string, unknown> = {
      Name: { title: [{ text: { content: title } }] },
      Status: { select: { name: status || "To Review" } },
      "Date Added": { date: { start: new Date().toISOString().split("T")[0] } },
    }

    // Optional fields
    if (url) properties.URL = { url }
    if (type) properties.Type = { select: { name: type } }
    if (source) properties.Source = { select: { name: source } }
    if (description) properties.Description = { rich_text: [{ text: { content: description } }] }

    const response = await fetch("https://api.notion.com/v1/pages", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${NOTION_TOKEN}`,
        "Notion-Version": "2022-06-28",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        parent: { database_id: DATABASE_ID },
        properties,
      }),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.message || "Failed to create research result")
    }

    const page = await response.json()
    return NextResponse.json({ success: true, id: page.id })
  } catch (error) {
    console.error("Error creating research result:", error)
    return NextResponse.json(
      { error: "Failed to create research result" },
      { status: 500 }
    )
  }
}

async function queryNotionDatabase(filters: object[] = []) {
  const response = await fetch(
    `https://api.notion.com/v1/databases/${DATABASE_ID}/query`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${NOTION_TOKEN}`,
        "Notion-Version": "2022-06-28",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        filter: filters.length > 0 ? { and: filters } : undefined,
        sorts: [{ property: "Date Added", direction: "descending" }],
        page_size: 100,
      }),
      cache: "no-store",
    }
  )

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.message || "Failed to query Notion")
  }

  return response.json()
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const type = searchParams.get("type")
  const status = searchParams.get("status")
  const source = searchParams.get("source")
  const search = searchParams.get("search")

  if (!DATABASE_ID) {
    return NextResponse.json(
      { error: "Database ID not configured" },
      { status: 500 }
    )
  }

  try {
    const filters: object[] = []

    if (type && type !== "all") {
      filters.push({ property: "Type", select: { equals: type } })
    }

    if (status && status !== "all") {
      filters.push({ property: "Status", select: { equals: status } })
    }

    if (source && source !== "all") {
      filters.push({ property: "Source", select: { equals: source } })
    }

    if (search) {
      filters.push({ property: "Name", title: { contains: search } })
    }

    const response = await queryNotionDatabase(filters)

    interface NotionPage {
      id: string
      url: string
      created_time: string
      properties: {
        Name?: { title?: Array<{ plain_text?: string }> }
        Title?: { title?: Array<{ plain_text?: string }> }
        URL?: { url?: string }
        Type?: { select?: { name?: string } }
        Source?: { select?: { name?: string } }
        Status?: { select?: { name?: string } }
        "Date Added"?: { date?: { start?: string } }
        Description?: { rich_text?: Array<{ plain_text?: string }> }
        Tags?: { multi_select?: Array<{ name: string }> }
      }
    }

    const items = (response.results as NotionPage[]).map((page) => {
      const properties = page.properties

      return {
        id: page.id,
        title:
          properties.Name?.title?.[0]?.plain_text ||
          properties.Title?.title?.[0]?.plain_text ||
          "Untitled",
        url: properties.URL?.url || null,
        type: properties.Type?.select?.name || null,
        source: properties.Source?.select?.name || null,
        status: properties.Status?.select?.name || "To Review",
        dateAdded: properties["Date Added"]?.date?.start || page.created_time,
        description: properties.Description?.rich_text?.[0]?.plain_text || null,
        tags: properties.Tags?.multi_select?.map(t => t.name) || [],
        notionUrl: page.url,
      }
    })

    const allTypes = [...new Set(items.map((item) => item.type).filter(Boolean))]
    const allSources = [...new Set(items.map((item) => item.source).filter(Boolean))]
    const allStatuses = [...new Set(items.map((item) => item.status).filter(Boolean))]

    return NextResponse.json({
      items,
      filters: {
        types: allTypes,
        sources: allSources,
        statuses: allStatuses,
      },
    })
  } catch (error) {
    console.error("Error fetching research results:", error)
    return NextResponse.json(
      { error: "Failed to fetch research results" },
      { status: 500 }
    )
  }
}
