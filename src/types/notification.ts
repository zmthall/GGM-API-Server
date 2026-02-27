// /types/notifications.ts
export type CorrespondenceType = 'ride_requests' | 'messages' | 'applications';

export type CorrespondenceStatus = 
  | "new"
  | "reviewing"
  | "scheduled"
  | "spam"
  | "closed"
  | "interviewed"
  | "do_not_hire"
  | "contacted"

export type NotificationCountsDoc = {
  rideRequestsNew: number;
  messagesNew: number;
  applicationsNew: number;
  updatedAt?: any;
};

export type NotificationCounts = {
  rideRequestsNew: number;
  messagesNew: number;
  applicationsNew: number;
  totalNew: number;
  updatedAt?: string;
};