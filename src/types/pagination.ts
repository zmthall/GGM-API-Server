export interface PaginationOptions {
  page?: number;
  pageSize?: number;
  orderField?: string;
  orderDirection?: 'asc' | 'desc';
  lastDoc?: FirebaseFirestore.DocumentSnapshot; // More specific type
}

export interface PaginatedDocumentResult<T> {
  data: T[];
  totalCount: number;
  // ... other existing properties
}

export interface PaginationMeta {
  currentPage: number;
  pageSize: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
  totalPages?: number;
  totalCount?: number;
}

export interface PaginatedResult<T> {
  data: T[];
  pagination: PaginationMeta;
}