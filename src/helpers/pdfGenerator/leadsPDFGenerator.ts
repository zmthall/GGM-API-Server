import PDFDocument from "pdfkit";
import { Lead, LeadStatus } from "../../types/lead";

export class LeadsPDFGenerator {
  // Creation of a pdf with a table of all the leads added to the pdf
  static createPDF(leads: Lead[]): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      try {
        const doc = new PDFDocument({
          size: "A4",
          margins: { top: 50, bottom: 50, left: 50, right: 50 },
        });

        const chunks: Buffer[] = [];

        doc.on("data", (chunk) => chunks.push(chunk));
        doc.on("end", () => {
          resolve(Buffer.concat(chunks));
        });
        doc.on("error", reject);

        // Add header
        this.addHeader(doc, leads.length);

        // Add summary stats
        this.addSummaryStats(doc, leads);

        // Add leads table
        this.addLeadsTable(doc, leads);

        // Add footer
        this.addFooter(doc);

        doc.end();
      } catch (error) {
        reject(error);
      }
    });
  }

  private static addHeader(doc: PDFKit.PDFDocument, totalLeads: number): void {
    const currentDate = new Date().toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });

    // Title
    doc
      .fontSize(24)
      .fillColor("#2c3e50")
      .text("Lead Management Report", 50, 50, { align: "center" });

    // Subtitle with date and count
    doc
      .fontSize(12)
      .fillColor("#7f8c8d")
      .text(`Generated PDF on ${currentDate} • ${totalLeads} Total Leads`, 50, 85, {
        align: "center",
      });

    // Horizontal line
    doc
      .strokeColor("#bdc3c7")
      .lineWidth(1)
      .moveTo(50, 110)
      .lineTo(545, 110)
      .stroke();
  }

  private static addSummaryStats(
    doc: PDFKit.PDFDocument,
    leads: Lead[],
    yPosition: number = 130
  ): void {
    const stats = this.calculateStats(leads);

    doc
      .fontSize(16)
      .fillColor("#2c3e50")
      .text("Summary Statistics", 50, yPosition);

    yPosition += 25;

    // Status breakdown
    doc.fontSize(12).fillColor("#34495e");

    const statusOrder: LeadStatus[] = [
      "New",
      "Reviewed",
      "Contacted",
      "Qualified",
      "Converted",
      "Lost",
      "Spam",
    ];

    statusOrder.forEach((status) => {
      if (stats.statusBreakdown[status] > 0) {
        const percentage = (
          (stats.statusBreakdown[status] / stats.total) *
          100
        ).toFixed(1);
        doc.text(
          `${status}: ${stats.statusBreakdown[status]} (${percentage}%)`,
          50,
          yPosition
        );
        yPosition += 18;
      }
    });

    // Conversion rate
    if (stats.conversionRate > 0) {
      yPosition += 10;
      doc
        .fontSize(14)
        .fillColor("#27ae60")
        .text(`Conversion Rate: ${stats.conversionRate}%`, 50, yPosition);
    }

    yPosition += 30;
  }

  private static addLeadsTable(doc: PDFKit.PDFDocument, leads: Lead[]): void {
    let yPosition = doc.y + 20;
    const pageHeight = doc.page.height - 100; // Leave space for footer

    // Table headers
    doc.fontSize(10).fillColor("#2c3e50").font("Helvetica-Bold");

    const headers = ["Name", "Email/Phone", "Status", "Source", "Contact Date"];
    const columnWidths = [100, 120, 70, 90, 85];
    const startX = 50;

    // Draw headers
    let xPosition = startX;
    headers.forEach((header, index) => {
      doc.text(header, xPosition, yPosition, {
        width: columnWidths[index],
        align: "left",
      });
      xPosition += columnWidths[index];
    });

    yPosition += 20;

    // Header underline
    doc
      .strokeColor("#bdc3c7")
      .lineWidth(1)
      .moveTo(startX, yPosition)
      .lineTo(startX + columnWidths.reduce((a, b) => a + b, 0), yPosition)
      .stroke();

    yPosition += 15;

    // Table rows
    doc.font("Helvetica").fontSize(9);

    leads.forEach((lead, index) => {
      // Check if we need a new page
      if (yPosition > pageHeight) {
        this.addFooter(doc);
        doc.addPage();
        yPosition = 50;
      }

      // Alternate row colors
      if (index % 2 === 0) {
        doc
          .rect(
            startX - 5,
            yPosition - 5,
            columnWidths.reduce((a, b) => a + b, 0) + 10,
            20
          )
          .fillColor("#f8f9fa")
          .fill();
      }

      doc.fillColor("#2c3e50");

      xPosition = startX;

      // Name
      doc.text(lead.name || "N/A", xPosition, yPosition, {
        width: columnWidths[0] - 5,
        ellipsis: true,
      });
      xPosition += columnWidths[0];

      // Email/Phone (prefer email, fallback to phone)
      const contact = lead.email || lead.phone || "N/A";
      doc.text(contact, xPosition, yPosition, {
        width: columnWidths[1] - 5,
        ellipsis: true,
      });
      xPosition += columnWidths[1];

      // Status with color coding
      const statusColor = this.getStatusColor(lead.status);
      doc.fillColor(statusColor).text(lead.status, xPosition, yPosition, {
        width: columnWidths[2] - 5,
      });
      doc.fillColor("#2c3e50"); // Reset color
      xPosition += columnWidths[2];

      // Source
      doc.text(lead.source || "N/A", xPosition, yPosition, {
        width: columnWidths[3] - 5,
        ellipsis: true,
      });
      xPosition += columnWidths[3];

      // Contact Date
      const formattedDate = new Date(lead.creation_date).toLocaleDateString(
        "en-US"
      );
      doc.text(formattedDate, xPosition, yPosition, {
        width: columnWidths[4] - 5,
      });

      yPosition += 25;
    });
  }

  private static addFooter(doc: PDFKit.PDFDocument): void {
    // Just add footer to the current page
    doc
      .strokeColor("#bdc3c7")
      .lineWidth(1)
      .moveTo(50, doc.page.height - 75)
      .lineTo(doc.page.width - 50, doc.page.height - 75)
      .stroke();

    doc
      .fontSize(8)
      .fillColor("#7f8c8d")
      .text("Generated by Lead Management System", 50, doc.page.height - 60, {
        align: "left",
      });
  }

  private static calculateStats(leads: Lead[]) {
    const statusBreakdown: Record<string, number> = {};

    leads.forEach((lead) => {
      statusBreakdown[lead.status] = (statusBreakdown[lead.status] || 0) + 1;
    });

    const converted = statusBreakdown["Converted"] || 0;
    const total = leads.length;
    const conversionRate =
      total > 0 ? Number(((converted / total) * 100).toFixed(1)) : 0;

    return {
      total,
      statusBreakdown,
      conversionRate,
    };
  }

  private static getStatusColor(status: LeadStatus): string {
    const statusColors: Record<LeadStatus, string> = {
      New: "#3498db", // Blue
      Reviewed: "#9b59b6", // Purple
      Contacted: "#f39c12", // Orange
      Qualified: "#2ecc71", // Green
      Converted: "#27ae60", // Dark Green
      Lost: "#e74c3c", // Red
      Spam: "#95a5a6", // Gray
    };

    return statusColors[status] || "#2c3e50";
  }

  // Creation of pdf using a date range and leads pulled from date range
  static createDateRangePDF(
    leads: Lead[],
    startDate: string,
    endDate: string
  ): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      try {
        const doc = new PDFDocument({
          size: "A4",
          margins: { top: 50, bottom: 50, left: 50, right: 50 },
        });

        const chunks: Buffer[] = [];

        doc.on("data", (chunk) => chunks.push(chunk));
        doc.on("end", () => {
          resolve(Buffer.concat(chunks));
        });
        doc.on("error", reject);

        // Add header with date range
        this.addDateRangeHeader(doc, leads.length, startDate, endDate);

        // Add summary stats
        this.addSummaryStats(doc, leads, 150);

        // Add leads table
        this.addLeadsTable(doc, leads);

        // Add footer
        this.addFooter(doc);

        doc.end();
      } catch (error) {
        reject(error);
      }
    });
  }

  // Add this method to your PDFGenerator class
  private static addDateRangeHeader(
    doc: PDFKit.PDFDocument,
    totalLeads: number,
    startDate: string,
    endDate: string
  ): void {
    const currentDate = new Date().toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });

    // Title
    doc
      .fontSize(24)
      .fillColor("#2c3e50")
      .text("Lead Management Report", 50, 50, { align: "center" });

    // Date range subtitle
    doc
      .fontSize(14)
      .fillColor("#3498db")
      .text(`${startDate} to ${endDate}`, 50, 80, { align: "center" });

    // Generated date and count
    doc
      .fontSize(12)
      .fillColor("#7f8c8d")
      .text(
        `Generated PDF on ${currentDate} • ${totalLeads} Total Leads`,
        50,
        105,
        { align: "center" }
      );

    // Horizontal line
    doc
      .strokeColor("#bdc3c7")
      .lineWidth(1)
      .moveTo(50, 130)
      .lineTo(545, 130)
      .stroke();
  }

  static createDatePDF(leads: Lead[], date: string): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      try {
        const doc = new PDFDocument({
          size: "A4",
          margins: { top: 50, bottom: 50, left: 50, right: 50 },
        });

        const chunks: Buffer[] = [];

        doc.on("data", (chunk) => chunks.push(chunk));
        doc.on("end", () => {
          resolve(Buffer.concat(chunks));
        });
        doc.on("error", reject);

        // Add header with date range
        this.addDateHeader(doc, leads.length, date);

        // Add summary stats
        this.addSummaryStats(doc, leads, 150);

        // Add leads table
        this.addLeadsTable(doc, leads);

        // Add footer
        this.addFooter(doc);

        doc.end();
      } catch (error) {
        reject(error);
      }
    });
  }

  private static addDateHeader(
    doc: PDFKit.PDFDocument,
    totalLeads: number,
    date: string
  ): void {
    const currentDate = new Date().toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });

    // Title
    doc
      .fontSize(24)
      .fillColor("#2c3e50")
      .text("Lead Management Report", 50, 50, { align: "center" });

    // Date range subtitle
    doc
      .fontSize(14)
      .fillColor("#3498db")
      .text(`${date}`, 50, 80, { align: "center" });

    // Generated date and count
    doc
      .fontSize(12)
      .fillColor("#7f8c8d")
      .text(
        `Generated PDF on ${currentDate} • ${totalLeads} Total Leads`,
        50,
        105,
        { align: "center" }
      );

    // Horizontal line
    doc
      .strokeColor("#bdc3c7")
      .lineWidth(1)
      .moveTo(50, 130)
      .lineTo(545, 130)
      .stroke();
  }

  // Creation of a single lead PDF
  static createSinglePDF(lead: Lead): Promise<Buffer> {
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
        this.addSingleLeadHeader(doc, lead);
        this.addLeadDetails(doc, lead);

        if (lead.notes) {
          this.addNotesSection(doc, lead.notes);
        }

        this.addSingleLeadFooter(doc, lead);

        // End the document - this triggers the 'end' event
        doc.end();
      } catch (error) {
        reject(error);
      }
    });
  }

  private static addSingleLeadHeader(
    doc: PDFKit.PDFDocument,
    lead: Lead
  ): void {
    const currentDate = new Date().toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });

    // Title with lead name
    doc
      .fontSize(24)
      .fillColor("#2c3e50")
      .text(`Lead Profile: ${lead.name}`, 50, 50, { align: "center" });

    // Status badge
    const statusColor = this.getStatusColor(lead.status);
    doc
      .fontSize(14)
      .fillColor(statusColor)
      .text(`Status: ${lead.status}`, 50, 85, { align: "center" });

    // Generation date
    doc
      .fontSize(10)
      .fillColor("#7f8c8d")
      .text(`Generated PDF on ${currentDate}`, 50, 110, { align: "center" });

    // Horizontal line
    doc
      .strokeColor("#bdc3c7")
      .lineWidth(1)
      .moveTo(50, 130)
      .lineTo(545, 130)
      .stroke();
  }

  private static addLeadDetails(doc: PDFKit.PDFDocument, lead: Lead): void {
    let yPosition = 160;
    const leftColumn = 50;
    const rightColumn = 300;

    doc
      .fontSize(18)
      .fillColor("#2c3e50")
      .text("Contact Information", 50, yPosition);

    yPosition += 30;

    // Contact details in two columns
    doc.fontSize(12).fillColor("#34495e");

    // Left column
    if (lead.email) {
      doc.font("Helvetica-Bold").text("Email:", leftColumn, yPosition);
      doc
        .font("Helvetica")
        .fillColor("#3498db")
        .text(lead.email, leftColumn + 60, yPosition);
      yPosition += 25;
    }

    if (lead.phone) {
      doc
        .fillColor("#34495e")
        .font("Helvetica-Bold")
        .text("Phone:", leftColumn, yPosition);
      doc.font("Helvetica").text(lead.phone, leftColumn + 60, yPosition);
      yPosition += 25;
    }

    // Right column (reset position for right side)
    let rightYPosition = 190;

    if (lead.source) {
      doc
        .fillColor("#34495e")
        .font("Helvetica-Bold")
        .text("Source:", rightColumn, rightYPosition);
      doc.font("Helvetica").text(lead.source, rightColumn + 60, rightYPosition);
      rightYPosition += 25;
    }

    // Creation date
    const creationDate =
      new Date(lead.creation_date).toLocaleDateString("en-US", {
        month: "2-digit",
        day: "2-digit",
        year: "numeric",
      }) +
      " at " +
      new Date(lead.creation_date).toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
      });

    doc
      .fillColor("#34495e")
      .font("Helvetica-Bold")
      .text("Created:", rightColumn, rightYPosition);
    doc.font("Helvetica").text(creationDate, rightColumn + 60, rightYPosition);
    rightYPosition += 25;

    // Last updated (if exists)
    if (lead.last_updated) {
      const lastUpdated =
        new Date(lead.last_updated).toLocaleDateString("en-US", {
          month: "2-digit",
          day: "2-digit",
          year: "numeric",
        }) +
        " at " +
        new Date(lead.last_updated).toLocaleTimeString("en-US", {
          hour: "2-digit",
          minute: "2-digit",
        });

      doc
        .fillColor("#34495e")
        .font("Helvetica-Bold")
        .text("Updated:", rightColumn, rightYPosition);
      doc.font("Helvetica").text(lastUpdated, rightColumn + 60, rightYPosition);
      rightYPosition += 25;
    }

    // Use the higher position for next section
    yPosition = Math.max(yPosition, rightYPosition) + 20;

    // Tags section
    if (lead.tag && lead.tag.length > 0) {
      doc
        .fillColor("#2c3e50")
        .fontSize(16)
        .font("Helvetica-Bold")
        .text("Tags", 50, yPosition);

      yPosition += 25;

      const tagsText = lead.tag.join(", ");
      doc
        .fillColor("#8e44ad")
        .fontSize(12)
        .font("Helvetica")
        .text(tagsText, 80, yPosition, {
          width: 400,
          align: "left",
        });

      yPosition += 40;
    }

    // Set y position for next section
    doc.y = yPosition;
  }

  private static addNotesSection(doc: PDFKit.PDFDocument, notes: string): void {
    let yPosition = doc.y + 20;

    // Check if we need a new page
    if (yPosition > doc.page.height - 150) {
      doc.addPage();
      yPosition = 50;
    }

    doc
      .fontSize(16)
      .fillColor("#2c3e50")
      .font("Helvetica-Bold")
      .text("Notes", 50, yPosition);

    yPosition += 25;

    // Calculate notes box height based on content
    const notesHeight = Math.min(notes.length * 0.6 + 40, 200);

    // Notes box background
    doc
      .rect(50, yPosition - 10, 495, notesHeight)
      .fillColor("#f8f9fa")
      .fill();

    // Notes text
    doc
      .fontSize(11)
      .fillColor("#2c3e50")
      .font("Helvetica")
      .text(notes, 60, yPosition, {
        width: 475,
        align: "left",
      });
  }

  private static addSingleLeadFooter(
    doc: PDFKit.PDFDocument,
    lead: Lead
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
      .text(`${lead.name}`, 50, doc.page.height - 60, { align: "left" })
      .text("Lead Management System", 0, doc.page.height - 60, {
        align: "right",
        width: doc.page.width - 50,
      });
  }
}
