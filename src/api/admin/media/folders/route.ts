import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import { MEDIA_MODULE } from "../../../../modules/media"
import type MediaModuleService from "../../../../modules/media/service"

/**
 * GET /admin/media/folders — list distinct media folders and asset counts.
 */
export async function GET(
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse
) {
  const service = req.scope.resolve<MediaModuleService>(MEDIA_MODULE)
  const assets = await service.listMediaAssets(
    { folder: { $ne: null } },
    { select: ["id", "folder"], take: 5000 }
  )

  const counts = new Map<string, number>()
  for (const asset of assets as Array<{ folder?: string | null }>) {
    if (asset.folder) {
      counts.set(asset.folder, (counts.get(asset.folder) ?? 0) + 1)
    }
  }

  const folders = Array.from(counts.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([name, count]) => ({ name, count }))

  return res.json({ folders })
}
