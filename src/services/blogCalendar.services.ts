import { createDocument, deleteDocument, getPaginatedDocuments, updateDocument } from '../helpers/firebase'
import type { BlogCalendar } from '../types/blogCalendar'
import type { PaginationOptions } from '../types/pagination'

const COLLECTION = 'blog-calendars'
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

export type BlogCalendarListItem = {
  key: string
  createdAt: string
  updatedAt: string
}

async function findCalendarByKey(key: string): Promise<BlogCalendar | null> {
  const k = validateKey(key)

  const options: PaginationOptions = {
    page: 1,
    pageSize: 1,
    orderField: 'updatedAt',
    orderDirection: 'desc'
  }

  const result = await getPaginatedDocuments<BlogCalendar>(
    COLLECTION,
    { key: k },
    {},
    options
  )

  return result.data?.[0] ?? null
}

export const listCalendars = async (): Promise<BlogCalendarListItem[]> => {
  try {
    const result = await getPaginatedDocuments<BlogCalendar>(
      COLLECTION,
      {},
      {},
      {
        page: 1,
        pageSize: 500,
        orderField: 'updatedAt',
        orderDirection: 'desc'
      }
    )

    const items: BlogCalendarListItem[] = (result.data ?? []).map((doc) => ({
      key: doc.key,
      createdAt: doc.createdAt,
      updatedAt: doc.updatedAt
    }))

    items.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
    return items
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
    const nowIso = new Date().toISOString()

    const existing = await findCalendarByKey(k)

    if (!existing) {
      const created = await createDocument<Omit<BlogCalendar, 'id'>>(COLLECTION, {
        key: k,
        csv: s,
        createdAt: nowIso,
        updatedAt: nowIso
      })

      // matches your event pattern: { id, data }
      return {
        id: created.id,
        ...(created.data as Omit<BlogCalendar, 'id'>)
      }
    }

    await updateDocument(COLLECTION, existing.id, {
      csv: s,
      updatedAt: nowIso
    })

    return {
      ...existing,
      csv: s,
      updatedAt: nowIso
    }
  } catch (error) {
    throw new Error(`Failed to save calendar: ${(error as Error).message}`)
  }
}

export const deleteCalendar = async (key: string): Promise<boolean> => {
  try {
    const k = validateKey(key)

    const existing = await findCalendarByKey(k)
    if (!existing) return false

    await deleteDocument(COLLECTION, existing.id)
    return true
  } catch (error) {
    throw new Error(`Failed to delete calendar: ${(error as Error).message}`)
  }
}