const config = {
  API_BASE_URL: import.meta.env.VITE_API_BASE_URL || 'http://45.166.15.28:8093/api',
  isDevelopment: import.meta.env.DEV,
  isProduction: import.meta.env.PROD,
};

export default config;