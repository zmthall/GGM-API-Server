import PDFDocument from "pdfkit";
import { ContactFormDocument, ContactFormStatus } from "../../types/contactForm";

export class ContactFormPDFGenerator {
  static createSinglePDF(
    contactFormDocument: ContactFormDocument
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
        this.addSingleContactHeader(doc, contactFormDocument);

        this.addContactFormDetails(doc, contactFormDocument);

        this.addMessageSection(doc, contactFormDocument);

        this.addSingleContactFooter(doc, contactFormDocument, );

        // End the document - this triggers the 'end' event
        doc.end();
      } catch (error) {
        reject(error);
      }
    });
  }

  private static addSingleContactHeader(
    doc: PDFKit.PDFDocument,
    contactFormDocument: ContactFormDocument
  ): void {
    const currentDate = new Date().toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });

    const dateObj = new Date(contactFormDocument.created_at);
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

    // Title with Contact name
    doc
      .fontSize(24)
      .fillColor("#2c3e50")
      .text(
        `Message From: ${contactFormDocument.first_name} ${contactFormDocument.last_name}`,
        50,
        50,
        { align: "center" }
      )

    doc
      .fontSize(14)
      .fillColor("#2c3e50") 
      .text(
        `Sent on: ${sentDate}`,
        50,
        85,
        { align: "center" }
      )

    // Status badge
    const statusColor = this.getStatusColor(contactFormDocument.status);
    doc
      .fontSize(14)
      .fillColor(statusColor)
      .text(`Status: ${contactFormDocument.status.toUpperCase()}`, 50, 115, { align: "center" });

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

  private static addContactFormDetails(doc: PDFKit.PDFDocument, contact: ContactFormDocument): void {
    let y = 185;
    const leftColX = 50;
    const rightColX = 300;

    // everything in the left column (values) must stop before the right column starts
    const leftValueX = leftColX + 60;           // after the "Email:" label
    const leftValueRight = rightColX - 20;      // gutter before right column
    const leftValueWidth = leftValueRight - leftValueX;

    doc.fontSize(18).fillColor("#2c3e50").text("Contact Information", leftColX, y);
    y += 30;

    doc.fontSize(12).fillColor("#34495e");

    // --- EMAIL (wrapped, clickable, underlined) ---
    doc.font("Helvetica-Bold").text("Email:", leftColX, y);

    const email = (contact.email || "").toUpperCase()

    const emailTextOpts = {
      width: leftValueWidth,
      align: "left" as const,
      link: `mailto:${contact.email}`,
      underline: true,
    };

    doc.font("Helvetica").fillColor("#3498db").text(email, leftValueX, y, emailTextOpts);

    // measure how tall it rendered and advance y accordingly
    const emailH = doc.heightOfString(email, emailTextOpts);
    y += emailH + 10;

    // --- PHONE (wrap if needed; optional) ---
    if (contact.phone) {
      doc.fillColor("#34495e").font("Helvetica-Bold").text("Phone:", leftColX, y);
      doc.font("Helvetica").fillColor("#34495e")
        .text(contact.phone, leftValueX, y, { width: leftValueWidth, align: "left" });
      const phoneH = doc.heightOfString(contact.phone, { width: leftValueWidth, align: "left" });
      y += phoneH + 10;
    }

    // --- REASON (wrap if long) ---
    doc.fillColor("#34495e").font("Helvetica-Bold").text("Reason:", leftColX, y);
    const reason = (contact.reason || "").toUpperCase();
    doc.font("Helvetica").fillColor("#34495e")
      .text(reason, leftValueX, y, { width: leftValueWidth, align: "left" });
    const reasonH = doc.heightOfString(reason, { width: leftValueWidth, align: "left" });
    y += reasonH + 10;

    // --- RIGHT COLUMN ---
    let rightY = 215;
    doc.fillColor("#34495e").font("Helvetica-Bold").text("Source:", rightColX, rightY);
    doc.font("Helvetica").text(contact.contact_type || "", rightColX + 60, rightY, { width: 180 });
    rightY += 25;

    // move cursor below whichever column is taller
    y = Math.max(y, rightY) + 20;

    // --- TAGS (optional) ---
    if (contact.tags?.length) {
      doc.fillColor("#2c3e50").fontSize(16).font("Helvetica-Bold").text("Tags", leftColX, y);
      y += 25;
      const tagsText = contact.tags.join(", ");
      doc.fillColor("#8e44ad").fontSize(12).font("Helvetica")
        .text(tagsText, 80, y, { width: 400, align: "left" });
      const tagsH = doc.heightOfString(tagsText, { width: 400, align: "left" });
      y += tagsH + 15;
    }

    doc.y = y;
  }

  private static addMessageSection(
    doc: PDFKit.PDFDocument,
    contactFormDocument: ContactFormDocument
  ): void {
    const left = 50;
    const boxWidth = 495;
    const pad = 10;
    const gapBeforeTitle = 20;
    const titleToBoxGap = 35;

    const footerTopY = doc.page.height - 75; // where your footer line is
    const pageTop = () => doc.page.margins.top;
    const pageBottomLimit = () => footerTopY - 8; // small guard gap

    // Position title
    let y = doc.y + gapBeforeTitle;
    if (y + 20 > pageBottomLimit()) {
      this.addSingleContactFooter(doc, contactFormDocument);
      doc.addPage();
      y = pageTop();
    }

    doc
      .fontSize(16)
      .fillColor('#2c3e50')
      .font('Helvetica-Bold')
      .text('Message', left, y);

    y += titleToBoxGap;

    // Prepare message font
    doc.font('Helvetica').fontSize(11).fillColor('#2c3e50');
    const full = (contactFormDocument.message ?? '').trim();

    // Instead of slicing chars, just let PDFKit paginate
    // by restricting text height to remaining space.
    let text = full;
    while (text.length > 0) {
      const avail = pageBottomLimit() - y - pad * 2;

      if (avail < doc.currentLineHeight()) {
        this.addSingleContactFooter(doc, contactFormDocument);
        doc.addPage();
        y = pageTop();
        continue;
      }

      // measure how much fits
      // when fitting text:
      const opts = { width: boxWidth - pad * 2, align: 'left' as const, height: avail };
      doc.font('Helvetica').fontSize(11).fillColor('#2c3e50');
      const fitted = doc.heightOfString(text, opts) > avail
        ? this.truncateText(doc, text, opts)   // <-- call your helper here
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
        this.addSingleContactFooter(doc, contactFormDocument);
        doc.addPage();
        y = pageTop();
      }
    }

    doc.y = y;
  }

  // crude helper: just find largest substring that heightOfString <= avail
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
    // avoid breaking mid-word if possible
    const slice = text.slice(0, best);
    const lastSpace = slice.lastIndexOf(' ');
    return lastSpace > 0 ? slice.slice(0, lastSpace) : slice;
  }


  private static addSingleContactFooter(
    doc: PDFKit.PDFDocument,
    contactFormDocument: ContactFormDocument
  ): void {
    doc
      .strokeColor("#bdc3c7")
      .lineWidth(1)
      .moveTo(50, doc.page.height - 75)
      .lineTo(545, doc.page.height - 75)
      .stroke();

    // Page footer information
    doc
      .fontSize(8)
      .fillColor("#7f8c8d")
      .text(`${contactFormDocument.first_name} ${contactFormDocument.last_name}`, 50, doc.page.height - 60, { align: "left" })
      .text("Contact Form Management System", 0, doc.page.height - 60, {
        align: "right",
        width: doc.page.width - 50,
      });
  }

  private static getStatusColor(contactFormStatus: ContactFormStatus): string {
    const statusColors: Record<ContactFormStatus, string> = {
      new: "#2ecc71", // Green
      reviewing: "#9b59b6", // Purple
      contacted: "#f39c12", // Orange
      spam: "#e74c3c", // Red
      closed: "#95a5a6", // Gray
    };

    return statusColors[contactFormStatus] || "#2c3e50";
  }
}
