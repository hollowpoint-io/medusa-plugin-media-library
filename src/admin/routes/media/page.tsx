import { defineRouteConfig } from "@medusajs/admin-sdk"
import { EllipsisHorizontal, Photo } from "@medusajs/icons"
import {
  Container,
  Heading,
  Button,
  Badge,
  Text,
  Select,
  FocusModal,
  Drawer,
  DropdownMenu,
  IconButton,
  Input,
  Label,
  Prompt,
  toast,
} from "@medusajs/ui"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { useEffect, useMemo, useState } from "react"
import { sdk } from "../../lib/sdk"

type MediaAsset = {
  id: string
  url: string
  filename: string
  mime_type: string | null
  role: string | null
  source: "theme" | "content" | "upload"
  alt: string | null
}

type MediaResponse = { media_assets: MediaAsset[]; count: number }

const sourceColor: Record<string, "blue" | "green" | "purple" | "grey"> = {
  theme: "blue",
  content: "green",
  upload: "purple",
}

const MediaLibraryPage = () => {
  const queryClient = useQueryClient()
  const [roleFilter, setRoleFilter] = useState<string>("all")
  const [open, setOpen] = useState(false)
  const [file, setFile] = useState<File | null>(null)
  const [uploadRole, setUploadRole] = useState("")
  const [editing, setEditing] = useState<MediaAsset | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<MediaAsset | null>(null)

  // Display query — loads on mount (no UI-state condition).
  // The backend can cold-start and return a transient 502; retry so a brief
  // wake-up doesn't surface as a misleading empty library.
  const { data, isLoading, isError, isFetching, refetch } =
    useQuery<MediaResponse>({
      queryKey: ["media"],
      queryFn: () => sdk.client.fetch("/admin/media?limit=500"),
      retry: 4,
      retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 8000),
    })

  const assets = data?.media_assets ?? []

  const roles = useMemo(() => {
    const set = new Set<string>()
    for (const a of assets) {
      if (a.role) {
        set.add(a.role)
      }
    }
    return Array.from(set).sort()
  }, [assets])

  const visible =
    roleFilter === "all" ? assets : assets.filter((a) => a.role === roleFilter)

  const upload = useMutation({
    mutationFn: async () => {
      if (!file) {
        throw new Error("Choose a file first")
      }
      const { files } = await sdk.admin.upload.create({ files: [file] })
      const uploaded = files[0]
      return sdk.client.fetch("/admin/media", {
        method: "POST",
        body: {
          assets: [
            {
              url: uploaded.url,
              filename: file.name,
              mime_type: file.type || null,
              role: uploadRole.trim() || null,
              source: "upload",
            },
          ],
        },
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["media"] })
      toast.success("Uploaded to media library")
      setOpen(false)
      setFile(null)
      setUploadRole("")
    },
    onError: (e) => toast.error((e as Error).message || "Upload failed"),
  })

  const copyUrl = (url: string) => {
    navigator.clipboard.writeText(url).then(
      () => toast.success("URL copied"),
      () => toast.error("Could not copy")
    )
  }

  const remove = useMutation({
    mutationFn: (id: string) =>
      sdk.client.fetch(`/admin/media/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["media"] })
      setDeleteTarget(null)
      toast.success("Removed from the media library")
    },
    onError: (e) => toast.error((e as Error).message || "Could not remove"),
  })

  return (
    <Container className="divide-y p-0">
      <div className="flex items-center justify-between px-6 py-4">
        <div className="flex flex-col">
          <Heading level="h1">Media Library</Heading>
          <Text size="small" className="text-ui-fg-subtle">
            Upload files through Medusa's File Module, then copy the URL
            wherever it's needed. Deleting a row never deletes the file.
          </Text>
          <Text size="small" className="text-ui-fg-subtle">
            {isLoading
              ? "Loading…"
              : isError
                ? "Couldn't reach the backend"
                : `${assets.length} assets hosted on Medusa storage`}
          </Text>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-48">
            <Select value={roleFilter} onValueChange={setRoleFilter}>
              <Select.Trigger>
                <Select.Value placeholder="Filter by role" />
              </Select.Trigger>
              <Select.Content>
                <Select.Item value="all">All roles</Select.Item>
                {roles.map((r) => (
                  <Select.Item key={r} value={r}>
                    {r}
                  </Select.Item>
                ))}
              </Select.Content>
            </Select>
          </div>
          <Button size="small" onClick={() => setOpen(true)}>
            Upload
          </Button>
        </div>
      </div>

      {isLoading && (
        <div className="px-6 py-8">
          <Text size="small" className="text-ui-fg-subtle">
            Loading media…
          </Text>
        </div>
      )}

      {!isLoading && isError && (
        <div className="flex flex-col items-start gap-y-3 px-6 py-8">
          <Text size="small" className="text-ui-fg-subtle">
            Couldn't load the media library. The backend may be waking up — this
            usually clears in a few seconds.
          </Text>
          <Button
            size="small"
            variant="secondary"
            onClick={() => refetch()}
            isLoading={isFetching}
          >
            Retry
          </Button>
        </div>
      )}

      {!isLoading && !isError && visible.length === 0 && (
        <div className="px-6 py-8">
          <Text size="small" className="text-ui-fg-subtle">
            No assets yet. Upload one, or run the backfill to import the migrated
            theme images.
          </Text>
        </div>
      )}

      {!isLoading && visible.length > 0 && (
        <div className="grid grid-cols-2 gap-4 px-6 py-4 md:grid-cols-3 lg:grid-cols-4">
          {visible.map((a) => (
            <div
              key={a.id}
              className="group relative flex flex-col gap-y-2 rounded-lg border border-ui-border-base bg-ui-bg-subtle p-3"
            >
              <div className="absolute right-2 top-2 opacity-0 transition-opacity group-hover:opacity-100 focus-within:opacity-100">
                <DropdownMenu>
                  <DropdownMenu.Trigger asChild>
                    <IconButton size="small" variant="transparent">
                      <EllipsisHorizontal />
                    </IconButton>
                  </DropdownMenu.Trigger>
                  <DropdownMenu.Content>
                    <DropdownMenu.Item onClick={() => setEditing(a)}>
                      Edit
                    </DropdownMenu.Item>
                    <DropdownMenu.Item onClick={() => setDeleteTarget(a)}>
                      Delete
                    </DropdownMenu.Item>
                  </DropdownMenu.Content>
                </DropdownMenu>
              </div>
              <div className="flex h-32 items-center justify-center overflow-hidden rounded-md bg-ui-bg-base">
                <img
                  src={a.url}
                  alt={a.alt ?? a.filename}
                  className="max-h-32 max-w-full object-contain"
                  loading="lazy"
                />
              </div>
              <Text
                size="small"
                leading="compact"
                weight="plus"
                className="truncate"
                title={a.filename}
              >
                {a.filename}
              </Text>
              <div className="flex flex-wrap items-center gap-1">
                {a.role && <Badge size="2xsmall">{a.role}</Badge>}
                <Badge size="2xsmall" color={sourceColor[a.source] ?? "grey"}>
                  {a.source}
                </Badge>
              </div>
              <Button
                size="small"
                variant="secondary"
                onClick={() => copyUrl(a.url)}
              >
                Copy URL
              </Button>
            </div>
          ))}
        </div>
      )}

      <FocusModal open={open} onOpenChange={setOpen}>
        <FocusModal.Content>
          <div className="flex h-full flex-col overflow-hidden">
            <FocusModal.Header>
              <div className="flex items-center justify-end gap-x-2">
                <FocusModal.Close asChild>
                  <Button
                    size="small"
                    variant="secondary"
                    disabled={upload.isPending}
                  >
                    Cancel
                  </Button>
                </FocusModal.Close>
                <Button
                  size="small"
                  onClick={() => upload.mutate()}
                  isLoading={upload.isPending}
                  disabled={!file}
                >
                  Upload
                </Button>
              </div>
            </FocusModal.Header>
            <FocusModal.Body className="flex-1 overflow-auto">
              <div className="mx-auto flex w-full max-w-lg flex-col gap-y-4 py-8">
                <div className="flex flex-col gap-y-2">
                  <Label>Image file</Label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                    className="text-ui-fg-base text-sm"
                  />
                </div>
                <div className="flex flex-col gap-y-2">
                  <Label>Role (optional)</Label>
                  <Input
                    placeholder="e.g. banner, brand-logo, homepage-image"
                    value={uploadRole}
                    onChange={(e) => setUploadRole(e.target.value)}
                  />
                  <Text size="small" className="text-ui-fg-subtle">
                    A hint for where this asset is used. Uploads are stored on
                    Medusa S3 and added to the library.
                  </Text>
                </div>
              </div>
            </FocusModal.Body>
          </div>
        </FocusModal.Content>
      </FocusModal>

      <EditMediaDrawer asset={editing} roles={roles} onClose={() => setEditing(null)} />

      <Prompt
        open={!!deleteTarget}
        onOpenChange={(o) => !o && setDeleteTarget(null)}
      >
        <Prompt.Content>
          <Prompt.Header>
            <Prompt.Title>Remove from media library</Prompt.Title>
            <Prompt.Description>
              Removes it from this library only — the file stays on S3 and
              anywhere it's used.
            </Prompt.Description>
          </Prompt.Header>
          <Prompt.Footer>
            <Prompt.Cancel>Cancel</Prompt.Cancel>
            <Prompt.Action
              onClick={() => deleteTarget && remove.mutate(deleteTarget.id)}
            >
              Remove
            </Prompt.Action>
          </Prompt.Footer>
        </Prompt.Content>
      </Prompt>
    </Container>
  )
}

/** Edit alt text + role for an existing asset — reuses the upsert-by-url POST route. */
const EditMediaDrawer = ({
  asset,
  roles,
  onClose,
}: {
  asset: MediaAsset | null
  roles: string[]
  onClose: () => void
}) => {
  const queryClient = useQueryClient()
  const [alt, setAlt] = useState("")
  const [role, setRole] = useState("")
  const [customRole, setCustomRole] = useState(false)

  useEffect(() => {
    if (asset) {
      setAlt(asset.alt ?? "")
      setRole(asset.role ?? "")
      setCustomRole(!!asset.role && !roles.includes(asset.role))
    }
  }, [asset])

  const save = useMutation({
    mutationFn: () => {
      if (!asset) {
        throw new Error("Nothing to save")
      }
      return sdk.client.fetch("/admin/media", {
        method: "POST",
        body: {
          assets: [
            {
              url: asset.url,
              filename: asset.filename,
              mime_type: asset.mime_type,
              source: asset.source,
              role: role.trim() || null,
              alt: alt.trim() || null,
            },
          ],
        },
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["media"] })
      toast.success("Asset updated")
      onClose()
    },
    onError: (e) => toast.error((e as Error).message || "Could not save"),
  })

  return (
    <Drawer open={!!asset} onOpenChange={(o) => !o && onClose()}>
      <Drawer.Content>
        <Drawer.Header>
          <Drawer.Title>Edit asset</Drawer.Title>
        </Drawer.Header>
        <Drawer.Body className="flex flex-col gap-4 overflow-auto">
          {asset && (
            <>
              <div className="flex h-32 items-center justify-center overflow-hidden rounded-md border border-ui-border-base bg-ui-bg-subtle">
                <img
                  src={asset.url}
                  alt=""
                  className="max-h-32 max-w-full object-contain"
                />
              </div>
              <Text size="small" className="text-ui-fg-subtle" title={asset.filename}>
                {asset.filename}
              </Text>
              <div className="flex flex-col gap-y-2">
                <Label>Alt text</Label>
                <Input
                  placeholder="Describes the image for accessibility/SEO"
                  value={alt}
                  onChange={(e) => setAlt(e.target.value)}
                />
              </div>
              <div className="flex flex-col gap-y-2">
                <Label>Role</Label>
                {!customRole ? (
                  <Select
                    value={role || "none"}
                    onValueChange={(v) => {
                      if (v === "__custom") {
                        setCustomRole(true)
                        setRole("")
                        return
                      }
                      setRole(v === "none" ? "" : v)
                    }}
                  >
                    <Select.Trigger>
                      <Select.Value placeholder="No role" />
                    </Select.Trigger>
                    <Select.Content>
                      <Select.Item value="none">No role</Select.Item>
                      {roles.map((r) => (
                        <Select.Item key={r} value={r}>
                          {r}
                        </Select.Item>
                      ))}
                      <Select.Item value="__custom">
                        Other (type a new role)…
                      </Select.Item>
                    </Select.Content>
                  </Select>
                ) : (
                  <div className="flex items-center gap-2">
                    <Input
                      placeholder="e.g. banner, brand-logo, homepage-image"
                      value={role}
                      onChange={(e) => setRole(e.target.value)}
                    />
                    <Button
                      size="small"
                      variant="secondary"
                      onClick={() => setCustomRole(false)}
                    >
                      Choose existing
                    </Button>
                  </div>
                )}
                <Text size="small" className="text-ui-fg-subtle">
                  A hint for where this asset is used (e.g. banner, brand-logo).
                </Text>
              </div>
            </>
          )}
        </Drawer.Body>
        <Drawer.Footer>
          <Drawer.Close asChild>
            <Button size="small" variant="secondary">
              Cancel
            </Button>
          </Drawer.Close>
          <Button size="small" onClick={() => save.mutate()} isLoading={save.isPending}>
            Save
          </Button>
        </Drawer.Footer>
      </Drawer.Content>
    </Drawer>
  )
}

export const config = defineRouteConfig({
  label: "Media Library",
  icon: Photo,
})

export default MediaLibraryPage
