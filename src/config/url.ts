import 'dotenv/config'

export const BASE_URL = process.env.BASE_URL || 'http://127.0.0.1:4000';
export const PORT = process.env.PORT || '4000';
export const FULL_BASE_URL = `${BASE_URL}`;