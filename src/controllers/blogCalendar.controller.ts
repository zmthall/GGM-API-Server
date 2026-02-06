import type { Request, Response } from 'express'
import * as blogCalendarService from '../services/blogCalendar.services'

export const listBlogCalendars = async (req: Request, res: Response) => {
  try {
    const items = await blogCalendarService.listCalendars()
    res.json({ items })
  } catch (error) {
    res.status(500).json({ message: (error as Error).message })
  }
}

export const getBlogCalendarByKey = async (req: Request, res: Response) => {
  try {
    const { key } = req.params
    const cal = await blogCalendarService.getCalendarByKey(key)

    if (!cal) {
      res.status(404).json({ message: 'Calendar not found' })
      return
    }

    res.json({ key: cal.key, csv: cal.csv })
  } catch (error) {
    res.status(500).json({ message: (error as Error).message })
  }
}

export const upsertBlogCalendar = async (req: Request, res: Response) => {
  try {
    const { key } = req.params
    const csv = typeof req.body?.csv === 'string' ? req.body.csv : ''
    await blogCalendarService.upsertCalendar(key, csv)
    res.json({ ok: true })
  } catch (error) {
    res.status(400).json({ message: (error as Error).message })
  }
}

export const deleteBlogCalendar = async (req: Request, res: Response) => {
  try {
    const { key } = req.params
    const deleted = await blogCalendarService.deleteCalendar(key)

    if (!deleted) {
      res.status(404).json({ message: 'Calendar not found' })
      return
    }

    res.json({ ok: true })
  } catch (error) {
    res.status(500).json({ message: (error as Error).message })
  }
}