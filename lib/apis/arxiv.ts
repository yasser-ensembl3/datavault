// arXiv API Client
// Base URL: http://export.arxiv.org/api/query
// Documentation: https://arxiv.org/help/api

export interface ArxivPaper {
  id: string
  title: string
  summary: string
  authors: string[]
  published: string
  updated: string
  link: string
  pdfLink: string
  categories: string[]
}

interface ArxivEntry {
  id: string[]
  title: string[]
  summary: string[]
  author: Array<{ name: string[] }>
  published: string[]
  updated: string[]
  link: Array<{ $: { href: string; title?: string; type?: string } }>
  category: Array<{ $: { term: string } }>
}

function parseXML(xmlText: string): ArxivEntry[] {
  // Simple XML parsing for arXiv response
  const entries: ArxivEntry[] = []

  // Match all <entry> blocks
  const entryRegex = /<entry>([\s\S]*?)<\/entry>/g
  let match

  while ((match = entryRegex.exec(xmlText)) !== null) {
    const entryXml = match[1]

    const getId = (xml: string): string => {
      const m = xml.match(/<id>([^<]+)<\/id>/)
      return m ? m[1] : ''
    }

    const getTitle = (xml: string): string => {
      const m = xml.match(/<title>([^<]+)<\/title>/)
      return m ? m[1].replace(/\s+/g, ' ').trim() : ''
    }

    const getSummary = (xml: string): string => {
      const m = xml.match(/<summary>([^<]+)<\/summary>/)
      return m ? m[1].replace(/\s+/g, ' ').trim() : ''
    }

    const getAuthors = (xml: string): Array<{ name: string[] }> => {
      const authors: Array<{ name: string[] }> = []
      const authorRegex = /<author>\s*<name>([^<]+)<\/name>\s*<\/author>/g
      let authorMatch
      while ((authorMatch = authorRegex.exec(xml)) !== null) {
        authors.push({ name: [authorMatch[1]] })
      }
      return authors
    }

    const getPublished = (xml: string): string => {
      const m = xml.match(/<published>([^<]+)<\/published>/)
      return m ? m[1] : ''
    }

    const getUpdated = (xml: string): string => {
      const m = xml.match(/<updated>([^<]+)<\/updated>/)
      return m ? m[1] : ''
    }

    const getLinks = (xml: string): Array<{ $: { href: string; title?: string; type?: string } }> => {
      const links: Array<{ $: { href: string; title?: string; type?: string } }> = []
      const linkRegex = /<link\s+([^>]+)\/>/g
      let linkMatch
      while ((linkMatch = linkRegex.exec(xml)) !== null) {
        const attrs = linkMatch[1]
        const hrefMatch = attrs.match(/href="([^"]+)"/)
        const titleMatch = attrs.match(/title="([^"]+)"/)
        const typeMatch = attrs.match(/type="([^"]+)"/)
        if (hrefMatch) {
          links.push({
            $: {
              href: hrefMatch[1],
              title: titleMatch?.[1],
              type: typeMatch?.[1],
            }
          })
        }
      }
      return links
    }

    const getCategories = (xml: string): Array<{ $: { term: string } }> => {
      const categories: Array<{ $: { term: string } }> = []
      const catRegex = /<category[^>]+term="([^"]+)"[^>]*\/>/g
      let catMatch
      while ((catMatch = catRegex.exec(xml)) !== null) {
        categories.push({ $: { term: catMatch[1] } })
      }
      return categories
    }

    entries.push({
      id: [getId(entryXml)],
      title: [getTitle(entryXml)],
      summary: [getSummary(entryXml)],
      author: getAuthors(entryXml),
      published: [getPublished(entryXml)],
      updated: [getUpdated(entryXml)],
      link: getLinks(entryXml),
      category: getCategories(entryXml),
    })
  }

  return entries
}

export async function searchArxiv(query: string, maxResults: number = 20): Promise<ArxivPaper[]> {
  const baseUrl = 'http://export.arxiv.org/api/query'
  const params = new URLSearchParams({
    search_query: `all:${query}`,
    start: '0',
    max_results: maxResults.toString(),
    sortBy: 'submittedDate',
    sortOrder: 'descending',
  })

  const response = await fetch(`${baseUrl}?${params}`, {
    cache: 'no-store',
  })

  if (!response.ok) {
    throw new Error(`arXiv API error: ${response.status}`)
  }

  const xmlText = await response.text()
  const entries = parseXML(xmlText)

  return entries.map((entry): ArxivPaper => {
    const abstractLink = entry.link.find(l => !l.$.title || l.$.title === 'alternate')
    const pdfLink = entry.link.find(l => l.$.title === 'pdf')

    return {
      id: entry.id[0]?.split('/abs/')[1] || entry.id[0] || '',
      title: entry.title[0] || '',
      summary: entry.summary[0] || '',
      authors: entry.author.map(a => a.name[0]),
      published: entry.published[0] || '',
      updated: entry.updated[0] || '',
      link: abstractLink?.$.href || entry.id[0] || '',
      pdfLink: pdfLink?.$.href || '',
      categories: entry.category.map(c => c.$.term),
    }
  })
}

export async function searchArxivByKeywords(keywords: string[], maxResults: number = 30): Promise<ArxivPaper[]> {
  if (keywords.length === 0) return []

  // Combine keywords with OR for broader results
  const query = keywords.join(' OR ')
  return searchArxiv(query, maxResults)
}
