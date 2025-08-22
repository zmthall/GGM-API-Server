// /types/nodeMailer.ts
export interface EmailMessage {
  to: string | string[];
  cc?: string | string[];
  bcc?: string | string[];
  subject: string;
  text?: string;
  html?: string;
  from?: string;
  attachments?: Array<{
    filename: string;
    path?: string;
    content?: Buffer | string;
    contentType?: string;
  }>;
}

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