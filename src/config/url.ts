// /config/url.ts
import 'dotenv/config'

// Environment data used for the server
export const BASE_URL = process.env.BASE_URL || 'http://127.0.0.1:4000';
export const PORT = process.env.PORT;
export const FULL_BASE_URL = PORT ? `${BASE_URL}:${PORT}` : `${BASE_URL}`;