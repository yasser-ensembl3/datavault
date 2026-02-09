"use client"

import { useState, useEffect, useCallback } from "react"
import { Loader2, ExternalLink, Download, Calendar, Bookmark, BookMarked, Plus, X, Trash2, Pencil, Inbox } from "lucide-react"
import { Button } from "@/components/ui/button"
import { AreaBadge } from "@/components/areas/area-badge"

interface ArxivResult {
  id: string
  title: string
  summary: string
  authors: string[]
  published: string
  pdfLink: string
  link: string
}

interface DataSource {
  id: string
  name: string
  description: string
  url: string
  type: "Data" | "API"
  category: string
  auth: string
  active: boolean
}

const defaultSources: DataSource[] = [
  { id: "1", name: "PubMed / NCBI", description: "36M+ biomedical citations, abstracts, and life science databases", url: "https://www.ncbi.nlm.nih.gov/home/develop/api/", type: "API", category: "Health", auth: "API Key", active: true },
  { id: "2", name: "Semantic Scholar", description: "AI-powered search with 200M+ papers, citation graphs, and SPECTER embeddings", url: "https://api.semanticscholar.org/api-docs/", type: "API", category: "Academic", auth: "API Key", active: true },
  { id: "3", name: "OpenAlex", description: "Fully open index of 240M+ scholarly works, authors, and institutions (CC0)", url: "https://docs.openalex.org/", type: "API", category: "Academic", auth: "None", active: true },
  { id: "4", name: "CrossRef", description: "Metadata for 150M+ scholarly works via DOI — articles, books, datasets", url: "https://www.crossref.org/documentation/retrieve-metadata/rest-api/", type: "API", category: "Academic", auth: "None", active: true },
  { id: "5", name: "CORE", description: "World's largest collection of open access research papers from 10K+ providers", url: "https://core.ac.uk/services/api", type: "API", category: "Academic", auth: "API Key", active: true },
  { id: "6", name: "Europe PMC", description: "33M+ life science publications with full-text search and cross-references", url: "https://europepmc.org/RestfulWebService", type: "API", category: "Health", auth: "None", active: true },
  { id: "7", name: "Unpaywall", description: "Finds free PDF links for 20M+ scholarly articles given a DOI", url: "https://unpaywall.org/products/api", type: "API", category: "Academic", auth: "None", active: true },
  { id: "8", name: "ClinicalTrials.gov", description: "NIH/NLM registry — search trials by condition, intervention, status", url: "https://clinicaltrials.gov/data-api/api", type: "API", category: "Health", auth: "None", active: true },
  { id: "9", name: "WHO Global Health Observatory", description: "2,300+ health indicators for 245 countries from the WHO", url: "https://www.who.int/data/gho/info/gho-odata-api", type: "API", category: "Health", auth: "None", active: false },
  { id: "10", name: "openFDA", description: "FDA data on drugs, devices, adverse events, recalls", url: "https://open.fda.gov", type: "API", category: "Health", auth: "API Key", active: false },
  { id: "11", name: "HuggingFace", description: "400K+ ML models, 100K+ datasets, free inference API", url: "https://huggingface.co/docs", type: "API", category: "Machine Learning", auth: "API Key", active: true },
  { id: "12", name: "Papers With Code", description: "ML papers linked with code, datasets, and benchmarks", url: "https://paperswithcode.com/api/v1/docs/", type: "API", category: "Machine Learning", auth: "None", active: true },
  { id: "13", name: "Kaggle", description: "200K+ public datasets and notebooks for ML research", url: "https://www.kaggle.com/docs/api", type: "Data", category: "Data", auth: "API Key", active: true },
  { id: "14", name: "Open Science Framework", description: "Repository for study designs, materials, data, and preprints", url: "https://developer.osf.io", type: "API", category: "Science", auth: "None", active: false },
  { id: "15", name: "SHARE", description: "Aggregated metadata from repositories, journals, and funders", url: "https://share.osf.io/api/v2/", type: "API", category: "Academic", auth: "None", active: false },
  { id: "16", name: "Wolfram Alpha", description: "Computational knowledge engine for math, science, health, statistics", url: "https://products.wolframalpha.com/api/", type: "API", category: "Science", auth: "API Key", active: false },
  { id: "17", name: "NLP Cloud", description: "NER, sentiment, summarization, classification via spaCy & transformers", url: "https://nlpcloud.io", type: "API", category: "Machine Learning", auth: "API Key", active: false },
  { id: "18", name: "Wikidata", description: "100M+ structured entities — diseases, genes, researchers, institutions", url: "https://www.wikidata.org/w/api.php?action=help", type: "Data", category: "Data", auth: "None", active: false },
  { id: "19", name: "Wikipedia", description: "Programmatic access to encyclopedia content, definitions, summaries", url: "https://www.mediawiki.org/wiki/API:Main_page", type: "Data", category: "Data", auth: "None", active: false },
  { id: "20", name: "Infermedica", description: "NLP symptom checker — useful for ADHD/autism symptom research", url: "https://developer.infermedica.com/docs/", type: "API", category: "Health", auth: "API Key", active: false },
  { id: "21", name: "NASA ADS", description: "Digital library for physics, astrophysics, and geophysics research", url: "https://ui.adsabs.harvard.edu/help/api/api-docs.html", type: "API", category: "Science", auth: "API Key", active: false },
  { id: "22", name: "Nobel Prize", description: "Open data about laureates, works, and research impact history", url: "https://www.nobelprize.org/about/developer-zone-2/", type: "Data", category: "Science", auth: "None", active: false },
  { id: "23", name: "Lexigram", description: "Medical NLP — extracts clinical concepts and maps to standard terminology", url: "https://docs.lexigram.io/", type: "API", category: "Health", auth: "API Key", active: false },
]

const defaultTags = ["ADHD", "Autism", "Psychology", "Neuroscience", "Machine Learning"]

export default function ApisDatasetPage() {
  // Tags & search state
  const [tags, setTags] = useState(defaultTags)
  const [selectedTag, setSelectedTag] = useState("ADHD")
  const [results, setResults] = useState<ArxivResult[]>([])
  const [searching, setSearching] = useState(false)
  const [selectedPaper, setSelectedPaper] = useState<ArxivResult | null>(null)
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set())
  const [savingId, setSavingId] = useState<string | null>(null)
  const [newTag, setNewTag] = useState("")

  // Data sources state
  const [sources, setSources] = useState<DataSource[]>(defaultSources)
  const [showAddForm, setShowAddForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState({ name: "", type: "API" as "Data" | "API" })

  // Auto-fetch on tag select
  const fetchPapers = useCallback(async (tag: string) => {
    setSearching(true)
    try {
      const res = await fetch(`/api/areas/search?q=${encodeURIComponent(tag)}&limit=3`)
      if (res.ok) {
        const data = await res.json()
        setResults(data.papers || [])
      }
    } catch {
      setResults([])
    } finally {
      setSearching(false)
    }
  }, [])

  // Fetch on mount with default tag
  useEffect(() => {
    fetchPapers(selectedTag)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const handleSelectTag = (tag: string) => {
    setSelectedTag(tag)
    fetchPapers(tag)
  }

  const handleAddTag = (e: React.FormEvent) => {
    e.preventDefault()
    const trimmed = newTag.trim()
    if (!trimmed || tags.includes(trimmed)) return
    setTags(prev => [...prev, trimmed])
    setNewTag("")
    setSelectedTag(trimmed)
    fetchPapers(trimmed)
  }

  const handleRemoveTag = (tag: string) => {
    setTags(prev => prev.filter(t => t !== tag))
    if (selectedTag === tag) {
      const remaining = tags.filter(t => t !== tag)
      if (remaining.length > 0) {
        setSelectedTag(remaining[0])
        fetchPapers(remaining[0])
      } else {
        setSelectedTag("")
        setResults([])
      }
    }
  }

  // Save paper to Notion
  const toggleSave = async (paper: ArxivResult) => {
    const title = paper.title
    if (savedIds.has(title)) {
      setSavedIds(prev => { const next = new Set(prev); next.delete(title); return next })
      await fetch(`/api/saved?title=${encodeURIComponent(title)}`, { method: "DELETE" })
    } else {
      setSavingId(paper.id)
      setSavedIds(prev => new Set(prev).add(title))
      await fetch("/api/saved", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: paper.title,
          description: paper.summary,
          authors: paper.authors?.join(", ") || "",
          pdfLink: paper.pdfLink,
          date: paper.published,
        }),
      })
      setSavingId(null)
    }
  }

  // Data sources CRUD
  const handleAddSource = (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.name.trim()) return

    if (editingId) {
      setSources(prev => prev.map(s =>
        s.id === editingId ? { ...s, name: form.name, type: form.type } : s
      ))
      setEditingId(null)
    } else {
      setSources(prev => [...prev, { id: Date.now().toString(), name: form.name, description: "", url: "", type: form.type, category: "Other", auth: "None", active: true }])
    }

    setForm({ name: "", type: "API" })
    setShowAddForm(false)
  }

  const toggleActive = (id: string) => {
    setSources(prev => prev.map(s => s.id === id ? { ...s, active: !s.active } : s))
  }

  const startEdit = (source: DataSource) => {
    setForm({ name: source.name, type: source.type })
    setEditingId(source.id)
    setShowAddForm(true)
  }

  const deleteSource = (id: string) => {
    setSources(prev => prev.filter(s => s.id !== id))
    if (editingId === id) {
      setEditingId(null)
      setForm({ name: "", type: "API" })
      setShowAddForm(false)
    }
  }

  const cancelForm = () => {
    setShowAddForm(false)
    setEditingId(null)
    setForm({ name: "", type: "API" })
  }

  return (
    <div className="p-4 md:p-6 space-y-10">
      {/* Section 1 — Arxiv by Tag */}
      <section>
        <header className="mb-5">
          <h1 className="text-lg font-semibold text-zinc-100">APIs / Dataset</h1>
          <p className="text-xs text-zinc-500">Top 3 papers by relevance per topic</p>
        </header>

        {/* Tags */}
        <div className="flex flex-wrap items-center gap-2 mb-5">
          {tags.map((tag) => (
            <AreaBadge
              key={tag}
              name={tag}
              isActive={selectedTag === tag}
              onClick={() => handleSelectTag(tag)}
            />
          ))}
          <form onSubmit={handleAddTag} className="flex items-center gap-1">
            <input
              value={newTag}
              onChange={e => setNewTag(e.target.value)}
              placeholder="Add tag..."
              className="w-24 px-2 py-1 bg-transparent border-b border-zinc-700 text-xs text-zinc-300 placeholder:text-zinc-600 focus:outline-none focus:border-zinc-500"
            />
            <button
              type="submit"
              disabled={!newTag.trim()}
              className="p-0.5 text-zinc-500 hover:text-zinc-300 disabled:opacity-50"
            >
              <Plus className="h-3.5 w-3.5" />
            </button>
          </form>
        </div>

        {/* Results */}
        {searching ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-5 w-5 animate-spin text-zinc-500" />
          </div>
        ) : results.length > 0 ? (
          <div className="space-y-2">
            <p className="text-xs text-zinc-500 mb-2">Top {results.length} results for &ldquo;{selectedTag}&rdquo;</p>
            {results.map((paper) => (
              <button
                key={paper.id}
                onClick={() => setSelectedPaper(paper)}
                className="w-full text-left bg-zinc-900 border border-zinc-800 rounded-lg p-4 hover:border-zinc-600 transition-colors cursor-pointer"
              >
                <h3 className="text-sm font-medium text-zinc-100 mb-1.5 leading-snug">
                  {paper.title}
                </h3>
                <p className="text-xs text-zinc-500 mb-1.5 truncate">
                  {paper.authors?.join(", ")}
                </p>
                {paper.published && (
                  <span className="flex items-center gap-1 text-[11px] text-zinc-600">
                    <Calendar className="h-3 w-3" />
                    {new Date(paper.published).toLocaleDateString()}
                  </span>
                )}
              </button>
            ))}
          </div>
        ) : selectedTag ? (
          <p className="text-sm text-zinc-500 text-center py-8">No results found for &ldquo;{selectedTag}&rdquo;</p>
        ) : null}
      </section>

      {/* Separator */}
      <hr className="border-zinc-800" />

      {/* Section 2 — All Data Sources */}
      <section>
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-base font-medium text-zinc-200">All Data Sources</h2>
          {!showAddForm && (
            <Button
              onClick={() => setShowAddForm(true)}
              variant="outline"
              size="sm"
              className="text-xs h-7 gap-1.5 border-zinc-700 text-zinc-400 hover:text-zinc-200"
            >
              <Plus className="h-3.5 w-3.5" />
              Add
            </Button>
          )}
        </div>

        {/* Add / Edit Form */}
        {showAddForm && (
          <form onSubmit={handleAddSource} className="mb-5 bg-zinc-900 border border-zinc-700 rounded-lg p-4 space-y-3">
            <div className="flex items-center justify-between mb-1">
              <h3 className="text-sm font-medium text-zinc-300">
                {editingId ? "Edit Source" : "New Source"}
              </h3>
              <button type="button" onClick={cancelForm} className="text-zinc-500 hover:text-zinc-300">
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <input
                value={form.name}
                onChange={e => setForm({ ...form, name: e.target.value })}
                placeholder="Source name..."
                className="px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-md text-sm text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:border-zinc-500"
                autoFocus
              />
              <select
                value={form.type}
                onChange={e => setForm({ ...form, type: e.target.value as "Data" | "API" })}
                className="px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-md text-sm text-zinc-300 focus:outline-none focus:border-zinc-500"
              >
                <option value="API" className="bg-zinc-900">API</option>
                <option value="Data" className="bg-zinc-900">Data</option>
              </select>
            </div>

            <div className="flex gap-2 pt-1">
              <Button type="button" variant="ghost" onClick={cancelForm} className="flex-1 text-zinc-400 text-sm">
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={!form.name.trim()}
                className="flex-1 bg-zinc-700 hover:bg-zinc-600 text-sm"
              >
                {editingId ? "Update" : "Add"}
              </Button>
            </div>
          </form>
        )}

        {/* Table */}
        {sources.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <Inbox className="h-8 w-8 text-zinc-600 mb-3" />
            <p className="text-zinc-400 text-sm mb-1">No data sources yet</p>
            <p className="text-zinc-500 text-xs">Add your first data source to start tracking</p>
          </div>
        ) : (
          <div className="space-y-2">
            {sources.map((source) => (
              <div
                key={source.id}
                className={`bg-zinc-900 border rounded-lg p-4 transition-colors ${
                  source.active ? "border-zinc-700" : "border-zinc-800 opacity-50"
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <a
                        href={source.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm font-medium text-zinc-100 hover:text-white transition-colors"
                      >
                        {source.name}
                      </a>
                      <span className="text-[10px] px-1.5 py-0.5 rounded border border-zinc-700 text-zinc-500">
                        {source.type}
                      </span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded border border-zinc-800 text-zinc-600">
                        {source.category}
                      </span>
                      {source.auth !== "None" && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded border border-zinc-800 text-zinc-600">
                          {source.auth}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-zinc-500 leading-relaxed">{source.description}</p>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <button
                      onClick={() => toggleActive(source.id)}
                      className={`w-4.5 h-4.5 rounded border transition-colors ${
                        source.active
                          ? "bg-zinc-100 border-zinc-100"
                          : "bg-transparent border-zinc-600 hover:border-zinc-400"
                      }`}
                      title={source.active ? "Active" : "Inactive"}
                    >
                      {source.active && (
                        <svg className="w-4 h-4 text-zinc-900" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </button>
                    <button
                      onClick={() => deleteSource(source.id)}
                      className="p-1 text-zinc-600 hover:text-red-400 transition-colors"
                      title="Delete"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Paper Modal */}
      {selectedPaper && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm"
          onClick={() => setSelectedPaper(null)}
        >
          <div
            className="bg-zinc-900 border border-zinc-700 rounded-xl w-full max-w-lg mx-4 max-h-[80vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between p-5 border-b border-zinc-800">
              <h2 className="text-base font-semibold text-zinc-100 leading-snug pr-4">
                {selectedPaper.title}
              </h2>
              <button
                onClick={() => setSelectedPaper(null)}
                className="text-zinc-500 hover:text-zinc-300 flex-shrink-0 mt-0.5"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-5 space-y-4">
              {selectedPaper.authors && selectedPaper.authors.length > 0 && (
                <div>
                  <p className="text-xs text-zinc-500 mb-1">Authors</p>
                  <p className="text-sm text-zinc-300">{selectedPaper.authors.join(", ")}</p>
                </div>
              )}
              {selectedPaper.published && (
                <div>
                  <p className="text-xs text-zinc-500 mb-1">Published</p>
                  <p className="text-sm text-zinc-300">{new Date(selectedPaper.published).toLocaleDateString()}</p>
                </div>
              )}
              {selectedPaper.summary && (
                <div>
                  <p className="text-xs text-zinc-500 mb-1">Abstract</p>
                  <p className="text-sm text-zinc-400 leading-relaxed">{selectedPaper.summary}</p>
                </div>
              )}
            </div>

            <div className="p-5 border-t border-zinc-800 flex gap-3">
              <button
                onClick={() => toggleSave(selectedPaper)}
                disabled={savingId === selectedPaper.id}
                className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 border rounded-lg text-sm transition-colors ${
                  savedIds.has(selectedPaper.title)
                    ? "bg-zinc-100 text-zinc-900 border-zinc-100 font-medium"
                    : "bg-zinc-800 hover:bg-zinc-700 border-zinc-700 text-zinc-200"
                }`}
              >
                {savedIds.has(selectedPaper.title) ? (
                  <><BookMarked className="h-4 w-4" /> Saved</>
                ) : (
                  <><Bookmark className="h-4 w-4" /> Save</>
                )}
              </button>
              {selectedPaper.pdfLink && (
                <>
                  <a
                    href={selectedPaper.pdfLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 rounded-lg text-sm text-zinc-200 transition-colors"
                  >
                    <ExternalLink className="h-4 w-4" />
                    See PDF
                  </a>
                  <a
                    href={`/api/areas/download?url=${encodeURIComponent(selectedPaper.pdfLink)}&title=${encodeURIComponent(selectedPaper.title)}`}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 rounded-lg text-sm text-zinc-200 transition-colors"
                  >
                    <Download className="h-4 w-4" />
                    Download
                  </a>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
