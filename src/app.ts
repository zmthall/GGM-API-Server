import express from 'express'
import path from 'path';
import cors from 'cors';
import 'dotenv/config';

const allowedOrigins = [
  'https://goldengatemanor.com',
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

import { errorHandler } from './middlewares/errorHandler';

const app = express();
// CORS for API routes
app.use(cors({
  origin: allowedOrigins,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());

const uploadsPath = path.resolve(__dirname, 'uploads');
app.use('/uploads', express.static(uploadsPath));

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
app.use(errorHandler);

app.get('/', (req, res) => {
    res.status(403).send('<h1>Access is not Available.</h1>');
})

app.get('/health', (req, res) => {
    res.status(200).json({ status: 'OK', message: 'Server is running' });
});

export default app;
