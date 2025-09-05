// helpers/pdfGenerator.ts
import { ContactFormPDFGenerator } from "./contactFormPDFGenerator";
import { LeadsPDFGenerator } from "./leadsPDFGenerator";
import { RideRequestPDFGenerator } from "./rideRequestPDFGenerator";

export const PDFGenerators = {
  contactForm: ContactFormPDFGenerator,
  leads: LeadsPDFGenerator,
  rideRequest: RideRequestPDFGenerator,
} as const;
