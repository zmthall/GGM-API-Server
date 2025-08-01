// helpers/firebaseHelpers.ts
import { firebaseAuth, firebaseDB } from '../config/firebase';
import type { FirebaseDocument, CreateDocumentResult } from '../types/firebase';
import { v4 as uuidv4 } from 'uuid';
import type { PaginatedResult, PaginationOptions } from '../types/event';

export const createDocument = async <T extends Record<string, any>>(
  collectionName: string, 
  data: T
): Promise<CreateDocumentResult<T>> => {
  try {
    const customId = uuidv4();
    const docRef = firebaseDB.collection(collectionName).doc(customId);
    await docRef.set(data);
    return { id: customId, data };
  } catch (error) {
    throw new Error(`Error creating document: ${(error as Error).message}`);
  }
};

export const createDocumentWithId = async <T extends Record<string, any>>(
  collectionName: string,
  customId: string,
  data: T
): Promise<CreateDocumentResult<T>> => {
  try {
    const docRef = firebaseDB.collection(collectionName).doc(customId);
    await docRef.set(data);
    return { id: customId, data };
  } catch (error) {
    throw new Error(`Error creating document: ${(error as Error).message}`);
  }
};

export const getDocument = async <T = Record<string, any>>(
  collectionName: string, 
  docId: string
): Promise<FirebaseDocument | null> => {
  try {
    const docRef = firebaseDB.collection(collectionName).doc(docId);
    const docSnap = await docRef.get();
    return docSnap.exists ? { id: docSnap.id, ...docSnap.data() } : null;
  } catch (error) {
    throw new Error(`Error getting document: ${(error as Error).message}`);
  }
};

export const getAllDocuments = async <T = Record<string, any>>(
  collectionName: string
): Promise<FirebaseDocument[]> => {
  try {
    const querySnapshot = await firebaseDB.collection(collectionName).get();
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    throw new Error(`Error getting documents: ${(error as Error).message}`);
  }
};

// Simple approach: Get all documents and sort in JavaScript
export const getPaginatedDocuments = async <T>(
  collectionName: string,
  filters: Record<string, any> = {},
  options: PaginationOptions = {}
): Promise<PaginatedResult<T>> => {
  try {
    const {
      pageSize = 10,
      page = 1,
      orderField = 'date',
      orderDirection = 'desc'
    } = options;

    let query: FirebaseFirestore.Query<FirebaseFirestore.DocumentData> = firebaseDB.collection(collectionName);
    
    // Apply filters
    Object.entries(filters).forEach(([field, value]) => {
      query = query.where(field, '==', value);
    });

    // Get ALL documents (for small datasets this is fine)
    const querySnapshot = await query.get();
    const allDocs = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as T[];

    // Sort in JavaScript
    const sortedDocs = allDocs.sort((a, b) => {
      const fieldA = (a as any)[orderField];
      const fieldB = (b as any)[orderField];
      
      // Handle different data types
      let valueA, valueB;
      
      if (fieldA instanceof Date) {
        valueA = fieldA.getTime();
      } else if (typeof fieldA === 'string') {
        // Try to parse as date if it looks like an ISO string
        const dateA = new Date(fieldA);
        valueA = isNaN(dateA.getTime()) ? fieldA : dateA.getTime();
      } else {
        valueA = fieldA;
      }
      
      if (fieldB instanceof Date) {
        valueB = fieldB.getTime();
      } else if (typeof fieldB === 'string') {
        // Try to parse as date if it looks like an ISO string
        const dateB = new Date(fieldB);
        valueB = isNaN(dateB.getTime()) ? fieldB : dateB.getTime();
      } else {
        valueB = fieldB;
      }

      if (orderDirection === 'asc') {
        return valueA > valueB ? 1 : -1;
      } else {
        return valueA < valueB ? 1 : -1;
      }
    });

    // Apply pagination
    const startIndex = (page - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    const pageData = sortedDocs.slice(startIndex, endIndex);
    
    // CORRECT logic: Check if there are more documents beyond this page
    const hasNextPage = endIndex < sortedDocs.length;
    const hasPreviousPage = page > 1;

    return {
      data: pageData,
      pagination: {
        currentPage: page,
        pageSize,
        hasNextPage,
        hasPreviousPage,
        totalPages: Math.ceil(sortedDocs.length / pageSize),
        totalCount: sortedDocs.length
      }
    };
  } catch (error) {
    console.error('Pagination error:', error);
    throw new Error(`Failed to fetch paginated documents: ${(error as Error).message}`);
  }
};

export const getDocumentsByDateRange = async <T = Record<string, any>>(
  collectionName: string,
  dateField: string,
  startDate: string,
  endDate: string,
  additionalFilters: Record<string, any> = {}
): Promise<FirebaseDocument[]> => {
  try {
    let query: FirebaseFirestore.Query<FirebaseFirestore.DocumentData> = firebaseDB.collection(collectionName);
    
    // Apply date range filters
    query = query.where(dateField, '>=', startDate);
    query = query.where(dateField, '<=', endDate);
    
    // Apply additional filters
    Object.entries(additionalFilters).forEach(([field, value]) => {
      query = query.where(field, '==', value);
    });
    
    // Order by the date field
    query = query.orderBy(dateField, 'desc');
    
    const querySnapshot = await query.get();
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    throw new Error(`Error getting documents by date range: ${(error as Error).message}`);
  }
};

export const getPaginatedDocumentsByDateRange = async <T>(
  collectionName: string,
  dateField: string,
  startDate: string,
  endDate: string,
  additionalFilters: Record<string, any> = {},
  options: PaginationOptions = {}
): Promise<PaginatedResult<T>> => {
  try {
    const {
      pageSize = 10,
      page = 1,
      orderDirection = 'desc'
    } = options;

    let query: FirebaseFirestore.Query<FirebaseFirestore.DocumentData> = firebaseDB.collection(collectionName);
    
    // Apply date range filters
    query = query.where(dateField, '>=', startDate);
    query = query.where(dateField, '<=', endDate);
    
    // Apply additional filters
    Object.entries(additionalFilters).forEach(([field, value]) => {
      query = query.where(field, '==', value);
    });
    
    // Order by the date field
    query = query.orderBy(dateField, orderDirection);
    
    // Get all documents (for small datasets this is fine)
    const querySnapshot = await query.get();
    const allDocs = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as T[];

    // Apply pagination
    const startIndex = (page - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    const pageData = allDocs.slice(startIndex, endIndex);
    
    const hasNextPage = endIndex < allDocs.length;
    const hasPreviousPage = page > 1;

    return {
      data: pageData,
      pagination: {
        currentPage: page,
        pageSize,
        hasNextPage,
        hasPreviousPage,
        totalPages: Math.ceil(allDocs.length / pageSize),
        totalCount: allDocs.length
      }
    };
  } catch (error) {
    console.error('Date range pagination error:', error);
    throw new Error(`Failed to fetch paginated documents by date range: ${(error as Error).message}`);
  }
};

export const getDocumentsByField = async <T = Record<string, any>>(
  collectionName: string,
  fieldName: string,
  fieldValue: any
): Promise<FirebaseDocument[]> => {
  try {
    const querySnapshot = await firebaseDB
      .collection(collectionName)
      .where(fieldName, '==', fieldValue)
      .get();
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    throw new Error(`Error getting documents by field: ${(error as Error).message}`);
  }
};

export const getFirstDocumentByField = async <T = Record<string, any>>(
  collectionName: string,
  fieldName: string,
  fieldValue: any
): Promise<FirebaseDocument | null> => {
  try {
    const querySnapshot = await firebaseDB
      .collection(collectionName)
      .where(fieldName, '==', fieldValue)
      .limit(1)
      .get();
    return querySnapshot.docs.length > 0 
      ? { id: querySnapshot.docs[0].id, ...querySnapshot.docs[0].data() }
      : null;
  } catch (error) {
    throw new Error(`Error getting document by field: ${(error as Error).message}`);
  }
};

export const getDocumentsByFieldWithOperator = async <T = Record<string, any>>(
  collectionName: string,
  fieldName: string,
  operator: '<' | '<=' | '==' | '!=' | '>=' | '>' | 'array-contains' | 'array-contains-any' | 'in' | 'not-in',
  fieldValue: any
): Promise<FirebaseDocument[]> => {
  try {
    const querySnapshot = await firebaseDB
      .collection(collectionName)
      .where(fieldName, operator, fieldValue)
      .get();
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    throw new Error(`Error getting documents by field with operator: ${(error as Error).message}`);
  }
};

export const updateDocument = async <T extends Partial<Record<string, any>>>(
  collectionName: string, 
  docId: string, 
  data: T
): Promise<{ id: string } & T> => {
  try {
    const docRef = firebaseDB.collection(collectionName).doc(docId);
    await docRef.update(data);
    return { id: docId, ...data };
  } catch (error) {
    throw new Error(`Error updating document: ${(error as Error).message}`);
  }
};

export const deleteDocument = async (
  collectionName: string, 
  docId: string
): Promise<void> => {
  try {
    const docRef = firebaseDB.collection(collectionName).doc(docId);
    await docRef.delete();
  } catch (error) {
    throw new Error(`Error deleting document: ${(error as Error).message}`);
  }
};

// For more complex queries, you can chain methods directly
export const queryDocuments = async <T = Record<string, any>>(
  collectionName: string,
  queryBuilder: (ref: FirebaseFirestore.CollectionReference) => FirebaseFirestore.Query
): Promise<FirebaseDocument[]> => {
  try {
    const collectionRef = firebaseDB.collection(collectionName);
    const query = queryBuilder(collectionRef);
    const querySnapshot = await query.get();
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    throw new Error(`Error querying documents: ${(error as Error).message}`);
  }
};

export const saveEmailData = async <T extends Record<string, any>>(
  emailData: T,
  collectionName: string = 'contact_messages',
  options: {
    contact_type?: string;
    tags?: string[];
    status?: string;
    additionalFields?: Record<string, any>;
  } = {}
): Promise<{ id: string; data: any }> => {
  try {
    const {
      contact_type = 'Contact Form',
      tags = [],
      status = 'new',
      additionalFields = {}
    } = options;

    const documentData = {
      contact_type,
      ...emailData,
      tags,
      created_at: new Date().toISOString(),
      status,
      ...additionalFields
    };

    const result = await createDocument(collectionName, documentData);
    return result;
  } catch (error) {
    throw new Error(`Failed to save email data: ${(error as Error).message}`);
  }
};

// user related helpers
export const createFirebaseUser = async (userData: {
  email: string;
  password: string;
  displayName?: string;
}): Promise<{ uid: string; email: string; displayName?: string }> => {
  try {
    const userRecord = await firebaseAuth.createUser({
      email: userData.email,
      password: userData.password,
      displayName: userData.displayName,
      emailVerified: false
    });

    return {
      uid: userRecord.uid,
      email: userRecord.email || userData.email,
      displayName: userRecord.displayName
    };
  } catch (error) {
    throw new Error(`Error creating Firebase user: ${(error as Error).message}`);
  }
};

export const generateEmailVerification = async (email: string): Promise<string> => {
  try {
    const link = await firebaseAuth.generateEmailVerificationLink(email);
    
    console.log(`Verification email link generated for user ${email}: ${link}`);
    return link;
  } catch (error) {
    throw new Error(`Error generating verification email: ${(error as Error).message}`);
  }
};

export const generatePasswordReset = async (email: string): Promise<string> => {
  try {
    const link = await firebaseAuth.generatePasswordResetLink(email);
    console.log(`Password reset link generated for ${email}: ${link}`);
    return link;
  } catch (error) {
    throw new Error(`Error generating password reset: ${(error as Error).message}`);
  }
};

export const deleteFirebaseUser = async (uid: string): Promise<void> => {
  try {
    await firebaseAuth.deleteUser(uid);
  } catch (error) {
    throw new Error(`Error deleting Firebase user: ${(error as Error).message}`);
  }
};

export const updateFirebaseUser = async (
  uid: string, 
  updates: { email?: string; displayName?: string; password?: string }
): Promise<void> => {
  try {
    await firebaseAuth.updateUser(uid, updates);
  } catch (error) {
    throw new Error(`Error updating Firebase user: ${(error as Error).message}`);
  }
};

export const testAdminSDK = async () => {
  try {
    const listUsers = await firebaseAuth.listUsers(1);
    console.log('Admin SDK working - found users:', listUsers.users.length);
    return true;
  } catch (error) {
    console.error('Admin SDK error:', error);
    return false;
  }
};