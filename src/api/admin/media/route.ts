import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import { MEDIA_MODULE } from "../../../modules/media"
import type MediaModuleService from "../../../modules/media/service"
import { upsertMediaAssetsWorkflow } from "../../../workflows/upsert-media-assets"
import type { MediaAssetInput } from "../../../workflows/steps/upsert-media-assets"

/**
 * GET /admin/media — list the media library.
 * Optional filters: ?role=, ?source=, ?limit=, ?offset=.
 */
export async function GET(
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse
) {
  const service = req.scope.resolve<MediaModuleService>(MEDIA_MODULE)

  const { role, source, limit, offset } = req.query as Record<string, string>
  const filters: Record<string, unknown> = {}
  if (role) filters.role = role
  if (source) filters.source = source

  const take = limit ? parseInt(limit, 10) : 200
  const skip = offset ? parseInt(offset, 10) : 0

  const [media_assets, count] = await service.listAndCountMediaAssets(filters, {
    take,
    skip,
    order: { source: "ASC", role: "ASC", filename: "ASC" },
  })

  return res.json({ media_assets, count, limit: take, offset: skip })
}

type RegisterBody = { assets?: MediaAssetInput[] }

/**
 * POST /admin/media — register one or more assets (idempotent by URL).
 */
export async function POST(
  req: AuthenticatedMedusaRequest<RegisterBody>,
  res: MedusaResponse
) {
  const assets = req.body?.assets ?? []

  if (!Array.isArray(assets) || assets.length === 0) {
    return res.status(400).json({ error: "assets[] required" })
  }

  const { result } = await upsertMediaAssetsWorkflow(req.scope).run({
    input: { assets },
  })

  return res.json(result)
}
