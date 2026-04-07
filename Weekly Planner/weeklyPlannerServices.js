import {database } from "../firebase-config.js";
import { ref, get, set} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-database.js";

// Constants
const MEAL_TYPES = ['breakfast', 'lunch', 'dinner', 'snack'];
const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const FULL_DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const DEFAULT_MEAL_CALORIES = 200;

// Utility Functions
class DateUtils {
    static toKey(date) {
        return date.toISOString().slice(0, 10);
    }

    static getWeekStart(weekOffset = 0, weekStartsOn = 'sun') {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const dow = today.getDay();
        const diff = weekStartsOn === 'sun' ? dow : (dow === 0 ? 6 : dow - 1);
        const start = new Date(today);
        start.setDate(today.getDate() - diff + weekOffset * 7);
        return start;
    }

    static getWeekDays(weekOffset = 0, weekStartsOn = 'sun') {
        const start = this.getWeekStart(weekOffset, weekStartsOn);
        return Array.from({ length: 7 }, (_, i) => {
            const d = new Date(start);
            d.setDate(start.getDate() + i);
            return d;
        });
    }

    static getWeekId(weekOffset = 0, weekStartsOn = 'sun') {
        // Always use Monday-based calculation for consistent week IDs regardless of display preference
        const mondayStart = this.getWeekStart(weekOffset, 'mon'); 
        const year = mondayStart.getFullYear();
        const firstJan = new Date(year, 0, 1);
        const days = Math.floor((mondayStart - firstJan) / (24 * 60 * 60 * 1000));
        const weekNum = Math.ceil((days + firstJan.getDay() + 1) / 7);
        return `${year}-W${String(weekNum).padStart(2, '0')}`;
    }

    static formatShortDate(d) {
        return `${MONTH_NAMES[d.getMonth()]} ${d.getDate()}`;
    }

    static formatFullDate(d) {
        return `${FULL_DAYS[d.getDay()]}, ${MONTH_NAMES[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`;
    }

    static isToday(d) {
        const t = new Date();
        t.setHours(0, 0, 0, 0);
        return d.getTime() === t.getTime();
    }
}

class StringUtils {
    static escapeHtml(str) {
        return String(str)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;');
    }

    static generateId() {
        return Math.random().toString(36).slice(2) + Date.now().toString(36);
    }
}

// Validation Service
class ValidationService {
    static validateMeal(meal) {
        const errors = {};

        if (!meal.name?.trim()) {
            errors.name = 'Meal name is required';
        }

        if (!MEAL_TYPES.includes(meal.type)) {
            errors.type = 'Invalid meal type';
        }

        const calories = parseInt(meal.calories);
        if (isNaN(calories) || calories < 0 || calories > 2000) {
            errors.calories = 'Calories must be between 0 and 2000';
        }

        return {
            isValid: Object.keys(errors).length === 0,
            errors
        };
    }

    static validateDateKey(dateKey) {
        const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
        return dateRegex.test(dateKey);
    }

    static sanitizeMeal(meal) {
        return {
            id: meal.id || StringUtils.generateId(),
            name: StringUtils.escapeHtml(meal.name || '').trim(),
            type: MEAL_TYPES.includes(meal.type) ? meal.type : 'breakfast',
            calories: Math.max(0, Math.min(2000, parseInt(meal.calories) || DEFAULT_MEAL_CALORIES))
        };
    }
}

// Meal Service
class MealService {
    static isDuplicateMeal(meals, name, type, excludeId = null) {
        return meals.some(meal =>
            meal.name.toLowerCase() === name.toLowerCase() &&
            meal.type === type &&
            meal.id !== excludeId
        );
    }

    static getTotalCalories(meals) {
        return meals.reduce((sum, meal) => sum + (meal.calories || DEFAULT_MEAL_CALORIES), 0);
    }

    static filterMealsByType(meals, type) {
        if (type === 'all') return meals;
        return meals.filter(meal => meal.type === type);
    }

    static sortMealsByType(meals) {
        const typeOrder = { breakfast: 0, lunch: 1, dinner: 2, snack: 3 };
        return meals.sort((a, b) => {
            const aOrder = typeOrder[a.type] ?? 999;
            const bOrder = typeOrder[b.type] ?? 999;
            return aOrder - bOrder || a.name.localeCompare(b.name);
        });
    }
}

// Firebase Service
class FirebaseService {
    static getFirebasePath(weekId, uid) {
        if (!uid) return null;
        return `users/${uid}/WeeklyPlanner/${weekId}`;
    }

    static async saveMealsToFirebase(weekId, meals, uid) {
        if (!uid) throw new Error('User not authenticated');
        
        const path = this.getFirebasePath(weekId, uid);
        if (!path) throw new Error('Invalid Firebase path');

        try {
            const weekMeals = {};
            Object.entries(meals).forEach(([dateKey, dayMeals]) => {
                if (ValidationService.validateDateKey(dateKey) && Array.isArray(dayMeals)) {
                    // Use dateKey directly instead of converting to day names
                    weekMeals[dateKey] = dayMeals.map(meal => ValidationService.sanitizeMeal(meal));
                }
            });
            
            console.log('Saving meals to Firebase:', { weekId, path, weekMeals });
            await set(ref(database, path), { days: weekMeals });
            console.log('Successfully saved meals to Firebase');
        } catch (error) {
            console.error('Error saving meals to Firebase:', error);
            throw new Error('Failed to save meals');
        }
    }

    static async loadMealsFromFirebase(weekId, weekDays, uid) {
        if (!uid) throw new Error('User not authenticated');
        
        const path = this.getFirebasePath(weekId, uid);
        if (!path) throw new Error('Invalid Firebase path');

        try {
            console.log('Loading meals from Firebase:', { weekId, path, uid });
            const snapshot = await get(ref(database, path));
            const meals = {};

            // Initialize empty meals for all days
            weekDays.forEach(day => {
                const dateKey = DateUtils.toKey(day);
                meals[dateKey] = [];
            });

            if (snapshot.exists()) {
                const data = snapshot.val();
                const days = data.days || {};
                console.log('Loaded data from Firebase:', { data, days });

                // Match dateKeys directly instead of converting day names
                Object.entries(days).forEach(([dateKey, dayMeals]) => {
                    if (ValidationService.validateDateKey(dateKey) && Array.isArray(dayMeals)) {
                        meals[dateKey] = dayMeals.map(meal => ValidationService.sanitizeMeal(meal));
                    }
                });
            } else {
                console.log('No existing data found in Firebase for week:', weekId);
            }

            console.log('Final meals loaded:', meals);
            return meals;
        } catch (error) {
            console.error('Error loading meals from Firebase:', error);
            throw new Error('Failed to load meals');
        }
    }


}

// Recipe Service
class RecipeService {
    static recipes = [];
    static loaded = false;

    static async loadAllRecipes() {
        if (this.loaded) return this.recipes;

        try {
            const snapshot = await get(ref(database, 'recipes'));
            this.recipes = [];

            if (snapshot.exists()) {
                const data = snapshot.val();
                Object.entries(data).forEach(([id, recipe]) => {
                    if (recipe && typeof recipe === 'object') {
                        this.recipes.push({
                            id,
                            name: recipe.name || 'Unnamed Recipe',
                            calories: parseInt(recipe.calories) || DEFAULT_MEAL_CALORIES,
                            category: recipe.category || 'Other',
                            description: recipe.description || '',
                            ingredients: recipe.ingredients || [],
                            instructions: recipe.instructions || []
                        });
                    }
                });
            }

            this.loaded = true;
            return this.recipes;
        } catch (error) {
            console.error('Error loading recipes:', error);
            throw new Error('Failed to load recipes');
        }
    }

    static filterRecipes(query) {
        const q = query.trim().toLowerCase();
        if (!q) return this.recipes;

        return this.recipes.filter(recipe =>
            recipe.name.toLowerCase().includes(q) ||
            recipe.category.toLowerCase().includes(q)
        );
    }

    static getRecipeById(id) {
        return this.recipes.find(recipe => recipe.id === id);
    }
}

// User Profile Service
class UserProfileService {
    static async getUserProfile(uid) {
        try {
            const snapshot = await get(ref(database, `users/${uid}`));
            return snapshot.exists() ? snapshot.val() : null;
        } catch (error) {
            console.error('Error loading user profile:', error);
            return null;
        }
    }

    static getTargetCalories(userProfile) {
        return userProfile?.targetCalories || 0;
    }
}

// Toast Service
class ToastService {
    static show(message, duration = 3000) {
        const toast = document.getElementById('reuseToast');
        if (toast) {
            toast.textContent = message;
            toast.classList.add('show');
            setTimeout(() => toast.classList.remove('show'), duration);
        }
    }
}

// Error Handler Service
class ErrorHandlerService {
    static handleError(error, context = '') {
        console.error(`${context} Error:`, error);
        
        const message = error.message || 'An unexpected error occurred';
        ToastService.show(`Error: ${message}`);
    }

    static handleValidationErrors(errors, formId = 'mealForm') {
        Object.entries(errors).forEach(([field, message]) => {
            const input = document.getElementById(`${field}Input`);
            if (input) {
                input.classList.add('error');
                input.setAttribute('title', message);
            }
        });
    }

    static clearValidationErrors(formId = 'mealForm') {
        const form = document.getElementById(formId);
        if (form) {
            form.querySelectorAll('input.error, select.error').forEach(input => {
                input.classList.remove('error');
                input.removeAttribute('title');
            });
        }
    }
}

// Export services for use in main application
export {
    DateUtils,
    StringUtils,
    ValidationService,
    MealService,
    FirebaseService,
    RecipeService,
    UserProfileService,
    ToastService,
    ErrorHandlerService,
    DAY_NAMES,
    FULL_DAYS,
    MONTH_NAMES,
    MEAL_TYPES,
    DEFAULT_MEAL_CALORIES
};