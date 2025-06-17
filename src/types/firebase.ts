export interface FirebaseDocument {
  id: string;
  [key: string]: any;
}

export interface CreateDocumentResult<T = any> {
  id: string;
  data: T;
}