# @hollowpoint-io/medusa-plugin-media-library

A browsable media library for [Medusa](https://medusajs.com) v2. The File Module uploads to storage but keeps no record — this plugin is that record.

Authored by Billy Mahmood. Maintained by [Hollowpoint](https://hollowpoint.io). MIT licensed.

## Install

```bash
npm install @hollowpoint-io/medusa-plugin-media-library
# or, until the package is on npm:
npm install github:hollowpoint-io/medusa-plugin-media-library
```

```ts
// medusa-config.ts
module.exports = defineConfig({
  plugins: [
    {
      resolve: "@hollowpoint-io/medusa-plugin-media-library",
      options: {},
    },
  ],
})
```

Then run migrations:

```bash
npx medusa db:migrate
```

Built and tested against Medusa `>=2.17 <3`. File storage is whatever the host app already configured.

## What you get

- Admin page **Media Library** — filter, upload (via Medusa's File Module), copy URL, edit alt/role
- Registry keyed uniquely by URL (re-registering is a no-op)
- **Deleting a library row never deletes the stored file**, so existing references keep working

## API

| Method | Path | Notes |
|---|---|---|
| `GET` | `/admin/media` | `?role=&source=&limit=&offset=` |
| `POST` | `/admin/media` | `{ assets: [{ url, filename, mime_type?, role?, source?, alt? }] }` |
| `DELETE` | `/admin/media/:id` | registry only |

`source` is `theme` \| `content` \| `upload`.

## Develop

```bash
npm install
npm test
npm run build
npm run dev
```

Need this installed and wired on a live Medusa store? [Hollowpoint](https://hollowpoint.io) does Medusa migrations and plugin work.
