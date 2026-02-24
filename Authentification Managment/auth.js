/*
 * auth.js - Authentication Module for MealMajor
 * SOEN 341 - Software Process, Winter 2026
 * Team LZJCO
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

/* ==================== REGISTER ==================== */
window.register = async function () {
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
    })) return;

    try {
        const userCredential = await createUserWithEmailAndPassword(
            auth,
            emailInput.value.trim(),
            passwordInput.value
        );

        await set(ref(database, `users/${userCredential.user.uid}`), {
            name: nameInput.value.trim(),
            email: emailInput.value.trim(),
            createdAt: new Date().toISOString(),
            preferences: { dietType: "", allergies: [] }
        });

        window.location.href = "../index.html";
    } catch (error) {
        handleAuthError(error);
    }
};

/* ==================== LOGIN ==================== */
window.login = async function () {
    const email = document.getElementById("email");
    const password = document.getElementById("password");

    const emailError = document.getElementById("email-error");
    const passwordError = document.getElementById("password-error");
    const formError = document.getElementById("form-error");

    clearErrors({
        inputs: [email, password],
        errors: [emailError, passwordError, formError]
    });

    if (!email.value) {
        setFieldError(email, emailError, "Email is required");
        return;
    }

    if (!password.value) {
        setFieldError(password, passwordError, "Password is required");
        return;
    }

    try {
        const userCredential = await signInWithEmailAndPassword(
            auth,
            email.value.trim(),
            password.value
        );

        const snapshot = await get(ref(database, `users/${userCredential.user.uid}`));
        if (snapshot.exists()) {
            sessionStorage.setItem("currentUser", JSON.stringify(snapshot.val()));
        }

        window.location.href = "/HomePage.html";
    } catch (error) {
        handleAuthError(error);
    }
};

/* ==================== FORGOT PASSWORD ==================== */
window.forgotPassword = async function () {
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

/* ==================== TOGGLE PASSWORD ==================== */
window.togglePassword = function (inputId, toggleSpan) {
    const input = document.getElementById(inputId);
    input.type = input.type === "password" ? "text" : "password";
};

/* ==================== LOGOUT ==================== */
window.logout = async function () {
    try {
        await auth.signOut();
        window.location.href = "../index.html";
    } catch (error) {
        console.error("Logout failed:", error);
    }
};


/* ==================== HELPERS ==================== */
function verifyFields({ nameInput, emailInput, passwordInput, confirmInput, nameError, emailError, passwordError }) {
    if (!nameInput.value.trim()) {
        setFieldError(nameInput, nameError, "Name is required");
        return false;
    }

    if (!isValidEmail(emailInput.value.trim())) {
        setFieldError(emailInput, emailError, "Invalid email");
        return false;
    }

    if (!isStrongPassword(passwordInput.value)) {
        setFieldError(passwordInput, passwordError, "Min 6 chars, 1 uppercase, 1 number");
        confirmInput.classList.add("error");
        return false;
    }

    if (passwordInput.value !== confirmInput.value) {
        setFieldError(passwordInput, passwordError, "Passwords do not match");
        confirmInput.classList.add("error");
        return false;
    }

    return true;
}

function clearErrors({ inputs = [], errors = [] }) {
    inputs.forEach(i => i && i.classList.remove("error"));
    errors.forEach(e => e && (e.textContent = ""));
}

function setFieldError(input, errorElement, message) {
    errorElement.textContent = message;
    input.classList.add("error");
}

function isValidEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function isStrongPassword(password) {
    return /^(?=.*[A-Z])(?=.*\d).{6,}$/.test(password);
}

function handleAuthError(error) {
    const messages = {
        "auth/email-already-in-use": "This email is already registered",
        "auth/invalid-email": "Invalid email address",
        "auth/user-not-found": "No account found with this email",
        "auth/wrong-password": "Incorrect password",
        "auth/too-many-requests": "Too many attempts. Try again later",
        "auth/invalid-credential": "Invalid email or password"
    };

    const formError = document.getElementById("form-error");
    if (formError) {
        formError.textContent = messages[error.code] || "An error occurred. Please try again.";
        formError.style.color = "#E53935";
    }
}

/* ==================== EVENT LISTENERS ==================== */
document.addEventListener("DOMContentLoaded", () => {
    const forgotLink = document.querySelector(".forgot-link");
    
    if (forgotLink) {
        forgotLink.addEventListener("click", (e) => {
            e.preventDefault();
            forgotPassword();
        });
    }
});
