// /services/google.service.ts
import { google, Auth } from 'googleapis';
import { googleSpreadSheetID, googleFolderID, googleCredentials } from '../config/google';
import type { FileUpload, FileData, ApplicationData } from '../types/application';
import * as stream from 'stream';
import { formatSubmissionDate } from '../helpers/dateFormat';
import { getPositionLabel } from '../helpers/applicationPosition';

class GoogleAPIService {
    private spreadsheetId: string;
    private folderId: string;
    private keyFile: string;

    constructor() {
        this.spreadsheetId = googleSpreadSheetID || '';
        this.folderId = googleFolderID || '';
        this.keyFile = 'google-cred.json';
    }

    async getSheetsAuth(): Promise<Auth.OAuth2Client> {
        const auth = new google.auth.GoogleAuth({
            credentials: googleCredentials,
            scopes: 'https://www.googleapis.com/auth/spreadsheets'
        });

        return (await auth.getClient()) as Auth.OAuth2Client;
    }

    async getDriveAuth(): Promise<Auth.OAuth2Client> {
        const auth = new google.auth.GoogleAuth({
            credentials: googleCredentials,
            scopes: 'https://www.googleapis.com/auth/drive'
        });

        return (await auth.getClient()) as Auth.OAuth2Client;
    }

    async getSheetMetaData() {
        const auth = await this.getSheetsAuth();
        const googleSheets = google.sheets({ version: 'v4', auth });
        
        return await googleSheets.spreadsheets.get({
            spreadsheetId: this.spreadsheetId
        });
    }

    async processFiles(files: FileUpload[]): Promise<{mvr?: FileData, drivers_license?: FileData, resume?: FileData}> {
        const fileData: {mvr?: FileData, drivers_license?: FileData, resume?: FileData} = {};

        for (const file of files) {
            const url = await this.uploadDrive(file);
            const data: FileData = {
                url: url,
                filename: file.originalname
            };
            
            if (file.fieldname === 'MVR') {
                fileData.mvr = data;
            } else if (file.fieldname === 'dl') {
                fileData.drivers_license = data;
            } else if (file.fieldname === 'resume') {
                fileData.resume = data;
            }
        }

        return fileData;
    }

    async pushSheetsData(applicationData: ApplicationData, fileData: {mvr?: FileData, drivers_license?: FileData, resume?: FileData}, sheet: string = 'Sheet1'): Promise<void> {
        const auth = await this.getSheetsAuth();
        const googleSheets = google.sheets({ version: 'v4', auth });
        
        // Create row data directly from application data
        const rowData = [
            'New', // status
            formatSubmissionDate(new Date), // submission_date
            getPositionLabel(applicationData.personal.select), // position
            applicationData.personal.firstName + ' ' + applicationData.personal.lastName, // first_name + last_name
            applicationData.personal.address, // address
            applicationData.personal.phoneNumber, // phone
            applicationData.personal.over18, // over_18
            applicationData.personal.citizen, // citizen
            applicationData.personal.felony, // felony
            applicationData.driving.hasEndorsements, // has_endorsements
            applicationData.driving?.endorsements || '', // endorsements
            applicationData.driving.hasAccidents, // has_accidents
            applicationData.driving?.accidents || '', // accidents
            applicationData.driving.hasTrafficConvictions, // has_traffic_convictions
            applicationData.driving?.trafficConvictions || '', // traffic_convictions
            fileData.mvr?.url || '', // mvr
            fileData.drivers_license?.url || '', // drivers_license
            applicationData.work.learnedAboutUs, // learned_about_us
            applicationData.work?.otherExplain, // other_explain
            applicationData.work.hasWorkedAtGoldenGate, // has_worked_at_ggm
            applicationData.work.employmentType, // employment_type
            applicationData.work?.availability, // availability
            applicationData.work.willingToWorkOvertime, // willing_to_work_overtime
            applicationData.work.preferablePayRate, // preferable_pay_rate
            applicationData.work.dateAvailableToStart, // date_available_to_start
            fileData.resume?.url || '' // resume
        ];

        await googleSheets.spreadsheets.values.append({
            spreadsheetId: this.spreadsheetId,
            range: sheet,
            valueInputOption: 'USER_ENTERED',
            requestBody: {
                values: [rowData]
            }
        });
    }

    async uploadDrive(file: FileUpload): Promise<string> {
        const auth = await this.getDriveAuth();
        const googleDrive = google.drive({ version: 'v3', auth });
        
        const bufferStream = new stream.PassThrough();
        bufferStream.end(file.buffer);
        
        const response = await googleDrive.files.create({
            requestBody: {
                name: file.originalname,
                parents: [this.folderId]
            },
            media: {
                mimeType: file.mimetype,
                body: bufferStream
            },
            fields: 'id'
        });

        const metaData = await googleDrive.files.get({
            fileId: response.data.id!,
            fields: 'webViewLink'
        });

        return metaData.data.webViewLink || '';
    }

    async findSheetByPosition(position: string): Promise<string | null> {
        const sheetsMetaData = await this.getSheetMetaData();
        const sheets = sheetsMetaData.data.sheets;

        if (!sheets) return null;

        for (const sheet of sheets) {
            const title = sheet.properties?.title;
            if (!title) continue;
            
            const normalizedTitle = title.toLowerCase().split(' ').join('_');
            if (position.includes(normalizedTitle)) {
                return title;
            }
        }

        return null;
    }
}

export const googleService = new GoogleAPIService();