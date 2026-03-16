import { Lead, LeadStatus } from '../types/lead';

export interface ValidationError {
  field: string;
  message: string;
}

export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
}

export const validateLead = (data: Partial<Lead>): ValidationResult => {
  const errors: ValidationError[] = []

  validateLeadName(data, errors)
  validateLeadContactPresence(data, errors)
  validateLeadEmail(data, errors)
  validateLeadPhone(data, errors)
  validateLeadStatus(data, errors)
  validateLeadCreationDate(data, errors)
  validateLeadTags(data, errors)
  validateLeadNotes(data, errors)
  validateLeadSource(data, errors)

  return {
    isValid: errors.length === 0,
    errors
  }
}

const pushLeadError = (
  errors: ValidationError[],
  field: string,
  message: string
) => {
  errors.push({ field, message })
}

const hasText = (value: unknown): value is string => {
  return typeof value === 'string' && value.trim().length > 0
}

const validateLeadName = (
  data: Partial<Lead>,
  errors: ValidationError[]
) => {
  if (hasText(data.name)) return
  pushLeadError(errors, 'name', 'Name is required')
}

const validateLeadContactPresence = (
  data: Partial<Lead>,
  errors: ValidationError[]
) => {
  const hasEmail = hasText(data.email)
  const hasPhone = hasText(data.phone)

  if (hasEmail || hasPhone) return

  pushLeadError(errors, 'contact', 'Either email or phone number is required')
}

const validateLeadEmail = (
  data: Partial<Lead>,
  errors: ValidationError[]
) => {
  if (!hasText(data.email)) return

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (emailRegex.test(data.email.trim())) return

  pushLeadError(errors, 'email', 'Email must be in valid format')
}

const validateLeadPhone = (
  data: Partial<Lead>,
  errors: ValidationError[]
) => {
  if (!hasText(data.phone)) return

  const phoneRegex = /^[+]?[\d\s\-()]{10,}$/
  if (phoneRegex.test(data.phone.trim())) return

  pushLeadError(errors, 'phone', 'Phone number must be valid')
}

const validateLeadStatus = (
  data: Partial<Lead>,
  errors: ValidationError[]
) => {
  if (!data.status) return

  const validStatuses: LeadStatus[] = ['New', 'Reviewed', 'Contacted', 'Qualified', 'Converted', 'Lost', 'Spam']
  if (validStatuses.includes(data.status)) return

  pushLeadError(errors, 'status', 'Status must be a valid lead status')
}

const validateLeadCreationDate = (
  data: Partial<Lead>,
  errors: ValidationError[]
) => {
  if (!data.creation_date) return

  const dateObj = new Date(data.creation_date)
  if (!Number.isNaN(dateObj.getTime())) return

  pushLeadError(errors, 'contact_date', 'Contact date must be a valid date')
}

const validateLeadTags = (
  data: Partial<Lead>,
  errors: ValidationError[]
) => {
  if (!data.tag) return

  if (!Array.isArray(data.tag)) {
    pushLeadError(errors, 'tag', 'Tags must be an array')
    return
  }

  data.tag.forEach((tag, index) => {
    if (typeof tag === 'string' && tag.trim()) return
    pushLeadError(errors, `tag[${index}]`, 'Tags must be non-empty strings')
  })
}

const validateLeadNotes = (
  data: Partial<Lead>,
  errors: ValidationError[]
) => {
  if (!hasText(data.notes)) return
  if (data.notes.trim().length <= 1000) return

  pushLeadError(errors, 'notes', 'Notes must be less than 1000 characters')
}

const validateLeadSource = (
  data: Partial<Lead>,
  errors: ValidationError[]
) => {
  if (!hasText(data.source)) return
  if (data.source.trim().length <= 100) return

  pushLeadError(errors, 'source', 'Source must be less than 100 characters')
}