// searchRecipes.js 
// Load and filter recipes from Firebase

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getDatabase, ref, get, remove } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-database.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";

const {
    formatCategory,
    getRecipeThumbnail,
    sortRecipes,
    applyRecipeFilters,
    buildClearedFiltersState
} = window.SearchRecipesHelpers;

// Firebase config
const firebaseConfig = {
    apiKey: "AIzaSyDSozt6vIF6RrLQei26G-teUd2cPSTdPIQ",
    authDomain: "louay-testing.firebaseapp.com",
    databaseURL: "https://louay-testing-default-rtdb.firebaseio.com",
    projectId: "louay-testing",
    storageBucket: "louay-testing.firebasestorage.app",
    messagingSenderId: "123255076909",
    appId: "1:123255076909:web:c2ba7c881ed4588b7ba0a4"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const database = getDatabase(app);
const auth = getAuth(app);

// Store all recipes
let allRecipes = [];

// Store selected categories (Task 15 - Zaree)
let selectedCategories = [];

// DOM Elements
const recipesGrid = document.getElementById('recipesGrid');
const searchInput = document.getElementById('searchInput');
const servingsFilter = document.getElementById('servingsFilter');
const prepTimeFilter = document.getElementById('prepTimeFilter');
const totalTimeFilter = document.getElementById('totalTimeFilter');
const sortFilter = document.getElementById('sortFilter');

// Load all recipes from Firebase (Task 10)
async function loadAllRecipes() {
    showLoading();
    
    try {
        const recipesRef = ref(database, 'recipes');
        const snapshot = await get(recipesRef);
        
        if (snapshot.exists()) {
            const data = snapshot.val();
            allRecipes = Object.entries(data).map(([id, recipe]) => ({
                id,
                ...recipe
            }));
            
            displayRecipes(allRecipes);
        } else {
            showEmptyState('No recipes found. Create your first recipe!');
        }
    } catch (error) {
        console.error('Error loading recipes:', error);
        showEmptyState('Error loading recipes. Please try again.');
    }
}

// Display recipes in the grid
function displayRecipes(recipes) {
    if (!recipesGrid) return;
    
    if (recipes.length === 0) {
        showEmptyState('No recipes match your search criteria.');
        return;
    }
    
    recipesGrid.innerHTML = recipes.map(recipe => createRecipeCard(recipe)).join('');
    
    // Attach event listeners to buttons
    attachCardListeners();
}

// Create HTML for a recipe card
function createRecipeCard(recipe) {
    const ingredients = recipe.ingredients || [];
    const displayIngredients = ingredients.slice(0, 4);
    const moreCount = ingredients.length - 4;
    const thumbnail = getRecipeThumbnail(recipe);
    
    return `
        <div class="recipe-card" data-id="${recipe.id}">
            ${thumbnail}
            <h3>${recipe.name || 'Untitled Recipe'}</h3>
            
            <div class="recipe-meta">
                ${recipe.cookingTime ? `<span>⏱️ ${recipe.cookingTime} min</span>` : ''}
                ${recipe.portions ? `<span>🍽️ ${recipe.portions} servings</span>` : ''}
                ${recipe.category ? `<span>📁 ${formatCategory(recipe.category)}</span>` : ''}
            </div>
            
            <div class="recipe-ingredients">
                <h4>Ingredients:</h4>
                <ul>
                    ${displayIngredients.map(ing => `<li>${ing}</li>`).join('')}
                    ${moreCount > 0 ? `<li><em>+${moreCount} more...</em></li>` : ''}
                </ul>
            </div>
            
            <div class="recipe-actions">
                <button class="btn btn-view" onclick="viewRecipe('${recipe.id}')">View</button>
                <button class="btn btn-edit" onclick="editRecipe('${recipe.id}')">Edit</button>
                <button class="btn btn-delete" onclick="deleteRecipe('${recipe.id}')">Delete</button>
            </div>
        </div>
    `;
}

// Search and filter recipes (Task 9)
function filterRecipes() {
    const filtered = applyRecipeFilters(allRecipes, {
        searchTerm: searchInput?.value || '',
        servings: servingsFilter?.value || '',
        prepTime: prepTimeFilter?.value || '',
        totalTime: totalTimeFilter?.value || '',
        selectedCategories,
        sortBy: sortFilter?.value || ''
    });

    displayRecipes(filtered);
}

// Filter by category checkboxes (Task 15 - Zaree)
function filterByCategory() {
    const checkboxes = document.querySelectorAll('.category-checkbox:checked');
    selectedCategories = Array.from(checkboxes).map(cb => cb.value);
    filterRecipes();
}

// Setup category checkbox listeners (Task 15 - Zaree)
function setupCategoryCheckboxes() {
    document.querySelectorAll('.category-checkbox').forEach(checkbox => {
        checkbox.addEventListener('change', filterByCategory);
    });
}

// Clear all filters
window.clearFilters = function() {
    const cleared = buildClearedFiltersState();
    if (searchInput) searchInput.value = cleared.search;
    if (servingsFilter) servingsFilter.value = cleared.servings;
    if (prepTimeFilter) prepTimeFilter.value = cleared.prepTime;
    if (totalTimeFilter) totalTimeFilter.value = cleared.totalTime;
    if (sortFilter) sortFilter.value = cleared.sort;
    
    // Clear category checkboxes (Task 15 - Zaree)
    document.querySelectorAll('.category-checkbox').forEach(cb => cb.checked = false);
    selectedCategories = cleared.selectedCategories;
    
    displayRecipes(allRecipes);
};

// Close recipe modal - DEFINED BEFORE viewRecipe to fix ESLint error
window.closeRecipeModal = function() {
    const modal = document.getElementById('recipeModal');
    if (modal) {
        modal.classList.remove('active');
        document.body.style.overflow = '';
    }
};

// View recipe details in modal
window.viewRecipe = function(recipeId) {
    const recipe = allRecipes.find(r => r.id === recipeId);
    if (!recipe) return;
    
    // Create modal if it doesn't exist
    let modal = document.getElementById('recipeModal');
    if (!modal) {
        modal = document.createElement('div');
        modal.id = 'recipeModal';
        modal.className = 'recipe-modal';
        modal.innerHTML = `
            <div class="recipe-modal-content">
                <button class="modal-close" onclick="window.closeRecipeModal()">&times;</button>
                <div id="recipeModalBody"></div>
            </div>
        `;
        document.body.appendChild(modal);
        
        // Close modal when clicking outside - use window.closeRecipeModal
        modal.addEventListener('click', (e) => {
            if (e.target === modal) window.closeRecipeModal();
        });
    }
    
    // Fill modal content
    const modalBody = document.getElementById('recipeModalBody');
    modalBody.innerHTML = `
        <h2>${recipe.name || 'Untitled Recipe'}</h2>
        
        <div class="modal-meta">
            ${recipe.cookingTime ? `<span>⏱️ ${recipe.cookingTime} min</span>` : ''}
            ${recipe.portions ? `<span>🍽️ ${recipe.portions} servings</span>` : ''}
            ${recipe.category ? `<span>📁 ${formatCategory(recipe.category)}</span>` : ''}
        </div>
        
        ${recipe.mediaUrl ? `
            <div class="modal-media">
                ${recipe.mediaUrl.includes('youtube') || recipe.mediaUrl.includes('youtu.be') 
                    ? `<iframe src="https://www.youtube.com/embed/${getYoutubeId(recipe.mediaUrl)}" frameborder="0" allowfullscreen></iframe>`
                    : `<img src="${recipe.mediaUrl}" alt="${recipe.name}">`
                }
            </div>
        ` : ''}
        
        <div class="modal-section">
            <h3>🥗 Ingredients</h3>
            <ul>
                ${recipe.ingredients?.map(ing => `<li>${ing}</li>`).join('') || '<li>No ingredients listed</li>'}
            </ul>
        </div>
        
        <div class="modal-section">
            <h3>📝 Steps</h3>
            <ol>
                ${recipe.steps?.map(step => `<li>${step}</li>`).join('') || '<li>No steps listed</li>'}
            </ol>
        </div>
        
        ${recipe.notes ? `
            <div class="modal-section">
                <h3>📌 Notes</h3>
                <p>${recipe.notes}</p>
            </div>
        ` : ''}
    `;
    
    // Show modal
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
};

// Close recipe modal
window.closeRecipeModal = function() {
    const modal = document.getElementById('recipeModal');
    if (modal) {
        modal.classList.remove('active');
        document.body.style.overflow = '';
    }
};
// Get YouTube video ID from URL
function getYoutubeId(url) {
    const match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\s]+)/);
    return match ? match[1] : '';
}

// Delete recipe
window.deleteRecipe = async function(recipeId) {
    if (!confirm('Are you sure you want to delete this recipe?')) return;
    
    try {
        const recipeRef = ref(database, `recipes/${recipeId}`);
        await remove(recipeRef);
        
        // Remove from local array and refresh display
        allRecipes = allRecipes.filter(r => r.id !== recipeId);
        filterRecipes();
        
        alert('Recipe deleted successfully!');
    } catch (error) {
        console.error('Error deleting recipe:', error);
        alert('Failed to delete recipe. Please try again.');
    }
};

// Edit recipe - redirects to CreateRecipes.html with editId param
window.editRecipe = function(recipeId) {
    window.location.href = `CreateRecipes.html?editId=${recipeId}`;
};

// Show loading state
function showLoading() {
    if (recipesGrid) {
        recipesGrid.innerHTML = '<div class="loading">Loading recipes...</div>';
    }
}

// Show empty state
function showEmptyState(message) {
    if (recipesGrid) {
        recipesGrid.innerHTML = `<div class="empty-state">${message}</div>`;
    }
}

// Attach event listeners to card buttons
function attachCardListeners() {
    // Listeners are attached via onclick attributes in the HTML
}

// Add event listeners for search and filters
function setupEventListeners() {
    // Search input - filter as user types
    searchInput?.addEventListener('input', debounce(filterRecipes, 300));
    
    // Filter dropdowns
    servingsFilter?.addEventListener('change', filterRecipes);
    prepTimeFilter?.addEventListener('change', filterRecipes);
    totalTimeFilter?.addEventListener('change', filterRecipes);
    sortFilter?.addEventListener('change', filterRecipes);
}

// Debounce function for search input
function debounce(func, wait) {
    let timeout;
    return function(...args) {
        clearTimeout(timeout);
        timeout = setTimeout(() => func.apply(this, args), wait);
    };
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    // Create recipes grid if it doesn't exist
    if (!document.getElementById('recipesGrid')) {
        const container = document.querySelector('.container');
        if (container) {
            const gridDiv = document.createElement('div');
            gridDiv.id = 'recipesGrid';
            gridDiv.className = 'recipes-grid';
            container.appendChild(gridDiv);
        }
    }
    
    setupEventListeners();
    setupCategoryCheckboxes(); // Task 15 - Zaree
    loadAllRecipes();
});

// Check auth state
onAuthStateChanged(auth, (user) => {
    if (!user) {
        console.log('User not logged in');
        // Optionally redirect to login
        // window.location.href = '../index.html';
    }
});