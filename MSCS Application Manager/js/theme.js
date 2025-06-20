// Dark Mode Toggle with System Preference Detection

class ThemeManager {
    constructor() {
        this.themes = {
            light: 'light',
            dark: 'dark',
            system: 'system'
        };
        
        this.currentTheme = this.getStoredTheme() || this.themes.system;
        this.systemTheme = this.getSystemTheme();
        
        this.initializeTheme();
        this.setupEventListeners();
    }

    initializeTheme() {
        // Apply theme on page load
        this.applyTheme(this.getEffectiveTheme());
        
        // Update UI controls
        this.updateThemeControls();
        
        // Listen for system theme changes
        this.watchSystemTheme();
    }

    setupEventListeners() {
        // Theme toggle buttons
        document.addEventListener('click', (e) => {
            if (e.target.matches('.theme-toggle') || e.target.closest('.theme-toggle')) {
                this.toggleTheme();
            }
            if (e.target.matches('.theme-option')) {
                const theme = e.target.dataset.theme;
                this.setTheme(theme);
            }
        });

        // Theme selector dropdown
        document.addEventListener('change', (e) => {
            if (e.target.matches('.theme-selector')) {
                this.setTheme(e.target.value);
            }
        });
    }

    getSystemTheme() {
        if (window.matchMedia) {
            return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
        }
        return 'light';
    }

    getStoredTheme() {
        try {
            return localStorage.getItem('theme-preference');
        } catch (error) {
            console.warn('Could not access localStorage for theme preference');
            return null;
        }
    }

    setStoredTheme(theme) {
        try {
            if (theme === this.themes.system) {
                localStorage.removeItem('theme-preference');
            } else {
                localStorage.setItem('theme-preference', theme);
            }
        } catch (error) {
            console.warn('Could not save theme preference to localStorage');
        }
    }

    getEffectiveTheme() {
        if (this.currentTheme === this.themes.system) {
            return this.systemTheme;
        }
        return this.currentTheme;
    }

    setTheme(theme) {
        if (!Object.values(this.themes).includes(theme)) {
            console.warn(`Invalid theme: ${theme}`);
            return;
        }
        
        this.currentTheme = theme;
        this.setStoredTheme(theme);
        this.applyTheme(this.getEffectiveTheme());
        this.updateThemeControls();
        
        // Dispatch theme change event
        this.dispatchThemeChangeEvent();
    }

    toggleTheme() {
        const effectiveTheme = this.getEffectiveTheme();
        const newTheme = effectiveTheme === 'dark' ? 'light' : 'dark';
        this.setTheme(newTheme);
    }

    applyTheme(theme) {
        const root = document.documentElement;
        
        // Remove existing theme classes
        root.classList.remove('theme-light', 'theme-dark');
        
        // Add new theme class
        root.classList.add(`theme-${theme}`);
        
        // Update meta theme-color for mobile browsers
        this.updateMetaThemeColor(theme);
        
        // Update chart colors if charts are present
        this.updateChartTheme(theme);
    }

    updateMetaThemeColor(theme) {
        let metaThemeColor = document.querySelector('meta[name="theme-color"]');
        
        if (!metaThemeColor) {
            metaThemeColor = document.createElement('meta');
            metaThemeColor.name = 'theme-color';
            document.head.appendChild(metaThemeColor);
        }
        
        const themeColors = {
            light: '#ffffff',
            dark: '#111827'
        };
        
        metaThemeColor.content = themeColors[theme] || themeColors.light;
    }

    updateChartTheme(theme) {
        // Update Chart.js default colors for dark mode
        if (window.Chart && window.analyticsCharts) {
            const chartColors = theme === 'dark' ? {
                primary: '#ffffff',
                secondary: '#9ca3af',
                accent: '#60a5fa',
                success: '#34d399',
                warning: '#fbbf24',
                danger: '#f87171',
                background: '#1f2937',
                border: '#374151'
            } : {
                primary: '#000000',
                secondary: '#6b7280',
                accent: '#3b82f6',
                success: '#16a34a',
                warning: '#f59e0b',
                danger: '#ef4444',
                background: '#f9fafb',
                border: '#e5e7eb'
            };
            
            // Update chart colors
            window.analyticsCharts.chartColors = chartColors;
            
            // Update existing charts
            setTimeout(() => {
                if (typeof updateAnalyticsCharts === 'function') {
                    updateAnalyticsCharts();
                }
            }, 100);
        }
    }

    updateThemeControls() {
        // Update theme toggle button icon
        const themeToggleBtns = document.querySelectorAll('.theme-toggle');
        const effectiveTheme = this.getEffectiveTheme();
        
        themeToggleBtns.forEach(btn => {
            const icon = btn.querySelector('i');
            if (icon) {
                icon.className = effectiveTheme === 'dark' ? 'fas fa-sun' : 'fas fa-moon';
            }
            
            // Update tooltip/title
            btn.title = effectiveTheme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode';
        });
        
        // Update theme selector
        const themeSelectors = document.querySelectorAll('.theme-selector');
        themeSelectors.forEach(selector => {
            selector.value = this.currentTheme;
        });
        
        // Update theme option buttons
        const themeOptions = document.querySelectorAll('.theme-option');
        themeOptions.forEach(option => {
            const isActive = option.dataset.theme === this.currentTheme;
            option.classList.toggle('active', isActive);
        });
    }

    watchSystemTheme() {
        if (window.matchMedia) {
            const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
            
            const handleSystemThemeChange = (e) => {
                this.systemTheme = e.matches ? 'dark' : 'light';
                
                // Only update if current theme is set to system
                if (this.currentTheme === this.themes.system) {
                    this.applyTheme(this.getEffectiveTheme());
                    this.updateThemeControls();
                    this.dispatchThemeChangeEvent();
                }
            };
            
            // Use modern API if available
            if (mediaQuery.addEventListener) {
                mediaQuery.addEventListener('change', handleSystemThemeChange);
            } else {
                // Fallback for older browsers
                mediaQuery.addListener(handleSystemThemeChange);
            }
        }
    }

    dispatchThemeChangeEvent() {
        const event = new CustomEvent('themechange', {
            detail: {
                theme: this.currentTheme,
                effectiveTheme: this.getEffectiveTheme(),
                systemTheme: this.systemTheme
            }
        });
        
        document.dispatchEvent(event);
    }

    // Public API methods
    getCurrentTheme() {
        return this.currentTheme;
    }

    getSystemTheme() {
        return this.systemTheme;
    }

    isDarkMode() {
        return this.getEffectiveTheme() === 'dark';
    }

    isLightMode() {
        return this.getEffectiveTheme() === 'light';
    }

    isSystemMode() {
        return this.currentTheme === this.themes.system;
    }
}

// Create and export theme manager instance
window.themeManager = new ThemeManager();

// Utility function for components to access theme
function getCurrentTheme() {
    return window.themeManager ? window.themeManager.getEffectiveTheme() : 'light';
}

function isDarkMode() {
    return window.themeManager ? window.themeManager.isDarkMode() : false;
}

// Initialize theme as early as possible to prevent flash
document.addEventListener('DOMContentLoaded', () => {
    // Theme is already initialized in constructor
    console.log('🎨 Theme system initialized');
});