import express from 'express'
import mediaRouter from './routes/media.routes.js';
import cors from 'cors';
import 'dotenv/config'

import multer from 'multer';
const upload = multer({ dest: 'uploads/' });

const app = express();
app.use(cors());
app.use(express.json());
app.use('/api/media', mediaRouter);
app.use('/uploads', express.static('uploads'));

export default app;
