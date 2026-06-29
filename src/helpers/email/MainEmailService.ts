import SMTPTransport from "nodemailer/lib/smtp-transport";
import { EmailService } from "./EmailService";
import { nodeMailerContactFormCCEmails, nodeMailerContactFormEmail, nodeMailerEmail, nodeMailerPassword, nodeMailerRideRequestCCEmails, nodeMailerRideRequestEmail, nodeMailerConsultationRequestEmail, nodeMailerConsultationRequestCCEmails } from "../../config/email";
import { ContactFormData } from "../../types/contactForm";
import { EmailMessage } from "../../types/nodeMailer";
import { formatDateTime } from "../dateFormat";
import { RideRequestData } from "../../types/rideRequest";
import { CondensedConsultationData } from "../../types/consultationForm";

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

    sendConsultationRequestEmail = async (
      consultationData: CondensedConsultationData
    ): Promise<{ success: boolean; messageId?: string; error?: string }> => {
      const recipientEmail = nodeMailerConsultationRequestEmail || nodeMailerEmail

      if (!recipientEmail) {
        throw new Error('Email configuration is missing - no consultation request email configured')
      }

      const fullName = `${consultationData.first_name} ${consultationData.last_name}`.trim()

      const formatValue = (value: string) => {
        // Preserve numeric ranges like 18-40 or 1-3-months
        if (/^\d/.test(value)) {
          return value
            .split('-')
            .map(part => (/^\d+$/.test(part) ? part : part.charAt(0).toUpperCase() + part.slice(1)))
            .join('-')
        }

        return value
          .split('-')
          .map(word => word.charAt(0).toUpperCase() + word.slice(1))
          .join(' ')
      }

      const questionLabels: Record<string, string> = {
        income_assistance: 'Income Assistance',
        ada_accommodations: 'ADA Accommodations',
        daily_living_assistance: 'Daily Living Assistance',
      }

      const getQuestionLabel = (question: { name: string; label: string }) => {
        return questionLabels[question.name] ?? formatValue(question.name)
      }

      const personSeekingCare =
        consultationData.person_seeking_care.value === 'other'
          ? `Other: ${consultationData.person_seeking_care.other}`
          : formatValue(consultationData.person_seeking_care.value)

      const insuranceType =
        consultationData.insurance_type.value === 'other'
          ? `Other: ${consultationData.insurance_type.other}`
          : formatValue(consultationData.insurance_type.value)

      const questionsText = consultationData.questions.length
        ? consultationData.questions
            .map(q => `${getQuestionLabel(q)}: ${formatValue(q.value)}`)
            .join('\n')
        : 'No responses provided'

      const questionsHtml = consultationData.questions.length
        ? consultationData.questions
            .map(
              q => `
                <tr>
                  <td style="padding: 6px 12px; border: 1px solid #ddd;"><strong>${getQuestionLabel(q)}</strong></td>
                  <td style="padding: 6px 12px; border: 1px solid #ddd;">${formatValue(q.value)}</td>
                </tr>
              `
            )
            .join('')
        : `
            <tr>
              <td colspan="2" style="padding: 6px 12px; border: 1px solid #ddd;">
                No responses provided
              </td>
            </tr>
          `

      const message: EmailMessage = {
        from: nodeMailerEmail,
        to: recipientEmail,
        cc: nodeMailerConsultationRequestCCEmails
          ? nodeMailerConsultationRequestCCEmails
              .split(',')
              .map(email => email.trim())
          : undefined,

        subject: `Consultation Request From: ${fullName} on ${formatDateTime(new Date())}`,

        text: `Name: ${fullName}
          Preferred Contact Method: ${formatValue(consultationData.contact_method)}
          Phone Number: ${consultationData.phone}
          Email Address: ${consultationData.email}

          Person Seeking Care: ${personSeekingCare}
          Age Range: ${formatValue(consultationData.age_range)}
          Insurance Type: ${insuranceType}
          Placement Timeline: ${formatValue(consultationData.placement)}

          Care Assessment:
          ${questionsText}

          Message:
          ${consultationData.message}
          `.trim(),
              html: `
                <article style="font-size: 1.1rem; font-family: Arial, sans-serif;">
                  <h1 style="text-decoration: underline;">Consultation Request</h1>

                  <h2>Contact Information</h2>

                  <p>
                    <strong>Name:</strong>
                    ${fullName}
                  </p>

                  <p>
                    <strong>Preferred Contact Method:</strong>
                    ${formatValue(consultationData.contact_method)}
                  </p>

                  <p>
                    <strong>Phone Number:</strong>
                    <a href="tel:${consultationData.phone}">
                      ${consultationData.phone}
                    </a>
                  </p>

                  <p>
                    <strong>Email Address:</strong>
                    <a href="mailto:${consultationData.email}">
                      ${consultationData.email}
                    </a>
                  </p>

                  <hr>

                  <h2>Care Information</h2>

                  <p>
                    <strong>Person Seeking Care:</strong>
                    ${personSeekingCare}
                  </p>

                  <p>
                    <strong>Age Range:</strong>
                    ${formatValue(consultationData.age_range)}
                  </p>

                  <p>
                    <strong>Insurance Type:</strong>
                    ${insuranceType}
                  </p>

                  <p>
                    <strong>Placement Timeline:</strong>
                    ${formatValue(consultationData.placement)}
                  </p>

                  <h3>Care Assessment</h3>

                  <table
                    style="
                      border-collapse: collapse;
                      width: 100%;
                      margin-bottom: 20px;
                    "
                  >
                    <thead>
                      <tr>
                        <th style="padding: 8px; border: 1px solid #ddd; text-align: left;">
                          Question
                        </th>
                        <th style="padding: 8px; border: 1px solid #ddd; text-align: left;">
                          Response
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      ${questionsHtml}
                    </tbody>
                  </table>

                  <h2>Additional Information</h2>

                  <p>
                    ${consultationData.message || 'No additional information provided.'}
                  </p>
                </article>
              `
            }

            return await this.sendEmail(message)
          }
}