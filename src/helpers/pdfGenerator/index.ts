// helpers/pdfGenerator.ts
import { ContactFormPDFGenerator } from "./contactFormPDFGenerator";
import { LeadsPDFGenerator } from "./leadsPDFGenerator";
import { RideRequestPDFGenerator } from "./rideRequestPDFGenerator";

export class PDFGenerator {
  static leads = LeadsPDFGenerator;
  static contactForm = ContactFormPDFGenerator;
  static rideRequest = RideRequestPDFGenerator;
}
