// types/event.ts
export type Event = {
    id: string;
    dateStart: string;
    dateEnd?: string;
    title: string;
    location: string;
    address: string;
    description: string;
    link: string;
    archived: boolean;
}

export type Events = Event[];