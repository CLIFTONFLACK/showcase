// src/lib/modelSync.ts
import { IMAGE_MODELS, TEXT_MODELS } from './ai'
import type { ImageModel, TextModel } from './ai'

const STORAGE_KEY = 'sre_model_sync'

export type ModelStatus = 'ok' | 'missing'

export type SyncReport = {
  checkedAt: number
  imageModels: { key: ImageModel; label: string; orId: string; status: ModelStatus }[]
  textModels:  { key: TextModel;  label: string; orId: string; status: ModelStatus }[]
  newImageCandidates: string[]  // OR model IDs not in our list that look like image generators
}

type StoredSync = {
  checkedAt: number
  disabledImage: ImageModel[]
  disabledText: TextModel[]
}

function load(): StoredSync | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : null
  } catch { return null }
}

function save(s: StoredSync) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(s))
}

export function getDisabledImageModels(): ImageModel[] {
  return load()?.disabledImage ?? []
}

export function getDisabledTextModels(): TextModel[] {
  return load()?.disabledText ?? []
}

export function getLastChecked(): number | null {
  return load()?.checkedAt ?? null
}

/** Returns only IMAGE_MODELS entries that aren't disabled */
export function getActiveImageModels(): typeof IMAGE_MODELS {
  const disabled = getDisabledImageModels()
  return Object.fromEntries(
    Object.entries(IMAGE_MODELS).filter(([k]) => !disabled.includes(k as ImageModel))
  ) as typeof IMAGE_MODELS
}

/** Returns only OR TextModel keys that aren't disabled */
export function getActiveORTextModels(): TextModel[] {
  const disabled = getDisabledTextModels()
  const orKeys = (Object.keys(TEXT_MODELS) as TextModel[]).filter(
    k => TEXT_MODELS[k].provider === 'openrouter' && !disabled.includes(k)
  )
  // Always keep at least one fallback even if all are disabled
  if (orKeys.length > 0) return orKeys
  const fallback = (Object.keys(TEXT_MODELS) as TextModel[]).find(k => TEXT_MODELS[k].provider === 'openrouter')
  if (!fallback) throw new Error('No OpenRouter text models configured in TEXT_MODELS')
  return [fallback]
}

export async function runSync(): Promise<SyncReport> {
  const res = await fetch('https://openrouter.ai/api/v1/models')
  if (!res.ok) throw new Error(`OpenRouter catalog fetch failed: ${res.status}`)
  const data = await res.json() as { data: { id: string; description?: string }[] }
  const liveIds = new Set(data.data.map(m => m.id))

  // Check image models
  const imageModels = (Object.keys(IMAGE_MODELS) as ImageModel[]).map(key => {
    const info = IMAGE_MODELS[key]
    return { key, label: info.label, orId: info.id, status: liveIds.has(info.id) ? 'ok' as const : 'missing' as const }
  })

  // Check OR text models only
  const textModels = (Object.keys(TEXT_MODELS) as TextModel[])
    .filter(k => TEXT_MODELS[k].provider === 'openrouter' && !!TEXT_MODELS[k].orId)
    .map(key => {
      const info = TEXT_MODELS[key]
      const orId = info.orId!
      return { key, label: info.label, orId, status: liveIds.has(orId) ? 'ok' as const : 'missing' as const }
    })

  // Find new image-generation candidates in OR catalog not in our list
  const knownImageIds = new Set(Object.values(IMAGE_MODELS).map(m => m.id))
  const newImageCandidates = data.data
    .filter(m => !knownImageIds.has(m.id) && /image/i.test(m.id + (m.description ?? '')))
    .map(m => m.id)
    .slice(0, 10)

  // Persist disable list
  const disabledImage = imageModels.filter(m => m.status === 'missing').map(m => m.key)
  const disabledText  = textModels.filter(m => m.status === 'missing').map(m => m.key)
  save({ checkedAt: Date.now(), disabledImage, disabledText })

  return { checkedAt: Date.now(), imageModels, textModels, newImageCandidates }
}
