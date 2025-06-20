// Environment Configuration
const config = {
  development: {
    API_BASE_URL: 'http://localhost:5001/api'
  },
  production: {
    API_BASE_URL: 'https://your-railway-app.railway.app/api' // Update after backend deployment
  }
};

// Detect environment
const isDevelopment = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
const environment = isDevelopment ? 'development' : 'production';

// Export configuration
window.APP_CONFIG = config[environment];