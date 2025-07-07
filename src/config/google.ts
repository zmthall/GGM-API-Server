// /config/google.ts
import 'dotenv/config'

export const googleSpreadSheetID = process.env.GOOGLE_SPREADSHEET_ID
export const googleFolderID = process.env.GOOGLE_FOLDER_ID

export const googleProjectId = process.env.GOOGLE_PROJECT_ID
export const googlePrivateKey = process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n')
export const googleClientEmail = process.env.GOOGLE_CLIENT_EMAIL
export const googleClientId = process.env.GOOGLE_CLIENT_ID

export const googleCredentials = {
    type: 'service_account',
    project_id: googleProjectId,
    private_key: googlePrivateKey,
    client_email: googleClientEmail,
    client_id: googleClientId
}