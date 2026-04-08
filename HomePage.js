// HomePage.js - Navigation logic for MealMajor Home Page

document.addEventListener('DOMContentLoaded', function() {
    const hamburger = document.getElementById('hamburger');
    const navDropdown = document.getElementById('navDropdown');
    const navOverlay = document.getElementById('navOverlay');

    // Hamburger toggle
    hamburger.addEventListener('click', function() {
        hamburger.classList.toggle('open');
        navDropdown.classList.toggle('open');
        navOverlay.classList.toggle('open');
    });

    // Close menu when clicking outside
    navOverlay.addEventListener('click', function() {
        hamburger.classList.remove('open');
        navDropdown.classList.remove('open');
        navOverlay.classList.remove('open');
    });

    // Close menu when pressing Escape key
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape' && navDropdown.classList.contains('open')) {
            hamburger.classList.remove('open');
            navDropdown.classList.remove('open');
            navOverlay.classList.remove('open');
        }
    });
});