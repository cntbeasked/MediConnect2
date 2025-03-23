import { initializeApp, getApps, getApp, FirebaseApp } from "firebase/app"
import { getAuth, Auth } from "firebase/auth"
import { getFirestore, Firestore } from "firebase/firestore"

// Check if we're running on the client side
const isBrowser = typeof window !== "undefined"

// Default config to prevent initialization errors
// This will be overridden by actual env variables when available
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "demo-api-key",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "demo-app.firebaseapp.com",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "demo-project",
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "demo-app.appspot.com",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "123456789",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "1:123456789:web:abc123def456",
}

// Only initialize Firebase if we're in the browser and it hasn't been initialized yet
let app: FirebaseApp
let auth: Auth
let db: Firestore

if (isBrowser) {
  try {
    app = !getApps().length ? initializeApp(firebaseConfig) : getApp()
    auth = getAuth(app)
    db = getFirestore(app)
    console.log("Firebase initialized successfully")
  } catch (error) {
    console.error("Firebase initialization error:", error)
    // Initialize with empty objects to prevent runtime errors
    throw new Error("Failed to initialize Firebase. See console for details.")
  }
} else {
  // Server-side placeholder
  // We need to provide a minimal implementation to avoid type errors
  app = {} as FirebaseApp
  auth = {} as Auth
  db = {} as Firestore
  console.warn("Firebase is not initialized on the server side")
}

export { app, auth, db }

