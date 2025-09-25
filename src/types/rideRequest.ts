export interface RideRequestData {
  name: string;
  dob: string; // ISO date string
  phone: string;
  email: string;
  med_id: string; // Medicaid ID
  apt_date: string; // ISO date string  
  apt_time: string; // ISO time string
  pickup_address: string;
  dropoff_address: string;
  notes: string;
}

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