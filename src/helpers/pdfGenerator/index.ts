// helpers/pdfGenerator.ts
import { ContactFormPDFGenerator } from "./contactFormPDFGenerator";
import { LeadsPDFGenerator } from "./leadsPDFGenerator";
import { RideRequestPDFGenerator } from "./rideRequestPDFGenerator";

export class PDFGenerator {
  static leads = LeadsPDFGenerator;
  static contactForm = ContactFormPDFGenerator;
  static rideRequest = RideRequestPDFGenerator;

  //   static createContactFormPDF(contactData: any) {
  // Contact form PDF logic
  //   }

  //   static createRideRequestPDF(rideData: any) {
  // Ride request PDF logic
  //   }
}
