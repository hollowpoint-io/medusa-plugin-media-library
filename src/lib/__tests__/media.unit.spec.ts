import {
  performDeleteMediaAsset,
  restoreMediaAsset,
  type MediaAssetRecord,
} from "../delete-media-asset"
import { performUpsertMediaAssets, type MediaWriter } from "../upsert-media-assets"

function mockWriter(
  existing: { id: string; url: string }[] = []
): MediaWriter & { created: unknown[]; updated: unknown[]; deleted: string[] } {
  const created: unknown[] = []
  const updated: unknown[] = []
  const deleted: string[] = []
  return {
    created,
    updated,
    deleted,
    listMediaAssets: async () => existing as any,
    createMediaAssets: async (rows) => {
      created.push(...rows)
      return rows.map((r, i) => ({ id: `new_${i}`, ...r }))
    },
    updateMediaAssets: async (rows) => {
      updated.push(...rows)
    },
    deleteMediaAssets: async (ids) => {
      deleted.push(...ids)
    },
  }
}

describe("performUpsertMediaAssets", () => {
  it("is idempotent by URL", async () => {
    const service = mockWriter([{ id: "m1", url: "https://cdn.example.com/a.png" }])
    const result = await performUpsertMediaAssets(service, [
      { url: "https://cdn.example.com/a.png", filename: "a.png", alt: "logo" },
      { url: "https://cdn.example.com/b.png", filename: "b.png" },
    ])
    expect(result).toMatchObject({ created: 1, updated: 1 })
    expect(result.createdIds).toEqual(["new_0"])
  })
})

describe("performDeleteMediaAsset", () => {
  it("returns the previous row so compensation can restore it", async () => {
    const previous: MediaAssetRecord = {
      id: "m1",
      url: "https://cdn.example.com/a.png",
      filename: "a.png",
    }
    const service = {
      retrieveMediaAsset: async () => previous,
      deleteMediaAssets: jest.fn().mockResolvedValue(undefined),
      createMediaAssets: jest.fn().mockResolvedValue(undefined),
    }

    const result = await performDeleteMediaAsset(service, "m1")
    expect(result.previous).toEqual(previous)
    expect(service.deleteMediaAssets).toHaveBeenCalledWith("m1")

    await restoreMediaAsset(service, result.previous)
    expect(service.createMediaAssets).toHaveBeenCalledWith(previous)
  })
})
