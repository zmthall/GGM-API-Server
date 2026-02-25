import {
  createDocumentWithId,
  createFirebaseUser,
  deleteDocument,
  deleteFirebaseUser,
  getPaginatedDocuments,
  getDocument,
  updateDocument,
  updateFirebaseUser
} from "../helpers/firebase";
import { PaginatedResult, PaginationOptions } from "../types/pagination";
import type { UserProfile, UserRole } from "../types/user";

const ALLOWED_ROLES: UserRole[] = ['admin', 'correspondence', 'user'];

function normalizeRole(role?: unknown): UserRole {
  const v = String(role ?? '').trim().toLowerCase();
  if (v === 'admin') return 'admin';
  if (v === 'correspondence') return 'correspondence';
  return 'user';
}

export const createUser = async (
  userData: { email: string; password: string; displayName?: string; role?: UserRole },
  createdByUid: string
): Promise<{ uid: string; email: string; displayName?: string; role: string }> => {
  try {
    // Create user in Firebase Auth
    const firebaseUser = await createFirebaseUser({
      email: userData.email,
      password: userData.password,
      displayName: userData.displayName
    });

    const role = normalizeRole(userData.role);

    // Create user profile in Firestore
    const userProfile = {
      email: userData.email,
      displayName: userData.displayName || '',
      role,
      status: 'active',
      created_at: new Date().toISOString(),
      created_by: createdByUid
    };

    await createDocumentWithId('users', firebaseUser.uid, userProfile);

    return {
      uid: firebaseUser.uid,
      email: firebaseUser.email,
      displayName: firebaseUser.displayName,
      role: userProfile.role
    };
  } catch (error) {
    console.error('ERROR in createUser:', error);
    throw new Error(`Failed to create user: ${(error as Error).message}`);
  }
};

export const deleteUser = async (uid: string): Promise<void> => {
  try {
    await deleteFirebaseUser(uid);
    await deleteDocument('users', uid);
  } catch (error) {
    throw new Error(`Failed to delete user: ${(error as Error).message}`);
  }
};

export const disableUserToggle = async (uid: string, disabled: boolean = true, requester: string): Promise<void> => {
  try {
    await updateFirebaseUser(uid, { disabled });

    const updateData = {
      status: disabled ? 'disabled' : 'active',
      updated: {
        at: new Date().toISOString(),
        by: requester
      }
    };

    await updateDocument('users', uid, updateData);
  } catch (error) {
    throw new Error(`Failed to disable user: ${(error as Error).message}`);
  }
};

export const getAllUsers = async (options: PaginationOptions = {}): Promise<PaginatedResult<UserProfile>> => {
  try {
    const page = options.page || 1;
    const pageSize = options.pageSize || 10;

    const result = await getPaginatedDocuments<UserProfile>(
      'users',
      {},
      {},
      {
        pageSize,
        page,
        orderField: 'created_at',
        orderDirection: 'desc',
        ...options
      }
    );

    return {
      data: result.data,
      pagination: result.pagination
    };
  } catch (error) {
    throw new Error(`Failed to get all users: ${(error as Error).message}`);
  }
};

export const updateUserRole = async (
  uid: string,
  roleInput: UserRole,
  requester: string
): Promise<{ id: string; role: string; updated: { at: string; by?: string } }> => {
  try {
    const role = normalizeRole(roleInput);

    if (!ALLOWED_ROLES.includes(role)) {
      throw new Error(`Invalid role: ${role}`);
    }

    const updateData = {
      role,
      updated: {
        at: new Date().toISOString(),
        by: requester
      }
    };

    const result = await updateDocument('users', uid, updateData);
    return result;
  } catch (error) {
    throw new Error(`Failed to update user role: ${(error as Error).message}`);
  }
};

export const updateLastLogin = async (uid: string):
Promise<{ id: string; lastLogin: string; }> => {
  try {
    const loginDate = (new Date()).toISOString();
    const result = await updateDocument('users', uid, { lastLogin: loginDate });
    return result;
  } catch (error) {
    throw new Error(`Failed to last login date: ${(error as Error).message}`);
  }
};

export const updateLastPasswordReset = async (uid: string):
Promise<{ id: string; lastPasswordReset: string; }> => {
  try {
    const lastPasswordReset = (new Date()).toISOString();
    const result = await updateDocument('users', uid, { lastPasswordReset });
    return result;
  } catch (error) {
    throw new Error(`Failed to last login date: ${(error as Error).message}`);
  }
};

export const getUserProfile = async (uid: string):
Promise<UserProfile | null> => {
  try {
    const result = await getDocument('users', uid);
    return result as UserProfile | null;
  } catch (error) {
    throw new Error(`cannot get user profile: ${(error as Error).message}`);
  }
};

export const updateDisplayName = async (uid: string, newDisplayName: string, requester: string | undefined = undefined):
Promise<{ id: string; displayName: string; }> => {
  try {
    const updateData = {
      displayName: newDisplayName,
      updated: {
        at: new Date().toISOString(),
        by: requester || uid
      }
    };
    const result = await updateDocument('users', uid, updateData);
    return result;
  } catch (error) {
    throw new Error(`Failed to last login date: ${(error as Error).message}`);
  }
};