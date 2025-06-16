import express from 'express'
import path from 'path';
import mediaRouter from './routes/media.routes';
import cors from 'cors';
import 'dotenv/config'

import { errorHandler } from './middlewares/errorHandler';

const app = express();
app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(path.join(process.cwd(), 'src', 'uploads')));
app.use(express.static(path.join(process.cwd(), 'src', 'static')));
app.use('/api/media', mediaRouter);
app.use(errorHandler);

app.get('/', (req, res) => {
    res.status(403).send('<h1>Access is not Available.</h1>');
})

export default app;
