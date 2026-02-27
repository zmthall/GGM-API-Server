import { Request, Response } from 'express'
import * as notificationService from '../services/notification.services'
import { CorrespondenceType } from '../types/notification'

const resolveType = (raw: unknown): CorrespondenceType | null => {
  const v = String(raw ?? '').trim().toLowerCase()

  // Accept BOTH canonical notification types and collection names
  if (v === 'ride_requests') return 'ride_requests'
  if (v === 'messages') return 'messages'
  if (v === 'applications') return 'applications'

  // Collection aliases
  if (v === 'contact_messages') return 'messages'
  if (v === 'job_applications') return 'applications'

  return null
}

const parseAmount = (raw: unknown) => {
  const n = Number(raw ?? 1)
  if (!Number.isFinite(n) || n <= 0) return 1
  return Math.floor(n)
}

export const getNotifications = async (req: Request, res: Response) => {
  try {
    const counts = await notificationService.getAllNotificationCounts()
    res.json({ success: true, data: counts })
    return
  } catch (error) {
    res.status(500).json({ success: false, message: (error as Error).message })
    return
  }
}

export const incrementNotifications = async (req: Request, res: Response) => {
  try {
    const type = resolveType(req.params.type ?? req.body?.type)
    if (!type) {
      res.status(400).json({
        success: false,
        message: 'Invalid type. Use: ride_requests | messages | applications (or contact_messages | job_applications).'
      })
      return
    }

    const amount = parseAmount(req.body?.amount)

    await notificationService.increaseNotificationCount(type, amount)

    const counts = await notificationService.getAllNotificationCounts()
    res.json({ success: true, data: counts })
    return
  } catch (error) {
    res.status(500).json({ success: false, message: (error as Error).message })
    return
  }
}

export const decrementNotifications = async (req: Request, res: Response) => {
  try {
    const type = resolveType(req.params.type ?? req.body?.type)
    if (!type) {
      res.status(400).json({
        success: false,
        message: 'Invalid type. Use: ride_requests | messages | applications (or contact_messages | job_applications).'
      })
      return
    }

    const amount = parseAmount(req.body?.amount)

    await notificationService.decreaseNotificationCount(type, amount)

    const counts = await notificationService.getAllNotificationCounts()
    res.json({ success: true, data: counts })
    return
  } catch (error) {
    res.status(500).json({ success: false, message: (error as Error).message })
    return
  }
}