# Running Spec-This as a Background Service (macOS)

Spec-This (Next.js app with integrated MCP server) can run as a persistent background service on macOS that auto-starts on login and auto-restarts on crashes.

## Features

- **Auto-start on login** - Services start automatically using macOS launchd
- **Auto-restart on crash** - Automatic recovery with configurable throttle
- **Multi-project support** - Manage multiple Next.js/MCP projects from one configuration
- **Centralized logging** - All logs in `~/Library/Logs/mcp-servers/`
- **Easy management** - Simple npm scripts for all operations
- **Native macOS integration** - Uses standard launchd system

## Quick Start

```bash
# 1. Install prerequisites
brew install jq

# 2. Configure your project path in launchd/projects.json
# 3. Build and install
npm run build
npm run service:install

# 4. Verify it's running
npm run service:status
```

## Common Commands

```bash
npm run service:status          # Check if running
npm run service:logs            # View logs
npm run service:logs:follow     # Follow logs in real-time
npm run service:restart         # Restart after code changes
npm run service:stop            # Stop service
npm run service:start           # Start service
npm run service:uninstall       # Remove service
```

## Documentation

For complete documentation, see:

- **[launchd/QUICKSTART.md](../launchd/QUICKSTART.md)** - Quick start guide for getting the service running
- **[launchd/README.md](../launchd/README.md)** - Complete documentation including troubleshooting, advanced usage, and multi-project setup

## Adding Multiple Projects

The system supports running multiple Next.js/MCP projects simultaneously. Edit `launchd/projects.json` to add additional projects, then run `npm run service:install` to install all enabled services.

See [launchd/README.md](../launchd/README.md#adding-additional-projects) for details.
