import { randomUUID } from 'node:crypto'
import {
  createBlogCalendar,
  deleteBlogCalendar,
  getBlogCalendarByKey,
  updateBlogCalendar,
  listBlogCalendars
} from '../helpers/database/blogCalendars/blogCalendars.db'
import type { BlogCalendar } from '../types/blogCalendar'

const KEY_REGEX = /^\d{4}-\d{2}$/
const MAX_CSV_CHARS = 300_000

function validateKey(key: string) {
  const k = String(key || '').trim()
  if (!k) throw new Error('Calendar key is required.')
  if (!KEY_REGEX.test(k)) throw new Error('Invalid calendar key format. Expected YYYY-MM.')
  return k
}

function validateCsv(csv: string) {
  const s = String(csv || '').trim()
  if (!s) throw new Error('CSV is required.')
  if (s.length > MAX_CSV_CHARS) throw new Error(`CSV is too large. Max ${MAX_CSV_CHARS} characters.`)
  return s
}

const toIsoString = (value: Date | string | number | null | undefined): string => {
  if (value instanceof Date) {
    return value.toISOString()
  }

  const parsed = new Date(value ?? '')
  if (!Number.isNaN(parsed.getTime())) {
    return parsed.toISOString()
  }

  return new Date(0).toISOString()
}

const mapRecordToBlogCalendar = (record: {
  id: string
  calendar_key: string
  csv: string
  created_at: Date
  updated_at: Date
}): BlogCalendar => {
  return {
    id: record.id,
    key: record.calendar_key,
    csv: record.csv,
    createdAt: toIsoString(record.created_at),
    updatedAt: toIsoString(record.updated_at)
  }
}

export type BlogCalendarListItem = {
  key: string
  createdAt: string
  updatedAt: string
}

async function findCalendarByKey(key: string): Promise<BlogCalendar | null> {
  const k = validateKey(key)
  const record = await getBlogCalendarByKey(k)

  if (!record) return null

  return mapRecordToBlogCalendar(record)
}

export const listCalendars = async (): Promise<BlogCalendarListItem[]> => {
  try {
    const records = await listBlogCalendars()

    return records.map((record) => ({
      key: record.calendar_key,
      createdAt: toIsoString(record.created_at),
      updatedAt: toIsoString(record.updated_at)
    }))
  } catch (error) {
    throw new Error(`Failed to list calendars: ${(error as Error).message}`)
  }
}

export const getCalendarByKey = async (key: string): Promise<BlogCalendar | null> => {
  try {
    return await findCalendarByKey(key)
  } catch (error) {
    throw new Error(`Failed to get calendar: ${(error as Error).message}`)
  }
}

export const upsertCalendar = async (key: string, csv: string): Promise<BlogCalendar> => {
  try {
    const k = validateKey(key)
    const s = validateCsv(csv)

    const existing = await getBlogCalendarByKey(k)

    if (!existing) {
      const created = await createBlogCalendar({
        id: randomUUID(),
        calendarKey: k,
        csv: s,
        createdAt: new Date(),
        updatedAt: new Date(),
        rawPayload: {}
      })

      return mapRecordToBlogCalendar(created)
    }

    const updated = await updateBlogCalendar(existing.id, {
      csv: s
    })

    if (!updated) {
      throw new Error('Failed to update calendar.')
    }

    return mapRecordToBlogCalendar(updated)
  } catch (error) {
    throw new Error(`Failed to save calendar: ${(error as Error).message}`)
  }
}

export const deleteCalendar = async (key: string): Promise<boolean> => {
  try {
    const k = validateKey(key)

    const existing = await getBlogCalendarByKey(k)
    if (!existing) return false

    return await deleteBlogCalendar(existing.id)
  } catch (error) {
    throw new Error(`Failed to delete calendar: ${(error as Error).message}`)
  }
}