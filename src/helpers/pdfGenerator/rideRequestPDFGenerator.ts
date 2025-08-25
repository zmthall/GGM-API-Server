import PDFDocument from "pdfkit";
import { RideRequestDocument, RideRequestStatus } from "../../types/rideRequest";

export class RideRequestPDFGenerator {
  static addedReviewedLine = false;

  static createSinglePDF(
    rideRequestDocument: RideRequestDocument
  ): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      try {
        const doc = new PDFDocument({
          size: "A4",
          margins: { top: 50, bottom: 50, left: 50, right: 50 },
        });

        // Collect PDF data in buffer
        const chunks: Buffer[] = [];

        doc.on("data", (chunk) => chunks.push(chunk));
        doc.on("end", () => {
          resolve(Buffer.concat(chunks));
        });
        doc.on("error", reject);

        // Add content
        this.addSingleRideRequestHeader(doc, rideRequestDocument);
        this.addRideRequestDetails(doc, rideRequestDocument);
        
        if (rideRequestDocument.notes) {
          this.addNotesSection(doc, rideRequestDocument);
        }
        
        this.addSingleRideRequestFooter(doc, rideRequestDocument);

        // End the document - this triggers the 'end' event
        doc.end();
        this.addedReviewedLine = false;
      } catch (error) {
        reject(error);
      }
    });
  }

  private static addSingleRideRequestHeader(
    doc: PDFKit.PDFDocument,
    rideRequestDocument: RideRequestDocument
  ): void {
    const currentDate = new Date().toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });

    const dateObj = new Date(rideRequestDocument.created_at);
    const datePart = dateObj.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
    const timePart = dateObj.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
    const sentDate = `${datePart} at ${timePart}`;

    // Title with Ride Request name
    doc
      .fontSize(24)
      .fillColor("#2c3e50")
      .text(
        `Request From: ${rideRequestDocument.name}`,
        50,
        50,
        { align: "center" }
      );

    doc
      .fontSize(14)
      .fillColor("#2c3e50") 
      .text(
        `Submitted on: ${sentDate}`,
        50,
        85,
        { align: "center" }
      );

    // Status badge
    const statusColor = this.getStatusColor(rideRequestDocument.status);
    doc
      .fontSize(14)
      .fillColor(statusColor)
      .text(`Status: ${rideRequestDocument.status.toUpperCase()}`, 50, 115, { align: "center" });

    // Generation date
    doc
      .fontSize(10)
      .fillColor("#7f8c8d")
      .text(`Generated PDF on ${currentDate}`, 50, 145, { align: "center" });

    // Horizontal line
    doc
      .strokeColor("#bdc3c7")
      .lineWidth(1)
      .moveTo(50, 165)
      .lineTo(545, 165)
      .stroke();
  }

  private static addRideRequestDetails(
    doc: PDFKit.PDFDocument, 
    rideRequest: RideRequestDocument
  ): void {
    let y = 185;
    const leftColX = 50;
    const valueX = leftColX + 150; // Space for labels
    const valueWidth = 345; // Remaining width for values

    doc.fontSize(18).fillColor("#2c3e50").text("Ride Request Information", leftColX, y);
    y += 30;

    doc.fontSize(12).fillColor("#34495e");

    // Name
    doc.font("Helvetica-Bold").text("Name:", leftColX, y);
    doc.font("Helvetica").text(rideRequest.name || "", valueX, y, { width: valueWidth });
    y += 25;

    // Date of Birth
    if (rideRequest.dob) {
      const dobFormatted = new Date(rideRequest.dob).toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      });
      doc.font("Helvetica-Bold").text("Date of Birth:", leftColX, y);
      doc.font("Helvetica").text(dobFormatted, valueX, y, { width: valueWidth });
      y += 25;
    }

    // Phone Number
    if (rideRequest.phone) {
      doc.font("Helvetica-Bold").text("Phone Number:", leftColX, y);
      doc.font("Helvetica").fillColor("#3498db")
        .text(rideRequest.phone, valueX, y, { 
          width: valueWidth,
          link: `tel:${rideRequest.phone}`,
          underline: true 
        });
      y += 25;
    }

    // Email Address
    if (rideRequest.email) {
      doc.fillColor("#34495e").font("Helvetica-Bold").text("Email Address:", leftColX, y);
      doc.font("Helvetica").fillColor("#3498db")
        .text(rideRequest.email, valueX, y, { 
          width: valueWidth,
          link: `mailto:${rideRequest.email}`,
          underline: true 
        });
      y += 25;
    }

    // Medicaid ID
    if (rideRequest.med_id) {
      doc.fillColor("#34495e").font("Helvetica-Bold").text("Medicaid ID:", leftColX, y);
      doc.font("Helvetica").fillColor("#34495e").text(rideRequest.med_id, valueX, y, { width: valueWidth });
      y += 25;
    }

    // Appointment Date
    if (rideRequest.apt_date) {
      const appointmentDate = new Date(rideRequest.apt_date).toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      });
      doc.font("Helvetica-Bold").text("Appointment Date:", leftColX, y);
      doc.font("Helvetica").text(appointmentDate, valueX, y, { width: valueWidth });
      y += 25;
    }

    // Appointment Time
    if (rideRequest.apt_time) {
      const appointmentTime = new Date(rideRequest.apt_time).toLocaleTimeString("en-US", {
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
        timeZone: "America/Denver" // MDT
      });
      doc.font("Helvetica-Bold").text("Appointment Time:", leftColX, y);
      doc.font("Helvetica").text(`${appointmentTime} MDT`, valueX, y, { width: valueWidth });
      y += 25;
    }

    // Pickup Location
    if (rideRequest.pickup_address) {
      doc.font("Helvetica-Bold").text("Pickup Location:", leftColX, y);
      const pickupHeight = doc.heightOfString(rideRequest.pickup_address, { width: valueWidth });
      doc.font("Helvetica").text(rideRequest.pickup_address, valueX, y, { width: valueWidth });
      y += Math.max(25, pickupHeight + 10);
    }

    // Drop-Off Location
    if (rideRequest.dropoff_address) {
      doc.font("Helvetica-Bold").text("Drop-Off Location:", leftColX, y);
      const dropoffHeight = doc.heightOfString(rideRequest.dropoff_address, { width: valueWidth });
      doc.font("Helvetica").text(rideRequest.dropoff_address, valueX, y, { width: valueWidth });
      y += Math.max(25, dropoffHeight + 10);
    }

    // Tags section
    if (rideRequest.tags?.length) {
      y += 10;
      doc.fillColor("#2c3e50").fontSize(16).font("Helvetica-Bold").text("Tags", leftColX, y);
      y += 25;
      const tagsText = rideRequest.tags.join(", ");
      doc.fillColor("#8e44ad").fontSize(12).font("Helvetica")
        .text(tagsText, 80, y, { width: 400, align: "left" });
      const tagsHeight = doc.heightOfString(tagsText, { width: 400, align: "left" });
      y += tagsHeight + 15;
    }

    doc.y = y;
  }

  private static addNotesSection(
    doc: PDFKit.PDFDocument,
    rideRequestDocument: RideRequestDocument
  ): void {
    const left = 50;
    const boxWidth = 495;
    const pad = 10;
    const gapBeforeTitle = 20;
    const titleToBoxGap = 35;

    const footerTopY = doc.page.height - 75;
    const pageTop = () => doc.page.margins.top;
    const pageBottomLimit = () => footerTopY - 8;

    // Position title
    let y = doc.y + gapBeforeTitle;
    if (y + 20 > pageBottomLimit()) {
      this.addSingleRideRequestFooter(doc, rideRequestDocument);
      doc.addPage();
      y = pageTop();
    }

    doc
      .fontSize(16)
      .fillColor('#2c3e50')
      .font('Helvetica-Bold')
      .text('Notes/Messages/Special Requirements', left, y);

    y += titleToBoxGap;

    // Prepare notes font
    doc.font('Helvetica').fontSize(11).fillColor('#2c3e50');
    const full = (rideRequestDocument.notes ?? '').trim();

    let text = full;
    while (text.length > 0) {
      const avail = pageBottomLimit() - y - pad * 2;

      if (avail < doc.currentLineHeight()) {
        this.addSingleRideRequestFooter(doc, rideRequestDocument);
        doc.addPage();
        y = pageTop();
        continue;
      }

      const opts = { width: boxWidth - pad * 2, align: 'left' as const, height: avail };
      doc.font('Helvetica').fontSize(11).fillColor('#2c3e50');
      const fitted = doc.heightOfString(text, opts) > avail
        ? this.truncateText(doc, text, opts)
        : text;

      const h = doc.heightOfString(fitted, opts);
      const boxHeight = h + pad * 2;

      // background
      doc.save();
      doc
        .lineWidth(0.5)
        .fillColor('#f8f9fa')
        .rect(left, y, boxWidth, boxHeight)
        .fill()
        .strokeColor('#d9dee3')
        .rect(left, y, boxWidth, boxHeight)
        .stroke();
      doc.restore();

      // text
      doc.text(fitted, left + pad, y + pad, opts);

      y += boxHeight + 4;
      text = text.slice(fitted.length).trimStart();

      if (text.length > 0 && (pageBottomLimit() - y) < doc.currentLineHeight()) {
        this.addSingleRideRequestFooter(doc, rideRequestDocument);
        doc.addPage();
        y = pageTop();
      }
    }

    doc.y = y;
  }

  // Helper for text truncation
  private static truncateText(
    doc: PDFKit.PDFDocument,
    text: string,
    opts: { width: number; align: 'left'|'center'|'right'|'justify'; height: number }
  ): string {
    let lo = 1, hi = text.length, best = 1;
    while (lo <= hi) {
      const mid = Math.ceil((lo + hi) / 2);
      const candidate = text.slice(0, mid);
      if (doc.heightOfString(candidate, opts) <= opts.height) {
        best = mid;
        lo = mid + 1;
      } else {
        hi = mid - 1;
      }
    }
    const slice = text.slice(0, best);
    const lastSpace = slice.lastIndexOf(' ');
    return lastSpace > 0 ? slice.slice(0, lastSpace) : slice;
  }

  private static addSingleRideRequestFooter(
    doc: PDFKit.PDFDocument,
    rideRequestDocument: RideRequestDocument
  ): void {
    doc
      .strokeColor("#bdc3c7")
      .lineWidth(1)
      .moveTo(50, doc.page.height - 75)
      .lineTo(545, doc.page.height - 75)
      .stroke();

    // Page footer information
    const footerY = doc.page.height - 60;
    
    // Left: Patient name
    doc
      .fontSize(8)
      .fillColor("#7f8c8d")
      .text(`${rideRequestDocument.name}`, 50, footerY, { align: "left" });

    // Center: Reviewed By line
    if(!this.addedReviewedLine) {
      doc
        .fontSize(8)
        .fillColor("#7f8c8d")
        .text("Reviewed By: _______________", 0, footerY, {
          align: "center",
          width: doc.page.width,
        });

      this.addedReviewedLine = true;
    }

    // Right: System name
    doc
      .fontSize(8)
      .fillColor("#7f8c8d")
      .text("Ride Request Management System", 0, footerY, {
        align: "right",
        width: doc.page.width - 50,
      });
  }

  private static getStatusColor(rideRequestStatus: RideRequestStatus): string {
    const statusColors: Record<RideRequestStatus, string> = {
      new: "#2ecc71", // Green
      reviewing: "#9b59b6", // Purple
      scheduled: "#f39c12", // Orange
      spam: "#e74c3c", // Red
      closed: "#95a5a6", // Gray
    };

    return statusColors[rideRequestStatus] || "#2c3e50";
  }
}