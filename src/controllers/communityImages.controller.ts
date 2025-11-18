// controllers/community.controller.ts
import { Request, Response } from 'express'
import * as communityService from '../services/communityImages.services'
import {
  buildCommunityManifest,
  saveCommunityManifest,
  readCommunityManifest,
} from '../helpers/communityImages/galleryManifest'

/**
 * GET /api/community-images
 * Optional query:
 *   ?signed=true        -> include signed URLs
 *   ?expires=900        -> signed URL TTL (seconds)
 *   ?rebuild=true       -> force rebuild instead of using existing manifest
 *   ?persist=true       -> after rebuild, write manifest.json to storage
 */
export const getCommunityImages = async (req: Request, res: Response) => {
  try {
    const signed = req.query.signed === 'true'
    const expires = Number(req.query.expires) || 3600
    const rebuild = req.query.rebuild === 'true'
    const persist = req.query.persist === 'true'

    const data = await communityService.getCommunityImages({
      signedUrls: signed,
      expiresInSeconds: expires,
      rebuild,
      persist,
    })

    res.set('Cache-Control', 'public, max-age=300, s-maxage=600')
    res.status(200).json({
      success: true,
      data,
      message: 'Fetched community images successfully',
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: (error as Error).message,
    })
  }
}

export const rebuildCommunityManifest = async (_req: Request, res: Response) => {
  try {
    const manifest = await buildCommunityManifest()
    await saveCommunityManifest(manifest)

    res.status(201).json({
      success: true,
      updatedAt: manifest.updatedAt,
      count: manifest.items.length,
      message: 'Rebuilt community manifest successfully',
    })
  } catch (error) {
    res.status(400).json({
      success: false,
      message: (error as Error).message,
    })
  }
}

/**
 * GET /api/community-images/manifest
 * Returns the raw manifest.json (no signed URLs).
 */
export const getCommunityManifest = async (_req: Request, res: Response) => {
  try {
    const manifest = await readCommunityManifest()
    if (!manifest) {
      res.status(404).json({
        success: false,
        error: 'manifest_not_found',
        message: 'Community manifest.json not found in storage.',
      })
      return
    }

    res.set('Cache-Control', 'public, max-age=300, s-maxage=600')
    res.status(200).json({
      success: true,
      data: manifest,
    })
  } catch (error) {
    res.status(400).json({
      success: false,
      message: (error as Error).message,
    })
  }
}
