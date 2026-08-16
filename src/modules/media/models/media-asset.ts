import { model } from "@medusajs/framework/utils"

/**
 * A registry row for an image or file hosted on Medusa's File Module (typically
 * S3). Medusa has no native media library — the File Module uploads but keeps
 * no browsable record — so this table is the library.
 *
 * `url` is the stable identity (unique): registering the same URL twice is a
 * no-op. `role` is a free-text hint (logo, favicon, banner, …). `source`
 * records where the asset entered the library.
 */
const MediaAsset = model.define("media_asset", {
  id: model.id().primaryKey(),

  url: model.text().unique(),
  filename: model.text(),
  mime_type: model.text().nullable(),

  role: model.text().nullable(),
  source: model.enum(["theme", "content", "upload"]).default("upload"),
  alt: model.text().nullable(),
})

export default MediaAsset
