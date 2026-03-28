import { getDatabase, ref, push, set, get, update } from 
"https://www.gstatic.com/firebasejs/10.8.0/firebase-database.js";

import { getAuth } from 
"https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";

import { initializeApp } from 
"https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";

const firebaseConfig = {
    apiKey: "AIzaSyDSozt6vIF6RrLQei26G-teUd2cPSTdPIQ",
    authDomain: "louay-testing.firebaseapp.com",
    databaseURL: "https://louay-testing-default-rtdb.firebaseio.com",
    projectId: "louay-testing",
    storageBucket: "louay-testing.firebasestorage.app",
    messagingSenderId: "123255076909",
    appId: "1:123255076909:web:c2ba7c881ed4588b7ba0a4"
};

const app = initializeApp(firebaseConfig);
const database = getDatabase(app);
const auth = getAuth(app);
const {
    validateRecipeInput,
    buildRecipeData,
    getMediaPreview,
    buildRecipePreview,
    readRecipeForm
} = window.CreateRecipeHelpers;

const urlParams = new URLSearchParams(window.location.search);
const editId = urlParams.get('editId');

// Helper functions for showing messages
function showError(message) {
    const errorDiv = document.getElementById('error-message');
    const successDiv = document.getElementById('success-message');
    
    errorDiv.textContent = message;
    errorDiv.style.display = 'block';
    successDiv.style.display = 'none';
    
    // Scroll to error message
    errorDiv.scrollIntoView({ behavior: 'smooth', block: 'center' });
    
    // Hide error after 5 seconds
    setTimeout(() => {
        errorDiv.style.display = 'none';
    }, 5000);
}

function showSuccess(message) {
    const errorDiv = document.getElementById('error-message');
    const successDiv = document.getElementById('success-message');
    
    successDiv.textContent = message;
    successDiv.style.display = 'block';
    errorDiv.style.display = 'none';
    
    // Scroll to success message
    successDiv.scrollIntoView({ behavior: 'smooth', block: 'center' });
    
    // Hide success after 3 seconds
    setTimeout(() => {
        successDiv.style.display = 'none';
    }, 3000);
}

function hideMessages() {
    document.getElementById('error-message').style.display = 'none';
    document.getElementById('success-message').style.display = 'none';
}

// Category selection
document.querySelectorAll('.category-option').forEach(option => {
    option.addEventListener('click', function() {
        document.querySelectorAll('.category-option').forEach(opt => opt.classList.remove('selected'));
        this.classList.add('selected');
        document.getElementById('selected-category').value = this.dataset.category;
        updatePreview();
    });
});

// Add ingredient
document.getElementById('add-ingredient').addEventListener('click', function() {
    const container = document.getElementById('ingredients-container');
    const newRow = document.createElement('div');
    newRow.className = 'ingredient-row';
    newRow.innerHTML = `
        <input type="text" class="ingredient-input" placeholder="e.g., 2 cups flour">
        <button class="btn btn-danger btn-sm remove-ingredient"><i class="fas fa-trash"></i></button>
    `;
    container.appendChild(newRow);
    attachRemoveListeners();
});

// Add step
document.getElementById('add-step').addEventListener('click', function() {
    const container = document.getElementById('steps-container');
    const newRow = document.createElement('div');
    newRow.className = 'step-row';
    newRow.innerHTML = `
        <input type="text" class="step-input" placeholder="e.g., Mix ingredients together">
        <button class="btn btn-danger btn-sm remove-step"><i class="fas fa-trash"></i></button>
    `;
    container.appendChild(newRow);
    attachRemoveListeners();
});

// Remove listeners
function attachRemoveListeners() {
    document.querySelectorAll('.remove-ingredient').forEach(btn => {
        btn.onclick = function() {
            if (document.querySelectorAll('.ingredient-row').length > 1) {
                this.parentElement.remove();
                updatePreview();
            }
        };
    });

    document.querySelectorAll('.remove-step').forEach(btn => {
        btn.onclick = function() {
            if (document.querySelectorAll('.step-row').length > 1) {
                this.parentElement.remove();
                updatePreview();
            }
        };
    });
}

attachRemoveListeners();

// Media preview
document.getElementById('media-url').addEventListener('input', function() {
    const previewDiv = document.getElementById('media-preview');
    const preview = getMediaPreview(this.value);

    if (preview.type === 'placeholder') {
        previewDiv.className = 'media-placeholder';
        previewDiv.innerHTML = '<i class="fas fa-image"></i><p>Media preview will appear here</p>';
        return;
    }

    if (preview.type === 'youtube') {
        previewDiv.className = '';
        previewDiv.innerHTML = `<iframe width="100%" height="315" src="https://www.youtube.com/embed/${preview.videoId}" frameborder="0" allowfullscreen></iframe>`;
    } else if (preview.type === 'image') {
        previewDiv.className = '';
        previewDiv.innerHTML = `<img src="${preview.url}" alt="Recipe image" style="max-width: 100%; border-radius: 10px;">`;
    }
});

// Preview update
function updatePreview() {
    const name = document.getElementById('recipe-name').value;
    const time = document.getElementById('cooking-time').value;
    const portions = document.getElementById('portions').value;
    const category = document.querySelector('.category-option.selected')?.textContent.trim();
    
    const ingredients = Array.from(document.querySelectorAll('.ingredient-input'))
        .map(input => input.value);

    document.getElementById('preview-content').innerHTML = buildRecipePreview({
        name,
        time,
        portions,
        category,
        ingredients
    });
}

// Update preview on input and hide messages when typing
['recipe-name', 'cooking-time', 'portions'].forEach(id => {
    document.getElementById(id).addEventListener('input', () => {
        updatePreview();
        hideMessages();
    });
});

document.addEventListener('input', function(e) {
    if (e.target.classList.contains('ingredient-input')) {
        updatePreview();
    }
});

// Clear all
document.getElementById('clear-btn').addEventListener('click', function() {
    if (confirm('Are you sure you want to clear all fields?')) {
        document.getElementById('recipe-name').value = '';
        document.getElementById('cooking-time').value = '';
        document.getElementById('portions').value = '';
        document.getElementById('media-url').value = '';
        document.getElementById('notes').value = '';
        document.querySelectorAll('.category-option').forEach(opt => opt.classList.remove('selected'));
        document.getElementById('selected-category').value = '';
        
        // Reset ingredients
        document.getElementById('ingredients-container').innerHTML = `
            <div class="ingredient-row">
                <input type="text" class="ingredient-input" placeholder="e.g., 2 cups flour">
                <button class="btn btn-danger btn-sm remove-ingredient"><i class="fas fa-trash"></i></button>
            </div>
        `;
        
        // Reset steps
        document.getElementById('steps-container').innerHTML = `
            <div class="step-row">
                <input type="text" class="step-input" placeholder="e.g., Preheat the oven to 350°F (175°C)">
                <button class="btn btn-danger btn-sm remove-step"><i class="fas fa-trash"></i></button>
            </div>
        `;
        
        // Reset media preview
        document.getElementById('media-preview').className = 'media-placeholder';
        document.getElementById('media-preview').innerHTML = '<i class="fas fa-image"></i><p>Media preview will appear here</p>';
        
        attachRemoveListeners();
        updatePreview();
    }
});

// Save recipe
document.getElementById('save-btn').addEventListener('click', async function() {
    const formValues = readRecipeForm(document);
    const user = auth.currentUser;
    const validationError = validateRecipeInput({
        name: formValues.name,
        ingredients: formValues.ingredients,
        steps: formValues.steps,
        user
    });

    if (validationError) {
        showError(validationError);
        return;
    }

    const recipeData = buildRecipeData(formValues, user, new Date().toISOString());

    try {
        if (editId) {
            recipeData.updatedAt = new Date().toISOString();
            await update(ref(database, `recipes/${editId}`), recipeData);
            showSuccess('Recipe updated successfully!');
            setTimeout(() => { window.location.href = 'SearchRecipes.html'; }, 1500);
        } 
        else {
        // Create new recipe ID
            const newRecipeRef = push(ref(database, "recipes"));
            await set(newRecipeRef, recipeData);
            showSuccess('Recipe saved successfully!');
            console.log("Saved recipe ID:", newRecipeRef.key);
        }
    } catch (error) {
        console.error("Error saving recipe:", error);
        showError('Failed to save recipe. Please try again.');
    }
});

// Edit recipe
async function loadRecipeForEditing(id) {
    const snapshot = await get(ref(database, `recipes/${id}`));
    if (!snapshot.exists()) return;
    const recipe = snapshot.val();

    document.getElementById('recipe-name').value  = recipe.name || '';
    document.getElementById('cooking-time').value = recipe.cookingTime || '';
    document.getElementById('portions').value = recipe.portions || '';
    document.getElementById('media-url').value = recipe.mediaUrl || '';
    document.getElementById('notes').value = recipe.notes || '';

    if (recipe.category) {
        document.querySelectorAll('.category-option').forEach(opt => {
            if (opt.dataset.category === recipe.category) {
                opt.classList.add('selected');
                document.getElementById('selected-category').value = recipe.category;
            }
        });
    }

    if (recipe.ingredients?.length > 0) {
        document.getElementById('ingredients-container').innerHTML =
            recipe.ingredients.map(ing => `
                <div class="ingredient-row">
                    <input type="text" class="ingredient-input" value="${ing}">
                    <button class="btn btn-danger btn-sm remove-ingredient"><i class="fas fa-trash"></i></button>
                </div>
        `).join('');
    }

    if (recipe.steps?.length > 0) {
        document.getElementById('steps-container').innerHTML =
            recipe.steps.map(step => `
                <div class="step-row">
                    <input type="text" class="step-input" value="${step}">
                    <button class="btn btn-danger btn-sm remove-step"><i class="fas fa-trash"></i></button>
                </div>
        `).join('');
    }
    document.getElementById('save-btn').textContent = 'Update Recipe';
    attachRemoveListeners();
    updatePreview();
}
// Call Edit
if (editId) {
    loadRecipeForEditing(editId);
}
