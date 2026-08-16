import {
  AuthenticatedMedusaRequest,
  MedusaResponse,
} from "@medusajs/framework/http"
import { deleteMediaAssetsWorkflow } from "../../../../workflows/delete-media-asset"

/**
 * DELETE /admin/media/:id — removes the asset from the library only. The
 * stored file object is never deleted, so anywhere the URL is already used
 * keeps working.
 */
export async function DELETE(
  req: AuthenticatedMedusaRequest,
  res: MedusaResponse
) {
  const { id } = req.params
  await deleteMediaAssetsWorkflow(req.scope).run({ input: id })
  return res.json({ id, object: "media_asset", deleted: true })
}
