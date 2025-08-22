import archiver from 'archiver';

interface PDFFile {
  buffer: Buffer;
  filename: string;
}

export class Zippper {
  static createPDFZip(pdfFiles: PDFFile[]): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      try {
        const archive = archiver('zip', { 
          zlib: { level: 9 } // Maximum compression
        });
        
        const chunks: Buffer[] = [];
        
        archive.on('data', (chunk) => chunks.push(chunk));
        archive.on('end', () => {
          resolve(Buffer.concat(chunks));
        });
        archive.on('error', reject);
        
        // Add each PDF to the archive
        pdfFiles.forEach(({ buffer, filename }) => {
          archive.append(buffer, { name: filename });
        });
        
        // Finalize the archive
        archive.finalize();
      } catch (error) {
        reject(error);
      }
    });
  }
}