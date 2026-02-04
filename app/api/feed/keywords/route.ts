import { NextResponse } from "next/server"

const NOTION_TOKEN = process.env.NOTION_TOKEN
const DATABASE_ID = process.env.NOTION_KEYWORDS_DATABASE_ID

interface NotionPage {
  id: string
  properties: Record<string, unknown>
}

async function queryNotionDatabase() {
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

function getTitleFromPage(properties: Record<string, unknown>): string {
  for (const key of Object.keys(properties)) {
    const prop = properties[key] as Record<string, unknown>
    if (prop && prop.title && Array.isArray(prop.title)) {
      const titleArr = prop.title as Array<{ plain_text?: string }>
      return titleArr[0]?.plain_text || ""
    }
  }
  return ""
}

function getCheckboxValue(properties: Record<string, unknown>, ...names: string[]): boolean {
  for (const name of names) {
    const prop = properties[name] as Record<string, unknown> | undefined
    if (prop && typeof prop.checkbox === 'boolean') {
      return prop.checkbox
    }
  }
  return true // default to active
}

export async function GET() {
  // For now, return hardcoded topics with their database IDs
  const topics = [
    {
      id: "machine-learning",
      name: "Machine Learning",
      databaseId: "2d958fe731b180d5a744d354f84db9fb",
      active: true,
    }
  ]

  return NextResponse.json({ keywords: topics })
}

export async function POST(request: Request) {
  if (!DATABASE_ID) {
    return NextResponse.json(
      { error: "Keywords database not configured" },
      { status: 500 }
    )
  }

  try {
    const body = await request.json()
    const { name } = body

    if (!name) {
      return NextResponse.json(
        { error: "Topic name is required" },
        { status: 400 }
      )
    }

    // Use Title property (the title field of the database)
    const properties: Record<string, unknown> = {
      Title: { title: [{ text: { content: name } }] },
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
      throw new Error(error.message || "Failed to create topic")
    }

    const page = await response.json()
    return NextResponse.json({ success: true, id: page.id })
  } catch (error) {
    console.error("Error creating topic:", error)
    return NextResponse.json(
      { error: "Failed to create topic" },
      { status: 500 }
    )
  }
}

export async function PATCH(request: Request) {
  try {
    const body = await request.json()
    const { id, active } = body

    if (!id) {
      return NextResponse.json(
        { error: "ID is required" },
        { status: 400 }
      )
    }

    const properties: Record<string, unknown> = {}

    if (typeof active === "boolean") {
      properties.Active = { checkbox: active }
    }

    const response = await fetch(`https://api.notion.com/v1/pages/${id}`, {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${NOTION_TOKEN}`,
        "Notion-Version": "2022-06-28",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ properties }),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.message || "Failed to update keyword")
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error updating keyword:", error)
    return NextResponse.json(
      { error: "Failed to update keyword" },
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
      throw new Error(error.message || "Failed to delete keyword")
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting keyword:", error)
    return NextResponse.json(
      { error: "Failed to delete keyword" },
      { status: 500 }
    )
  }
}
