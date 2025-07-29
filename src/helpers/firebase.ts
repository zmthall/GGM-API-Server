// helpers/firebaseHelpers.ts
import { firebaseDB } from '../config/firebase';
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
    
    // Check if there are more pages
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