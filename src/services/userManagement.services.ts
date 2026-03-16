import {
  createFirebaseUser,
  deleteFirebaseUser,
  updateFirebaseUser
} from '../helpers/firebase'
import {
  createUser as createUserProfile,
  deleteUser as deleteUserProfile,
  getUserById,
  listUsers,
  updateUser
} from '../helpers/database/users/users.db'
import { PaginatedResult, PaginationOptions } from '../types/pagination'
import type { UserProfile, UserRole } from '../types/user'
import { toSafeString } from '../helpers/safe'

const ALLOWED_ROLES = new Set<UserRole>(['admin', 'correspondence', 'user'])


function normalizeRole(role?: unknown): UserRole {
  const v = toSafeString(role ?? '').trim().toLowerCase()
  if (v === 'admin') return 'admin'
  if (v === 'correspondence') return 'correspondence'
  return 'user'
}

const toIsoString = (value: Date | string | number | null | undefined): string => {
  if (!value) return ''

  if (value instanceof Date) {
    return value.toISOString()
  }

  const parsed = new Date(value)
  if (!Number.isNaN(parsed.getTime())) {
    return parsed.toISOString()
  }

  return ''
}

const mapUserRecordToProfile = (record: {
  id: string
  email: string
  display_name: string
  role: string
  status: string
  created_at: Date
  created_by: string
  last_login: Date | null
  last_password_reset: Date | null
  updated_at: Date
  updated_by: string
}): UserProfile => {
  return {
    id: record.id,
    email: record.email,
    displayName: record.display_name,
    role: record.role as UserRole,
    status: record.status,
    created_at: toIsoString(record.created_at),
    created_by: record.created_by,
    lastLogin: record.last_login ? toIsoString(record.last_login) : undefined,
    lastPasswordReset: record.last_password_reset ? toIsoString(record.last_password_reset) : undefined,
    updated: {
      at: toIsoString(record.updated_at),
      by: record.updated_by
    }
  } as UserProfile
}

export const createUser = async (
  userData: { email: string; password: string; displayName?: string; role?: UserRole },
  createdByUid: string
): Promise<{ uid: string; email: string; displayName?: string; role: string }> => {
  try {
    const firebaseUser = await createFirebaseUser({
      email: userData.email,
      password: userData.password,
      displayName: userData.displayName
    })

    const role = normalizeRole(userData.role)

    await createUserProfile({
      id: firebaseUser.uid,
      email: userData.email,
      displayName: userData.displayName || '',
      role,
      status: 'active',
      createdBy: createdByUid,
      updatedBy: createdByUid,
      rawPayload: {}
    })

    return {
      uid: firebaseUser.uid,
      email: firebaseUser.email,
      displayName: firebaseUser.displayName ?? userData.displayName,
      role
    }
  } catch (error) {
    console.error('ERROR in createUser:', error)
    throw new Error(`Failed to create user: ${(error as Error).message}`)
  }
}

export const deleteUser = async (uid: string): Promise<void> => {
  try {
    await deleteFirebaseUser(uid)
    await deleteUserProfile(uid)
  } catch (error) {
    throw new Error(`Failed to delete user: ${(error as Error).message}`)
  }
}

export const disableUserToggle = async (
  uid: string,
  requester: string,
  disabled: boolean = true
): Promise<void> => {
  try {
    await updateFirebaseUser(uid, { disabled })

    await updateUser(uid, {
      status: disabled ? 'disabled' : 'active',
      updatedBy: requester
    })
  } catch (error) {
    throw new Error(`Failed to disable user: ${(error as Error).message}`)
  }
}

export const getAllUsers = async (
  options: PaginationOptions = {}
): Promise<PaginatedResult<UserProfile>> => {
  try {
    const page = Math.max(1, Number(options.page) || 1)
    const pageSize = Math.max(1, Number(options.pageSize) || 10)

    const records = await listUsers()
    const totalItems = records.length
    const totalPages = Math.max(1, Math.ceil(totalItems / pageSize))
    const startIndex = (page - 1) * pageSize
    const pagedRecords = records.slice(startIndex, startIndex + pageSize)

    return {
      data: pagedRecords.map(mapUserRecordToProfile),
      pagination: {
        currentPage: page,
        pageSize,
        totalItems,
        totalPages,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1
      }
    }
  } catch (error) {
    throw new Error(`Failed to get all users: ${(error as Error).message}`)
  }
}

export const updateUserRole = async (
  uid: string,
  roleInput: UserRole,
  requester: string
): Promise<{ id: string; role: string; updated: { at: string; by?: string } }> => {
  try {
    const role = normalizeRole(roleInput)

    if (!ALLOWED_ROLES.has(role)) {
      throw new Error(`Invalid role: ${role}`)
    }

    const updated = await updateUser(uid, {
      role,
      updatedBy: requester
    })

    if (!updated) {
      throw new Error('User not found.')
    }

    return {
      id: updated.id,
      role: updated.role,
      updated: {
        at: toIsoString(updated.updated_at),
        by: updated.updated_by
      }
    }
  } catch (error) {
    throw new Error(`Failed to update user role: ${(error as Error).message}`)
  }
}

export const updateLastLogin = async (
  uid: string
): Promise<{ id: string; lastLogin: string }> => {
  try {
    const loginDate = new Date()

    const updated = await updateUser(uid, {
      lastLogin: loginDate,
      updatedBy: uid
    })

    if (!updated) {
      throw new Error('User not found.')
    }

    return {
      id: updated.id,
      lastLogin: toIsoString(updated.last_login)
    }
  } catch (error) {
    throw new Error(`Failed to last login date: ${(error as Error).message}`)
  }
}

export const updateLastPasswordReset = async (
  uid: string
): Promise<{ id: string; lastPasswordReset: string }> => {
  try {
    const lastPasswordReset = new Date()

    const updated = await updateUser(uid, {
      lastPasswordReset,
      updatedBy: uid
    })

    if (!updated) {
      throw new Error('User not found.')
    }

    return {
      id: updated.id,
      lastPasswordReset: toIsoString(updated.last_password_reset)
    }
  } catch (error) {
    throw new Error(`Failed to last login date: ${(error as Error).message}`)
  }
}

export const getUserProfile = async (
  uid: string
): Promise<UserProfile | null> => {
  try {
    const result = await getUserById(uid)
    return result ? mapUserRecordToProfile(result) : null
  } catch (error) {
    throw new Error(`cannot get user profile: ${(error as Error).message}`)
  }
}

export const updateDisplayName = async (
  uid: string,
  newDisplayName: string,
  requester: string | undefined = undefined
): Promise<{ id: string; displayName: string }> => {
  try {
    const updated = await updateUser(uid, {
      displayName: newDisplayName,
      updatedBy: requester || uid
    })

    if (!updated) {
      throw new Error('User not found.')
    }

    return {
      id: updated.id,
      displayName: updated.display_name
    }
  } catch (error) {
    throw new Error(`Failed to last login date: ${(error as Error).message}`)
  }
}