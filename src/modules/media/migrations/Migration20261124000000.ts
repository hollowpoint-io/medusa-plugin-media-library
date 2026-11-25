import { Migration } from "@medusajs/framework/mikro-orm/migrations"

export class Migration20261124000000 extends Migration {
  override async up(): Promise<void> {
    this.addSql(
      `ALTER TABLE "media_asset" ADD COLUMN IF NOT EXISTS "folder" text NULL;`
    )
    this.addSql(
      `CREATE INDEX IF NOT EXISTS "IDX_media_asset_folder" ON "media_asset" ("folder") WHERE deleted_at IS NULL;`
    )
  }

  override async down(): Promise<void> {
    this.addSql(`DROP INDEX IF EXISTS "IDX_media_asset_folder";`)
    this.addSql(`ALTER TABLE "media_asset" DROP COLUMN IF EXISTS "folder";`)
  }
}
