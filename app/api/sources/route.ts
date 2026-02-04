import { NextResponse } from "next/server"

const NOTION_TOKEN = process.env.NOTION_TOKEN
const DATABASE_ID = process.env.NOTION_SOURCES_DATABASE_ID

interface NotionPage {
  id: string
  url: string
  created_time: string
  properties: {
    Name?: { title?: Array<{ plain_text?: string }> }
    Description?: { rich_text?: Array<{ plain_text?: string }> }
    Category?: { select?: { name?: string } }
    URL?: { url?: string }
    "Docs URL"?: { url?: string }
    Auth?: { select?: { name?: string } }
    "Rate Limit"?: { rich_text?: Array<{ plain_text?: string }> }
    Formats?: { multi_select?: Array<{ name: string }> }
    "Is Free"?: { checkbox?: boolean }
    Tags?: { multi_select?: Array<{ name: string }> }
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
        sorts: [{ property: "Name", direction: "ascending" }],
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
  const category = searchParams.get("category")
  const auth = searchParams.get("auth")
  const isFree = searchParams.get("isFree")

  if (!DATABASE_ID) {
    return NextResponse.json(
      { error: "Sources database not configured" },
      { status: 500 }
    )
  }

  try {
    const filters: object[] = []

    if (category && category !== "all") {
      filters.push({ property: "Category", select: { equals: category } })
    }

    if (auth && auth !== "all") {
      filters.push({ property: "Auth", select: { equals: auth } })
    }

    if (isFree === "true") {
      filters.push({ property: "Is Free", checkbox: { equals: true } })
    }

    const response = await queryNotionDatabase(filters)

    const items = (response.results as NotionPage[]).map((page) => {
      const properties = page.properties

      return {
        id: page.id,
        name: properties.Name?.title?.[0]?.plain_text || "Untitled",
        description: properties.Description?.rich_text?.[0]?.plain_text || null,
        category: properties.Category?.select?.name || null,
        url: properties.URL?.url || null,
        docsUrl: properties["Docs URL"]?.url || null,
        auth: properties.Auth?.select?.name || "None",
        rateLimit: properties["Rate Limit"]?.rich_text?.[0]?.plain_text || null,
        formats: properties.Formats?.multi_select?.map(f => f.name) || [],
        isFree: properties["Is Free"]?.checkbox || false,
        tags: properties.Tags?.multi_select?.map(t => t.name) || [],
        createdAt: page.created_time,
        notionUrl: page.url,
      }
    })

    const allCategories = [...new Set(items.map((item) => item.category).filter(Boolean))]
    const allAuth = [...new Set(items.map((item) => item.auth).filter(Boolean))]

    return NextResponse.json({
      items,
      filters: {
        categories: allCategories.length > 0 ? allCategories : [
          "Government", "Academic", "Finance", "Health", "Weather", "Geographic", "Social", "Scientific"
        ],
        authMethods: allAuth.length > 0 ? allAuth : ["None", "API Key", "OAuth", "Token"],
      },
    })
  } catch (error) {
    console.error("Error fetching sources:", error)
    return NextResponse.json(
      { error: "Failed to fetch sources" },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  if (!DATABASE_ID) {
    return NextResponse.json(
      { error: "Sources database not configured" },
      { status: 500 }
    )
  }

  try {
    const body = await request.json()
    const { name, description, category, url, docsUrl, auth, rateLimit, formats, isFree, tags } = body

    if (!name) {
      return NextResponse.json(
        { error: "Name is required" },
        { status: 400 }
      )
    }

    const properties: Record<string, unknown> = {
      Name: { title: [{ text: { content: name } }] },
      "Is Free": { checkbox: isFree ?? true },
    }

    if (description) {
      properties.Description = { rich_text: [{ text: { content: description } }] }
    }
    if (category) {
      properties.Category = { select: { name: category } }
    }
    if (url) {
      properties.URL = { url }
    }
    if (docsUrl) {
      properties["Docs URL"] = { url: docsUrl }
    }
    if (auth) {
      properties.Auth = { select: { name: auth } }
    }
    if (rateLimit) {
      properties["Rate Limit"] = { rich_text: [{ text: { content: rateLimit } }] }
    }
    if (formats && formats.length > 0) {
      properties.Formats = { multi_select: formats.map((f: string) => ({ name: f })) }
    }
    if (tags && tags.length > 0) {
      properties.Tags = { multi_select: tags.map((t: string) => ({ name: t })) }
    }

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
      throw new Error(error.message || "Failed to create source")
    }

    const page = await response.json()
    return NextResponse.json({ success: true, id: page.id })
  } catch (error) {
    console.error("Error creating source:", error)
    return NextResponse.json(
      { error: "Failed to create source" },
      { status: 500 }
    )
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get("id")

    if (!id) {
      return NextResponse.json(
        { error: "ID is required" },
        { status: 400 }
      )
    }

    const response = await fetch(`https://api.notion.com/v1/pages/${id}`, {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${NOTION_TOKEN}`,
        "Notion-Version": "2022-06-28",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ archived: true }),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.message || "Failed to delete source")
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting source:", error)
    return NextResponse.json(
      { error: "Failed to delete source" },
      { status: 500 }
    )
  }
}
