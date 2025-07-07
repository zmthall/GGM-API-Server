// /controllers/application.controller.ts
import { Request, Response } from 'express';
import * as applicationService from '../services/application.services';
import type { FileUpload } from '../types/application';

export const submitApplication = async (req: Request, res: Response) => {
    try {
        const applicationData = JSON.parse(req.body.applicationData);
        const files: FileUpload[] = req.files as FileUpload[] || [];

        // Immediately respond to user
        res.status(200).json({
            success: true,
            message: 'Application received and is being processed'
        });

        // Process in background (fire-and-forget)
        applicationService.submitApplication(applicationData, files)
            .catch(error => {
                console.error('Background processing failed:', error);
                // Could log to database, send email notification, etc.
            });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: (error as Error).message
        });
    }
};