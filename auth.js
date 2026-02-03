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
    signInWithEmailAndPassword,
    sendPasswordResetEmail
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
    const nameInput = document.getElementById("name");
    const emailInput = document.getElementById("email");
    const passwordInput = document.getElementById("password");
    const confirmInput = document.getElementById("confirm-password");

    const nameError = document.getElementById("name-error");
    const emailError = document.getElementById("email-error");
    const passwordError = document.getElementById("password-error");
    const formError = document.getElementById("form-error");

    clearErrors({
        inputs: [nameInput, emailInput, passwordInput, confirmInput],
        errors: [nameError, emailError, passwordError, formError]
    });

    if (!verifyFields({
        nameInput,
        emailInput,
        passwordInput,
        confirmInput,
        nameError,
        emailError,
        passwordError
    })) {
        return;
    }

    try {
        // Create user in Firebase Auth
        const userCredential = await createUserWithEmailAndPassword(auth, emailInput.value.trim(), passwordInput.value);
        const user = userCredential.user;

        // Save user profile to Realtime Database
        await set(ref(database, 'users/' + user.uid), {
            name: nameInput.value.trim(),
            email: emailInput.value.trim(),
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
    const email = document.getElementById("email");
    const password = document.getElementById("password");
    const emailError = document.getElementById("email-error");
    const passwordError = document.getElementById("password-error");
    const formError = document.getElementById("form-error");

    clearErrors({
        inputs: [email, password],
        errors: [emailError, passwordError, formError]
    });

    // check if either field is empty
    if (!email.value) {
        setFieldError(email, emailError, "Email is required");
        return;
    }
    if (!password.value) {
        setFieldError(password, passwordError, "Password is required");
        return;
    }

    try {
        // Sign in with Firebase
        const userCredential = await signInWithEmailAndPassword(auth, email.value.trim(), password.value);
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

document.addEventListener("DOMContentLoaded", () => {
    const forgotLink = document.getElementById("forgot-password-link");

    if (forgotLink) {
        forgotLink.addEventListener("click", (e) => {
            e.preventDefault();
            forgotPassword();
        });
    }
});

window.forgotPassword = async function () {
    alert("Forgot password clicked");

    const emailInput = document.getElementById("email");
    const emailError = document.getElementById("email-error");
    const formError = document.getElementById("form-error");

    clearErrors({
        inputs: [emailInput],
        errors: [emailError, formError]
    });

    if (!emailInput.value) {
        setFieldError(emailInput, emailError, "Enter your email first");
        return;
    }

    try {
        await sendPasswordResetEmail(auth, emailInput.value.trim());
        formError.textContent = "Password reset email sent!";
        formError.style.color = "#4CAF50";
    } catch (error) {
        handleAuthError(error);
    }
};





//========================Helpers========================//
function verifyFields({nameInput, emailInput, passwordInput, confirmInput, nameError, emailError, passwordError}) {
    const name = nameInput.value.trim();
    const email = emailInput.value.trim();
    const password = passwordInput.value;
    const confirm = confirmInput.value;

    // NAME
    if (!name) {
        setFieldError(nameInput, nameError, "Name is required");
        return false;
    }

    // EMAIL
    if (!isValidEmail(email)) {
        setFieldError(emailInput, emailError, "Invalid email");
        return false;
    }

    // PASSWORD STRENGTH
    if (!isStrongPassword(password)) {
        setFieldError(
            passwordInput,
            passwordError,
            "Min 6 chars, 1 uppercase letter, 1 number"
        );
        confirmInput.classList.add("error");
        return false;
    }

    // PASSWORD MATCH
    if (password !== confirm) {
        setFieldError(passwordInput, passwordError, "Passwords do not match");
        confirmInput.classList.add("error");
        return false;
    }

    return true;
}

function clearErrors({ inputs = [], errors = [] }) {
    inputs.forEach(input => {
        if (input) input.classList.remove("error");
    });

    errors.forEach(err => {
        if (err) err.textContent = "";
    });
}


function setFieldError(input, errorElement, message) {
    errorElement.textContent = message;
    input.classList.add("error");
}

function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

function isStrongPassword(password) {
    // Min 6 chars, 1 uppercase, 1 digit
    const passwordRegex = /^(?=.*[A-Z])(?=.*\d).{6,}$/;
    return passwordRegex.test(password);
}


// Helper function to show form-level error
function showFormError(message) {
    const formError = document.getElementById('form-error');
    if (formError) formError.textContent = message;
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
        'auth/too-many-requests': 'Too many attempts. Try again later',
        'auth/invalid-credentials': 'Invalid credentials provided',
    };

    const message = errorMessages[error.code] || 'An unexpected error occurred. Please try again.';
    showFormError(message);
}