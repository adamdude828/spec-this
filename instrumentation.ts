/**
 * Next.js Instrumentation Hook
 * Runs once when the server starts (both dev and production)
 */

export async function register() {
  // Import shutdown handler to register signal handlers
  // This ensures graceful cleanup of database connections on Ctrl+C
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    await import('./lib/shutdown-handler');
  }
}
