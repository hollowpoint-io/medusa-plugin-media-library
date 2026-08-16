export type MediaAssetInput = {
  url: string
  filename: string
  mime_type?: string | null
  role?: string | null
  source?: "theme" | "content" | "upload"
  alt?: string | null
}

export type MediaAssetRow = MediaAssetInput & { id: string }

export type MediaWriter = {
  listMediaAssets: (filters: { url: string[] }) => Promise<MediaAssetRow[]>
  createMediaAssets: (rows: MediaAssetInput[]) => Promise<MediaAssetRow[]>
  updateMediaAssets: (rows: Array<MediaAssetInput & { id: string }>) => Promise<unknown>
  deleteMediaAssets: (ids: string[]) => Promise<unknown>
}

export async function performUpsertMediaAssets(
  service: MediaWriter,
  assets: MediaAssetInput[]
): Promise<{ created: number; updated: number; createdIds: string[] }> {
  const urls = assets.map((a) => a.url)
  const existing = urls.length ? await service.listMediaAssets({ url: urls }) : []
  const byUrl = new Map(existing.map((e) => [e.url, e]))

  const toCreate = assets.filter((a) => !byUrl.has(a.url))
  const toUpdate = assets.filter((a) => byUrl.has(a.url))

  const created = toCreate.length ? await service.createMediaAssets(toCreate) : []
  if (toUpdate.length) {
    await service.updateMediaAssets(
      toUpdate.map((a) => ({ id: byUrl.get(a.url)!.id, ...a }))
    )
  }

  return {
    created: toCreate.length,
    updated: toUpdate.length,
    createdIds: created.map((c) => c.id),
  }
}
