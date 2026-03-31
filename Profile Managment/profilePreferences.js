/*
 * profilePreferences.js - Profile Management for MealMajor
 * SOEN 341 - Software Process, Winter 2026
 * Team LZJCO
 */

// Firebase imports
import { auth, database } from "../firebase-config.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import {
  ref,
  get,
  update
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-database.js";

// Constants
const ERROR_MESSAGES = {
  NO_USER: "Please log in to access your profile.",
  LOAD_FAILED: "Failed to load profile data.",
  UPDATE_FAILED: "Failed to update profile.",
  NAME_REQUIRED: "Name cannot be empty.",
  INVALID_CALORIES: "Daily calorie target must be a positive number."
};

const SUCCESS_MESSAGES = {
  PROFILE_UPDATED: "Profile updated successfully!"
};

// Profile Validation Service
class ProfileValidationService {
  static validateProfileData(formData) {
    const errors = {};

    if (!formData.name?.trim()) {
      errors.name = ERROR_MESSAGES.NAME_REQUIRED;
    }

    const calories = parseInt(formData.targetCalories);
    if (formData.targetCalories && (isNaN(calories) || calories < 0 || calories > 10000)) {
      errors.targetCalories = ERROR_MESSAGES.INVALID_CALORIES;
    }

    return {
      isValid: Object.keys(errors).length === 0,
      errors
    };
  }
}

// Profile DOM Service
class ProfileDOMService {
  static getElementById(id) {
    return document.getElementById(id);
  }

  static getFormData() {
    const nameElement = this.getElementById("name");
    const caloriesElement = this.getElementById("targetCalories");
    const otherAllergiesElement = this.getElementById("Allergies");

    const selectedAllergies = Array.from(
      document.querySelectorAll("#allergyGroup input[type='checkbox']:checked")
    ).map(cb => cb.value);

    const dietPreferences = Array.from(
      document.querySelectorAll("#prefGroup input[type='checkbox']:checked")
    ).map(cb => cb.value);

    return {
      name: nameElement?.value?.trim() || "",
      targetCalories: caloriesElement?.value || "",
      selectedAllergies,
      otherAllergies: otherAllergiesElement?.value?.trim() || "",
      dietPreferences
    };
  }

  static populateForm(profileData) {
    // Ensure helpers are available
    if (!window.ProfilePreferencesHelpers) {
      console.error('ProfilePreferencesHelpers not loaded');
      return;
    }
    
    const formData = window.ProfilePreferencesHelpers.mapProfileToForm(profileData);

    // Set basic fields
    const nameInput = this.getElementById("name");
    const caloriesInput = this.getElementById("targetCalories");
    const otherAllergiesInput = this.getElementById("Allergies");

    if (nameInput) nameInput.value = formData.name;
    if (caloriesInput) caloriesInput.value = profileData.targetCalories || "";
    if (otherAllergiesInput) otherAllergiesInput.value = formData.otherAllergies;

    // Set allergy checkboxes
    document.querySelectorAll("#allergyGroup input[type='checkbox']").forEach(cb => {
      cb.checked = formData.selectedAllergies.includes(cb.value);
    });

    // Set dietary preference checkboxes
    document.querySelectorAll("#prefGroup input[type='checkbox']").forEach(cb => {
      cb.checked = formData.dietPreferences.includes(cb.value);
    });
  }

  static displayMessage(message, isError = false) {
    const messageElement = this.getElementById("save-message");
    if (messageElement) {
      messageElement.textContent = message;
      messageElement.className = `save-message ${isError ? 'error' : 'success'}`;
    }
  }

  static clearMessage() {
    const messageElement = this.getElementById("save-message");
    if (messageElement) {
      messageElement.textContent = "";
      messageElement.className = "save-message";
    }
  }

  static displayFieldErrors(errors) {
    Object.entries(errors).forEach(([field, message]) => {
      const errorElement = this.getElementById(`${field}-error`);
      const inputElement = this.getElementById(field);
      
      if (errorElement) {
        errorElement.textContent = message;
      }
      if (inputElement) {
        inputElement.classList.add('error');
      }
    });
  }

  static clearFieldErrors() {
    // Clear all error messages
    document.querySelectorAll('.error-text').forEach(error => {
      error.textContent = '';
    });
    
    // Remove error styling from inputs
    document.querySelectorAll('input.error').forEach(input => {
      input.classList.remove('error');
    });
  }

  static setFormLoading(isLoading) {
    const form = this.getElementById("settingsForm");
    const saveButton = this.getElementById("saveButton");
    
    if (form) {
      form.classList.toggle('loading', isLoading);
    }
    
    if (saveButton) {
      saveButton.disabled = isLoading;
      saveButton.textContent = isLoading ? 'Saving...' : 'Save Changes';
    }
  }
}

// Profile Service
class ProfileService {
  static async loadUserProfile(uid) {
    try {
      const snapshot = await get(ref(database, `users/${uid}`));
      return snapshot.exists() ? snapshot.val() : null;
    } catch (error) {
      console.error('Error loading profile:', error);
      throw new Error(ERROR_MESSAGES.LOAD_FAILED, { cause: error });
    }
  }

  static async updateUserProfile(uid, formData) {
    const { isValid, errors } = ProfileValidationService.validateProfileData(formData);
    
    if (!isValid) {
      throw { validationErrors: errors };
    }

    // Process allergies
    const otherAllergiesArray = formData.otherAllergies
      ? formData.otherAllergies.split(',').map(item => item.trim()).filter(Boolean)
      : [];
    
    const allAllergies = [...formData.selectedAllergies, ...otherAllergiesArray];

    const updateData = {
      name: formData.name,
      targetCalories: formData.targetCalories ? parseInt(formData.targetCalories) : 0,
      preferences: {
        allergies: allAllergies,
        dietPreferences: formData.dietPreferences
      }
    };

    try {
      await update(ref(database, `users/${uid}`), updateData);
      return updateData;
    } catch (error) {
      console.error('Error updating profile:', error);
      throw new Error(ERROR_MESSAGES.UPDATE_FAILED, { cause: error });
    }
  }
}

// Main Profile Manager
class ProfileManager {
  constructor() {
    this.currentUser = null;
    this.form = null;
    this.isInitialized = false;
  }

  waitForHelpers() {
    return new Promise((resolve) => {
      if (window.ProfilePreferencesHelpers) {
        resolve();
      } else {
        const checkHelpers = () => {
          if (window.ProfilePreferencesHelpers) {
            resolve();
          } else {
            setTimeout(checkHelpers, 10);
          }
        };
        checkHelpers();
      }
    });
  }

  async initialize() {
    if (this.isInitialized) return;

    // Wait for helpers to be loaded
    await this.waitForHelpers();

    this.form = ProfileDOMService.getElementById("settingsForm");
    if (!this.form) {
      console.error('Profile form not found');
      return;
    }

    // Wait for authentication state
    onAuthStateChanged(auth, async (user) => {
      await this.handleAuthStateChange(user);
    });

    this.setupEventListeners();
    this.isInitialized = true;
  }

  async handleAuthStateChange(user) {
    this.currentUser = user;
    
    if (!user) {
      ProfileDOMService.displayMessage(ERROR_MESSAGES.NO_USER, true);
      return;
    }

    try {
      await this.loadUserProfile();
    } catch (error) {
      ProfileDOMService.displayMessage(error.message, true);
    }
  }

  async loadUserProfile() {
    if (!this.currentUser) return;

    try {
      ProfileDOMService.setFormLoading(true);
      const profileData = await ProfileService.loadUserProfile(this.currentUser.uid);
      
      if (profileData) {
        ProfileDOMService.populateForm(profileData);
      }
    } catch (error) {
      ProfileDOMService.displayMessage(error.message, true);
    } finally {
      ProfileDOMService.setFormLoading(false);
    }
  }

  setupEventListeners() {
    // Form submission
    this.form.addEventListener("submit", async (e) => {
      e.preventDefault();
      await this.handleProfileUpdate();
    });

    // Real-time error clearing
    this.setupInputErrorClearing();
  }

  setupInputErrorClearing() {
    const inputs = document.querySelectorAll('#settingsForm input');
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
  }

  async handleProfileUpdate() {
    if (!this.currentUser) {
      ProfileDOMService.displayMessage(ERROR_MESSAGES.NO_USER, true);
      return;
    }

    try {
      ProfileDOMService.setFormLoading(true);
      ProfileDOMService.clearMessage();
      ProfileDOMService.clearFieldErrors();

      const formData = ProfileDOMService.getFormData();
      await ProfileService.updateUserProfile(this.currentUser.uid, formData);
      
      ProfileDOMService.displayMessage(SUCCESS_MESSAGES.PROFILE_UPDATED);
    } catch (error) {
      if (error.validationErrors) {
        ProfileDOMService.displayFieldErrors(error.validationErrors);
      } else {
        ProfileDOMService.displayMessage(error.message, true);
      }
    } finally {
      ProfileDOMService.setFormLoading(false);
    }
  }
}

// Initialize when DOM is ready
document.addEventListener("DOMContentLoaded", () => {
  const profileManager = new ProfileManager();
  profileManager.initialize();
});
