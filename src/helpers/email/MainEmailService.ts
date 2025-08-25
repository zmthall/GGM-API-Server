import SMTPTransport from "nodemailer/lib/smtp-transport";
import { EmailService } from "./EmailService";
import { nodeMailerContactFormCCEmails, nodeMailerContactFormEmail, nodeMailerEmail, nodeMailerPassword, nodeMailerRideRequestCCEmails, nodeMailerRideRequestEmail } from "../../config/email";
import { ContactFormData } from "../../types/contactForm";
import { EmailMessage, RideRequestData } from "../../types/nodeMailer";
import { formatDateTime } from "../dateFormat";

export class MainEmailService extends EmailService {
  constructor() {
    super({
      service: 'gmail',
      secure: true,
      auth: {
        user: nodeMailerEmail,
        pass: nodeMailerPassword,
      },
      tls: { rejectUnauthorized: false },
      pool: true,
      maxConnections: 5,
      maxMessages: 100,
    } as SMTPTransport.Options);
  }

  sendContactFormEmail = async (
      contactData: ContactFormData
    ): Promise<{ success: boolean; messageId?: string; error?: string }> => {
        // Validate email configuration
        const recipientEmail = nodeMailerContactFormEmail || nodeMailerEmail;
        if (!recipientEmail) {
          throw new Error('Email configuration is missing - no recipient email configured')
        };
  
        // Prepare email message
        const message: EmailMessage = {
          from: nodeMailerEmail,
          to: recipientEmail,
          cc: nodeMailerContactFormCCEmails ? nodeMailerContactFormCCEmails.split(',').map(email => email.trim()) : undefined,
          subject: `Message From: ${contactData.first_name} ${contactData.last_name} on ${formatDateTime(new Date())}`,
          text: `Reason: ${contactData.reason}\nName: ${contactData.first_name} ${contactData.last_name}\nEmail Address: ${contactData.email}\nPhone Number: ${contactData.phone}\nPreferred Contact Method: ${contactData.contact_method}\nMessage: ${contactData.message}`,
          html: `
            <p><strong>Reason:</strong> ${contactData.reason}</p>
            <p><strong>Name:</strong> ${contactData.first_name} ${contactData.last_name}</p>
            <p><strong>Email Address:</strong> <a href="mailto:${contactData.email}">${contactData.email}</a></p>
            <p><strong>Phone Number:</strong> <a href="tel:${contactData.phone}">${contactData.phone}</a></p>
            <p><strong>Preferred Contact Method:</strong> ${contactData.contact_method}</p>
            <p><strong>Message:</strong> ${contactData.message}</p>
          `
        };
  
        return await this.sendEmail(message);
    }
  
    sendRideRequestEmail = async (
      rideData: RideRequestData
      ): Promise<{ success: boolean; messageId?: string; error?: string }> => {
        // Validate email configuration - use RIDE_REQUEST_EMAIL specifically
        const recipientEmail = nodeMailerRideRequestEmail || nodeMailerEmail;
        if (!recipientEmail) {
        throw new Error('Email configuration is missing - no ride request email configured')
        }

        // Date formatting
        const dateFormat = new Intl.DateTimeFormat("en-US", { dateStyle: "long" });
        const timeFormat = new Intl.DateTimeFormat("en-US", {
        timeStyle: "long",
        timeZone: "America/Denver",
        });

        const appointmentDate = new Date(rideData.apt_date);
        const appointmentTime = new Date(rideData.apt_time);
        const dateOfBirth = new Date(rideData.dob);

        // Prepare email message
        const message: EmailMessage = {
        from: nodeMailerEmail,
        to: recipientEmail,
        cc: nodeMailerRideRequestCCEmails ? nodeMailerRideRequestCCEmails.split(',').map(email => email.trim()) : undefined,
        subject: `Ride Request From: ${rideData.name} on ${formatDateTime(new Date())}`,
        text: `Name: ${rideData.name}\nDate of Birth: ${dateFormat.format(dateOfBirth)}\nPhone Number: ${rideData.phone}\nEmail Address: ${rideData.email}\nMedicaid ID: ${rideData.med_id}\nAppointment Date: ${dateFormat.format(appointmentDate)}\nAppointment Time: ${timeFormat.format(appointmentTime)}\nPickup Location: ${rideData.pickup_address}\nDrop-Off Location: ${rideData.dropoff_address}\nNotes/Messages/Special Requirements: ${rideData.notes}`,
        html: `
            <article style="font-size: 1.25rem;">
            <h1 style="text-decoration: underline;">Ride Request:</h1>
            <p><span style="font-weight: 700;">Name:</span> ${rideData.name}</p>
            <p><span style="font-weight: 700;">Date of Birth:</span> ${dateFormat.format(dateOfBirth)}</p>
            <p><span style="font-weight: 700;">Phone Number:</span> <a href="tel:${rideData.phone}">${rideData.phone}</a></p>
            <p><span style="font-weight: 700;">Email Address:</span> <a href="mailto:${rideData.email}">${rideData.email}</a></p>
            <p><span style="font-weight: 700;">Medicaid ID:</span> ${rideData.med_id}</p>
            <p><span style="font-weight: 700;">Appointment Date:</span> ${dateFormat.format(appointmentDate)}</p>
            <p><span style="font-weight: 700;">Appointment Time:</span> ${timeFormat.format(appointmentTime)}</p>
            <p><span style="font-weight: 700;">Pickup Location:</span> ${rideData.pickup_address}</p>
            <p><span style="font-weight: 700;">Drop-Off Location:</span> ${rideData.dropoff_address}</p>
            <p><span style="font-weight: 700;">Notes/Messages/Special Requirements:</span> ${rideData.notes}</p>
            </article>
        `
        };

        return await this.sendEmail(message);
      }
}