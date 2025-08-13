// helpers/pdfGenerator.ts
import PDFDocument from 'pdfkit';
import { Lead, LeadStatus } from '../types/lead';

export class PDFGenerator {
  // utils/pdfGenerator.ts
  static createLeadsPDF(leads: Lead[]): Buffer {
    const doc = new PDFDocument({ 
      size: 'A4',
      margins: { top: 50, bottom: 50, left: 50, right: 50 }
    });

    // Collect PDF data in buffer
    const chunks: Buffer[] = [];
    doc.on('data', chunk => chunks.push(chunk));
    doc.on('end', () => {});

    // Add header
    this.addHeader(doc, leads.length);
    
    // Add summary stats
    this.addSummaryStats(doc, leads);
    
    // Add leads table
    this.addLeadsTable(doc, leads);
    
    // Add footer
    this.addFooter(doc);
    
    doc.end();

    // Return buffer when PDF is complete
    return Buffer.concat(chunks);
  }

  private static addHeader(doc: PDFKit.PDFDocument, totalLeads: number): void {
    const currentDate = new Date().toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    // Title
    doc.fontSize(24)
       .fillColor('#2c3e50')
       .text('Lead Management Report', 50, 50, { align: 'center' });

    // Subtitle with date and count
    doc.fontSize(12)
       .fillColor('#7f8c8d')
       .text(`Generated on ${currentDate} • ${totalLeads} Total Leads`, 50, 85, { align: 'center' });

    // Horizontal line
    doc.strokeColor('#bdc3c7')
       .lineWidth(1)
       .moveTo(50, 110)
       .lineTo(545, 110)
       .stroke();
  }

  private static addSummaryStats(doc: PDFKit.PDFDocument, leads: Lead[]): void {
    const stats = this.calculateStats(leads);
    let yPosition = 130;

    doc.fontSize(16)
       .fillColor('#2c3e50')
       .text('Summary Statistics', 50, yPosition);

    yPosition += 25;

    // Status breakdown
    doc.fontSize(12)
       .fillColor('#34495e');

    const statusOrder: LeadStatus[] = ['New', 'Reviewed', 'Contacted', 'Qualified', 'Converted', 'Lost', 'Spam'];
    
    statusOrder.forEach((status) => {
      if (stats.statusBreakdown[status] > 0) {
        const percentage = ((stats.statusBreakdown[status] / stats.total) * 100).toFixed(1);
        doc.text(`${status}: ${stats.statusBreakdown[status]} (${percentage}%)`, 50, yPosition);
        yPosition += 18;
      }
    });

    // Conversion rate
    if (stats.conversionRate > 0) {
      yPosition += 10;
      doc.fontSize(14)
         .fillColor('#27ae60')
         .text(`Conversion Rate: ${stats.conversionRate}%`, 50, yPosition);
    }

    yPosition += 30;
    
    // Another horizontal line before table
    doc.strokeColor('#bdc3c7')
       .lineWidth(1)
       .moveTo(50, yPosition)
       .lineTo(545, yPosition)
       .stroke();
  }

  private static addLeadsTable(doc: PDFKit.PDFDocument, leads: Lead[]): void {
    let yPosition = doc.y + 20;
    const pageHeight = doc.page.height - 100; // Leave space for footer

    // Table headers
    doc.fontSize(10)
       .fillColor('#2c3e50')
       .font('Helvetica-Bold');

    const headers = ['Name', 'Email/Phone', 'Status', 'Source', 'Contact Date'];
    const columnWidths = [120, 140, 80, 100, 95];
    const startX = 50;

    // Draw headers
    let xPosition = startX;
    headers.forEach((header, index) => {
      doc.text(header, xPosition, yPosition, {
        width: columnWidths[index],
        align: 'left'
      });
      xPosition += columnWidths[index];
    });

    yPosition += 20;

    // Header underline
    doc.strokeColor('#bdc3c7')
       .lineWidth(1)
       .moveTo(startX, yPosition)
       .lineTo(startX + columnWidths.reduce((a, b) => a + b, 0), yPosition)
       .stroke();

    yPosition += 15;

    // Table rows
    doc.font('Helvetica')
       .fontSize(9);

    leads.forEach((lead, index) => {
      // Check if we need a new page
      if (yPosition > pageHeight) {
        doc.addPage();
        yPosition = 50;
      }

      // Alternate row colors
      if (index % 2 === 0) {
        doc.rect(startX - 5, yPosition - 5, columnWidths.reduce((a, b) => a + b, 0) + 10, 20)
           .fillColor('#f8f9fa')
           .fill();
      }

      doc.fillColor('#2c3e50');
      
      xPosition = startX;

      // Name
      doc.text(lead.name || 'N/A', xPosition, yPosition, {
        width: columnWidths[0] - 5,
        ellipsis: true
      });
      xPosition += columnWidths[0];

      // Email/Phone (prefer email, fallback to phone)
      const contact = lead.email || lead.phone || 'N/A';
      doc.text(contact, xPosition, yPosition, {
        width: columnWidths[1] - 5,
        ellipsis: true
      });
      xPosition += columnWidths[1];

      // Status with color coding
      const statusColor = this.getStatusColor(lead.status);
      doc.fillColor(statusColor)
         .text(lead.status, xPosition, yPosition, {
           width: columnWidths[2] - 5
         });
      doc.fillColor('#2c3e50'); // Reset color
      xPosition += columnWidths[2];

      // Source
      doc.text(lead.source || 'N/A', xPosition, yPosition, {
        width: columnWidths[3] - 5,
        ellipsis: true
      });
      xPosition += columnWidths[3];

      // Contact Date
      const formattedDate = new Date(lead.creation_date).toLocaleDateString('en-US');
      doc.text(formattedDate, xPosition, yPosition, {
        width: columnWidths[4] - 5
      });

      yPosition += 25;
    });
  }

  private static addFooter(doc: PDFKit.PDFDocument): void {
    const pageCount = doc.bufferedPageRange().count;
    
    for (let i = 0; i < pageCount; i++) {
      doc.switchToPage(i);
      
      // Footer line
      doc.strokeColor('#bdc3c7')
         .lineWidth(1)
         .moveTo(50, doc.page.height - 50)
         .lineTo(545, doc.page.height - 50)
         .stroke();

      // Page number and generation info
      doc.fontSize(8)
         .fillColor('#7f8c8d')
         .text(`Page ${i + 1} of ${pageCount}`, 50, doc.page.height - 35, { align: 'left' })
         .text('Generated by Lead Management System', 545, doc.page.height - 35, { align: 'right' });
    }
  }

  private static calculateStats(leads: Lead[]) {
    const statusBreakdown: Record<string, number> = {};
    
    leads.forEach(lead => {
      statusBreakdown[lead.status] = (statusBreakdown[lead.status] || 0) + 1;
    });

    const converted = statusBreakdown['Converted'] || 0;
    const total = leads.length;
    const conversionRate = total > 0 ? Number(((converted / total) * 100).toFixed(1)) : 0;

    return {
      total,
      statusBreakdown,
      conversionRate
    };
  }

  private static getStatusColor(status: LeadStatus): string {
    const statusColors: Record<LeadStatus, string> = {
      'New': '#3498db',        // Blue
      'Reviewed': '#9b59b6',   // Purple  
      'Contacted': '#f39c12',  // Orange
      'Qualified': '#2ecc71',  // Green
      'Converted': '#27ae60',  // Dark Green
      'Lost': '#e74c3c',       // Red
      'Spam': '#95a5a6'        // Gray
    };
    
    return statusColors[status] || '#2c3e50';
  }
  
//   static createContactFormPDF(contactData: any) {
    // Contact form PDF logic
//   }
  
//   static createRideRequestPDF(rideData: any) {
    // Ride request PDF logic
//   }
}