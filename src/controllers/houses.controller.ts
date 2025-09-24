import { Request, Response } from 'express';
import * as housesService from '../services/houses.services';
import { buildBigManifest, readBigManifest, saveBigManifest, buildHouseBlock } from '../helpers/houses/galleryManifest' 

export const getHouseImages = async (req: Request, res: Response) => {
  const { houseId } = req.params
  if (!houseId) {
    res.status(400).json({ success: false, message: 'houseId required' });
    return;
  }

  try {
    const signed = req.query.signed === 'true'       // ?signed=true to request signed URLs
    const expires = Number(req.query.expires) || 3600 // ?expires=900

    const houseImages = await housesService.getHouseImages(houseId, {
      signedUrls: signed,
      expiresInSeconds: expires,
      rebuild: req.query.rebuild === 'true', // optional knob
      persist: false,                         // or true if you want to rewrite the big manifest
    })

    res.set('Cache-Control', 'public, max-age=300, s-maxage=600')
    res.status(200).json({
      success: true,
      data: houseImages,
      message: `Fetched house images for ${houseId} successfully`,
    })
    return;
  } catch (error) {
    res.status(500).json({
      success: false,
      message: (error as Error).message,
    })
    return;
  }
}

export async function rebuildAllManifests(_req: Request, res: Response) {
    try {
        const big = await buildBigManifest()
        await saveBigManifest(big)
        res.status(201).json({
                success: true,
                updatedAt: big.updatedAt,
                count: Object.keys(big.houses).length,
                message: `Rebuilt all manifests successfully`
            });
    } catch (error) { 
        res.status(400).json({
            success: false,
            message: (error as Error).message
        });
    }
}

export const getCombinedManifest = async (
  _req: Request,
  res: Response,
) => {
  try {
    const manifest = await readBigManifest()
    if (!manifest) {
      res.status(404).json({
        success: false,
        error: 'manifest_not_found',
        message: 'Combined manifest.json not found in storage.'
      })
      return;
    }

    res.set('Cache-Control', 'public, max-age=300, s-maxage=600')
    res.status(200).json({
      success: true,
      data: manifest
    })
    return;
  } catch (error) {
    res.status(400).json({
            success: false,
            message: (error as Error).message
        });
  }
}
