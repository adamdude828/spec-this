# Quick Start: MCP Background Service

Get your MCP server running as a macOS background service in 3 steps.

## Prerequisites

```bash
# Install jq (JSON processor)
brew install jq
```

## Setup (First Time)

### 1. Configure Project Path

Edit `launchd/projects.json` and update the `projectPath`:

```json
{
  "projects": [
    {
      "name": "spec-this",
      "label": "com.specthis.mcp",
      "projectPath": "/Users/YOUR_USERNAME/path/to/spec-this",  ← UPDATE THIS
      "enabled": true,
      "description": "Spec-This MCP Server"
    }
  ],
  "global": {
    "logDirectory": "~/Library/Logs/mcp-servers",
    "nodePath": "/usr/local/bin/node"
  }
}
```

**Tip:** Use absolute paths or `~` for home directory.

### 2. Build and Install

```bash
npm run build:mcp
npm run service:install
```

Done! Your MCP server is now running in the background.

### 3. Verify It's Running

```bash
npm run service:status
```

You should see "Running" status.

## Daily Commands

```bash
# View logs
npm run service:logs

# Follow logs in real-time (useful for debugging)
npm run service:logs:follow

# After making code changes
npm run build:mcp
npm run service:restart

# Stop/start manually
npm run service:stop
npm run service:start

# Remove service
npm run service:uninstall
```

## Troubleshooting

**Service won't start?**
1. Check logs: `npm run service:logs`
2. Verify database: Ensure `.env.local` has `DATABASE_URL`
3. Test manually: `npm run start:mcp`

**Need to update Node.js path?**
1. Check path: `which node`
2. Update `nodePath` in `launchd/projects.json`
3. Reinstall: `npm run service:uninstall && npm run service:install`

**Where are logs stored?**
`~/Library/Logs/mcp-servers/spec-this/`

## Adding More Projects

1. Edit `launchd/projects.json` - add new project entry with unique name and label
2. Run `npm run service:install` (installs all enabled projects)
3. Check status: `./launchd/mcp-service.sh status`

See `launchd/README.md` for full documentation.

## How It Works

- Uses macOS `launchd` (the standard for background services)
- Auto-starts on login
- Auto-restarts on crash
- Logs everything to `~/Library/Logs/mcp-servers/`
- Runs as your user (LaunchAgent, not daemon)

## Service Management Script

For advanced usage, you can use the management script directly:

```bash
cd launchd

# Show all commands
./mcp-service.sh help

# Install/manage specific project
./mcp-service.sh install spec-this
./mcp-service.sh status spec-this
./mcp-service.sh logs spec-this -f

# Manage all projects
./mcp-service.sh status
./mcp-service.sh install
```

## Development vs Production

**Development** (manual, with hot reload):
```bash
npm run dev:mcp
```

**Production** (background service):
```bash
npm run build:mcp
npm run service:install
```

Use development mode when actively coding. Use production mode for always-on MCP server access.

## Need Help?

- Full docs: `launchd/README.md`
- List projects: `npm run service:status`
- View logs: `npm run service:logs`
- MCP server docs: See main `CLAUDE.md`
