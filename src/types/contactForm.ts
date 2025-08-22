export interface ContactFormData {
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  reason: string;
  contact_method: string;
  message: string;
}

export interface ContactFormDocument extends ContactFormData {
  id: string;
  contact_type: string;
  tags: string[];
  created_at: string;
  status: ContactFormStatus;
  email_status?: string;
  email_sent_at?: string;
  message_id?: string;
  email_error?: string;
  email_failed_at?: string;
}

export type ContactFormStatus =
  | "new"
  | "reviewing"
  | "contacted"
  | "spam"
  | "closed";
