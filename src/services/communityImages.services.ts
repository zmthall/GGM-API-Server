// services/community.services.ts
import {
  readCommunityManifest,
  buildCommunityManifest,
  saveCommunityManifest,
  attachSignedUrls,
  type CommunityManifest,
  type SignedCommunityManifest,
} from '../helpers/communityImages/galleryManifest'

type GetCommunityOpts = {
  rebuild?: boolean
  persist?: boolean
  signedUrls?: boolean
  expiresInSeconds?: number
}

/**
 * Get all community images (from manifest or by rebuilding it).
 * Mirrors getHouseImages but for the global Community/all folder.
 */
export const getCommunityImages = async (
  opts?: GetCommunityOpts
): Promise<CommunityManifest | SignedCommunityManifest> => {
  const rebuild = !!opts?.rebuild

  if (!rebuild) {
    const manifest = await readCommunityManifest()
    if (manifest) {
      return opts?.signedUrls
        ? await attachSignedUrls(manifest, {
            expiresInSeconds: opts.expiresInSeconds,
          })
        : manifest
    }
  }

  // Rebuild manifest from bucket
  const manifest = await buildCommunityManifest()

  // Optionally persist the rebuilt manifest.json back to storage
  if (opts?.persist) {
    await saveCommunityManifest(manifest)
  }

  return opts?.signedUrls
    ? await attachSignedUrls(manifest, {
        expiresInSeconds: opts.expiresInSeconds,
      })
    : manifest
}
