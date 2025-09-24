// Helper for building/reading/saving the combined gallery manifest
// Requires: `firebaseBucket` from your /config/firebase.ts

import { firebaseBucket } from '../../config/firebase'
import sizeOf from 'image-size'
import type { ISize as ImageInfo } from 'image-size/dist/types/interface'

/** ---------- Types ---------- */
export type ManifestItem = { file: string; w: number; h: number; alt?: string }
export type HouseBlock = { houseId: string; items: ManifestItem[] }
export type BigManifest = {
  version: number
  updatedAt: string
  prefix: 'houses/'
  houses: Record<string, HouseBlock>
}

/** ---------- Constants ---------- */
export const HOUSES_PREFIX = 'houses/'
export const MANIFEST_PATH = 'houses/manifest.json'
const IMAGE_EXT = /\.(avif|webp|jpe?g|png)$/i

/** ---------- Small utils ---------- */
const sortLex = (a: string, b: string) =>
  a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' })

/** Try to get dimensions from a small header slice (fast), fall back to full. */
async function probeDimensions(gsPath: string, headerBytes = 65536): Promise<{ w: number; h: number }> {
  const file = firebaseBucket.file(gsPath)

  // 1) Header slice
  try {
    const header = await new Promise<Buffer>((resolve, reject) => {
      const chunks: Buffer[] = []
      file.createReadStream({ start: 0, end: headerBytes - 1 })
        .on('data', (c) => chunks.push(c))
        .on('error', reject)
        .on('end', () => resolve(Buffer.concat(chunks)))
    })
    const info: ImageInfo = sizeOf(header)
    if (info?.width && info?.height) return { w: info.width, h: info.height }
  } catch {
    /* fall through */
  }

  // 2) Full download (rarely needed)
  const [buf] = await file.download()
  const info: ImageInfo = sizeOf(buf)
  if (!info?.width || !info?.height) throw new Error(`Could not read dimensions: ${gsPath}`)
  return { w: info.width, h: info.height }
}

/** List house ids (top-level folders under houses/). */
export async function listHouseIds(): Promise<string[]> {
  const [files] = await firebaseBucket.getFiles({ prefix: HOUSES_PREFIX })
  const set = new Set<string>()
  for (const f of files) {
    const rest = f.name.slice(HOUSES_PREFIX.length)
    const top = rest.split('/')[0]
    if (top) set.add(top)
  }
  return Array.from(set).sort(sortLex)
}

/** List image filenames within a house (relative to houses/<id>/). */
export async function listHouseImages(houseId: string): Promise<string[]> {
  const prefix = `${HOUSES_PREFIX}${houseId}/`
  const [files] = await firebaseBucket.getFiles({ prefix })
  return files
    .map((f) => f.name)
    .filter((n) => !n.endsWith('/'))
    .filter((n) => n !== `${prefix}${MANIFEST_PATH}`)
    .filter((n) => IMAGE_EXT.test(n))
    .map((n) => n.replace(prefix, ''))
    .sort(sortLex)
}

/** Build a HouseBlock (with w/h) for one house folder. */
export async function buildHouseBlock(
  houseId: string,
  opts?: { altFactory?: (file: string) => string }
): Promise<HouseBlock> {
  const files = await listHouseImages(houseId)
  const items: ManifestItem[] = []
  for (const file of files) {
    const gsPath = `${HOUSES_PREFIX}${houseId}/${file}`
    const { w, h } = await probeDimensions(gsPath)
    items.push({ file, w, h, alt: opts?.altFactory ? opts.altFactory(file) : '' })
  }
  return { houseId, items }
}

/** Build the combined manifest for all (or provided) houses. */
export async function buildBigManifest(houseIds?: string[], opts?: { altFactory?: (file: string, houseId: string) => string }): Promise<BigManifest> {
  const ids = houseIds?.length ? houseIds : await listHouseIds()
  const houses: BigManifest['houses'] = {}

  for (const id of ids) {
    const block = await buildHouseBlock(id, {
      altFactory: opts?.altFactory ? (f) => opts.altFactory!(f, id) : undefined
    })
    houses[id] = block
  }

  return {
    version: 1,
    updatedAt: new Date().toISOString(),
    prefix: 'houses/',
    houses,
  }
}

/** Save the big manifest at the bucket root (next to houses/). */
export async function saveBigManifest(manifest: BigManifest) {
  await firebaseBucket.file(MANIFEST_PATH).save(JSON.stringify(manifest, null, 2), {
    contentType: 'application/json',
    resumable: false,
    metadata: {
      cacheControl: 'public, max-age=300, s-maxage=600', // short TTL so edits show up fast
    },
  })
}

/** Read the big manifest if it exists, else return null. */
export async function readBigManifest(): Promise<BigManifest | null> {
  const f = firebaseBucket.file(MANIFEST_PATH)
  const [exists] = await f.exists()
  if (!exists) return null
  const [buf] = await f.download()
  return JSON.parse(buf.toString('utf8'))
}

// --- Add to helpers/houses/manifest.ts ---
export type SignedHouseBlock = {
  houseId: string
  items: (ManifestItem & { url: string })[]
}

/** Decorate a HouseBlock with signed URLs (keeps w/h/alt). */
export async function attachSignedUrls(
  block: HouseBlock,
  opts?: { expiresInSeconds?: number }
): Promise<SignedHouseBlock> {
  const expiresInSeconds = opts?.expiresInSeconds ?? 3600 // 1h default

  const items = await Promise.all(
    block.items.map(async (it) => {
      const file = firebaseBucket.file(`${HOUSES_PREFIX}${block.houseId}/${it.file}`)
      const [url] = await file.getSignedUrl({
        action: 'read',
        expires: Date.now() + expiresInSeconds * 1000,
      })
      return { ...it, url }
    })
  )

  return { houseId: block.houseId, items }
}

