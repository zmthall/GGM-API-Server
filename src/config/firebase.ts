import admin from 'firebase-admin';
import 'dotenv/config';

// Initialize Admin SDK - specific environment data needed for firebase
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FB_PROJECT_ID,
      clientEmail: process.env.FB_CLIENT_EMAIL,
      privateKey: process.env.FB_PRIVATE_KEY?.replace(/\\n/g, '\n')
    })
  });
}

export const firebaseDB = admin.firestore();
export const firebaseAuth = admin.auth();