import { ContactFormData } from "./nodeMailer";

export interface ContactFormDocument extends ContactFormData {
  id: string;
  contact_type: string;
  tags: string[];
  created_at: string;
  status: string;
  email_status?: string;
  email_sent_at?: string;
  message_id?: string;
  email_error?: string;
  email_failed_at?: string;
}