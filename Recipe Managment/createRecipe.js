import { getDatabase, ref, push, set } from 
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
    const url = this.value.trim();
    const previewDiv = document.getElementById('media-preview');
    
    if (!url) {
        previewDiv.className = 'media-placeholder';
        previewDiv.innerHTML = '<i class="fas fa-image"></i><p>Media preview will appear here</p>';
        return;
    }

    // Check if YouTube URL
    const youtubeRegex = /(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\s]+)/;
    const match = url.match(youtubeRegex);
    
    if (match) {
        const videoId = match[1];
        previewDiv.className = '';
        previewDiv.innerHTML = `<iframe width="100%" height="315" src="https://www.youtube.com/embed/${videoId}" frameborder="0" allowfullscreen></iframe>`;
    } else if (url.match(/\.(jpg|jpeg|png|gif|webp)$/i)) {
        previewDiv.className = '';
        previewDiv.innerHTML = `<img src="${url}" alt="Recipe image" style="max-width: 100%; border-radius: 10px;">`;
    }
});

// Preview update
function updatePreview() {
    const name = document.getElementById('recipe-name').value;
    const time = document.getElementById('cooking-time').value;
    const portions = document.getElementById('portions').value;
    const category = document.querySelector('.category-option.selected')?.textContent.trim();
    
    const ingredients = Array.from(document.querySelectorAll('.ingredient-input'))
        .map(input => input.value)
        .filter(val => val.trim());

    let preview = '';
    
    if (name) preview += `<h3>${name}</h3>`;
    if (category || time || portions) {
        preview += '<p>';
        if (category) preview += `<strong>Category:</strong> ${category} `;
        if (time) preview += `<strong>Time:</strong> ${time} min `;
        if (portions) preview += `<strong>Servings:</strong> ${portions}`;
        preview += '</p>';
    }
    
    if (ingredients.length > 0) {
        preview += '<p><strong>Ingredients:</strong><br>' + ingredients.join('<br>') + '</p>';
    }

    document.getElementById('preview-content').innerHTML = preview || '<p><em>Your recipe preview will appear here as you type.</em></p>';
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

    const name = document.getElementById('recipe-name').value.trim();

    if (!name) {
        showError('Please enter a recipe name');
        return;
    }

    const ingredients = Array.from(document.querySelectorAll('.ingredient-input'))
        .map(input => input.value.trim())
        .filter(val => val);

    const steps = Array.from(document.querySelectorAll('.step-input'))
        .map(input => input.value.trim())
        .filter(val => val);

    if (ingredients.length === 0) {
        showError('Please add at least one ingredient');
        return;
    }

    if (steps.length === 0) {
        showError('Please add at least one step');
        return;
    }

    const user = auth.currentUser;

    if (!user) {
        showError('You must be logged in to save recipes.');
        return;
    }

    const recipeData = {
        name: name,
        ownerUid: user.uid,
        cookingTime: Number(document.getElementById('cooking-time').value) || 0,
        portions: Number(document.getElementById('portions').value) || 0,
        category: document.getElementById('selected-category').value,
        mediaUrl: document.getElementById('media-url').value.trim(),
        ingredients: ingredients,
        steps: steps,
        notes: document.getElementById('notes').value.trim(),
        createdAt: new Date().toISOString()
    };

    try {
        // Create new recipe ID
        const newRecipeRef = push(ref(database, "recipes"));

        await set(newRecipeRef, recipeData);

        showSuccess('Recipe saved successfully!');

        console.log("Saved recipe ID:", newRecipeRef.key);

    } catch (error) {
        console.error("Error saving recipe:", error);
        showError('Failed to save recipe. Please try again.');
    }
});

