// Authentication UI Management

// Create and show authentication modal
function showAuthModal() {
    // Remove existing modal if present
    const existingModal = document.getElementById('auth-modal');
    if (existingModal) {
        existingModal.remove();
    }

    // Create modal HTML
    const modalHTML = `
        <div id="auth-modal" class="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
            <div class="bg-white rounded-xl max-w-md w-full p-6">
                <div class="flex justify-between items-center mb-6">
                    <h2 class="text-xl font-bold">Welcome to MSCS Application Manager</h2>
                    <button id="close-auth-modal" class="text-gray-500 hover:text-gray-700">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                
                <!-- Auth Toggle Buttons -->
                <div class="flex mb-6">
                    <button id="login-tab" class="flex-1 py-2 px-4 text-center border-b-2 border-purple-600 text-purple-600 font-medium">
                        Login
                    </button>
                    <button id="register-tab" class="flex-1 py-2 px-4 text-center border-b-2 border-gray-200 text-gray-500 font-medium">
                        Register
                    </button>
                </div>

                <!-- Login Form -->
                <form id="login-form" class="space-y-4">
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">Email</label>
                        <input type="email" id="login-email" required 
                               class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 focus:border-transparent">
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">Password</label>
                        <input type="password" id="login-password" required 
                               class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 focus:border-transparent">
                    </div>
                    <button type="submit" id="login-btn" 
                            class="w-full bg-purple-700 text-white py-2 rounded-lg hover:bg-purple-800 transition">
                        <span class="btn-text">Login</span>
                        <span class="btn-loading hidden">
                            <i class="fas fa-spinner fa-spin mr-2"></i>Logging in...
                        </span>
                    </button>
                </form>

                <!-- Register Form -->
                <form id="register-form" class="space-y-4 hidden">
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                        <input type="text" id="register-name" required 
                               class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 focus:border-transparent">
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">Email</label>
                        <input type="email" id="register-email" required 
                               class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 focus:border-transparent">
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">Password</label>
                        <input type="password" id="register-password" required minlength="6"
                               class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 focus:border-transparent">
                        <p class="text-xs text-gray-500 mt-1">At least 6 characters</p>
                    </div>
                    <button type="submit" id="register-btn" 
                            class="w-full bg-purple-700 text-white py-2 rounded-lg hover:bg-purple-800 transition">
                        <span class="btn-text">Create Account</span>
                        <span class="btn-loading hidden">
                            <i class="fas fa-spinner fa-spin mr-2"></i>Creating account...
                        </span>
                    </button>
                </form>

                <!-- Demo Account Info -->
                <div class="mt-4 p-3 bg-gray-50 rounded-lg">
                    <p class="text-sm text-gray-600">
                        <strong>Demo Account:</strong><br>
                        Email: test@example.com<br>
                        Password: password123
                    </p>
                </div>
            </div>
        </div>
    `;

    // Add modal to page
    document.body.insertAdjacentHTML('beforeend', modalHTML);

    // Add event listeners
    setupAuthModalEvents();
}

function setupAuthModalEvents() {
    const modal = document.getElementById('auth-modal');
    const closeBtn = document.getElementById('close-auth-modal');
    const loginTab = document.getElementById('login-tab');
    const registerTab = document.getElementById('register-tab');
    const loginForm = document.getElementById('login-form');
    const registerForm = document.getElementById('register-form');

    // Close modal
    closeBtn.addEventListener('click', () => {
        modal.remove();
    });

    // Close on outside click
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.remove();
        }
    });

    // Tab switching
    loginTab.addEventListener('click', () => {
        switchAuthTab('login');
    });

    registerTab.addEventListener('click', () => {
        switchAuthTab('register');
    });

    // Form submissions
    loginForm.addEventListener('submit', handleLogin);
    registerForm.addEventListener('submit', handleRegister);
}

function switchAuthTab(tab) {
    const loginTab = document.getElementById('login-tab');
    const registerTab = document.getElementById('register-tab');
    const loginForm = document.getElementById('login-form');
    const registerForm = document.getElementById('register-form');

    if (tab === 'login') {
        loginTab.className = 'flex-1 py-2 px-4 text-center border-b-2 border-purple-600 text-purple-600 font-medium';
        registerTab.className = 'flex-1 py-2 px-4 text-center border-b-2 border-gray-200 text-gray-500 font-medium';
        loginForm.classList.remove('hidden');
        registerForm.classList.add('hidden');
    } else {
        registerTab.className = 'flex-1 py-2 px-4 text-center border-b-2 border-purple-600 text-purple-600 font-medium';
        loginTab.className = 'flex-1 py-2 px-4 text-center border-b-2 border-gray-200 text-gray-500 font-medium';
        registerForm.classList.remove('hidden');
        loginForm.classList.add('hidden');
    }
}

async function handleLogin(e) {
    e.preventDefault();
    
    const button = document.getElementById('login-btn');
    const btnText = button.querySelector('.btn-text');
    const btnLoading = button.querySelector('.btn-loading');
    
    // Show loading state
    btnText.classList.add('hidden');
    btnLoading.classList.remove('hidden');
    button.disabled = true;

    try {
        const email = document.getElementById('login-email').value;
        const password = document.getElementById('login-password').value;

        const response = await api.login({ email, password });
        
        showSuccess('Login successful!');
        document.getElementById('auth-modal').remove();
        
        // Update UI for authenticated user
        updateUIForAuth();
        
        // Load dashboard data
        loadDashboardData();
        
    } catch (error) {
        showError(error.message || 'Login failed. Please try again.');
    } finally {
        // Reset button state
        btnText.classList.remove('hidden');
        btnLoading.classList.add('hidden');
        button.disabled = false;
    }
}

async function handleRegister(e) {
    e.preventDefault();
    
    const button = document.getElementById('register-btn');
    const btnText = button.querySelector('.btn-text');
    const btnLoading = button.querySelector('.btn-loading');
    
    // Show loading state
    btnText.classList.add('hidden');
    btnLoading.classList.remove('hidden');
    button.disabled = true;

    try {
        const name = document.getElementById('register-name').value;
        const email = document.getElementById('register-email').value;
        const password = document.getElementById('register-password').value;

        const response = await api.register({ name, email, password });
        
        showSuccess('Account created successfully!');
        document.getElementById('auth-modal').remove();
        
        // Update UI for authenticated user
        updateUIForAuth();
        
        // Load dashboard data
        loadDashboardData();
        
    } catch (error) {
        showError(error.message || 'Registration failed. Please try again.');
    } finally {
        // Reset button state
        btnText.classList.remove('hidden');
        btnLoading.classList.add('hidden');
        button.disabled = false;
    }
}

// Update UI when user is authenticated
function updateUIForAuth() {
    // Update navigation to show user info and logout
    const nav = document.querySelector('nav .flex.items-center.space-x-4');
    if (nav && currentUser) {
        nav.innerHTML = `
            <span class="text-white text-sm">Welcome, ${currentUser.name}</span>
            <button id="logout-btn" class="bg-white text-purple-700 px-4 py-2 rounded-lg font-medium hover:bg-gray-100 transition">
                <i class="fas fa-sign-out-alt mr-2"></i>Logout
            </button>
        `;

        // Add logout event listener
        document.getElementById('logout-btn').addEventListener('click', () => {
            api.logout();
        });
    }
}

// Check authentication on page load
async function checkAuth() {
    if (isAuthenticated()) {
        try {
            const user = await api.getCurrentUser();
            if (user) {
                updateUIForAuth();
                loadDashboardData();
                return true;
            }
        } catch (error) {
            console.log('Auth check failed:', error);
        }
    }
    
    // Show auth modal if not authenticated
    showAuthModal();
    return false;
}