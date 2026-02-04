import { NextResponse } from "next/server"

const NOTION_TOKEN = process.env.NOTION_TOKEN

// Map of topic names to their Notion database IDs
const TOPIC_DATABASES: Record<string, string> = {
  "Machine Learning": "2d958fe731b180d5a744d354f84db9fb",
}

interface NotionPage {
  id: string
  url: string
  created_time: string
  properties: Record<string, unknown>
}

function getTextFromProperty(prop: unknown): string {
  if (!prop || typeof prop !== 'object') return ""

  const p = prop as Record<string, unknown>

  // Title property
  if (p.title && Array.isArray(p.title)) {
    return (p.title as Array<{ plain_text?: string }>)[0]?.plain_text || ""
  }

  // Rich text property
  if (p.rich_text && Array.isArray(p.rich_text)) {
    return (p.rich_text as Array<{ plain_text?: string }>)[0]?.plain_text || ""
  }

  // URL property
  if (typeof p.url === 'string') {
    return p.url
  }

  return ""
}

function getTitleFromPage(properties: Record<string, unknown>): string {
  for (const key of Object.keys(properties)) {
    const prop = properties[key] as Record<string, unknown>
    if (prop && prop.title && Array.isArray(prop.title)) {
      return (prop.title as Array<{ plain_text?: string }>)[0]?.plain_text || ""
    }
  }
  return ""
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const topic = searchParams.get("topic")

  if (!topic) {
    return NextResponse.json({ error: "Topic is required" }, { status: 400 })
  }

  const databaseId = TOPIC_DATABASES[topic]
  if (!databaseId) {
    return NextResponse.json({ error: "Unknown topic" }, { status: 404 })
  }

  try {
    const response = await fetch(
      `https://api.notion.com/v1/databases/${databaseId}/query`,
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

    const data = await response.json()

    const papers = (data.results as NotionPage[]).map((page) => {
      const props = page.properties

      return {
        id: page.id,
        title: getTitleFromPage(props),
        description: getTextFromProperty(props.Description) || getTextFromProperty(props.Content),
        authors: getTextFromProperty(props.Authors),
        pdfLink: getTextFromProperty(props["pdf Link"]) || getTextFromProperty(props.pdfLink),
        subject: getTextFromProperty(props.Subject),
        notionUrl: page.url,
        createdAt: page.created_time,
      }
    }).filter(p => p.title)

    return NextResponse.json({ papers })
  } catch (error) {
    console.error("Error fetching papers:", error)
    return NextResponse.json(
      { error: "Failed to fetch papers" },
      { status: 500 }
    )
  }
}
