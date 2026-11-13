/**
 * Veyora Firebase Configuration & Initialization
 * 
 * Instructions:
 * 1. Create a Firebase project at https://console.firebase.google.com/
 * 2. Enable Authentication (Email/Password)
 * 3. Enable Cloud Firestore
 * 4. Replace the placeholder values below with your web app credentials.
 * 
 * If credentials are not configured, Veyora automatically activates
 * Demo Mode so you can still test full role authentication and workflows.
 */

const firebaseConfig = {
  apiKey: "REPLACE_WITH_YOUR_FIREBASE_API_KEY",
  authDomain: "veyora-health.firebaseapp.com",
  projectId: "veyora-health",
  storageBucket: "veyora-health.appspot.com",
  messagingSenderId: "123456789012",
  appId: "1:123456789012:web:abcdef1234567890abcdef"
};

class FirebaseManager {
  constructor() {
    this.app = null;
    this.auth = null;
    this.db = null;
    this.storage = null;
    this.isConfigured = false;
    this.init();
  }

  init() {
    // Check if configuration has been supplied by the user
    const hasValidKey = firebaseConfig.apiKey && 
      firebaseConfig.apiKey !== "REPLACE_WITH_YOUR_FIREBASE_API_KEY" && 
      !firebaseConfig.apiKey.includes("REPLACE");

    if (hasValidKey && typeof firebase !== 'undefined') {
      try {
        if (!firebase.apps.length) {
          this.app = firebase.initializeApp(firebaseConfig);
        } else {
          this.app = firebase.app();
        }
        this.auth = firebase.auth();
        this.db = firebase.firestore();
        this.storage = firebase.storage();
        this.isConfigured = true;
        console.info("%c[Veyora]%c Firebase connected successfully.", "color: #2563eb; font-weight: bold;", "color: inherit;");
      } catch (err) {
        console.warn("[Veyora] Firebase initialization error. Falling back to Demo Mode:", err);
        this.isConfigured = false;
      }
    } else {
      this.isConfigured = false;
      console.info("%c[Veyora]%c Running in Demo Simulation Mode (Firebase keys unconfigured). Instant 1-click test accounts are active.", "color: #0d9488; font-weight: bold;", "color: inherit;");
    }
  }

  getStatus() {
    return {
      configured: this.isConfigured,
      projectId: this.isConfigured ? firebaseConfig.projectId : 'demo-simulation'
    };
  }
}

// Global instance for browser compatibility
window.VeyoraFirebase = new FirebaseManager();
window.MediBookFirebase = window.VeyoraFirebase;
