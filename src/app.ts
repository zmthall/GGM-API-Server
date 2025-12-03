import express, { NextFunction, Request, Response } from 'express'
import path from 'path';
import cors from 'cors';
import 'dotenv/config';

import pinoHttp from 'pino-http';
import { logger, randomID } from './logger';

const allowedOrigins = [
  'https://goldengatemanor.com',
  'https://www.goldengatemanor.com',
  'https://dev.goldengatemanor.com',
  'http://localhost:3000',
  'http://127.0.0.1:3000'
];

// Routing imports
import mediaRouter from './routes/media.routes';
import eventRouter from './routes/event.routes';
import jobRouter from './routes/jobs.routes';
import recaptcha from './routes/recaptcha.routes';
import email from './routes/email.routes'
import application from './routes/application.routes';
import contactForm from './routes/contactForm.routes';
import rideRequest from './routes/rideRequest.routes';
import userManagement from './routes/userManagement.routes';
import lead from './routes/lead.routes'
import houses from './routes/houses.routes'
import community from './routes/communityImages.routes'
import crypto from './routes/crypto.routes'
import verify from './routes/verify.routes'

import { errorHandler } from './middlewares/errorHandler';
import { routeLogger } from './middlewares/routeLogs';

const app = express();

// behind nginx/Passenger
app.set('trust proxy', true);

// CORS for API routes
app.use(cors({
  origin(origin, cb) {
    if (!origin || allowedOrigins.includes(origin)) return cb(null, true);
    cb(new Error('Not allowed by CORS'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-Id'],
  exposedHeaders: ['X-Request-Id', 'X-Filename', 'Content-Disposition'],
  maxAge: 86400
}));

app.use(pinoHttp({
  logger,
  autoLogging: false,
  genReqId(req, res) {
    const id = (req.headers['x-request-id'] as string) ?? randomID();
    res.setHeader('X-Request-Id', id);
    return id;
  },
  redact: { paths: ['req.headers.authorization', 'req.headers.cookie'], remove: true },
  customProps: (req) => ({ userId: (req as any).user?.uid ?? null, ip: req.ip }),
}));

app.use(express.json());

const uploadsPath = path.resolve(__dirname, 'uploads');
app.use('/uploads', express.static(uploadsPath));

const isHealth = (p: string) => /^\/health(?:$|\/)/.test(p);

app.use(routeLogger({
  name: 'api',
  skip: (req) =>
    isHealth(req.path) ||
    req.path.startsWith('/uploads') ||
    req.method === 'OPTIONS'
}));

// Routing
app.use('/api/media', mediaRouter);
app.use('/api/events', eventRouter)
app.use('/api/jobs', jobRouter)
app.use('/api/recaptcha', recaptcha);
app.use('/api/email', email);
app.use('/api/application', application);
app.use('/api/contact-form', contactForm);
app.use('/api/ride-request', rideRequest);
app.use('/api/users', userManagement);
app.use('/api/leads', lead)
app.use('/api/houses', houses)
app.use('/api/community', community)
app.use('/api/crypto', crypto)
app.use('/api/verify', verify)

app.get('/', (req, res) => {
    res.status(403).send('<h1>Access is not Available.</h1>');
})

app.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK', message: 'Server is running' });
});

app.get('/ping', (req, res) => {
  req.log.info({ msg: 'pong' }, 'route-log');
  res.json({ ok: true });
});

app.get('/boom', (_req, _res) => { throw new Error('kaboom'); });

app.use(errorHandler);
app.use((err: Error, req: Request, res: Response, _next: NextFunction) => {
  req.log.error({ err }, 'unhandled-error');
  // pino-http sets req.id; we also echoed it to the client
  res.status(500).json({
    success: false,
    message: 'Internal Server Error',
    requestId: (req as any).id || res.getHeader('X-Request-Id') || null
  });
});

export default app;
