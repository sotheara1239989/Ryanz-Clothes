import { initializeApp, getApps, getApp, deleteApp } from 'firebase/app';
import { initializeFirestore, getFirestore, doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getStorage } from 'firebase/storage';

// Helper to get saved config from localStorage or import.meta.env
export const getActiveFirebaseConfig = () => {
  try {
    const local = localStorage.getItem('ryanz_firebase_config');
    if (local) {
      const parsed = JSON.parse(local);
      if (parsed.apiKey && parsed.projectId) {
        return parsed;
      }
    }
  } catch (e) {
    console.warn("Could not read localStorage firebase config:", e);
  }

  return {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "",
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "",
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "",
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "",
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "",
    appId: import.meta.env.VITE_FIREBASE_APP_ID || ""
  };
};

const currentConfig = getActiveFirebaseConfig();

export const isFirebaseConfigured = Boolean(
  currentConfig.apiKey &&
  currentConfig.projectId &&
  !currentConfig.apiKey.includes("Dummy") &&
  !currentConfig.apiKey.includes("Replace")
);

// Fallback dummy config if not yet entered
const effectiveConfig = isFirebaseConfigured ? currentConfig : {
  apiKey: currentConfig.apiKey || "AIzaSyDemoFallbackKeyReplaceWithYourOwn",
  authDomain: currentConfig.authDomain || "ryanz-clothes-store.firebaseapp.com",
  projectId: currentConfig.projectId || "ryanz-clothes-store",
  storageBucket: currentConfig.storageBucket || "ryanz-clothes-store.appspot.com",
  messagingSenderId: currentConfig.messagingSenderId || "123456789012",
  appId: currentConfig.appId || "1:123456789012:web:demo123456"
};

// Initialize or retrieve app
let app;
if (getApps().length > 0) {
  app = getApp();
} else {
  app = initializeApp(effectiveConfig);
}

// Initialize Firestore with robust polling settings to prevent browser blocker dropping
let firestoreDb;
try {
  firestoreDb = initializeFirestore(app, {
    experimentalForceLongPolling: true,
    ignoreUndefinedProperties: true
  });
} catch (e) {
  firestoreDb = getFirestore(app);
}

export const db = firestoreDb;
export const auth = getAuth(app);
export const storage = getStorage(app);
export const googleProvider = new GoogleAuthProvider();

/**
 * Save new Firebase configuration to localStorage and reload application
 */
export const saveCustomFirebaseConfig = (config) => {
  try {
    localStorage.setItem('ryanz_firebase_config', JSON.stringify(config));
    window.location.reload();
  } catch (err) {
    console.error("Error saving firebase config:", err);
    throw err;
  }
};

/**
 * Clear custom configuration from localStorage
 */
export const clearCustomFirebaseConfig = () => {
  localStorage.removeItem('ryanz_firebase_config');
  window.location.reload();
};

/**
 * Test live connection to Firestore
 */
export const testFirestoreConnection = async () => {
  try {
    const testDocRef = doc(db, '_connection_test', 'ping');
    await setDoc(testDocRef, {
      ping: true,
      timestamp: serverTimestamp(),
      app: "Ryanz Clothes"
    });
    const snap = await getDoc(testDocRef);
    return {
      success: true,
      data: snap.data(),
      projectId: app.options.projectId
    };
  } catch (error) {
    console.error("Firestore connection test failed:", error);
    return {
      success: false,
      error: error.message || "Failed to reach Firestore."
    };
  }
};

export default app;
