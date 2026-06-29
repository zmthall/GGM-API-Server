// /types/notifications.ts
export type CorrespondenceType = 'messages' | 'ride_requests' | 'consultation_requests' | 'applications';

export type CorrespondenceStatus = 
  | "new"
  | "reviewing"
  | "scheduled"
  | "completed"
  | "declined"
  | "spam"
  | "closed"
  | "interviewed"
  | "do_not_hire"
  | "contacted"

export type NotificationCountsDoc = {
  messagesNew: number;
  rideRequestsNew: number;
  consultationRequestsNew: number;
  applicationsNew: number;
  updatedAt?: any;
};

export type NotificationCounts = {
  messagesNew: number;
  rideRequestsNew: number;
  consultationRequestsNew: number;
  applicationsNew: number;
  totalNew: number;
  updatedAt?: string;
};