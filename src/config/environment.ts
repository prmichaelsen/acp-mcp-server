export const env = {
  PORT: process.env.PORT || '8080',
  NODE_ENV: process.env.NODE_ENV || 'development',
  PLATFORM_URL: process.env.PLATFORM_URL || 'https://agentbase.me',
  CORS_ORIGIN: process.env.CORS_ORIGIN || 'https://agentbase.me',
  JWT_SECRET: process.env.JWT_SECRET || '',
  PLATFORM_SERVICE_TOKEN: process.env.PLATFORM_SERVICE_TOKEN || '',
};
