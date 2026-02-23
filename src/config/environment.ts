export const env = {
  PORT: process.env.PORT || '8080',
  NODE_ENV: process.env.NODE_ENV || 'development',
  PLATFORM_URL: process.env.PLATFORM_URL || 'https://agentbase.me',
  CORS_ORIGIN: process.env.CORS_ORIGIN || 'https://agentbase.me',
  PLATFORM_SERVICE_TOKEN: process.env.PLATFORM_SERVICE_TOKEN || '',
};

// Validate required environment variables
if (!process.env.PLATFORM_SERVICE_TOKEN) {
  console.warn('Warning: PLATFORM_SERVICE_TOKEN not set');
}
