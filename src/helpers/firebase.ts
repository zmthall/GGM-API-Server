// helpers/firebaseHelpers.ts
import { firebaseDB } from '../config/firebase';
import { 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  getDocs, 
  updateDoc, 
  deleteDoc, 
  query, 
  orderBy,
  limit,
  startAfter,
  where,
  DocumentData,
  QueryConstraint,
  Query
} from 'firebase/firestore';
import type { FirebaseDocument, CreateDocumentResult } from '../types/firebase';
import { v4 as uuidv4 } from 'uuid';
import type { PaginatedResult, PaginationOptions } from '../types/event';

export const createDocument = async <T extends DocumentData>(
  collectionName: string, 
  data: T
): Promise<CreateDocumentResult<T>> => {
  try {
    const customId = uuidv4(); // Generate your own UUID
    const docRef = doc(firebaseDB, collectionName, customId);
    await setDoc(docRef, data);
    return { id: customId, data };
  } catch (error) {
    throw new Error(`Error creating document: ${(error as Error).message}`);
  }
};

// Optional: If you want to pass your own ID
export const createDocumentWithId = async <T extends DocumentData>(
  collectionName: string,
  customId: string,
  data: T
): Promise<CreateDocumentResult<T>> => {
  try {
    const docRef = doc(firebaseDB, collectionName, customId);
    await setDoc(docRef, data);
    return { id: customId, data };
  } catch (error) {
    throw new Error(`Error creating document: ${(error as Error).message}`);
  }
};

export const getDocument = async <T = DocumentData>(
  collectionName: string, 
  docId: string
): Promise<FirebaseDocument | null> => {
  try {
    const docRef = doc(firebaseDB, collectionName, docId);
    const docSnap = await getDoc(docRef);
    return docSnap.exists() ? { id: docSnap.id, ...docSnap.data() } : null;
  } catch (error) {
    throw new Error(`Error getting document: ${(error as Error).message}`);
  }
};

export const getAllDocuments = async <T = DocumentData>(
  collectionName: string
): Promise<FirebaseDocument[]> => {
  try {
    const querySnapshot = await getDocs(collection(firebaseDB, collectionName));
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

    const collectionRef = collection(firebaseDB, collectionName);
    
    // Build base query with filters
    let q: Query = collectionRef;
    
    // Apply filters
    Object.entries(filters).forEach(([field, value]) => {
      q = query(q, where(field, '==', value));
    });

    // Add ordering and limit
    q = query(q, orderBy(orderField, orderDirection), limit(pageSize + 1));

    // Add pagination cursor if provided
    if (lastDoc) {
      q = query(q, startAfter(lastDoc));
    }

    const querySnapshot = await getDocs(q);
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

export const updateDocument = async <T extends Partial<DocumentData>>(
  collectionName: string, 
  docId: string, 
  data: T
): Promise<{ id: string } & T> => {
  try {
    const docRef = doc(firebaseDB, collectionName, docId);
    await updateDoc(docRef, data);
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
    const docRef = doc(firebaseDB, collectionName, docId);
    await deleteDoc(docRef);
  } catch (error) {
    throw new Error(`Error deleting document: ${(error as Error).message}`);
  }
};

export const queryDocuments = async <T = DocumentData>(
  collectionName: string,
  ...constraints: QueryConstraint[]
): Promise<FirebaseDocument[]> => {
  try {
    const q = query(collection(firebaseDB, collectionName), ...constraints);
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    throw new Error(`Error querying documents: ${(error as Error).message}`);
  }
};