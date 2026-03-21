const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');

// Initialize Firebase Admin SDK
try {
  const serviceAccountPath = path.join(__dirname, 'serviceAccountKey.json');
  if (fs.existsSync(serviceAccountPath)) {
    const serviceAccount = require(serviceAccountPath);
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount)
    });
    console.log("Firebase Admin SDK initialized successfully");
  } else {
    console.warn("serviceAccountKey.json not found. Firestore features won't work in the backend until you add it.");
  }
} catch (error) {
    console.error("Error initializing Firebase Admin:", error);
}

const db = admin.apps.length > 0 ? admin.firestore() : null;

module.exports = { admin, db };
