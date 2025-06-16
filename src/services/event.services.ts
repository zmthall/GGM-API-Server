// In-memory store for demo. Replace with DB logic.
const events: Record<string, any> = {};

export const createEvent = (data: any) => {
  const id = crypto.randomUUID();
  events[id] = { ...data, id, archived: false };
  return events[id];
};

export const getAllEvents = () => {
  return Object.values(events).filter(e => !e.archived);
};

export const getEventById = (id: string) => {
  return events[id];
};

export const updateEvent = (id: string, data: any) => {
  if (!events[id]) throw new Error('Not found');
  events[id] = { ...events[id], ...data };
  return events[id];
};

export const deleteEvent = (id: string) => {
  delete events[id];
};

export const archiveEvent = (id: string) => {
  if (!events[id]) throw new Error('Not found');
  events[id].archived = true;
  return events[id];
};