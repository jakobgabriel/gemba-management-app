export const config = {
  port: parseInt(process.env.PORT || '3000', 10),
  databaseUrl:
    process.env.DATABASE_URL ||
    'postgresql://gemba:gemba@localhost:5432/gemba',
  jwtSecret: process.env.JWT_SECRET || 'dev-secret-change-in-production',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '15m',
  jwtRefreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
  corsOrigin: process.env.CORS_ORIGIN || '*',
  nodeEnv: process.env.NODE_ENV || 'development',
  logLevel: process.env.LOG_LEVEL || 'info',
} as const;
