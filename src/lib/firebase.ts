import { initializeApp } from "firebase/app";
import { getFirestore, doc, getDocFromServer } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import firebaseConfig from "../../firebase-applet-config.json";

const app = (firebaseConfig && firebaseConfig.apiKey !== "REPLACE_WITH_YOUR_API_KEY") 
  ? initializeApp(firebaseConfig) 
  : null;

export const db = app ? getFirestore(app, firebaseConfig.projectId === "REPLACE_WITH_YOUR_PROJECT_ID" ? undefined : (firebaseConfig as any).firestoreDatabaseId) : null;
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
