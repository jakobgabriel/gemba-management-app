import app from './app.js';
import { config } from './config.js';
import { pool } from './db.js';

const server = app.listen(config.port, () => {
  console.log(
    `[gemba-backend] Server running on port ${config.port} (env: ${config.nodeEnv})`,
  );
});

// ---------------------------------------------------------------------------
// Graceful shutdown
// ---------------------------------------------------------------------------
function shutdown(signal: string) {
  console.log(`\n[gemba-backend] Received ${signal}. Shutting down gracefully...`);

  server.close(async () => {
    console.log('[gemba-backend] HTTP server closed.');

    try {
      await pool.end();
      console.log('[gemba-backend] Database pool closed.');
    } catch (err) {
      console.error('[gemba-backend] Error closing database pool:', err);
    }

    process.exit(0);
  });

  // Force exit if graceful shutdown takes too long
  setTimeout(() => {
    console.error('[gemba-backend] Forced shutdown after timeout.');
    process.exit(1);
  }, 10_000);
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
