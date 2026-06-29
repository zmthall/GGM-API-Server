// /config/notification.config.ts
import { CorrespondenceType } from '../types/notification';

export const NOTIFICATION_COUNTS_DOC = {
  collection: 'admin_meta',
  docId: 'correspondence_counts'
} as const;

export const NOTIFICATION_TYPE_BY_COLLECTION = {
  contact_messages: 'messages',
  ride_requests: 'ride_requests',
  consultation_requests: 'consultation_requests',
  job_applications: 'applications',
  job_applications_import_test: 'applications'
} as const

export const COUNTS_FIELD_BY_TYPE: Record<
  CorrespondenceType,
  'messagesNew'  | 'rideRequestsNew' | 'consultationRequestsNew' | 'applicationsNew'
> = {
  ride_requests: 'rideRequestsNew',
  messages: 'messagesNew',
  consultation_requests: 'consultationRequestsNew',
  applications: 'applicationsNew'
};

export const DEFAULT_NOTIFICATION_COUNTS = {
  rideRequestsNew: 0,
  messagesNew: 0,
  consultationRequestsNew: 0,
  applicationsNew: 0
} as const;