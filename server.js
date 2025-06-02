import app from './app.js'

import fs from 'fs';
import path from 'path';

const uploadDir = path.resolve('uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir);
}

const PORT = process.env.PORT || 4000;

app.listen(PORT, () => {
    console.log(`API successfully running on ${process.env.BASE_URL}:${PORT}`)
})