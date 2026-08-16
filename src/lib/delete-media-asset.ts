export type MediaAssetRecord = {
  id: string
  url: string
  filename: string
  mime_type?: string | null
  role?: string | null
  source?: "theme" | "content" | "upload"
  alt?: string | null
}

export type MediaDeleter = {
  retrieveMediaAsset: (id: string) => Promise<MediaAssetRecord>
  deleteMediaAssets: (id: string) => Promise<unknown>
  createMediaAssets: (row: MediaAssetRecord) => Promise<unknown>
}

/**
 * Registry-only delete: removes the library row and never touches the
 * underlying file object, so anywhere the URL is already used keeps working.
 * Compensation recreates the exact row.
 */
export async function performDeleteMediaAsset(
  service: MediaDeleter,
  id: string
): Promise<{ id: string; previous: MediaAssetRecord }> {
  const previous = await service.retrieveMediaAsset(id)
  await service.deleteMediaAssets(id)
  return { id, previous }
}

export async function restoreMediaAsset(
  service: MediaDeleter,
  previous: MediaAssetRecord
): Promise<void> {
  await service.createMediaAssets(previous)
}
