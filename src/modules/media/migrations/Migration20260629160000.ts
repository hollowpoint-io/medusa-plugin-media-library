import { Migration } from "@medusajs/framework/mikro-orm/migrations"

export class Migration20260629160000 extends Migration {
  override async up(): Promise<void> {
    this.addSql(
      `create table if not exists "media_asset" ("id" text not null, "url" text not null, "filename" text not null, "mime_type" text null, "role" text null, "source" text check ("source" in ('theme', 'content', 'upload')) not null default 'upload', "alt" text null, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "media_asset_pkey" primary key ("id"));`
    )
    this.addSql(
      `CREATE UNIQUE INDEX IF NOT EXISTS "IDX_media_asset_url_unique" ON "media_asset" ("url") WHERE deleted_at IS NULL;`
    )
    this.addSql(
      `CREATE INDEX IF NOT EXISTS "IDX_media_asset_deleted_at" ON "media_asset" ("deleted_at") WHERE deleted_at IS NULL;`
    )
  }

  override async down(): Promise<void> {
    this.addSql(`drop table if exists "media_asset" cascade;`)
  }
}
