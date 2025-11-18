// Helper for building/reading/saving the Community gallery manifest
// Requires: `firebaseBucket` from your /config/firebase.ts

import { firebaseBucket } from '../../config/firebase'
import sizeOf from 'image-size'
import type { ISize as ImageInfo } from 'image-size/dist/types/interface'

/** ---------- Types ---------- */
export type CommunityManifestItem = {
  file: string
  w: number
  h: number
  alt?: string
}

export type CommunityManifest = {
  version: number
  updatedAt: string
  prefix: 'Community/all/'
  items: CommunityManifestItem[]
}

export type SignedCommunityManifestItem = CommunityManifestItem & {
  url: string
}

export type SignedCommunityManifest = Omit<CommunityManifest, 'items'> & {
  items: SignedCommunityManifestItem[]
}

/** ---------- Constants ---------- */
export const COMMUNITY_PREFIX = 'Community/all/'
export const COMMUNITY_MANIFEST_PATH = 'Community/manifest.json'
const IMAGE_EXT = /\.(avif|webp|jpe?g|png)$/i

/** ---------- Small utils ---------- */
const sortLex = (a: string, b: string) =>
  a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' })

/** Try to get dimensions from a small header slice (fast), fall back to full. */
async function probeDimensions(
  gsPath: string,
  headerBytes = 65536
): Promise<{ w: number; h: number }> {
  const file = firebaseBucket.file(gsPath)

  // 1) Header slice
  try {
    const header = await new Promise<Buffer>((resolve, reject) => {
      const chunks: Buffer[] = []
      file
        .createReadStream({ start: 0, end: headerBytes - 1 })
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
  if (!info?.width || !info?.height) {
    throw new Error(`Could not read dimensions: ${gsPath}`)
  }
  return { w: info.width, h: info.height }
}

/** List image filenames within Community/all (relative filenames only). */
export async function listCommunityImages(): Promise<string[]> {
  const [files] = await firebaseBucket.getFiles({ prefix: COMMUNITY_PREFIX })

  return files
    .map((f) => f.name)
    .filter((n) => !n.endsWith('/')) // ignore directory placeholders
    .filter((n) => n !== COMMUNITY_MANIFEST_PATH) // ignore the manifest
    .filter((n) => IMAGE_EXT.test(n)) // images only
    .map((n) => n.replace(COMMUNITY_PREFIX, '')) // strip prefix
    .sort(sortLex)
}

/** Build the manifest for all images in Community/all. */
export async function buildCommunityManifest(opts?: {
  altFactory?: (file: string) => string
}): Promise<CommunityManifest> {
  const files = await listCommunityImages()
  const items: CommunityManifestItem[] = []

  for (const file of files) {
    const gsPath = `${COMMUNITY_PREFIX}${file}`
    const { w, h } = await probeDimensions(gsPath)
    items.push({
      file,
      w,
      h,
      alt: opts?.altFactory ? opts.altFactory(file) : '',
    })
  }

  return {
    version: 1,
    updatedAt: new Date().toISOString(),
    prefix: 'Community/all/',
    items,
  }
}

/** Save the community manifest at Community/manifest.json. */
export async function saveCommunityManifest(manifest: CommunityManifest) {
  await firebaseBucket.file(COMMUNITY_MANIFEST_PATH).save(
    JSON.stringify(manifest, null, 2),
    {
      contentType: 'application/json',
      resumable: false,
      metadata: {
        cacheControl: 'public, max-age=300, s-maxage=600', // short TTL like houses
      },
    }
  )
}

/** Read the community manifest if it exists, else return null. */
export async function readCommunityManifest(): Promise<CommunityManifest | null> {
  const f = firebaseBucket.file(COMMUNITY_MANIFEST_PATH)
  const [exists] = await f.exists()
  if (!exists) return null
  const [buf] = await f.download()
  return JSON.parse(buf.toString('utf8'))
}

/** Decorate the manifest with signed URLs (keeps w/h/alt). */
export async function attachSignedUrls(
  manifest: CommunityManifest,
  opts?: { expiresInSeconds?: number }
): Promise<SignedCommunityManifest> {
  const expiresInSeconds = opts?.expiresInSeconds ?? 3600 // 1h default

  const items: SignedCommunityManifestItem[] = await Promise.all(
    manifest.items.map(async (it) => {
      const file = firebaseBucket.file(`${COMMUNITY_PREFIX}${it.file}`)
      const [url] = await file.getSignedUrl({
        action: 'read',
        expires: Date.now() + expiresInSeconds * 1000,
      })
      return { ...it, url }
    })
  )

  return {
    ...manifest,
    items,
  }
}
