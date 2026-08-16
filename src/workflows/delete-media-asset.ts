import {
  createWorkflow,
  WorkflowResponse,
} from "@medusajs/framework/workflows-sdk"
import { deleteMediaAssetStep } from "./steps/delete-media-asset"

/** Delete a single media asset by id (rollback-safe, registry-only). */
export const deleteMediaAssetsWorkflow = createWorkflow(
  "delete-media-assets",
  function (id: string) {
    const result = deleteMediaAssetStep(id)
    return new WorkflowResponse(result)
  }
)

export default deleteMediaAssetsWorkflow
