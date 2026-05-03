export const config = { runtime: 'nodejs' }

import { getDb, searchHistory, migrate } from '../netlify/functions/_db'
import { searchPubMed } from '../netlify/functions/_sources/pubmed'
import { searchEuropePMC } from '../netlify/functions/_sources/europepmc'
import { searchClinicalTrials } from '../netlify/functions/_sources/clinicaltrials'
import { searchSemanticScholar } from '../netlify/functions/_sources/semanticscholar'
import { searchCrossRef } from '../netlify/functions/_sources/crossref'
import { searchOpenAlex } from '../netlify/functions/_sources/openalex'
import { searchLens } from '../netlify/functions/_sources/lens'
import { searchScholar } from '../netlify/functions/_sources/scholar'
import type { SearchParams, Source, SourceResult, Paper } from '../src/types/index'

function deduplicateResults(results: SourceResult[]): SourceResult[] {
  const seen = new Map<string, Paper>()

  for (const sourceResult of results) {
    for (const paper of sourceResult.papers) {
      const titleKey = paper.title
        ? `title:${paper.title.toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 80)}`
        : `id:${paper.id}`
      const key = paper.doi
        ? `doi:${paper.doi.toLowerCase().trim()}`
        : titleKey

      if (seen.has(key)) {
        const existing = seen.get(key)!
        if (!existing.sources) existing.sources = [existing.source]
        if (!existing.sources.includes(paper.source)) {
          existing.sources.push(paper.source)
        }
        if (!existing.abstract && paper.abstract) {
          existing.abstract = paper.abstract
        }
        if (paper.citationCount && (!existing.citationCount || paper.citationCount > existing.citationCount)) {
          existing.citationCount = paper.citationCount
        }
      } else {
        seen.set(key, { ...paper, sources: [paper.source] })
      }
    }
  }

  return results.map(sr => ({
    ...sr,
    papers: sr.papers
      .map(p => {
        const titleKey = p.title
          ? `title:${p.title.toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 80)}`
          : `id:${p.id}`
        const key = p.doi ? `doi:${p.doi.toLowerCase().trim()}` : titleKey
        return seen.get(key)!
      })
      .filter(p => p && (p.source === p.sources?.[0] || !p.sources)),
  }))
}

const HANDLERS: Record<Source, (p: SearchParams) => Promise<any[]>> = {
  pubmed: searchPubMed,
  europepmc: searchEuropePMC,
  clinicaltrials: searchClinicalTrials,
  semanticscholar: searchSemanticScholar,
  crossref: searchCrossRef,
  openalex: searchOpenAlex,
  lens: searchLens,
  scholar: searchScholar,
}

export default async function handler(req: Request): Promise<Response> {
  if (req.method !== 'POST') {
    return new Response('Method Not Allowed', { status: 405 })
  }

  try {
    await migrate()
  } catch (e) {
    return new Response(JSON.stringify({ error: 'migrate failed', detail: String(e) }), {
      status: 500, headers: { 'Content-Type': 'application/json' },
    })
  }

  let params: SearchParams
  try {
    params = await req.json()
  } catch {
    return new Response('Invalid JSON body', { status: 400 })
  }

  if (!Array.isArray(params?.sources) || params.sources.length === 0) {
    return new Response('sources must be a non-empty array', { status: 400 })
  }

  const sources = params.sources.filter(s => s in HANDLERS)

  try {
    const settled = await Promise.allSettled(
      sources.map(source => HANDLERS[source](params).then(papers => ({ source, papers, error: undefined })))
    )

    const results: SourceResult[] = settled.map((r, i) =>
      r.status === 'fulfilled'
        ? r.value
        : { source: sources[i], papers: [], error: (r.reason as Error).message }
    )

    const deduped = deduplicateResults(results)
    const totalCount = deduped.reduce((n, r) => n + r.papers.length, 0)

    getDb().insert(searchHistory).values({
      params: params as any,
      resultCount: totalCount,
    }).catch(console.error)

    return new Response(JSON.stringify({ results: deduped, totalCount }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    })
  } catch (e) {
    return new Response(JSON.stringify({ error: 'Search failed', detail: String(e) }), {
      status: 500, headers: { 'Content-Type': 'application/json' },
    })
  }
}
