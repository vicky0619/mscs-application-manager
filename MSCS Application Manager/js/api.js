// API Configuration - will be set by config.js
const API_BASE_URL = window.APP_CONFIG?.API_BASE_URL || 'http://localhost:5001/api';

// Authentication state
let currentUser = null;
let authToken = localStorage.getItem('authToken');

// API Service Class
class APIService {
    constructor() {
        this.baseURL = API_BASE_URL;
    }

    // Helper method to make authenticated requests
    async request(endpoint, options = {}) {
        const url = `${this.baseURL}${endpoint}`;
        const config = {
            headers: {
                'Content-Type': 'application/json',
                ...options.headers
            },
            ...options
        };

        // Add auth token if available
        if (authToken) {
            config.headers['Authorization'] = `Bearer ${authToken}`;
        }

        try {
            const response = await fetch(url, config);
            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || `HTTP error! status: ${response.status}`);
            }

            return data;
        } catch (error) {
            console.error('API request failed:', error);
            
            // If token is invalid, clear it
            if (error.message.includes('Invalid token') || error.message.includes('Access denied')) {
                this.logout();
            }
            
            throw error;
        }
    }

    // Authentication methods
    async register(userData) {
        const response = await this.request('/auth/register', {
            method: 'POST',
            body: JSON.stringify(userData)
        });

        if (response.token) {
            authToken = response.token;
            localStorage.setItem('authToken', authToken);
            currentUser = response.user;
        }

        return response;
    }

    async login(credentials) {
        const response = await this.request('/auth/login', {
            method: 'POST',
            body: JSON.stringify(credentials)
        });

        if (response.token) {
            authToken = response.token;
            localStorage.setItem('authToken', authToken);
            currentUser = response.user;
        }

        return response;
    }

    logout() {
        authToken = null;
        currentUser = null;
        localStorage.removeItem('authToken');
        window.location.reload();
    }

    async getCurrentUser() {
        if (!authToken) return null;
        
        try {
            const response = await this.request('/auth/me');
            currentUser = response.user;
            return currentUser;
        } catch (error) {
            return null;
        }
    }

    // University methods
    async getUniversities(filters = {}) {
        const queryParams = new URLSearchParams(filters).toString();
        const endpoint = queryParams ? `/universities?${queryParams}` : '/universities';
        return await this.request(endpoint);
    }

    async getUniversity(id) {
        return await this.request(`/universities/${id}`);
    }

    async createUniversity(universityData) {
        return await this.request('/universities', {
            method: 'POST',
            body: JSON.stringify(universityData)
        });
    }

    async updateUniversity(id, universityData) {
        return await this.request(`/universities/${id}`, {
            method: 'PUT',
            body: JSON.stringify(universityData)
        });
    }

    async deleteUniversity(id) {
        return await this.request(`/universities/${id}`, {
            method: 'DELETE'
        });
    }

    // Task methods
    async getTasks(filters = {}) {
        const queryParams = new URLSearchParams(filters).toString();
        const endpoint = queryParams ? `/tasks?${queryParams}` : '/tasks';
        return await this.request(endpoint);
    }

    async createTask(taskData) {
        return await this.request('/tasks', {
            method: 'POST',
            body: JSON.stringify(taskData)
        });
    }

    async updateTask(id, taskData) {
        return await this.request(`/tasks/${id}`, {
            method: 'PUT',
            body: JSON.stringify(taskData)
        });
    }

    async deleteTask(id) {
        return await this.request(`/tasks/${id}`, {
            method: 'DELETE'
        });
    }

    // Document methods
    async getDocuments(filters = {}) {
        const queryParams = new URLSearchParams(filters).toString();
        const endpoint = queryParams ? `/documents?${queryParams}` : '/documents';
        return await this.request(endpoint);
    }

    async createDocument(documentData) {
        return await this.request('/documents', {
            method: 'POST',
            body: JSON.stringify(documentData)
        });
    }

    async updateDocument(id, documentData) {
        return await this.request(`/documents/${id}`, {
            method: 'PUT',
            body: JSON.stringify(documentData)
        });
    }

    async deleteDocument(id) {
        return await this.request(`/documents/${id}`, {
            method: 'DELETE'
        });
    }

    // Deadline methods
    async getDeadlines(filters = {}) {
        const queryParams = new URLSearchParams(filters).toString();
        const endpoint = queryParams ? `/deadlines?${queryParams}` : '/deadlines';
        return await this.request(endpoint);
    }

    async createDeadline(deadlineData) {
        return await this.request('/deadlines', {
            method: 'POST',
            body: JSON.stringify(deadlineData)
        });
    }

    async updateDeadline(id, deadlineData) {
        return await this.request(`/deadlines/${id}`, {
            method: 'PUT',
            body: JSON.stringify(deadlineData)
        });
    }

    async deleteDeadline(id) {
        return await this.request(`/deadlines/${id}`, {
            method: 'DELETE'
        });
    }

    // Dashboard methods
    async getDashboardStats() {
        return await this.request('/dashboard/stats');
    }

    async getRecentActivity() {
        return await this.request('/dashboard/activity');
    }

    async getUpcomingDeadlines() {
        return await this.request('/dashboard/upcoming-deadlines');
    }
}

// Create global API instance
const api = new APIService();

// Authentication utilities
function isAuthenticated() {
    return !!authToken;
}

function requireAuth() {
    if (!isAuthenticated()) {
        showAuthModal();
        return false;
    }
    return true;
}

// UI Helper functions
function showError(message) {
    console.error('🚨 Error:', message);
    
    // Remove existing notifications
    document.querySelectorAll('.notification, .modern-notification').forEach(n => n.remove());
    
    // Create modern error notification
    const errorDiv = document.createElement('div');
    errorDiv.className = 'modern-notification error notification';
    errorDiv.innerHTML = `
        <div class="flex items-center justify-between">
            <div class="flex items-center gap-3">
                <i class="fas fa-exclamation-circle text-red-600"></i>
                <span class="text-body">${message}</span>
            </div>
            <button onclick="this.parentElement.parentElement.remove()" class="modern-btn modern-btn-ghost modern-btn-sm">
                <i class="fas fa-times"></i>
            </button>
        </div>
    `;
    document.body.appendChild(errorDiv);
    
    // Auto remove after 7 seconds
    setTimeout(() => {
        if (errorDiv.parentNode) errorDiv.remove();
    }, 7000);
}

function showSuccess(message) {
    console.log('✅ Success:', message);
    
    // Remove existing notifications
    document.querySelectorAll('.notification, .modern-notification').forEach(n => n.remove());
    
    // Create modern success notification
    const successDiv = document.createElement('div');
    successDiv.className = 'modern-notification success notification';
    successDiv.innerHTML = `
        <div class="flex items-center justify-between">
            <div class="flex items-center gap-3">
                <i class="fas fa-check-circle text-green-600"></i>
                <span class="text-body">${message}</span>
            </div>
            <button onclick="this.parentElement.parentElement.remove()" class="modern-btn modern-btn-ghost modern-btn-sm">
                <i class="fas fa-times"></i>
            </button>
        </div>
    `;
    document.body.appendChild(successDiv);
    
    // Auto remove after 4 seconds
    setTimeout(() => {
        if (successDiv.parentNode) successDiv.remove();
    }, 4000);
}

function showLoading(message = 'Loading...') {
    // Remove existing loading
    document.querySelectorAll('.loading-notification, .modern-loading').forEach(n => n.remove());
    
    const loadingDiv = document.createElement('div');
    loadingDiv.className = 'modern-notification loading-notification modern-loading';
    loadingDiv.innerHTML = `
        <div class="flex items-center gap-3">
            <i class="fas fa-spinner fa-spin text-blue-600"></i>
            <span class="text-body">${message}</span>
        </div>
    `;
    document.body.appendChild(loadingDiv);
    
    return loadingDiv;
}

function hideLoading() {
    document.querySelectorAll('.loading-notification, .modern-loading').forEach(n => n.remove());
}

function formatDate(dateString) {
    if (!dateString) return 'No date set';
    return new Date(dateString).toLocaleDateString();
}

function formatDateTime(dateString) {
    if (!dateString) return 'No date set';
    return new Date(dateString).toLocaleString();
}

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { api, isAuthenticated, requireAuth, showError, showSuccess, formatDate, formatDateTime };
}