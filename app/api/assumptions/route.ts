import { NextResponse } from "next/server"

const NOTION_TOKEN = process.env.NOTION_TOKEN
const DATABASE_ID = process.env.NOTION_ASSUMPTIONS_DATABASE_ID

interface NotionPage {
  id: string
  url: string
  created_time: string
  properties: {
    Name?: { title?: Array<{ plain_text?: string }> }
    Description?: { rich_text?: Array<{ plain_text?: string }> }
    Status?: { select?: { name?: string } }
    Confidence?: { select?: { name?: string } }
    Evidence?: { rich_text?: Array<{ plain_text?: string }> }
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
        sorts: [{ timestamp: "created_time", direction: "descending" }],
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
  const status = searchParams.get("status")
  const confidence = searchParams.get("confidence")

  if (!DATABASE_ID) {
    return NextResponse.json(
      { error: "Assumptions database not configured" },
      { status: 500 }
    )
  }

  try {
    const filters: object[] = []

    if (status && status !== "all") {
      filters.push({ property: "Status", select: { equals: status } })
    }

    if (confidence && confidence !== "all") {
      filters.push({ property: "Confidence", select: { equals: confidence } })
    }

    const response = await queryNotionDatabase(filters)

    const items = (response.results as NotionPage[]).map((page) => {
      const properties = page.properties

      return {
        id: page.id,
        title: properties.Name?.title?.[0]?.plain_text || "Untitled",
        description: properties.Description?.rich_text?.[0]?.plain_text || null,
        status: properties.Status?.select?.name || "Pending",
        confidence: properties.Confidence?.select?.name || "Medium",
        evidence: properties.Evidence?.rich_text?.[0]?.plain_text || null,
        createdAt: page.created_time,
        notionUrl: page.url,
      }
    })

    const allStatuses = [...new Set(items.map((item) => item.status).filter(Boolean))]
    const allConfidences = [...new Set(items.map((item) => item.confidence).filter(Boolean))]

    return NextResponse.json({
      items,
      filters: {
        statuses: allStatuses.length > 0 ? allStatuses : ["Pending", "Testing", "Validated", "Invalidated"],
        confidences: allConfidences.length > 0 ? allConfidences : ["Low", "Medium", "High"],
      },
    })
  } catch (error) {
    console.error("Error fetching assumptions:", error)
    return NextResponse.json(
      { error: "Failed to fetch assumptions" },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  if (!DATABASE_ID) {
    return NextResponse.json(
      { error: "Assumptions database not configured" },
      { status: 500 }
    )
  }

  try {
    const body = await request.json()
    const { title, description, status, confidence, evidence } = body

    if (!title) {
      return NextResponse.json(
        { error: "Title is required" },
        { status: 400 }
      )
    }

    const properties: Record<string, unknown> = {
      Name: { title: [{ text: { content: title } }] },
      Status: { select: { name: status || "Pending" } },
      Confidence: { select: { name: confidence || "Medium" } },
    }

    if (description) {
      properties.Description = { rich_text: [{ text: { content: description } }] }
    }
    if (evidence) {
      properties.Evidence = { rich_text: [{ text: { content: evidence } }] }
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
      throw new Error(error.message || "Failed to create assumption")
    }

    const page = await response.json()
    return NextResponse.json({ success: true, id: page.id })
  } catch (error) {
    console.error("Error creating assumption:", error)
    return NextResponse.json(
      { error: "Failed to create assumption" },
      { status: 500 }
    )
  }
}

export async function PATCH(request: Request) {
  try {
    const body = await request.json()
    const { id, title, description, status, confidence, evidence } = body

    if (!id) {
      return NextResponse.json(
        { error: "ID is required" },
        { status: 400 }
      )
    }

    const properties: Record<string, unknown> = {}

    if (title) {
      properties.Name = { title: [{ text: { content: title } }] }
    }
    if (status) {
      properties.Status = { select: { name: status } }
    }
    if (confidence) {
      properties.Confidence = { select: { name: confidence } }
    }
    if (description !== undefined) {
      properties.Description = { rich_text: [{ text: { content: description } }] }
    }
    if (evidence !== undefined) {
      properties.Evidence = { rich_text: [{ text: { content: evidence } }] }
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
      throw new Error(error.message || "Failed to update assumption")
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error updating assumption:", error)
    return NextResponse.json(
      { error: "Failed to update assumption" },
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
      throw new Error(error.message || "Failed to delete assumption")
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting assumption:", error)
    return NextResponse.json(
      { error: "Failed to delete assumption" },
      { status: 500 }
    )
  }
}
