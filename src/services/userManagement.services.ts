import { createDocumentWithId, createFirebaseUser, deleteDocument, deleteFirebaseUser, getAllDocuments, getDocument, updateDocument } from "../helpers/firebase";
import type { UserProfile } from "../types/user";

export const createUser = async (
  userData: { email: string; password: string; displayName?: string; role?: 'admin' | 'user' },
  createdByUid: string
): Promise<{ uid: string; email: string; displayName?: string; role: string }> => {
  try {
    // Create user in Firebase Auth
    const firebaseUser = await createFirebaseUser({
      email: userData.email,
      password: userData.password,
      displayName: userData.displayName
    });

    // Create user profile in Firestore
    const userProfile = {
      email: userData.email,
      displayName: userData.displayName || '',
      role: userData.role || 'user',
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
    // Delete user from Firebase Auth
    await deleteFirebaseUser(uid);

    // Delete user profile from Firestore
    await deleteDocument('users', uid);
  } catch (error) {
    throw new Error(`Failed to delete user: ${(error as Error).message}`);
  }
};

export const getAllUsers = async (): Promise<any[]> => {
  try {
    const users = await getAllDocuments('users');
    return users;
  } catch (error) {
    throw new Error(`Failed to get all users: ${(error as Error).message}`);
  }
};

export const updateUserRole = async (
  uid: string, 
  role: 'admin' | 'user'
): Promise<{ id: string; role: string; updated_at: string }> => {
  try {
    const updateData = {
      role,
      updated_at: new Date().toISOString()
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
  
    const result = await updateDocument('users', uid, {lastLogin: loginDate});
  
    return result;
  } catch (error) {
    throw new Error(`Failed to last login date: ${(error as Error).message}`);
  }
}

export const updateLastPasswordReset = async (uid: string):
Promise<{ id: string; lastPasswordReset: string; }> => { 
  try {
    const lastPasswordReset = (new Date()).toISOString();
  
    const result = await updateDocument('users', uid, {lastPasswordReset});
  
    return result;
  } catch (error) {
    throw new Error(`Failed to last login date: ${(error as Error).message}`);
  }
}

export const getUserProfile = async (uid: string): 
Promise<UserProfile | null> => {
  try {
    const result = await getDocument('users', uid)

    return result as UserProfile | null;
  } catch (error) {
    throw new Error(`cannot get user profile: ${(error as Error).message}`)
  }
} 


export const updateDisplayName = async (uid: string, newDisplayName: string):
Promise<{ id: string; displayName: string; }> => { 
  try {
    const result = await updateDocument('users', uid, {displayName: newDisplayName});
  
    return result;
  } catch (error) {
    throw new Error(`Failed to last login date: ${(error as Error).message}`);
  }
}