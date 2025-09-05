import app from './app'

import fs from 'fs';
import path from 'path';
import logger from './logger';

const uploadDir = path.resolve('uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir);
}

const STATUS = process.env.STATUS || 'prod'
const PORT = parseInt(process.env.PORT || '4000', 10)

if (STATUS === 'dev') {
  app.listen(PORT, '127.0.0.1', () => {
    console.log(`🚀 Server running in ${STATUS} mode on http://127.0.0.1:${PORT}`)
  })
} else {
  app.listen(PORT, () => {
    console.log(`🚀 Server running in ${STATUS} mode on port ${PORT}`)
    logger.info({ node: process.versions.node }, 'server-up');
  })
}