/*
 * firebase-config.js - Firebase Configuration for MealMajor
 * SOEN 341 - Software Process, Winter 2026
 * Team LZJCO
 */

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { getDatabase } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-database.js";
import { getStorage } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-storage.js";
/*
// Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyDSozt6vIF6RrLQei26G-teUd2cPSTdPIQ",
    authDomain: "louay-testing.firebaseapp.com",
    databaseURL: "https://louay-testing-default-rtdb.firebaseio.com",
    projectId: "louay-testing",
    storageBucket: "louay-testing.firebasestorage.app",
    messagingSenderId: "123255076909",
    appId: "1:123255076909:web:c2ba7c881ed4588b7ba0a4",
    measurementId: "G-0BZBDBH9Q6"
};*/

/*
 * firebase-config.js - Firebase Configuration for MealMajor
 * SOEN 341 - Software Process, September 2026
 * Team LZJCO
 */

// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyBtSQZIfafNiwpjT0OG_sQqknZ1eB6vyXc",
  authDomain: "lzjco-soenproject.firebaseapp.com",
  projectId: "lzjco-soenproject",
  storageBucket: "lzjco-soenproject.firebasestorage.app",
  messagingSenderId: "549082545321",
  appId: "1:549082545321:web:1333e057e6ecff156f7db8",
  measurementId: "G-13W79QXVC5"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);

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
