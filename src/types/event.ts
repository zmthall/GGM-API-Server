// types/event.ts
import * as admin from 'firebase-admin';

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
  lastDoc?: admin.firestore.QueryDocumentSnapshot<admin.firestore.DocumentData>;
  orderField?: string;
  orderDirection?: 'asc' | 'desc';
}

export interface PaginatedResult<T> {
  data: T[];
  hasNextPage: boolean;
  lastDocument?: admin.firestore.QueryDocumentSnapshot<admin.firestore.DocumentData>;
}