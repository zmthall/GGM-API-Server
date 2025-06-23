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

export const getPaginatedDocuments = async <T>(
  collectionName: string,
  filters: Record<string, any> = {},
  options: PaginationOptions = {}
): Promise<PaginatedResult<T>> => {
  try {
    const {
      pageSize = 10,
      lastDoc,
      orderField = 'date',
      orderDirection = 'desc'
    } = options;

    let query: FirebaseFirestore.Query<FirebaseFirestore.DocumentData> = firebaseDB.collection(collectionName);
    
    // Apply filters
    Object.entries(filters).forEach(([field, value]) => {
      query = query.where(field, '==', value);
    });

    // Add ordering and limit
    query = query.orderBy(orderField, orderDirection).limit(pageSize + 1);

    // Add pagination cursor if provided
    if (lastDoc) {
      query = query.startAfter(lastDoc);
    }

    const querySnapshot = await query.get();
    const docs = querySnapshot.docs;
    
    // Check if there's a next page
    const hasNextPage = docs.length > pageSize;
    
    // Remove the extra document if it exists
    const data = docs.slice(0, pageSize).map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as T[];

    // The last document for next pagination
    const lastDocument = docs.length > 0 ? docs[Math.min(docs.length - 1, pageSize - 1)] : undefined;

    return {
      data,
      hasNextPage,
      lastDocument: hasNextPage ? lastDocument : undefined
    };
  } catch (error) {
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