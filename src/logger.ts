// logger.ts
import pino from 'pino';
import path from 'node:path';
import fs from 'node:fs';
import { randomUUID } from 'node:crypto';

const isProd = process.env.NODE_ENV === 'production';
const logDir = process.env.LOG_DIR || path.resolve(process.cwd(), 'app-logs');

// Handy alias: either a standard destination stream OR whatever `pino.transport()` returns
type PinoDest = pino.DestinationStream | ReturnType<typeof pino.transport>;

let destination: PinoDest | undefined;

if (isProd) {
  try {
    fs.mkdirSync(logDir, { recursive: true });
    destination = pino.transport({
      targets: [
        { target: 'pino/file', level: 'info',  options: { destination: path.join(logDir, 'app.log'),   mkdir: true } },
        { target: 'pino/file', level: 'error', options: { destination: path.join(logDir, 'error.log'), mkdir: true } },
      ],
    });
  } catch (e) {
    destination = undefined; // fallback to stdout
    // eslint-disable-next-line no-console
    console.warn('[logger] file transport init failed, using stdout:', (e as Error).message);
  }
} else {
  // dev pretty output — make sure: npm i -D pino-pretty
  destination = pino.transport({
    target: 'pino-pretty',
    options: { colorize: true, translateTime: 'SYS:standard' },
  });
}

export const logger = pino(
  { level: process.env.LOG_LEVEL ?? (isProd ? 'info' : 'debug'), base: { service: 'ggm-api' } },
  destination
);

export const randomID = () => randomUUID();
export default logger;
