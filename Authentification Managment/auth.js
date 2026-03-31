import { auth, database } from "../firebase-config.js";
import {
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    sendPasswordResetEmail
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import {
    ref,
    set,
    get
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-database.js";

// Constants
const ROUTES = {
    HOME: "/HomePage.html",
    LOGIN: "/index.html"
};

const VALIDATION_PATTERNS = {
    EMAIL: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    STRONG_PASSWORD: /^(?=.*[A-Z])(?=.*\d).{6,}$/
};

const ERROR_MESSAGES = {
    VALIDATION: {
        NAME_REQUIRED: "Name is required",
        INVALID_EMAIL: "Invalid email",
        EMAIL_REQUIRED: "Email is required",
        PASSWORD_REQUIRED: "Password is required",
        PASSWORD_WEAK: "Min 6 chars, 1 uppercase, 1 number",
        PASSWORDS_MISMATCH: "Passwords do not match",
        EMAIL_FOR_RESET: "Enter your email first"
    },
    AUTH: {
        "auth/email-already-in-use": "This email is already registered",
        "auth/invalid-email": "Invalid email address",
        "auth/user-not-found": "No account found with this email",
        "auth/wrong-password": "Incorrect password",
        "auth/too-many-requests": "Too many attempts. Try again later",
        "auth/invalid-credential": "Invalid email or password"
    },
    SUCCESS: {
        PASSWORD_RESET: "Password reset email sent!"
    },
    DEFAULT: "An error occurred. Please try again."
};

// Firebase services are imported from firebase-config.js

// Validation Service
class ValidationService {
    static isValidEmail(email) {
        return VALIDATION_PATTERNS.EMAIL.test(email);
    }

    static isStrongPassword(password) {
        return VALIDATION_PATTERNS.STRONG_PASSWORD.test(password);
    }

    static validateRegistrationFields(fields) {
        const errors = {};
        
        if (!fields.name?.trim()) {
            errors.name = ERROR_MESSAGES.VALIDATION.NAME_REQUIRED;
        }
        
        if (!this.isValidEmail(fields.email?.trim())) {
            errors.email = ERROR_MESSAGES.VALIDATION.INVALID_EMAIL;
        }
        
        if (!this.isStrongPassword(fields.password)) {
            errors.password = ERROR_MESSAGES.VALIDATION.PASSWORD_WEAK;
        }
        
        if (fields.password !== fields.confirmPassword) {
            errors.password = ERROR_MESSAGES.VALIDATION.PASSWORDS_MISMATCH;
        }
        
        return {
            isValid: Object.keys(errors).length === 0,
            errors
        };
    }

    static validateLoginFields(fields) {
        const errors = {};
        
        if (!fields.email) {
            errors.email = ERROR_MESSAGES.VALIDATION.EMAIL_REQUIRED;
        }
        
        if (!fields.password) {
            errors.password = ERROR_MESSAGES.VALIDATION.PASSWORD_REQUIRED;
        }
        
        return {
            isValid: Object.keys(errors).length === 0,
            errors
        };
    }

    static validatePasswordResetFields(fields) {
        const errors = {};
        
        if (!fields.email) {
            errors.email = ERROR_MESSAGES.VALIDATION.EMAIL_FOR_RESET;
        }
        
        return {
            isValid: Object.keys(errors).length === 0,
            errors
        };
    }
}

// DOM Utility Service
class DOMService {
    static getElementById(id) {
        return document.getElementById(id);
    }

    static getFormData(fieldIds) {
        const data = {};
        fieldIds.forEach(id => {
            const element = this.getElementById(id);
            data[id] = element ? element.value.trim() : '';
        });
        return data;
    }

    static clearErrors(inputIds = [], errorIds = []) {
        inputIds.forEach(id => {
            const input = this.getElementById(id);
            if (input) input.classList.remove("error");
        });
        
        errorIds.forEach(id => {
            const error = this.getElementById(id);
            if (error) error.textContent = "";
        });
    }

    static setFieldError(inputId, errorId, message) {
        const errorElement = this.getElementById(errorId);
        const inputElement = this.getElementById(inputId);
        
        if (errorElement) {
            errorElement.textContent = message;
        }
        if (inputElement) {
            inputElement.classList.add("error");
        }
    }

    static displayErrors(errors) {
        Object.entries(errors).forEach(([field, message]) => {
            this.setFieldError(field, `${field}-error`, message);
        });
    }

    static displayFormMessage(message, isSuccess = false) {
        const formError = this.getElementById("form-error");
        if (formError) {
            formError.textContent = message;
            formError.style.color = isSuccess ? "#4CAF50" : "#E53935";
        }
    }

    static togglePasswordVisibility(inputId) {
        const input = this.getElementById(inputId);
        if (input) {
            input.type = input.type === "password" ? "text" : "password";
        }
    }
}

// Error Handler Service
class ErrorHandlerService {
    static handleAuthError(error) {
        const message = ERROR_MESSAGES.AUTH[error.code] || ERROR_MESSAGES.DEFAULT;
        DOMService.displayFormMessage(message);
        console.error('Auth Error:', error);
    }

    static handleValidationErrors(errors) {
        DOMService.displayErrors(errors);
    }

    static handleGenericError(error, context = '') {
        console.error(`${context} Error:`, error);
        DOMService.displayFormMessage(ERROR_MESSAGES.DEFAULT);
    }
}

// User Service
class UserService {
    static async createUserProfile(uid, userData) {
        const userProfile = {
            name: userData.name,
            email: userData.email,
            createdAt: new Date().toISOString(),
            preferences: { 
                dietType: "", 
                allergies: [] 
            }
        };
        
        await set(ref(database, `users/${uid}`), userProfile);
        return userProfile;
    }

    static async getUserProfile(uid) {
        const snapshot = await get(ref(database, `users/${uid}`));
        return snapshot.exists() ? snapshot.val() : null;
    }

    static setCurrentUser(userData) {
        sessionStorage.setItem("currentUser", JSON.stringify(userData));
    }

    static getCurrentUser() {
        const userData = sessionStorage.getItem("currentUser");
        return userData ? JSON.parse(userData) : null;
    }

    static clearCurrentUser() {
        sessionStorage.removeItem("currentUser");
    }
}

// Navigation Service
class NavigationService {
    static redirectTo(route) {
        window.location.href = route;
    }

    static redirectToHome() {
        this.redirectTo(ROUTES.HOME);
    }

    static redirectToLogin() {
        this.redirectTo(ROUTES.LOGIN);
    }
}
// Main Authentication Service
class AuthService {
    constructor() {
        this.auth = auth;
        this.database = database;
    }

    // Registration
    async register() {
        try {
            const formData = DOMService.getFormData(['name', 'email', 'password', 'confirm-password']);
            const validation = ValidationService.validateRegistrationFields({
                name: formData.name,
                email: formData.email,
                password: formData.password,
                confirmPassword: formData['confirm-password']
            });

            // Clear previous errors
            DOMService.clearErrors(
                ['name', 'email', 'password', 'confirm-password'],
                ['name-error', 'email-error', 'password-error', 'form-error']
            );

            if (!validation.isValid) {
                ErrorHandlerService.handleValidationErrors(validation.errors);
                return;
            }

            const userCredential = await createUserWithEmailAndPassword(
                this.auth,
                formData.email,
                formData.password
            );

            await UserService.createUserProfile(userCredential.user.uid, {
                name: formData.name,
                email: formData.email
            });

            NavigationService.redirectToLogin();
        } catch (error) {
            ErrorHandlerService.handleAuthError(error);
        }
    }

    // Login
    async login() {
        try {
            const formData = DOMService.getFormData(['email', 'password']);
            const validation = ValidationService.validateLoginFields(formData);

            // Clear previous errors
            DOMService.clearErrors(
                ['email', 'password'],
                ['email-error', 'password-error', 'form-error']
            );

            if (!validation.isValid) {
                ErrorHandlerService.handleValidationErrors(validation.errors);
                return;
            }

            const userCredential = await signInWithEmailAndPassword(
                this.auth,
                formData.email,
                formData.password
            );

            const userProfile = await UserService.getUserProfile(userCredential.user.uid);
            if (userProfile) {
                UserService.setCurrentUser(userProfile);
            }

            NavigationService.redirectToHome();
        } catch (error) {
            ErrorHandlerService.handleAuthError(error);
        }
    }

    // Forgot Password
    async forgotPassword() {
        try {
            const formData = DOMService.getFormData(['email']);
            const validation = ValidationService.validatePasswordResetFields(formData);

            // Clear previous errors
            DOMService.clearErrors(['email'], ['email-error', 'form-error']);

            if (!validation.isValid) {
                ErrorHandlerService.handleValidationErrors(validation.errors);
                return;
            }

            await sendPasswordResetEmail(this.auth, formData.email);
            DOMService.displayFormMessage(ERROR_MESSAGES.SUCCESS.PASSWORD_RESET, true);
        } catch (error) {
            ErrorHandlerService.handleAuthError(error);
        }
    }

    // Logout
    async logout() {
        try {
            await this.auth.signOut();
            UserService.clearCurrentUser();
            NavigationService.redirectToLogin();
        } catch (error) {
            ErrorHandlerService.handleGenericError(error, 'Logout');
        }
    }

    // Check Authentication Status
    static getCurrentAuthUser() {
        return auth.currentUser;
    }

    static isAuthenticated() {
        return !!this.getCurrentAuthUser();
    }
}

// Singleton instance
const authService = new AuthService();

// Global function exports for backward compatibility
window.register = () => authService.register();
window.login = () => authService.login();
window.forgotPassword = () => authService.forgotPassword();
window.logout = () => authService.logout();
window.togglePassword = (inputId) => DOMService.togglePasswordVisibility(inputId);

// Event Handler Service
class EventHandlerService {
    static initializeEventListeners() {
        document.addEventListener("DOMContentLoaded", () => {
            // Forgot password link
            const forgotLink = document.querySelector(".forgot-link");
            if (forgotLink) {
                forgotLink.addEventListener("click", (e) => {
                    e.preventDefault();
                    authService.forgotPassword();
                });
            }

            // Form submissions with Enter key
            const forms = document.querySelectorAll('form');
            forms.forEach(form => {
                form.addEventListener('keypress', (e) => {
                    if (e.key === 'Enter') {
                        e.preventDefault();
                        const submitButton = form.querySelector('button[type="submit"]');
                        if (submitButton) {
                            submitButton.click();
                        }
                    }
                });
            });

            // Auto-clear errors on input
            const inputs = document.querySelectorAll('input[type="text"], input[type="email"], input[type="password"]');
            inputs.forEach(input => {
                input.addEventListener('input', () => {
                    if (input.classList.contains('error')) {
                        input.classList.remove('error');
                        const errorId = `${input.id}-error`;
                        const errorElement = document.getElementById(errorId);
                        if (errorElement) {
                            errorElement.textContent = '';
                        }
                    }
                });
            });
        });
    }
}

// Initialize event listeners
EventHandlerService.initializeEventListeners();
