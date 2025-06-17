import express from 'express'
import path from 'path';
import mediaRouter from './routes/media.routes';
import eventRouter from './routes/event.routes';
import cors from 'cors';
import 'dotenv/config';

import { errorHandler } from './middlewares/errorHandler';

const app = express();
app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));
app.use(express.static(path.join(__dirname, '../static')));
app.use('/api/media', mediaRouter);
app.use('/api/events', eventRouter)
app.use(errorHandler);

app.get('/', (req, res) => {
    res.status(403).send('<h1>Access is not Available.</h1>');
})

app.get('/health', (req, res) => {
    res.status(200).json({ status: 'OK', message: 'Server is running' });
});

export default app;
