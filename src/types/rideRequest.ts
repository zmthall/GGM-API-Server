import { RideRequestData } from "./nodeMailer";

export interface RideRequestDocument extends RideRequestData {
  id: string;
  contact_type: string;
  tags: string[];
  created_at: string;
  status: RideRequestStatus;
  email_status?: string;
  email_sent_at?: string;
  message_id?: string;
  email_error?: string;
  email_failed_at?: string;
}

export type RideRequestStatus =
  | "new"
  | "reviewing"
  | "scheduled"
  | "spam"
  | "closed";