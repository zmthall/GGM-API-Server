// helpers/pdfGenerator.ts
import { ContactFormPDFGenerator } from "./contactFormPDFGenerator";
import { LeadsPDFGenerator } from "./leadsPDFGenerator";

export class PDFGenerator {
  static leads = LeadsPDFGenerator;
  static contactForm = ContactFormPDFGenerator;

  //   static createContactFormPDF(contactData: any) {
  // Contact form PDF logic
  //   }

  //   static createRideRequestPDF(rideData: any) {
  // Ride request PDF logic
  //   }
}
