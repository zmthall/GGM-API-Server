// /config/notification.config.ts
import { CorrespondenceType } from '../types/notification';

export const NOTIFICATION_COUNTS_DOC = {
  collection: 'admin_meta',
  docId: 'correspondence_counts'
} as const;

export const NOTIFICATION_TYPE_BY_COLLECTION = {
  ride_requests: 'ride_requests',
  contact_messages: 'messages',
  job_applications: 'applications'
} as const

export const COUNTS_FIELD_BY_TYPE: Record<
  CorrespondenceType,
  'rideRequestsNew' | 'messagesNew' | 'applicationsNew'
> = {
  ride_requests: 'rideRequestsNew',
  messages: 'messagesNew',
  applications: 'applicationsNew'
};

export const DEFAULT_NOTIFICATION_COUNTS = {
  rideRequestsNew: 0,
  messagesNew: 0,
  applicationsNew: 0
} as const;