import { initializeApp } from "firebase/app";
import { getFirestore, doc, getDocFromServer } from "firebase/firestore";
import { getAuth } from "firebase/auth";

let firebaseConfig: any = null;

try {
  // Try to load the config file
  firebaseConfig = await import("../../firebase-applet-config.json").then(m => m.default);
} catch (e) {
  console.warn("Firebase config not found. Please complete Firebase setup.");
}

const app = firebaseConfig ? initializeApp(firebaseConfig) : null;
export const db = app ? getFirestore(app, firebaseConfig.firestoreDatabaseId) : null;
export const auth = app ? getAuth(app) : null;

// Validate Connection
if (db) {
  const testConnection = async () => {
    try {
      await getDocFromServer(doc(db, "test", "connection"));
    } catch (error) {
      if (error instanceof Error && error.message.includes("offline")) {
        console.error("Firebase is offline. Check configuration.");
      }
    }
  };
  testConnection();
}
