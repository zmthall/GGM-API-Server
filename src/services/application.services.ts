// /services/application.service.ts
import { ApplicationData, FileUpload } from '../types/application';
import { googleService } from './google.services';

export const submitApplication = async (applicationData: ApplicationData, files: FileUpload[]) => {
    try {
        // Find the appropriate sheet based on position
        const sheetTitle = await googleService.findSheetByPosition(applicationData.personal.select);

        // Process file uploads
        const fileData = await googleService.processFiles(files);

        // Push data to Google Sheets
        await googleService.pushSheetsData(applicationData, fileData, sheetTitle || 'Sheet1');

        return {
            success: true,
            message: 'Application submitted successfully'
        };

    } catch (error) {
        throw new Error(`Failed to submit application: ${(error as Error).message}`);
    }
};