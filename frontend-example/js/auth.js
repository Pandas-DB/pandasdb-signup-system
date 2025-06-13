// Global auth configuration and utilities
class AuthAPI {
    constructor() {
        this.baseURL = this.loadConfig() || '';
        this.currentUser = null;
        this.authToken = null;
    }

    loadConfig() {
        return localStorage.getItem('api-url') || '';
    }

    saveConfig(url) {
        localStorage.setItem('api-url', url);
        this.baseURL = url;
    }

    async makeRequest(endpoint, options = {}) {
        const url = `${this.baseURL}${endpoint}`;
        
        const defaultHeaders = {
            'Content-Type': 'application/json'
        };

        if (this.authToken) {
            defaultHeaders['Authorization'] = `Bearer ${this.authToken}`;
        }

        const config = {
            ...options,
            headers: {
                ...defaultHeaders,
                ...options.headers
            }
        };

        try {
            showStatusMessage('Making request...', 'info');
            console.log('Making request to:', url, config);
            
            const response = await fetch(url, config);
            const data = await response.json();
            
            console.log('Response:', response.status, data);

            if (!response.ok) {
                throw new Error(data.message || data.error || `HTTP ${response.status}`);
            }

            return data;
        } catch (error) {
            console.error('API Error:', error);
            showStatusMessage(`Error: ${error.message}`, 'error');
            throw error;
        }
    }

    setAuthToken(token) {
        this.authToken = token;
        localStorage.setItem('auth-token', token);
    }

    getAuthToken() {
        if (!this.authToken) {
            this.authToken = localStorage.getItem('auth-token');
        }
        return this.authToken;
    }

    clearAuth() {
        this.authToken = null;
        this.currentUser = null;
        localStorage.removeItem('auth-token');
        localStorage.removeItem('current-user');
    }

    setCurrentUser(user) {
        this.currentUser = user;
        localStorage.setItem('current-user', JSON.stringify(user));
    }

    getCurrentUser() {
        if (!this.currentUser) {
            const stored = localStorage.getItem('current-user');
            if (stored) {
                this.currentUser = JSON.parse(stored);
            }
        }
        return this.currentUser;
    }
}

// Global instance
const authAPI = new AuthAPI();

// UI utility functions
function showStatusMessage(message, type = 'info') {
    const statusEl = document.getElementById('status-message');
    statusEl.textContent = message;
    statusEl.className = `status-message ${type} show`;
    
    setTimeout(() => {
        statusEl.classList.remove('show');
    }, 5000);
}

function setButtonLoading(buttonId, loading = true) {
    const button = document.getElementById(buttonId) || document.querySelector(`#${buttonId}`);
    if (!button) return;
    
    if (loading) {
        button.disabled = true;
        button.classList.add('loading');
        button.dataset.originalText = button.textContent;
        button.textContent = 'Loading...';
    } else {
        button.disabled = false;
        button.classList.remove('loading');
        if (button.dataset.originalText) {
            button.textContent = button.dataset.originalText;
        }
    }
}

function togglePassword(inputId) {
    const input = document.getElementById(inputId);
    const button = input.parentElement.querySelector('.toggle-password');
    
    if (input.type === 'password') {
        input.type = 'text';
        button.textContent = '🙈';
    } else {
        input.type = 'password';
        button.textContent = '👁';
    }
}

function saveConfig() {
    const apiUrl = document.getElementById('api-url').value.trim();
    if (!apiUrl) {
        showStatusMessage('Please enter a valid API URL', 'error');
        return;
    }
    
    authAPI.saveConfig(apiUrl);
    showStatusMessage('Configuration saved!', 'success');
}

function signOut() {
    authAPI.clearAuth();
    
    // Reset all forms
    document.querySelectorAll('form').forEach(form => form.reset());
    
    // Show appropriate sign in form based on page
    if (typeof showEmailForm === 'function') {
        showEmailForm('signin');
    } else if (typeof showPhoneForm === 'function') {
        showPhoneForm('signin');
    }
    
    // Hide dashboard and show auth section
    document.getElementById('dashboard').classList.remove('active');
    const authSection = document.querySelector('.auth-section:first-of-type');
    if (authSection) {
        authSection.classList.add('active');
    }
    
    showStatusMessage('Signed out successfully', 'success');
}

function showDashboard(userInfo = {}) {
    // Hide all auth sections
    document.querySelectorAll('.auth-section').forEach(section => {
        section.classList.remove('active');
    });
    
    // Show dashboard
    document.getElementById('dashboard').classList.add('active');
    
    // Update user info
    document.getElementById('user-id').textContent = userInfo.userSub || userInfo.sub || 'N/A';
    
    const emailEl = document.getElementById('user-email');
    if (emailEl) {
        emailEl.textContent = userInfo.email || 'N/A';
    }
    
    const phoneEl = document.getElementById('user-phone');
    if (phoneEl) {
        phoneEl.textContent = userInfo.phone_number || 'N/A';
    }
    
    authAPI.setCurrentUser(userInfo);
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', function() {
    // Load saved config
    const savedUrl = authAPI.loadConfig();
    if (savedUrl) {
        document.getElementById('api-url').value = savedUrl;
    }
    
    // Check if user is already logged in
    const token = authAPI.getAuthToken();
    const user = authAPI.getCurrentUser();
    
    if (token && user) {
        showDashboard(user);
    }
    
    // Set up form event listeners
    setupEventListeners();
});

function setupEventListeners() {
    // API config form
    const apiUrlInput = document.getElementById('api-url');
    if (apiUrlInput) {
        apiUrlInput.addEventListener('change', function() {
            saveConfig();
        });
    }
}

// Utility function to validate phone number format
function formatPhoneNumber(phone) {
    // Remove all non-digits
    const digits = phone.replace(/\D/g, '');
    
    // Add + prefix if not present and has 10+ digits
    if (digits.length >= 10 && !phone.startsWith('+')) {
        return '+1' + digits.slice(-10); // Default to US +1
    }
    
    // Return as-is if already formatted correctly
    if (phone.startsWith('+')) {
        return phone;
    }
    
    return '+' + digits;
}

// Utility function to validate email format
function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

// Utility function to validate password strength
function validatePassword(password) {
    const minLength = 8;
    const hasUpper = /[A-Z]/.test(password);
    const hasLower = /[a-z]/.test(password);
    const hasNumber = /\d/.test(password);
    
    const errors = [];
    
    if (password.length < minLength) {
        errors.push(`Password must be at least ${minLength} characters long`);
    }
    if (!hasUpper) {
        errors.push('Password must contain at least one uppercase letter');
    }
    if (!hasLower) {
        errors.push('Password must contain at least one lowercase letter');
    }
    if (!hasNumber) {
        errors.push('Password must contain at least one number');
    }
    
    return {
        valid: errors.length === 0,
        errors: errors
    };
}
