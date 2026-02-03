/*
 * auth.js - Authentication Module for MealMajor
 * SOEN 341 - Software Process, Winter 2026
 * Team LZJCO
 * 
 * Handles user registration, login, and password toggle functionality
 * using Firebase Authentication and Realtime Database.
 */

// Firebase imports (SDK v10)
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { 
    getAuth, 
    createUserWithEmailAndPassword, 
    signInWithEmailAndPassword 
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { 
    getDatabase, 
    ref, 
    set, 
    get 
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-database.js";

// Firebase config
const firebaseConfig = {
    apiKey: "AIzaSyDSozt6vIF6RrLQei26G-teUd2cPSTdPIQ",
    authDomain: "louay-testing.firebaseapp.com",
    databaseURL: "https://louay-testing-default-rtdb.firebaseio.com",
    projectId: "louay-testing",
    storageBucket: "louay-testing.firebasestorage.app",
    messagingSenderId: "123255076909",
    appId: "1:123255076909:web:c2ba7c881ed4588b7ba0a4",
    measurementId: "G-0BZBDBH9Q6"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const database = getDatabase(app);


/*
 * register() - Creates a new user account
 * Validates inputs, creates Firebase Auth user, saves profile to database
 */
window.register = async function() {
    const name = document.getElementById('name').value.trim();
    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value;
    const confirmPassword = document.getElementById('confirm-password').value;

    clearErrors();

    // Validation
    let hasError = false;

    if (!name) {
        showError('name', 'Name is required');
        hasError = true;
    }

    if (!email) {
        showError('email', 'Email is required');
        hasError = true;
    } else if (!isValidEmail(email)) {
        showError('email', 'Invalid email format');
        hasError = true;
    }

    if (!password) {
        showError('password', 'Password is required');
        hasError = true;
    } else if (password.length < 6) {
        showError('password', 'Minimum 6 characters');
        hasError = true;
    }

    if (password !== confirmPassword) {
        showError('confirm-password', 'Passwords do not match');
        hasError = true;
    }

    if (hasError) return;

    try {
        // Create user in Firebase Auth
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;

        // Save user profile to Realtime Database
        await set(ref(database, 'users/' + user.uid), {
            name: name,
            email: email,
            createdAt: new Date().toISOString(),
            preferences: {
                dietType: '',
                allergies: []
            }
        });

        alert('Account created successfully!');
        window.location.href = 'index.html';

    } catch (error) {
        handleAuthError(error);
    }
}


/*
 * login() - Authenticates existing user
 * Verifies credentials with Firebase Auth, retrieves user data from database
 */
window.login = async function() {
    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value;

    clearErrors();

    if (!email || !password) {
        showFormError('Please enter email and password');
        return;
    }

    try {
        // Sign in with Firebase
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;

        // Get user data from database
        const userRef = ref(database, 'users/' + user.uid);
        const snapshot = await get(userRef);

        if (snapshot.exists()) {
            const userData = snapshot.val();
            
            // Store in session for use in other pages
            sessionStorage.setItem('currentUser', JSON.stringify({
                uid: user.uid,
                name: userData.name,
                email: userData.email,
                preferences: userData.preferences
            }));
        }

        alert('Login successful!');
        window.location.href = 'HomePage.html';

    } catch (error) {
        handleAuthError(error);
    }
}


/*
 * togglePassword() - Shows/hides password field content
 */
window.togglePassword = function(inputId, toggleSpan) {
    const input = document.getElementById(inputId);
    
    // SVG for eye open (show password)
    const eyeOpen = `<svg class="eye-icon" xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
        <circle cx="12" cy="12" r="3"></circle>
    </svg>`;
    
    // SVG for eye closed (hide password)
    const eyeClosed = `<svg class="eye-icon" xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
        <line x1="1" y1="1" x2="23" y2="23"></line>
    </svg>`;
    
    if (input.type === 'password') {
        input.type = 'text';
        toggleSpan.innerHTML = eyeClosed;
    } else {
        input.type = 'password';
        toggleSpan.innerHTML = eyeOpen;
    }
}


// Helper function to show field-specific error
function showError(fieldId, message) {
    const errorSpan = document.getElementById(fieldId + '-error');
    const input = document.getElementById(fieldId);
    
    if (errorSpan) errorSpan.textContent = ' - ' + message;
    if (input) input.classList.add('error');
}

// Helper function to show form-level error
function showFormError(message) {
    const formError = document.getElementById('form-error');
    if (formError) formError.textContent = message;
}

// Clear all error messages
function clearErrors() {
    document.querySelectorAll('.error-text').forEach(el => el.textContent = '');
    
    const formError = document.getElementById('form-error');
    if (formError) formError.textContent = '';
    
    document.querySelectorAll('input.error').forEach(input => {
        input.classList.remove('error');
    });
}

// Email validation with regex
function isValidEmail(email) {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email);
}

// Handle Firebase error codes
function handleAuthError(error) {
    console.error('Auth error:', error.code);
    
    const errorMessages = {
        'auth/email-already-in-use': 'This email is already registered',
        'auth/invalid-email': 'Invalid email address',
        'auth/weak-password': 'Password is too weak',
        'auth/user-not-found': 'No account found with this email',
        'auth/wrong-password': 'Incorrect password',
        'auth/too-many-requests': 'Too many attempts. Try again later'
    };

    const message = errorMessages[error.code] || 'An error occurred. Please try again.';
    showFormError(message);
}

// TODO: Add helper functions