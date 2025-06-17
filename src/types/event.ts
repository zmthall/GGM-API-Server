import { QueryDocumentSnapshot, DocumentData } from 'firebase/firestore';

export type Event = {
    id: string;
    date: string;
    dateTo?: string;
    title: string;
    location: string;
    address: string;
    description: string;
    link: string;
    archived: boolean;
}

export type Events = Event[];

export interface PaginationOptions {
  pageSize?: number;
  lastDoc?: QueryDocumentSnapshot<DocumentData>;
  orderField?: string;
  orderDirection?: 'asc' | 'desc';
}

export interface PaginatedResult<T> {
  data: T[];
  hasNextPage: boolean;
  lastDocument?: QueryDocumentSnapshot<DocumentData>;
}