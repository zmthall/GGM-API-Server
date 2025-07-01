// /config/email.ts
import 'dotenv/config';

export const nodeMailerEmail = process.env.EMAIL_USERNAME;
export const nodeMailerPassword = process.env.EMAIL_PASSWORD;
export const nodeMailerContactFormEmail = process.env.CONTACT_FORM_EMAIL;
export const nodeMailerContactFormCCEmails = process.env.CONTACT_FORM_CC_EMAILS;
export const nodeMailerRideRequestEmail = process.env.RIDE_REQUEST_EMAIL;
export const nodeMailerRideRequestCCEmails = process.env.RIDE_REQUEST_CC_EMAILS;