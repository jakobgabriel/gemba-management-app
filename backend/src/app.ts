import express from 'express';
import cors from 'cors';
import swaggerUi from 'swagger-ui-express';
import { config } from './config.js';
import { authenticate } from './middleware/auth.js';
import { errorHandler } from './middleware/errorHandler.js';
import { swaggerSpec } from './swagger.js';

// Route modules
import authRoutes from './modules/auth/routes.js';
import usersRoutes from './modules/users/routes.js';
import issuesRoutes from './modules/issues/routes.js';
import productionRoutes from './modules/production/routes.js';
import safetyRoutes from './modules/safety/routes.js';
import gembaWalksRoutes from './modules/gemba-walks/routes.js';
import configRoutes from './modules/config/routes.js';
import analyticsRoutes from './modules/analytics/routes.js';
import handoverRoutes from './modules/handover/routes.js';
import bulkRoutes from './modules/bulk/routes.js';

const app = express();

// ---------------------------------------------------------------------------
// Global middleware
// ---------------------------------------------------------------------------
app.use(cors({ origin: config.corsOrigin }));
app.use(express.json());

// ---------------------------------------------------------------------------
// Swagger UI – API documentation
// ---------------------------------------------------------------------------
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
  customCss: '.swagger-ui .topbar { display: none }',
  customSiteTitle: 'Gemba API Docs',
}));
app.get('/api-docs.json', (_req, res) => {
  res.json(swaggerSpec);
});

// ---------------------------------------------------------------------------
// Health-check endpoints
// ---------------------------------------------------------------------------
app.get('/healthz', (_req, res) => {
  res.json({ status: 'ok' });
});

app.get('/readyz', (_req, res) => {
  res.json({ status: 'ready' });
});

// ---------------------------------------------------------------------------
// API v1 routes
// ---------------------------------------------------------------------------
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/users', authenticate, usersRoutes);
app.use('/api/v1/issues', authenticate, issuesRoutes);
app.use('/api/v1/production', authenticate, productionRoutes);
app.use('/api/v1/safety', authenticate, safetyRoutes);
app.use('/api/v1/gemba-walks', authenticate, gembaWalksRoutes);
app.use('/api/v1/config', authenticate, configRoutes);
app.use('/api/v1/analytics', authenticate, analyticsRoutes);
app.use('/api/v1/handover', authenticate, handoverRoutes);
app.use('/api/v1/bulk', authenticate, bulkRoutes);

// ---------------------------------------------------------------------------
// Global error handler (must be registered last)
// ---------------------------------------------------------------------------
app.use(errorHandler);

export default app;
