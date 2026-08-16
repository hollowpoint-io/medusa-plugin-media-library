import {
  createWorkflow,
  WorkflowResponse,
} from "@medusajs/framework/workflows-sdk"
import {
  upsertMediaAssetsStep,
  type MediaAssetInput,
} from "./steps/upsert-media-assets"

type Input = { assets: MediaAssetInput[] }

/**
 * Register media assets into the library (idempotent by URL).
 */
export const upsertMediaAssetsWorkflow = createWorkflow(
  "upsert-media-assets",
  function (input: Input) {
    const result = upsertMediaAssetsStep({ assets: input.assets })
    return new WorkflowResponse(result)
  }
)

export default upsertMediaAssetsWorkflow
