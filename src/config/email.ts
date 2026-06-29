// /config/email.ts
import 'dotenv/config';

// Main Email
export const nodeMailerEmail = process.env.EMAIL_USERNAME;
export const nodeMailerPassword = process.env.EMAIL_PASSWORD;

// Contact Form Email
export const nodeMailerContactFormEmail = process.env.CONTACT_FORM_EMAIL;
export const nodeMailerContactFormCCEmails = process.env.CONTACT_FORM_CC_EMAILS;

// Ride Request Email
export const nodeMailerRideRequestEmail = process.env.RIDE_REQUEST_EMAIL;
export const nodeMailerRideRequestCCEmails = process.env.RIDE_REQUEST_CC_EMAILS;

// Consultation Request Email
export const nodeMailerConsultationRequestEmail = process.env.CONSULTATION_REQUEST_EMAIL;
export const nodeMailerConsultationRequestCCEmails = process.env.CONSULTATION_REQUEST_CC_EMAILS;

// Branded Email
export const brandedEmailHost = process.env.BRANDED_EMAIL_HOST;
export const brandedEmailPort = Number(process.env.BRANDED_EMAIL_PORT);
export const brandedEmailUser = process.env.BRANDED_EMAIL_USER;
export const brandedEmailPassword = process.env.BRANDED_EMAIL_PASSWORD;
