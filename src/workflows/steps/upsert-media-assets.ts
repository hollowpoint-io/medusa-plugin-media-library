import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk"
import {
  performUpsertMediaAssets,
  type MediaAssetInput,
} from "../../lib/upsert-media-assets"
import { MEDIA_MODULE } from "../../modules/media"
import type MediaModuleService from "../../modules/media/service"

export type { MediaAssetInput }

export const upsertMediaAssetsStep = createStep(
  "upsert-media-assets",
  async ({ assets }: { assets: MediaAssetInput[] }, { container }) => {
    const service = container.resolve<MediaModuleService>(MEDIA_MODULE)
    const result = await performUpsertMediaAssets(service as any, assets)
    return new StepResponse(
      { created: result.created, updated: result.updated },
      result.createdIds
    )
  },
  async (createdIds, { container }) => {
    if (!createdIds?.length) return
    const service = container.resolve<MediaModuleService>(MEDIA_MODULE)
    await service.deleteMediaAssets(createdIds)
  }
)
