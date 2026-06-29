export interface ConsultationFormData {
  personal_information: {
    first_name: string;
    last_name: string;
    email: string;
    phone: string;
    contact_method: 'email' | 'phone';
  };
  individual_care_information: {
    person_seeking_care: {
      value: 'self' | 'parent' | 'family-member' | 'friend' | 'client-patient' | 'other';
      other: string;
    };
    age_range: '18-40' | '40-55' | '55-65' | '65-75' | '75+' | 'no-answer';
    insurance_type: {
      value: 'medicaid' | 'medicare' | 'private-insurance' | 'va-benefits' | 'unknown' | 'other';
      other: string;
    };
    questions: {
      name: string;
      label: string;
      value: 'yes' | 'no' | 'unsure';
    }[];
    placement: 'immediate' | '30-days' | '1-3-months' | 'exploring';
  };
  message: string;
}

export interface CondensedConsultationData {
    first_name: string;
    last_name: string; 
    email: string;
    phone: string;
    contact_method: 'email' | 'phone';
    person_seeking_care: {
      value: 'self' | 'parent' | 'family-member' | 'friend' | 'client-patient' | 'other';
      other: string;
    };
    age_range: '18-40' | '40-55' | '55-65' | '65-75' | '75+' | 'no-answer';
    insurance_type: {
      value: 'medicaid' | 'medicare' | 'private-insurance' | 'va-benefits' | 'unknown' | 'other';
      other: string;
    };
    questions: {
      name: string;
      label: string;
      value: 'yes' | 'no' | 'unsure';
    }[];
    placement: 'immediate' | '30-days' | '1-3-months' | 'exploring';
    message: string;
}

export type ConsultationFormStatus =
  | "new"
  | "reviewing"
  | "contacted"
  | "spam"
  | "closed";

export interface ConsultationFormDocument extends CondensedConsultationData {
  id: string;
  contact_type: string;
  tags: string[];
  created_at: Date;
  status: ConsultationFormStatus;
  email_status?: string;
  email_sent_at?: Date | null;
  message_id?: string;
  email_error?: string;
  email_failed_at?: Date;
  updated_at: Date;
}

export interface ConsultationMessageRecord extends ConsultationFormDocument{
  email_status: string;
  tags: string[]
  raw_payload: Record<string, unknown>
}

export interface CreateConsultationRequestInput extends CondensedConsultationData {
  id: string
  contact_type?: string
  createdAt?: Date

  emailSentAt?: Date | null
  emailStatus?: string
  messageId?: string
  emailError?: string
  emailFailedAt?: Date | null

  status?: ConsultationFormStatus
  tags?: string[]
  rawPayload?: Record<string, unknown>
}

export interface UpdateConsultationRequestInput {
  contactMethod?: 'email' | 'phone'
  contactType?: string

  email?: string
  emailSentAt?: Date | null
  emailStatus?: string
  emailError?: string
  emailFailedAt?: Date | null

  firstName?: string
  lastName?: string
  phone?: string
  message?: string
  messageId?: string

  personSeekingCare?: CondensedConsultationData['person_seeking_care']
  ageRange?: CondensedConsultationData['age_range']
  insuranceType?: CondensedConsultationData['insurance_type']
  questions?: CondensedConsultationData['questions']
  placement?: CondensedConsultationData['placement']

  status?: ConsultationFormStatus
  tags?: string[]
  rawPayload?: Record<string, unknown>
}
