/**
 * Centralized graceful shutdown handler
 * Manages cleanup of all resources (database connections, etc.)
 */

type ShutdownCallback = () => Promise<void> | void;

class ShutdownHandler {
  private callbacks: ShutdownCallback[] = [];
  private isShuttingDown = false;

  /**
   * Register a cleanup callback to run on shutdown
   */
  public register(callback: ShutdownCallback): void {
    this.callbacks.push(callback);
  }

  /**
   * Execute all cleanup callbacks and exit
   */
  public async shutdown(_signal: string): Promise<void> {
    if (this.isShuttingDown) {
      return;
    }

    this.isShuttingDown = true;

    // Run all cleanup callbacks in parallel
    try {
      await Promise.all(
        this.callbacks.map(async (callback) => {
          try {
            await callback();
          } catch (error) {
            console.error('Error during shutdown cleanup:', error);
          }
        })
      );
    } catch (error) {
      console.error('Error during shutdown:', error);
    }

    process.exit(0);
  }
}

// Singleton instance
export const shutdownHandler = new ShutdownHandler();

// Register signal handlers once
if (typeof process !== 'undefined') {
  // Remove all existing SIGINT/SIGTERM handlers (likely from Next.js)
  // This is necessary because Next.js's handlers don't call process.exit()
  process.removeAllListeners('SIGINT');
  process.removeAllListeners('SIGTERM');

  // Add our handlers with immediate exit
  process.on('SIGINT', () => {
    shutdownHandler.shutdown('SIGINT');
  });

  process.on('SIGTERM', () => {
    shutdownHandler.shutdown('SIGTERM');
  });
}
