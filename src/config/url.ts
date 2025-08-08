// /config/url.ts
import 'dotenv/config'

export const BASE_URL = process.env.BASE_URL || 'http://127.0.0.1:4000';
export const PORT = process.env.PORT;

// Extract nested ternary into independent statements
const isLocalDevelopment = BASE_URL.startsWith('http://127.0.0.1') || BASE_URL.startsWith('http://localhost');
const shouldAppendPort = isLocalDevelopment && PORT;

export const FULL_BASE_URL = shouldAppendPort ? `${BASE_URL}:${PORT}` : BASE_URL;