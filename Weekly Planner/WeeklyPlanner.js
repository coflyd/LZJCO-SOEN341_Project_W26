import { auth } from "../firebase-config.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import {
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
    MEAL_TYPES
} from './weeklyPlannerServices.js';

// Application State
class AppState {
    constructor() {
        this.weekStartsOn = 'sun';
        this.currentWeekOffset = 0;
        this.selectedDate = null;
        this.activeFilter = 'all';
        this.currentUser = null;
        this.meals = {};
        this.targetCalories = 0;
        this.isLoading = false;
    }

    setUser(user) {
        this.currentUser = user;
    }

    setMeals(meals) {
        this.meals = meals || {};
    }

    getMeals(dateKey) {
        return this.meals[dateKey] || [];
    }

    setTargetCalories(calories) {
        this.targetCalories = calories;
    }
}

// DOM Manipulation Service
class DOMService {
    static getElementById(id) {
        return document.getElementById(id);
    }

    static querySelector(selector) {
        return document.querySelector(selector);
    }

    static querySelectorAll(selector) {
        return document.querySelectorAll(selector);
    }

    static createElement(tag, className = '', innerHTML = '') {
        const element = document.createElement(tag);
        if (className) element.className = className;
        if (innerHTML) element.innerHTML = innerHTML;
        return element;
    }

    static clearElement(element) {
        if (element) element.innerHTML = '';
    }

    static addClass(element, className) {
        if (element) element.classList.add(className);
    }

    static removeClass(element, className) {
        if (element) element.classList.remove(className);
    }

    static toggleClass(element, className) {
        if (element) element.classList.toggle(className);
    }

    static hasClass(element, className) {
        return element ? element.classList.contains(className) : false;
    }

    static setDisplay(element, display) {
        if (element) element.style.display = display;
    }

    static show(element) {
        this.setDisplay(element, 'block');
    }

    static hide(element) {
        this.setDisplay(element, 'none');
    }
}

// Grid Rendering Service
class GridRenderService {
    static renderWeekGrid(weekDays, meals, targetCalories) {
        const grid = DOMService.getElementById('weekGrid');
        DOMService.clearElement(grid);

        weekDays.forEach(day => {
            const dateKey = DateUtils.toKey(day);
            const dayMeals = meals[dateKey] || [];
            const card = this.createDayCard(day, dateKey, dayMeals, targetCalories);
            grid.appendChild(card);
        });

        this.updateWeekLabel(weekDays);
    }

    static createDayCard(day, dateKey, dayMeals, targetCalories) {
        const card = DOMService.createElement('div', 'day-card', '');
        
        if (DateUtils.isToday(day)) {
            DOMService.addClass(card, 'today');
        }

        const totalCalories = MealService.getTotalCalories(dayMeals);
        if (targetCalories > 0 && totalCalories > targetCalories) {
            DOMService.addClass(card, 'over-limit');
        }

        // Day header
        const dayHeader = DOMService.createElement('div', 'day-header');
        dayHeader.innerHTML = `
            <div class="day-name">${DAY_NAMES[day.getDay()]}</div>
            <div class="day-number">${day.getDate()}</div>
        `;
        card.appendChild(dayHeader);

        // Meals list
        const mealsList = DOMService.createElement('div', 'meals-list');
        const sortedMeals = MealService.sortMealsByType(dayMeals);
        
        sortedMeals.forEach(meal => {
            const mealChip = this.createMealChip(meal, dateKey);
            mealsList.appendChild(mealChip);
        });

        card.appendChild(mealsList);

        // Add meal hint
        const hint = DOMService.createElement('div', 'add-meal-hint', 'Click to manage meals');
        card.appendChild(hint);

        // Click handler
        card.addEventListener('click', () => {
            PanelManager.openPanel(dateKey, day);
        });

        return card;
    }

    static createMealChip(meal, dateKey) {
        const chip = DOMService.createElement('div', 'meal-chip');
        chip.setAttribute('data-type', meal.type);

        chip.innerHTML = `
            <div class="meal-type-dot"></div>
            <span class="chip-name">${StringUtils.escapeHtml(meal.name)}</span>
            <div class="chip-actions">
                <button class="edit-chip" title="Edit meal">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="delete-chip" title="Delete meal">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        `;

        // Event handlers
        const editBtn = chip.querySelector('.edit-chip');
        const deleteBtn = chip.querySelector('.delete-chip');

        editBtn?.addEventListener('click', (e) => {
            e.stopPropagation();
            FormManager.startEdit(meal.id, dateKey);
        });

        deleteBtn?.addEventListener('click', (e) => {
            e.stopPropagation();
            WeeklyPlannerManager.removeMeal(dateKey, meal.id);
        });

        return chip;
    }

    static updateWeekLabel(weekDays) {
        const start = weekDays[0];
        const end = weekDays[6];
        const label = DOMService.getElementById('weekLabel');
        
        if (label) {
            label.textContent = `${DateUtils.formatShortDate(start)} — ${DateUtils.formatShortDate(end)}`;
        }
    }
}

// Panel Management Service
class PanelManager {
    static openPanel(dateKey, dayObj) {
        appState.selectedDate = dateKey;
        appState.activeFilter = 'all';

        const dayTitle = DOMService.getElementById('panelDayTitle');
        const dayDate = DOMService.getElementById('panelDayDate');
        
        if (dayTitle) dayTitle.textContent = FULL_DAYS[dayObj.getDay()];
        if (dayDate) dayDate.textContent = DateUtils.formatFullDate(dayObj);

        this.updateFilterTabs();
        FormManager.hideForm();
        this.renderPanelMeals();

        const panel = DOMService.getElementById('sidePanel');
        const overlay = DOMService.getElementById('panelOverlay');
        
        DOMService.addClass(panel, 'open');
        DOMService.addClass(overlay, 'open');
        
        GridRenderService.renderWeekGrid(
            DateUtils.getWeekDays(appState.currentWeekOffset, appState.weekStartsOn),
            appState.meals,
            appState.targetCalories
        );
    }

    static closePanel() {
        appState.selectedDate = null;
        
        const panel = DOMService.getElementById('sidePanel');
        const overlay = DOMService.getElementById('panelOverlay');
        
        DOMService.removeClass(panel, 'open');
        DOMService.removeClass(overlay, 'open');
        
        FormManager.hideForm();
        
        GridRenderService.renderWeekGrid(
            DateUtils.getWeekDays(appState.currentWeekOffset, appState.weekStartsOn),
            appState.meals,
            appState.targetCalories
        );
    }

    static updateFilterTabs() {
        const tabs = DOMService.querySelectorAll('.type-tab');
        tabs.forEach(tab => {
            DOMService.removeClass(tab, 'active');
            if (tab.dataset.filter === appState.activeFilter) {
                DOMService.addClass(tab, 'active');
            }
        });
    }

    static renderPanelMeals() {
        const dateKey = appState.selectedDate;
        if (!dateKey) return;

        const container = DOMService.getElementById('panelMeals');
        DOMService.clearElement(container);

        let meals = appState.getMeals(dateKey);
        const totalCalories = MealService.getTotalCalories(meals);

        // Filter meals
        if (appState.activeFilter !== 'all') {
            meals = MealService.filterMealsByType(meals, appState.activeFilter);
        }

        // Total calories bar
        const overLimit = appState.targetCalories > 0 && totalCalories > appState.targetCalories;
        const totalBar = DOMService.createElement('div', '', '');
        totalBar.style.cssText = `
            background: ${overLimit ? '#ffebee' : '#f1f8e9'};
            color: ${overLimit ? '#c62828' : '#2e7d32'};
            padding: 8px 12px;
            border-radius: 8px;
            font-size: 0.85rem;
            font-weight: 600;
            margin-bottom: 12px;
            text-align: center;
            border: ${overLimit ? '1.5px solid #ef9a9a' : '1.5px solid #c5e1a5'};
        `;
        
        const targetText = appState.targetCalories > 0 ? ` / ${appState.targetCalories} cal` : '';
        totalBar.textContent = overLimit 
            ? `⚠️ Over limit: ${totalCalories} cal${targetText}`
            : `Total: ${totalCalories} cal${targetText}`;
        
        container.appendChild(totalBar);

        if (meals.length === 0) {
            const noMeals = DOMService.createElement('div', 'no-meals-msg', `
                <i class="fas fa-utensils"></i>
                No ${appState.activeFilter === 'all' ? 'meals' : appState.activeFilter} added yet
            `);
            container.appendChild(noMeals);
            return;
        }

        // Render meals
        const sortedMeals = MealService.sortMealsByType(meals);
        sortedMeals.forEach(meal => {
            const row = this.createMealRow(meal, dateKey);
            container.appendChild(row);
        });
    }

    static createMealRow(meal, dateKey) {
        const row = DOMService.createElement('div', 'panel-meal-row');
        row.setAttribute('data-type', meal.type);

        row.innerHTML = `
            <div class="type-badge">${meal.type}</div>
            <div class="meal-name">${StringUtils.escapeHtml(meal.name)}</div>
            <div class="row-actions">
                <button class="btn-edit" title="Edit meal">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="btn-delete" title="Delete meal">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        `;

        // Event handlers
        const editBtn = row.querySelector('.btn-edit');
        const deleteBtn = row.querySelector('.btn-delete');

        editBtn?.addEventListener('click', () => {
            FormManager.startEdit(meal.id, dateKey);
        });

        deleteBtn?.addEventListener('click', () => {
            WeeklyPlannerManager.removeMeal(dateKey, meal.id);
        });

        return row;
    }
}

// Form Management Service  
class FormManager {
    static showForm(title = 'Edit Meal') {
        const formTitle = DOMService.getElementById('formTitle');
        const form = DOMService.getElementById('mealForm');
        const nameInput = DOMService.getElementById('mealNameInput');
        
        if (formTitle) formTitle.textContent = title;
        DOMService.setDisplay(form, 'block');
        ErrorHandlerService.clearValidationErrors();
        this.clearDuplicateWarning();
        
        if (nameInput) nameInput.focus();
    }

    static hideForm() {
        const form = DOMService.getElementById('mealForm');
        const nameInput = DOMService.getElementById('mealNameInput');
        const typeInput = DOMService.getElementById('mealTypeInput');
        const caloriesInput = DOMService.getElementById('mealCaloriesInput');
        const editIdInput = DOMService.getElementById('editMealId');
        
        DOMService.setDisplay(form, 'none');
        
        if (nameInput) nameInput.value = '';
        if (typeInput) typeInput.value = 'breakfast';
        if (caloriesInput) caloriesInput.value = '200';
        if (editIdInput) editIdInput.value = '';
        
        ErrorHandlerService.clearValidationErrors();
        this.clearDuplicateWarning();
    }

    static startEdit(mealId, dateKey) {
        const meal = appState.getMeals(dateKey).find(m => m.id === mealId);
        if (!meal) return;

        const editIdInput = DOMService.getElementById('editMealId');
        const nameInput = DOMService.getElementById('mealNameInput');
        const typeInput = DOMService.getElementById('mealTypeInput');
        const caloriesInput = DOMService.getElementById('mealCaloriesInput');
        
        if (editIdInput) editIdInput.value = mealId;
        if (nameInput) nameInput.value = meal.name;
        if (typeInput) typeInput.value = meal.type;
        if (caloriesInput) caloriesInput.value = meal.calories || 200;
        
        this.showForm('Edit Meal');
    }

    static showDuplicateWarning() {
        const warning = DOMService.getElementById('duplicateWarning');
        DOMService.addClass(warning, 'show');
    }

    static clearDuplicateWarning() {
        const warning = DOMService.getElementById('duplicateWarning');
        DOMService.removeClass(warning, 'show');
    }
}

// Recipe Picker Service
class RecipePickerManager {
    static async openRecipePicker() {
        const overlay = DOMService.getElementById('recipePickerOverlay');
        const searchInput = DOMService.getElementById('recipePickerSearch');
        
        DOMService.addClass(overlay, 'open');
        
        if (searchInput) {
            searchInput.value = '';
            setTimeout(() => searchInput.focus(), 100);
        }
        
        this.clearDuplicateWarning();
        
        try {
            await RecipeService.loadAllRecipes();
            this.renderPickerList('');
        } catch (error) {
            ErrorHandlerService.handleError(error, 'Recipe Loading');
        }
    }

    static closeRecipePicker() {
        const overlay = DOMService.getElementById('recipePickerOverlay');
        DOMService.removeClass(overlay, 'open');
        this.clearDuplicateWarning();
    }

    static renderPickerList(query) {
        const list = DOMService.getElementById('recipePickerList');
        DOMService.clearElement(list);

        const filtered = RecipeService.filterRecipes(query);

        if (filtered.length === 0) {
            const empty = DOMService.createElement('div', 'recipe-picker-empty', `
                <i class="fas fa-search"></i>
                No recipes found matching "${query}"
            `);
            list.appendChild(empty);
            return;
        }

        filtered.forEach(recipe => {
            const item = this.createRecipeItem(recipe);
            list.appendChild(item);
        });
    }

    static createRecipeItem(recipe) {
        const item = DOMService.createElement('div', 'recipe-picker-item', '');

        item.innerHTML = `
            <div class="rpi-name">${StringUtils.escapeHtml(recipe.name)}</div>
            <div class="rpi-meta">
                <span class="rpi-cal">${recipe.calories} cal</span>
                <span class="rpi-cat">${StringUtils.escapeHtml(recipe.category)}</span>
                <button class="rpi-add-btn">Add</button>
            </div>
        `;

        const addBtn = item.querySelector('.rpi-add-btn');
        addBtn?.addEventListener('click', () => {
            this.pickRecipe(recipe);
        });

        return item;
    }

    static async pickRecipe(recipe) {
        const dateKey = appState.selectedDate;
        const mealTypeSelect = DOMService.getElementById('recipePickerMealType');
        const mealType = mealTypeSelect?.value || 'breakfast';

        // Duplicate check
        const existingMeals = appState.getMeals(dateKey);
        if (MealService.isDuplicateMeal(existingMeals, recipe.name, mealType)) {
            this.showDuplicateWarning(mealType);
            return;
        }

        const newMeal = ValidationService.sanitizeMeal({
            id: StringUtils.generateId(),
            name: recipe.name,
            type: mealType,
            calories: recipe.calories
        });

        try {
            await WeeklyPlannerManager.addMeal(dateKey, newMeal);
            this.closeRecipePicker();
            PanelManager.renderPanelMeals();
            
            GridRenderService.renderWeekGrid(
                DateUtils.getWeekDays(appState.currentWeekOffset, appState.weekStartsOn),
                appState.meals,
                appState.targetCalories
            );
        } catch (error) {
            ErrorHandlerService.handleError(error, 'Add Recipe');
        }
    }

    static showDuplicateWarning(mealType) {
        const warning = DOMService.getElementById('pickerDupWarning');
        const mealTypeSpan = DOMService.getElementById('dupMealType');
        
        if (mealTypeSpan) mealTypeSpan.textContent = mealType;
        DOMService.addClass(warning, 'show');
    }

    static clearDuplicateWarning() {
        const warning = DOMService.getElementById('pickerDupWarning');
        DOMService.removeClass(warning, 'show');
    }
}

// Main Application Manager
class WeeklyPlannerManager {
    static async initialize() {
        await this.setupEventListeners();
        
        onAuthStateChanged(auth, async (user) => {
            if (user) {
                console.log('User authenticated:', user.uid);
                appState.setUser(user);
                await this.loadUserData();
                await this.loadMealsFromFirebase();
            } else {
                console.log('No user authenticated');
                this.showAuthRequired();
            }
        });

        // Don't render initial grid here - wait for auth state
    }

    static async loadUserData() {
        try {
            const userProfile = await UserProfileService.getUserProfile(appState.currentUser.uid);
            if (userProfile) {
                appState.setTargetCalories(UserProfileService.getTargetCalories(userProfile));
            }
        } catch (error) {
            console.error('Error loading user data:', error);
        }
    }

    static async loadMealsFromFirebase() {
        if (!appState.currentUser) return;

        try {
            appState.isLoading = true;
            const weekId = DateUtils.getWeekId(appState.currentWeekOffset, appState.weekStartsOn);
            const weekDays = DateUtils.getWeekDays(appState.currentWeekOffset, appState.weekStartsOn);
            
            const meals = await FirebaseService.loadMealsFromFirebase(weekId, weekDays, appState.currentUser.uid);
            appState.setMeals(meals);
            
            GridRenderService.renderWeekGrid(weekDays, meals, appState.targetCalories);
        } catch (error) {
            ErrorHandlerService.handleError(error, 'Load Meals');
        } finally {
            appState.isLoading = false;
        }
    }

    static async saveMealsToFirebase() {
        if (!appState.currentUser) return;

        try {
            const weekId = DateUtils.getWeekId(appState.currentWeekOffset, appState.weekStartsOn);
            await FirebaseService.saveMealsToFirebase(weekId, appState.meals, appState.currentUser.uid);
        } catch (error) {
            ErrorHandlerService.handleError(error, 'Save Meals');
        }
    }

    static async addMeal(dateKey, meal) {
        const existingMeals = appState.getMeals(dateKey);
        
        if (MealService.isDuplicateMeal(existingMeals, meal.name, meal.type)) {
            FormManager.showDuplicateWarning();
            throw new Error('Duplicate meal');
        }

        FormManager.clearDuplicateWarning();
        
        if (!appState.meals[dateKey]) {
            appState.meals[dateKey] = [];
        }
        
        appState.meals[dateKey].push(meal);
        await this.saveMealsToFirebase();
        return true;
    }

    static async updateMeal(dateKey, id, updates) {
        const meals = appState.meals[dateKey];
        if (!meals) return false;

        if (MealService.isDuplicateMeal(meals, updates.name, updates.type, id)) {
            FormManager.showDuplicateWarning();
            throw new Error('Duplicate meal');
        }

        FormManager.clearDuplicateWarning();
        
        const idx = meals.findIndex(m => m.id === id);
        if (idx !== -1) {
            meals[idx] = { ...meals[idx], ...updates };
            await this.saveMealsToFirebase();
            return true;
        }
        
        return false;
    }

    static async removeMeal(dateKey, id) {
        if (!appState.meals[dateKey]) return;
        
        appState.meals[dateKey] = appState.meals[dateKey].filter(m => m.id !== id);
        await this.saveMealsToFirebase();
        
        PanelManager.renderPanelMeals();
        GridRenderService.renderWeekGrid(
            DateUtils.getWeekDays(appState.currentWeekOffset, appState.weekStartsOn),
            appState.meals,
            appState.targetCalories
        );
    }

    static renderInitialGrid() {
        const weekDays = DateUtils.getWeekDays(appState.currentWeekOffset, appState.weekStartsOn);
        GridRenderService.renderWeekGrid(weekDays, appState.meals, appState.targetCalories);
    }

    static showAuthRequired() {
        const grid = DOMService.getElementById('weekGrid');
        DOMService.clearElement(grid);
        
        const authMsg = DOMService.createElement('div', 'auth-required', `
            <i class="fas fa-lock"></i>
            <h3>Please log in to access your meal planner</h3>
            <p><a href="../index.html">Go to Login</a></p>
        `);
        
        grid.appendChild(authMsg);
    }

    static async setupEventListeners() {
        // Week navigation
        const prevWeekBtn = DOMService.getElementById('prevWeek');
        const nextWeekBtn = DOMService.getElementById('nextWeek');
        const todayBtn = DOMService.getElementById('todayBtn');

        prevWeekBtn?.addEventListener('click', async () => {
            appState.currentWeekOffset--;
            await this.loadMealsFromFirebase();
        });

        nextWeekBtn?.addEventListener('click', async () => {
            appState.currentWeekOffset++;
            await this.loadMealsFromFirebase();
        });

        todayBtn?.addEventListener('click', async () => {
            appState.currentWeekOffset = 0;
            await this.loadMealsFromFirebase();
        });

        // Week start toggle
        const weekStartToggle = DOMService.getElementById('weekStartToggle');
        weekStartToggle?.addEventListener('click', async (e) => {
            const btn = e.target.closest('span[data-value]');
            if (!btn) return;
            
            appState.weekStartsOn = btn.dataset.value;
            
            DOMService.querySelectorAll('#weekStartToggle span').forEach(s => {
                DOMService.removeClass(s, 'active');
            });
            DOMService.addClass(btn, 'active');
            
            await this.loadMealsFromFirebase();
        });

        // Panel controls
        const panelClose = DOMService.getElementById('panelClose');
        const panelOverlay = DOMService.getElementById('panelOverlay');
        
        panelClose?.addEventListener('click', PanelManager.closePanel);
        panelOverlay?.addEventListener('click', PanelManager.closePanel);

        // Type filter tabs
        const typeTabs = DOMService.getElementById('typeTabs');
        typeTabs?.addEventListener('click', (e) => {
            const tab = e.target.closest('.type-tab');
            if (!tab) return;
            
            appState.activeFilter = tab.dataset.filter;
            PanelManager.updateFilterTabs();
            PanelManager.renderPanelMeals();
        });

        // Add meal button
        const showAddForm = DOMService.getElementById('showAddForm');
        showAddForm?.addEventListener('click', async () => {
            await RecipePickerManager.openRecipePicker();
        });

        // Recipe picker controls
        const recipePickerClose = DOMService.getElementById('recipePickerClose');
        const recipePickerOverlay = DOMService.getElementById('recipePickerOverlay');
        const recipePickerSearch = DOMService.getElementById('recipePickerSearch');
        const recipePickerMealType = DOMService.getElementById('recipePickerMealType');

        recipePickerClose?.addEventListener('click', RecipePickerManager.closeRecipePicker);
        
        recipePickerOverlay?.addEventListener('click', (e) => {
            if (e.target === recipePickerOverlay) {
                RecipePickerManager.closeRecipePicker();
            }
        });

        recipePickerSearch?.addEventListener('input', (e) => {
            RecipePickerManager.clearDuplicateWarning();
            RecipePickerManager.renderPickerList(e.target.value);
        });

        recipePickerMealType?.addEventListener('change', () => {
            RecipePickerManager.clearDuplicateWarning();
        });

        // Form controls
        const cancelFormBtn = DOMService.getElementById('cancelFormBtn');
        const saveMealBtn = DOMService.getElementById('saveMealBtn');
        const mealNameInput = DOMService.getElementById('mealNameInput');

        cancelFormBtn?.addEventListener('click', FormManager.hideForm);
        
        saveMealBtn?.addEventListener('click', async () => {
            await this.handleSaveMeal();
        });

        mealNameInput?.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                saveMealBtn?.click();
            } else if (e.key === 'Escape') {
                FormManager.hideForm();
            }
        });

        // Reuse last week
        const reuseLastWeekBtn = DOMService.getElementById('reuseLastWeekBtn');
        reuseLastWeekBtn?.addEventListener('click', this.reuseLastWeek.bind(this));
    }

    static async handleSaveMeal() {
        const nameInput = DOMService.getElementById('mealNameInput');
        const typeInput = DOMService.getElementById('mealTypeInput');
        const caloriesInput = DOMService.getElementById('mealCaloriesInput');
        const editIdInput = DOMService.getElementById('editMealId');
        
        const name = nameInput?.value?.trim() || '';
        const type = typeInput?.value || 'breakfast';
        const calories = parseInt(caloriesInput?.value) || 200;
        const editId = editIdInput?.value || '';
        const dateKey = appState.selectedDate;

        if (!name) {
            if (nameInput) {
                nameInput.style.borderColor = '#E53935';
                nameInput.focus();
            }
            return;
        }

        if (nameInput) nameInput.style.borderColor = '';

        const meal = ValidationService.sanitizeMeal({
            id: editId || StringUtils.generateId(),
            name,
            type,
            calories
        });

        try {
            if (editId) {
                await this.updateMeal(dateKey, editId, meal);
            } else {
                await this.addMeal(dateKey, meal);
            }

            FormManager.hideForm();
            PanelManager.renderPanelMeals();
            
            GridRenderService.renderWeekGrid(
                DateUtils.getWeekDays(appState.currentWeekOffset, appState.weekStartsOn),
                appState.meals,
                appState.targetCalories
            );
        } catch (error) {
            console.error('Save meal error:', error);
        }
    }

    static async reuseLastWeek() {
        if (!appState.currentUser) return;

        const btn = DOMService.getElementById('reuseLastWeekBtn');
        if (btn) {
            btn.disabled = true;
            btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Loading…';
        }

        try {
            const lastWeekId = DateUtils.getWeekId(appState.currentWeekOffset - 1, appState.weekStartsOn);
            const lastWeekDays = DateUtils.getWeekDays(appState.currentWeekOffset - 1, appState.weekStartsOn);
            
            const lastWeekMeals = await FirebaseService.loadMealsFromFirebase(
                lastWeekId, 
                lastWeekDays, 
                appState.currentUser.uid
            );

            const currentWeekDays = DateUtils.getWeekDays(appState.currentWeekOffset, appState.weekStartsOn);
            const newMeals = {};

            let foundMeals = false;
            currentWeekDays.forEach((day, index) => {
                const currentDateKey = DateUtils.toKey(day);
                const lastWeekDateKey = DateUtils.toKey(lastWeekDays[index]);
                
                if (lastWeekMeals[lastWeekDateKey]?.length > 0) {
                    foundMeals = true;
                    newMeals[currentDateKey] = lastWeekMeals[lastWeekDateKey].map(meal => ({
                        ...meal,
                        id: StringUtils.generateId()
                    }));
                } else {
                    newMeals[currentDateKey] = appState.meals[currentDateKey] || [];
                }
            });

            if (foundMeals) {
                appState.setMeals(newMeals);
                await this.saveMealsToFirebase();
                
                GridRenderService.renderWeekGrid(
                    currentWeekDays,
                    appState.meals,
                    appState.targetCalories
                );
                
                ToastService.show('Successfully copied meals from last week!');
            } else {
                ToastService.show('No meals found for last week.');
            }
        } catch (error) {
            ErrorHandlerService.handleError(error, 'Reuse Last Week');
        } finally {
            if (btn) {
                btn.disabled = false;
                btn.innerHTML = '<i class="fas fa-copy"></i> Reuse Last Week';
            }
        }
    }
}

// Initialize application state
const appState = new AppState();

// Initialize the application when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    WeeklyPlannerManager.initialize();
});