import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk"
import {
  performDeleteMediaAsset,
  restoreMediaAsset,
} from "../../lib/delete-media-asset"
import { MEDIA_MODULE } from "../../modules/media"
import type MediaModuleService from "../../modules/media/service"

/**
 * Registry-only delete: removes the MediaAsset row but never touches the
 * underlying file object. Compensation recreates the exact row.
 */
export const deleteMediaAssetStep = createStep(
  "delete-media-asset",
  async (id: string, { container }) => {
    const service = container.resolve<MediaModuleService>(MEDIA_MODULE)
    const { previous } = await performDeleteMediaAsset(service as any, id)
    return new StepResponse({ id }, previous)
  },
  async (previous, { container }) => {
    if (!previous) return
    const service = container.resolve<MediaModuleService>(MEDIA_MODULE)
    await restoreMediaAsset(service as any, previous)
  }
)
