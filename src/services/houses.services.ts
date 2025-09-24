// services/houses.service.ts
import {
  readBigManifest,
  buildHouseBlock,
  buildBigManifest,
  saveBigManifest,
  attachSignedUrls,
  type HouseBlock,
  type SignedHouseBlock,
} from '../helpers/houses/galleryManifest'

export const getHouseImages = async (
  houseId: string,
  opts?: { rebuild?: boolean; persist?: boolean; signedUrls?: boolean; expiresInSeconds?: number }
): Promise<HouseBlock | SignedHouseBlock> => {
  if (!houseId) throw new Error('houseId required')

  const rebuild = !!opts?.rebuild

  if (!rebuild) {
    const big = await readBigManifest()
    const block = big?.houses?.[houseId]
    if (block) {
      return opts?.signedUrls
        ? await attachSignedUrls(block, { expiresInSeconds: opts.expiresInSeconds })
        : block
    }
  }

  // Build only this house’s block
  const block = await buildHouseBlock(houseId)

  // Optionally refresh & persist the combined manifest
  if (opts?.persist) {
    const big = await buildBigManifest()
    await saveBigManifest(big)
  }

  return opts?.signedUrls
    ? await attachSignedUrls(block, { expiresInSeconds: opts.expiresInSeconds })
    : block
}
