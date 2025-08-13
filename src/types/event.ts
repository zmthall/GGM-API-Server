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