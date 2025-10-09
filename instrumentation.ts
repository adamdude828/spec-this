/**
 * Next.js Instrumentation Hook
 * Runs once when the server starts (both dev and production)
 */

export async function register() {
  console.log('🚀 Instrumentation hook called, NEXT_RUNTIME:', process.env.NEXT_RUNTIME);

  // Import shutdown handler to register signal handlers
  // This ensures graceful cleanup of database connections on Ctrl+C
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    console.log('📦 Loading shutdown handler...');
    await import('./lib/shutdown-handler');
    console.log('✅ Shutdown handler loaded');
  }
}
