// Constants
const PREDEFINED_ALLERGIES = ["milk", "eggs", "peanuts", "gluten", "soy"];
const PREDEFINED_DIET_PREFERENCES = ["vegan", "vegetarian", "keto", "low-carb", "high-protein"];

/**
 * String Utility Functions
 */
class StringUtils {
  /**
   * Split comma-separated string and clean up items
   * @param {string} value - Comma-separated string
   * @returns {string[]} - Array of cleaned strings
   */
  static splitCommaList(value) {
    if (!value || typeof value !== 'string') return [];
    
    return value
      .split(',')
      .map(item => item.trim())
      .filter(Boolean);
  }

  /**
   * Join array into comma-separated string
   * @param {string[]} items - Array of strings
   * @returns {string} - Comma-separated string
   */
  static joinCommaList(items) {
    if (!Array.isArray(items)) return '';
    return items.filter(Boolean).join(', ');
  }

  /**
   * Sanitize text input
   * @param {string} text - Input text
   * @returns {string} - Sanitized text
   */
  static sanitizeText(text) {
    if (!text) return '';
    return text.trim().replace(/\s+/g, ' ');
  }
}

/**
 * Array Processing Utilities
 */
class ArrayUtils {
  /**
   * Filter out predefined items from array
   * @param {string[]} items - Items to filter
   * @param {string[]} predefined - Predefined items to exclude
   * @returns {string[]} - Filtered array
   */
  static getCustomItems(items, predefined) {
    if (!Array.isArray(items)) return [];
    return items.filter(item => !predefined.includes(item));
  }

  /**
   * Get only predefined items from array
   * @param {string[]} items - Items to filter
   * @param {string[]} predefined - Predefined items to include
   * @returns {string[]} - Filtered array
   */
  static getPredefinedItems(items, predefined) {
    if (!Array.isArray(items)) return [];
    return items.filter(item => predefined.includes(item));
  }

  /**
   * Remove duplicates from array
   * @param {string[]} items - Array with potential duplicates
   * @returns {string[]} - Deduplicated array
   */
  static removeDuplicates(items) {
    if (!Array.isArray(items)) return [];
    return [...new Set(items.filter(Boolean))];
  }
}

/**
 * Allergy Processing Functions
 */
class AllergyProcessor {
  /**
   * Get custom allergies (not in predefined list)
   * @param {string[]} allergies - All allergies
   * @returns {string[]} - Custom allergies only
   */
  static getCustomAllergies(allergies) {
    return ArrayUtils.getCustomItems(allergies, PREDEFINED_ALLERGIES);
  }

  /**
   * Get predefined allergies from list
   * @param {string[]} allergies - All allergies
   * @returns {string[]} - Predefined allergies only
   */
  static getPredefinedAllergies(allergies) {
    return ArrayUtils.getPredefinedItems(allergies, PREDEFINED_ALLERGIES);
  }

  /**
   * Combine predefined and custom allergies
   * @param {string[]} predefined - Predefined allergies
   * @param {string} customString - Custom allergies as string
   * @returns {string[]} - Combined deduplicated allergies
   */
  static combineAllergies(predefined, customString) {
    const customArray = StringUtils.splitCommaList(customString);
    const combined = [...(predefined || []), ...customArray];
    return ArrayUtils.removeDuplicates(combined);
  }
}

/**
 * Data Validation Functions
 */
class DataValidator {
  /**
   * Validate user profile data structure
   * @param {Object} data - User profile data
   * @returns {Object} - Validated and normalized data
   */
  static validateProfileData(data) {
    if (!data || typeof data !== 'object') {
      return { name: '', preferences: { allergies: [], dietPreferences: [] } };
    }

    const preferences = data.preferences || {};
    
    return {
      name: StringUtils.sanitizeText(data.name) || '',
      targetCalories: this.validateCalories(data.targetCalories),
      preferences: {
        allergies: Array.isArray(preferences.allergies) ? preferences.allergies : [],
        dietPreferences: Array.isArray(preferences.dietPreferences) ? preferences.dietPreferences : []
      }
    };
  }

  /**
   * Validate calorie target
   * @param {number|string} calories - Calorie value
   * @returns {number} - Validated calorie number
   */
  static validateCalories(calories) {
    const num = parseInt(calories);
    if (isNaN(num) || num < 0) return 0;
    if (num > 10000) return 10000; // Maximum reasonable calorie limit
    return num;
  }

  /**
   * Validate form input data
   * @param {Object} formData - Form input data
   * @returns {Object} - Validation result
   */
  static validateFormInput(formData) {
    const errors = {};

    if (!formData.name?.trim()) {
      errors.name = 'Name is required';
    }

    const calories = parseInt(formData.targetCalories);
    if (formData.targetCalories && (isNaN(calories) || calories < 0 || calories > 10000)) {
      errors.targetCalories = 'Please enter a valid calorie target (0-10000)';
    }

    return {
      isValid: Object.keys(errors).length === 0,
      errors,
      sanitizedData: {
        name: StringUtils.sanitizeText(formData.name),
        targetCalories: this.validateCalories(formData.targetCalories),
        selectedAllergies: ArrayUtils.removeDuplicates(formData.selectedAllergies || []),
        otherAllergies: StringUtils.sanitizeText(formData.otherAllergies),
        dietPreferences: ArrayUtils.removeDuplicates(formData.dietPreferences || [])
      }
    };
  }
}

/**
 * Main Profile Processing Functions
 */
class ProfilePreferencesHelpers {
  /**
   * Convert profile data to form-friendly format
   * @param {Object} data - User profile data from database
   * @returns {Object} - Form-ready data
   */
  static mapProfileToForm(data) {
    const validatedData = DataValidator.validateProfileData(data);
    const { allergies, dietPreferences } = validatedData.preferences;

    return {
      name: validatedData.name,
      targetCalories: validatedData.targetCalories,
      selectedAllergies: AllergyProcessor.getPredefinedAllergies(allergies),
      otherAllergies: StringUtils.joinCommaList(AllergyProcessor.getCustomAllergies(allergies)),
      dietPreferences: ArrayUtils.getPredefinedItems(dietPreferences, PREDEFINED_DIET_PREFERENCES)
    };
  }

  /**
   * Build profile update object from form data
   * @param {string} name - User name
   * @param {string[]} selectedAllergies - Selected predefined allergies
   * @param {string} otherAllergies - Custom allergies string
   * @param {string[]} dietPreferences - Selected diet preferences
   * @param {string|number} targetCalories - Target calorie value
   * @returns {Object} - Update object or error
   */
  static buildProfileUpdate(name, selectedAllergies, otherAllergies, dietPreferences, targetCalories) {
    const formData = {
      name,
      selectedAllergies,
      otherAllergies,
      dietPreferences,
      targetCalories
    };

    const validation = DataValidator.validateFormInput(formData);
    
    if (!validation.isValid) {
      return { error: validation.errors };
    }

    const { sanitizedData } = validation;
    
    return {
      name: sanitizedData.name,
      targetCalories: sanitizedData.targetCalories,
      preferences: {
        allergies: AllergyProcessor.combineAllergies(sanitizedData.selectedAllergies, sanitizedData.otherAllergies),
        dietPreferences: sanitizedData.dietPreferences
      }
    };
  }

  /**
   * Read form data from DOM
   * @param {Document} documentRef - Document reference
   * @returns {Object} - Form data
   */
  static readProfileForm(documentRef) {
    const getElementById = (id) => documentRef.getElementById(id);

    return {
      name: getElementById("name")?.value || "",
      targetCalories: getElementById("targetCalories")?.value || "",
      selectedAllergies: Array.from(
        documentRef.querySelectorAll("#allergyGroup input[type='checkbox']:checked")
      ).map(cb => cb.value),
      otherAllergies: getElementById("Allergies")?.value || "",
      dietPreferences: Array.from(
        documentRef.querySelectorAll("#prefGroup input[type='checkbox']:checked")
      ).map(cb => cb.value)
    };
  }

  // Legacy function aliases for backward compatibility
  static splitCommaList = StringUtils.splitCommaList;
  static getOtherAllergies = AllergyProcessor.getCustomAllergies;
}

function splitCommaList(value) {
  return StringUtils.splitCommaList(value);
}

function getOtherAllergies(allergies) {
  return AllergyProcessor.getCustomAllergies(allergies);
}

function mapProfileToForm(data) {
  const formData = ProfilePreferencesHelpers.mapProfileToForm(data);

  if (data?.targetCalories === undefined) {
    const { targetCalories, ...legacyFormData } = formData;
    return legacyFormData;
  }

  return formData;
}

function buildProfileUpdate(name, selectedAllergies, otherAllergies, dietPreferences, targetCalories) {
  const updatePayload = ProfilePreferencesHelpers.buildProfileUpdate(
    name,
    selectedAllergies,
    otherAllergies,
    dietPreferences,
    targetCalories
  );

  if (updatePayload.error?.name) {
    return { error: 'Name cannot be empty.' };
  }

  if (targetCalories === undefined) {
    const { targetCalories: omittedCalories, ...legacyPayload } = updatePayload;
    return legacyPayload;
  }

  return updatePayload;
}

function readProfileForm(documentRef) {
  const formData = ProfilePreferencesHelpers.readProfileForm(documentRef);

  if (!documentRef.getElementById("targetCalories")) {
    const { targetCalories, ...legacyFormData } = formData;
    return legacyFormData;
  }

  return formData;
}

// Browser environment
if (typeof window !== "undefined") {
  window.ProfilePreferencesHelpers = ProfilePreferencesHelpers;
  window.StringUtils = StringUtils;
  window.ArrayUtils = ArrayUtils;
  window.AllergyProcessor = AllergyProcessor;
  window.DataValidator = DataValidator;
}

// Node.js environment
if (typeof module !== "undefined" && module.exports) {
  module.exports = {
    splitCommaList,
    getOtherAllergies,
    mapProfileToForm,
    buildProfileUpdate,
    readProfileForm,
    ProfilePreferencesHelpers,
    StringUtils,
    ArrayUtils,
    AllergyProcessor,
    DataValidator,
    PREDEFINED_ALLERGIES,
    PREDEFINED_DIET_PREFERENCES
  };
}
