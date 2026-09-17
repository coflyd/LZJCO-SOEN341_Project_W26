
/*
 * firebase-config.js - Firebase Configuration for MealMajor
 * SOEN 341 - Software Process, September 2026
 * Team LZJCO
 */

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { getDatabase } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-database.js";
import { getStorage } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-storage.js";

// Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyBtSQZIfafNiwpjT0OG_sQqknZ1eB6vyXc",
    authDomain: "lzjco-soenproject.firebaseapp.com",
    databaseURL: "https://lzjco-soenproject-default-rtdb.europe-west1.firebasedatabase.app",
    projectId: "lzjco-soenproject",
    storageBucket: "lzjco-soenproject.firebasestorage.app",
    messagingSenderId: "549082545321",
    appId: "1:549082545321:web:1333e057e6ecff156f7db8",
    measurementId: "G-13W79QXVC5"
};

// Initialize Firebase app
const app = initializeApp(firebaseConfig);

// Initialize and export Firebase services
export const auth = getAuth(app);
export const database = getDatabase(app);
export const storage = getStorage(app);

// Export raw config and app instance for advanced use cases
export { firebaseConfig, app };

// Default export for convenience
export default {
    auth,
    database,
    storage,
    config: firebaseConfig,
    app
};
