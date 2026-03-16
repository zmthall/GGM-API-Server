import { Event } from '../types/event'

export interface ValidationError {
  field: string
  message: string
}

export interface ValidationResult {
  isValid: boolean
  errors: ValidationError[]
}

const MM_DD_YYYY_REGEX = /^(0[1-9]|1[0-2])\/(0[1-9]|[12]\d|3[01])\/\d{4}$/

const addError = (errors: ValidationError[], field: string, message: string) => {
  errors.push({ field, message })
}

const hasTrimmedValue = (value: unknown): value is string => {
  return typeof value === 'string' && value.trim().length > 0
}

const isValidMmDdYyyyFormat = (value: string): boolean => {
  return MM_DD_YYYY_REGEX.test(value)
}

const parseMmDdYyyy = (value: string): Date => {
  const [month, day, year] = value.split('/').map(Number)
  return new Date(year, month - 1, day)
}

const isRealCalendarDate = (value: string): boolean => {
  const [month, day, year] = value.split('/').map(Number)
  const dateObj = new Date(year, month - 1, day)

  return (
    dateObj.getFullYear() === year &&
    dateObj.getMonth() === month - 1 &&
    dateObj.getDate() === day
  )
}

const validateRequiredTextField = (
  errors: ValidationError[],
  field: string,
  value: string | undefined,
  message: string
) => {
  if (hasTrimmedValue(value)) return
  addError(errors, field, message)
}

const validateDescription = (errors: ValidationError[], description: string | undefined) => {
  if (!hasTrimmedValue(description)) {
    addError(errors, 'description', 'Description is required')
    return
  }

  if (description.trim().length >= 200) return

  addError(errors, 'description', 'Description must be at least 200 characters long')
}

const validateLink = (errors: ValidationError[], link: string | undefined) => {
  if (!hasTrimmedValue(link)) {
    addError(errors, 'link', 'Link is required')
    return
  }

  try {
    new URL(link)
  } catch {
    addError(errors, 'link', 'Link must be a valid URL')
  }
}

const validateStartDate = (errors: ValidationError[], dateStart: string | undefined) => {
  if (!hasTrimmedValue(dateStart)) {
    addError(errors, 'dateStart', 'Start date is required')
    return
  }

  if (!isValidMmDdYyyyFormat(dateStart)) {
    addError(errors, 'dateStart', 'Start date must be in MM/DD/YYYY format')
    return
  }

  if (isRealCalendarDate(dateStart)) return

  addError(errors, 'dateStart', 'Start date must be a valid date')
}

const validateEndDate = (
  errors: ValidationError[],
  dateStart: string | undefined,
  dateEnd: string | undefined
) => {
  if (!hasTrimmedValue(dateEnd)) return

  if (!isValidMmDdYyyyFormat(dateEnd)) {
    addError(errors, 'dateEnd', 'End date must be in MM/DD/YYYY format')
    return
  }

  if (!hasTrimmedValue(dateStart)) return
  if (!isValidMmDdYyyyFormat(dateStart)) return

  const startDate = parseMmDdYyyy(dateStart)
  const endDate = parseMmDdYyyy(dateEnd)

  if (endDate >= startDate) return

  addError(errors, 'dateEnd', 'End date must be after start date')
}

export const validateEvent = (data: Partial<Event>): ValidationResult => {
  const errors: ValidationError[] = []

  validateRequiredTextField(errors, 'title', data.title, 'Title is required')
  validateStartDate(errors, data.dateStart)
  validateRequiredTextField(errors, 'location', data.location, 'Location is required')
  validateRequiredTextField(errors, 'address', data.address, 'Address is required')
  validateDescription(errors, data.description)
  validateLink(errors, data.link)
  validateEndDate(errors, data.dateStart, data.dateEnd)

  return {
    isValid: errors.length === 0,
    errors
  }
}