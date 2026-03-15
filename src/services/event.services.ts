import { v4 as uuidv4 } from 'uuid';
import { convertISOToMMDDYYYY } from '../helpers/dateFormat'
import { validateEvent } from '../helpers/eventValidation'
import {
  createEvent as createEventRecord,
  deleteEvent as deleteEventRecord,
  getEventById,
  listActiveEvents,
  listArchivedEvents,
  updateEvent as updateEventRecord
} from '../helpers/database/events/events.db'
import type { Event } from '../types/event'
import type { PaginatedResult, PaginationOptions } from '../types/pagination'

const toIsoString = (value: Date | string | number | null | undefined): string | undefined => {
  if (!value) return undefined

  if (value instanceof Date) {
    return value.toISOString()
  }

  const parsed = new Date(value)
  if (!Number.isNaN(parsed.getTime())) {
    return parsed.toISOString()
  }

  return undefined
}

const mapRecordToEvent = (record: {
  id: string
  address: string
  archived: boolean
  date_start: Date | null
  date_end: Date | null
  description: string
  link: string
  location: string
  title: string
}): Event => {
  return {
    id: record.id,
    address: record.address,
    archived: record.archived,
    dateStart: toIsoString(record.date_start) ?? '',
    dateEnd: toIsoString(record.date_end),
    description: record.description,
    link: record.link,
    location: record.location,
    title: record.title
  }
}

const paginateItems = <T>(items: T[], page: number, pageSize: number): PaginatedResult<T> => {
  const currentPage = Math.max(1, Number(page) || 1)
  const normalizedPageSize = Math.max(1, Number(pageSize) || 5)
  const totalItems = items.length
  const totalPages = Math.max(1, Math.ceil(totalItems / normalizedPageSize))
  const startIndex = (currentPage - 1) * normalizedPageSize
  const data = items.slice(startIndex, startIndex + normalizedPageSize)

  return {
    data,
    pagination: {
      currentPage,
      pageSize: normalizedPageSize,
      totalItems,
      totalPages,
      hasNextPage: currentPage < totalPages,
      hasPreviousPage: currentPage > 1
    }
  }
}

export const createEvent = async (data: Omit<Event, 'id'>): Promise<Event> => {
  const processedData = {
    ...data,
    archived: false
  }

  const validation = validateEvent(processedData)
  if (!validation.isValid) {
    throw new Error(`Validation failed: ${validation.errors.map(e => e.message).join(', ')}`)
  }

  const dateStartIso = new Date(processedData.dateStart).toISOString()
  const dateEndIso = processedData.dateEnd ? new Date(processedData.dateEnd).toISOString() : null

  try {
    const created = await createEventRecord({
      id: uuidv4(),
      address: processedData.address,
      archived: false,
      dateStart: dateStartIso ? new Date(dateStartIso) : null,
      dateEnd: dateEndIso ? new Date(dateEndIso) : null,
      description: processedData.description,
      link: processedData.link,
      location: processedData.location,
      title: processedData.title,
      rawPayload: {}
    })

    return mapRecordToEvent(created)
  } catch (error) {
    throw new Error(`Failed to create event: ${(error as Error).message}`)
  }
}

export const getAllEvents = async (options: PaginationOptions = {}): Promise<PaginatedResult<Event>> => {
  try {
    const page = options.page || 1
    const pageSize = options.pageSize || 5

    const records = await listActiveEvents()
    const mapped = records.map(mapRecordToEvent)

    const convertedData = mapped.map((event: Event) => ({
      ...event,
      dateStart: convertISOToMMDDYYYY(event.dateStart),
      dateEnd: event.dateEnd ? convertISOToMMDDYYYY(event.dateEnd) : undefined
    }))

    return paginateItems(convertedData, page, pageSize)
  } catch (error) {
    throw new Error(`Failed to get events: ${(error as Error).message}`)
  }
}

export const getArchivedEvents = async (options: PaginationOptions = {}): Promise<PaginatedResult<Event>> => {
  try {
    const page = options.page || 1
    const pageSize = options.pageSize || 10

    const records = await listArchivedEvents()
    const mapped = records.map(mapRecordToEvent)

    const convertedData = mapped.map((event: Event) => ({
      ...event,
      dateStart: convertISOToMMDDYYYY(event.dateStart),
      dateEnd: event.dateEnd ? convertISOToMMDDYYYY(event.dateEnd) : undefined
    }))

    return paginateItems(convertedData, page, pageSize)
  } catch (error) {
    throw new Error(`Failed to get archived events: ${(error as Error).message}`)
  }
}

export const getEvent = async (id: string): Promise<Event | null> => {
  try {
    const event = await getEventById(id)

    if (!event) {
      return null
    }

    return mapRecordToEvent(event)
  } catch (error) {
    throw new Error(`Failed to get event: ${(error as Error).message}`)
  }
}

export const updateEvent = async (id: string, data: Partial<Omit<Event, 'id'>>): Promise<Event | null> => {
  try {
    const existingEvent = await getEventById(id)

    if (!existingEvent) {
      return null
    }

    const existingMapped = mapRecordToEvent(existingEvent)

    const validation = validateEvent({ ...existingMapped, ...data })
    if (!validation.isValid) {
      throw new Error(`Validation failed: ${validation.errors.map(e => e.message).join(', ')}`)
    }

    const processedDateStart = data.dateStart ? new Date(data.dateStart).toISOString() : null
    const processedDateEnd = data.dateEnd ? new Date(data.dateEnd).toISOString() : null

    const updatedEvent = await updateEventRecord(id, {
      address: data.address,
      archived: data.archived,
      dateStart: data.dateStart ? new Date(processedDateStart as string) : undefined,
      dateEnd: data.dateEnd ? new Date(processedDateEnd as string) : undefined,
      description: data.description,
      link: data.link,
      location: data.location,
      title: data.title
    })

    if (!updatedEvent) {
      return null
    }

    return mapRecordToEvent(updatedEvent)
  } catch (error) {
    throw new Error(`Failed to update event: ${(error as Error).message}`)
  }
}

export const deleteEvent = async (id: string): Promise<boolean> => {
  try {
    const existingEvent = await getEventById(id)

    if (!existingEvent) {
      return false
    }

    return await deleteEventRecord(id)
  } catch (error) {
    throw new Error(`Failed to delete event: ${(error as Error).message}`)
  }
}

export const archiveEvent = async (id: string): Promise<Event | null> => {
  try {
    const existingEvent = await getEventById(id)

    if (!existingEvent) {
      return null
    }

    const updatedEvent = await updateEventRecord(id, {
      archived: !existingEvent.archived
    })

    if (!updatedEvent) {
      return null
    }

    return mapRecordToEvent(updatedEvent)
  } catch (error) {
    throw new Error(`Failed to archive event: ${(error as Error).message}`)
  }
}