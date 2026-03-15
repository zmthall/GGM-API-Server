export const toSafeString = (value: unknown): string => {
  return typeof value === 'string' ? value : ''
}

export const toSafeBoolean = (value: unknown): boolean => {
  return typeof value === 'boolean' ? value : false
}

export const toSafeDate = (value: unknown): Date => {
  if (value instanceof Date) {
    return value
  }

  if (typeof value === 'string' || typeof value === 'number') {
    const parsed = new Date(value)
    if (!Number.isNaN(parsed.getTime())) {
      return parsed
    }
  }

  return new Date(0)
}

export const toSafeNullableDate = (value: unknown): Date | null => {
  if (value == null) {
    return null
  }

  if (value instanceof Date) {
    return value
  }

  if (typeof value === 'string' || typeof value === 'number') {
    const parsed = new Date(value)
    if (!Number.isNaN(parsed.getTime())) {
      return parsed
    }
  }

  return null
}

export const toSafeStringArray = (value: unknown): string[] => {
  if (!Array.isArray(value)) return []
  return value.filter((item): item is string => typeof item === 'string')
}

export const toSafeObject = (value: unknown): Record<string, unknown> => {
  if (value && typeof value === 'object' && !Array.isArray(value)) {
    return value as Record<string, unknown>
  }

  return {}
}