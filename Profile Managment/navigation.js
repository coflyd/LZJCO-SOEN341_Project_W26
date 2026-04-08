class NavigationManager {
    constructor() {
        this.hamburger = null;
        this.navDropdown = null;
        this.navOverlay = null;
        this.isOpen = false;
    }

    initialize() {
        this.hamburger = document.getElementById('hamburger');
        this.navDropdown = document.getElementById('navDropdown');
        this.navOverlay = document.getElementById('navOverlay');

        if (!this.hamburger || !this.navDropdown || !this.navOverlay) {
            console.warn('Navigation elements not found');
            return;
        }

        this.attachEventListeners();
    }

    attachEventListeners() {
        // Toggle navigation on hamburger click
        this.hamburger.addEventListener('click', () => {
            this.toggle();
        });

        // Close navigation on overlay click
        this.navOverlay.addEventListener('click', () => {
            this.close();
        });

        // Close navigation on escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.isOpen) {
                this.close();
            }
        });
    }

    toggle() {
        if (this.isOpen) {
            this.close();
        } else {
            this.open();
        }
    }

    open() {
        this.hamburger.classList.add('open');
        this.navDropdown.classList.add('open');
        this.navOverlay.classList.add('open');
        this.isOpen = true;
    }

    close() {
        this.hamburger.classList.remove('open');
        this.navDropdown.classList.remove('open');
        this.navOverlay.classList.remove('open');
        this.isOpen = false;
    }
}

// Initialize navigation when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    const navigation = new NavigationManager();
    navigation.initialize();
});

// Export for potential use in other modules
window.NavigationManager = NavigationManager;