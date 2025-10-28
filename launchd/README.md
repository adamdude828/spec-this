# Next.js Background Service for macOS

This directory contains everything needed to run Spec-This (Next.js app with integrated MCP server) and other similar projects as persistent background services on macOS using `launchd`.

## Features

- **Auto-start on login**: Services start automatically when you log in
- **Auto-restart on crash**: Services automatically restart if they crash
- **Multiple projects**: Easily manage multiple Next.js/MCP projects from a single configuration
- **Centralized logging**: All logs in one location (`~/Library/Logs/mcp-servers/`)
- **Simple management**: Easy-to-use CLI for install, start, stop, status, and logs
- **Native macOS integration**: Uses launchd (the macOS standard for background services)

## Prerequisites

1. **Node.js**: Ensure Node.js is installed (used to run Next.js)
2. **jq**: JSON processor for configuration management
   ```bash
   brew install jq
   ```
3. **Built Next.js app**: Run `npm run build` in your project

## Quick Start

### 1. Configure Your Project Path

Edit `launchd/projects.json` and update the `projectPath` to match your installation:

```json
{
  "projects": [
    {
      "name": "spec-this",
      "label": "com.specthis.mcp",
      "projectPath": "/Users/yourname/projects/spec-this",
      "port": "3080",
      "enabled": true,
      "description": "Spec-This Next.js app with integrated MCP server"
    }
  ],
  "global": {
    "logDirectory": "~/Library/Logs/mcp-servers",
    "nodePath": "/usr/local/bin/node"
  }
}
```

**Important**: Use absolute paths or `~` for home directory. Update `nodePath` if your Node.js is in a different location (check with `which node`).

### 2. Build the Next.js App

```bash
npm run build
```

### 3. Install and Start the Service

```bash
cd launchd
chmod +x mcp-service.sh
./mcp-service.sh install
```

That's it! Spec-This is now running in the background (web UI on http://localhost:3080 and MCP server at /api/sse) and will auto-start on login.

## Usage

### Basic Commands

```bash
# Show status of all services
./mcp-service.sh status

# Show detailed status of a specific project
./mcp-service.sh status spec-this

# View logs (last 50 lines)
./mcp-service.sh logs spec-this

# Follow logs in real-time
./mcp-service.sh logs spec-this -f

# Restart a service (useful after code changes)
./mcp-service.sh restart spec-this

# Stop a service
./mcp-service.sh stop spec-this

# Start a service
./mcp-service.sh start spec-this

# List all configured projects
./mcp-service.sh list

# Uninstall a service
./mcp-service.sh uninstall spec-this
```

### Development Workflow

When you make changes to the code:

```bash
# 1. Rebuild the Next.js app
npm run build

# 2. Restart the service to pick up changes
./launchd/mcp-service.sh restart spec-this

# 3. Check logs to verify it's working
./launchd/mcp-service.sh logs spec-this -f
```

## Adding Additional Projects

You can manage multiple Next.js/MCP projects with this system. To add a new project:

### 1. Add to Configuration

Edit `launchd/projects.json` and add a new project entry:

```json
{
  "projects": [
    {
      "name": "spec-this",
      "label": "com.specthis.mcp",
      "projectPath": "/Users/yourname/projects/spec-this",
      "port": "3080",
      "enabled": true,
      "description": "Spec-This Next.js app with integrated MCP server"
    },
    {
      "name": "my-other-mcp",
      "label": "com.mycompany.mcp",
      "projectPath": "/Users/yourname/projects/my-other-mcp",
      "enabled": true,
      "description": "My Other MCP Server"
    }
  ],
  "global": {
    "logDirectory": "~/Library/Logs/mcp-servers",
    "nodePath": "/usr/local/bin/node"
  }
}
```

**Important**: Each project must have:
- A unique `name` (used in commands)
- A unique `label` (reverse domain notation, must be globally unique on your system)
- An absolute `projectPath` pointing to the project directory
- A `port` number for the Next.js server (defaults to 3080 if not specified)
- A built Next.js app at `{projectPath}/.next`

### 2. Install the New Service

```bash
./mcp-service.sh install my-other-mcp
```

Or install all enabled projects at once:

```bash
./mcp-service.sh install
```

### 3. Manage All Services

```bash
# View status of all services
./mcp-service.sh status

# Install all enabled services
./mcp-service.sh install

# Uninstall all services
./mcp-service.sh uninstall
```

## Configuration Reference

### Project Configuration

Each project in `projects.json` has these fields:

| Field | Required | Description |
|-------|----------|-------------|
| `name` | Yes | Short name used in CLI commands |
| `label` | Yes | Unique launchd label (reverse domain notation) |
| `projectPath` | Yes | Absolute path to project directory |
| `enabled` | Yes | Whether to include in `install` command |
| `description` | No | Human-readable description |

### Global Configuration

| Field | Required | Description |
|-------|----------|-------------|
| `logDirectory` | Yes | Where to store log files |
| `nodePath` | No | Path to Node.js executable (auto-detected if omitted) |

## File Structure

```
launchd/
├── README.md                          # This file
├── mcp-service.sh                     # Main management script
├── com.specthis.mcp.plist.template   # Launchd plist template
├── projects.json                      # Your project configuration
└── projects.json.example              # Example configuration
```

## Log Management

Logs are stored at `~/Library/Logs/mcp-servers/{project-name}/`:
- `stdout.log` - Standard output
- `stderr.log` - Error output

**Note**: Logs grow indefinitely. Consider setting up log rotation:

```bash
# Add to your crontab (crontab -e)
0 0 * * 0 find ~/Library/Logs/mcp-servers -name "*.log" -mtime +30 -delete
```

This deletes logs older than 30 days every Sunday at midnight.

## Troubleshooting

### Service won't start

1. **Check if Next.js is built**:
   ```bash
   ls -l .next
   ```

2. **Verify Node.js path**:
   ```bash
   which node
   ```
   Update `nodePath` in `projects.json` if different.

3. **Check logs for errors**:
   ```bash
   ./mcp-service.sh logs spec-this
   ```

4. **Verify launchd status**:
   ```bash
   launchctl list | grep specthis
   ```

### Service keeps crashing

1. **Check logs**:
   ```bash
   ./mcp-service.sh logs spec-this
   ```

2. **Verify database connection**:
   Ensure `.env.local` in your project directory has correct `DATABASE_URL`.

3. **Test manually**:
   ```bash
   cd /path/to/spec-this
   npm run start  # Visit http://localhost:3080
   ```

### Can't find service

1. **Verify project is configured**:
   ```bash
   ./mcp-service.sh list
   ```

2. **Check if installed**:
   ```bash
   ls ~/Library/LaunchAgents/com.specthis.mcp.plist
   ```

3. **Reinstall**:
   ```bash
   ./mcp-service.sh uninstall spec-this
   ./mcp-service.sh install spec-this
   ```

### Permission errors

Ensure the script is executable:
```bash
chmod +x launchd/mcp-service.sh
```

## Advanced Usage

### Custom Environment Variables

To add custom environment variables to your service, edit the plist template:

1. Edit `com.specthis.mcp.plist.template`
2. Add to the `<key>EnvironmentVariables</key>` dict:
   ```xml
   <key>MY_CUSTOM_VAR</key>
   <string>my-value</string>
   ```
3. Reinstall the service

**Note**: For sensitive data like `DATABASE_URL`, use `.env.local` in your project directory instead (Next.js loads it automatically).

### Multiple Instances of Same Project

To run multiple instances (e.g., different databases):

1. Create separate project entries with different names and labels:
   ```json
   {
     "name": "spec-this-dev",
     "label": "com.specthis.mcp.dev",
     "projectPath": "/path/to/spec-this-dev",
     ...
   },
   {
     "name": "spec-this-prod",
     "label": "com.specthis.mcp.prod",
     "projectPath": "/path/to/spec-this-prod",
     ...
   }
   ```

2. Each instance needs its own project directory with separate `.env.local`

### Manual launchd Commands

If you need direct control:

```bash
# Load service
launchctl load ~/Library/LaunchAgents/com.specthis.mcp.plist

# Unload service
launchctl unload ~/Library/LaunchAgents/com.specthis.mcp.plist

# Start service
launchctl start com.specthis.mcp

# Stop service
launchctl stop com.specthis.mcp

# View service info
launchctl list | grep specthis
```

## Uninstalling

To completely remove all services:

```bash
# Uninstall all services
./mcp-service.sh uninstall

# Optionally, remove logs
rm -rf ~/Library/Logs/mcp-servers
```

## Security Considerations

- Services run as your user account (LaunchAgent, not LaunchDaemon)
- Logs may contain sensitive information - review log directory permissions
- Database credentials should be in `.env.local` (not in plist files)
- plist files are in your user's `~/Library/LaunchAgents` (only you can access)

## Integration with MCP Clients

Once running, your MCP server is accessible via HTTP. Configure your MCP client (like Claude Desktop) to connect via SSE transport:

```json
{
  "mcpServers": {
    "spec-this": {
      "url": "http://localhost:3080/api/sse"
    }
  }
}
```

**Note**: The background service keeps the Next.js server running persistently, which includes both the web UI (http://localhost:3080) and the MCP server endpoint (/api/sse).

## Contributing

To improve this service management system:

1. Edit `mcp-service.sh` for new features
2. Update `com.specthis.mcp.plist.template` for service configuration changes
3. Update this README with new documentation
4. Test thoroughly before committing

## Resources

- [launchd.info](https://www.launchd.info/) - Complete launchd reference
- [MCP Documentation](https://modelcontextprotocol.io/) - Model Context Protocol docs
- [Apple Developer: launchd](https://developer.apple.com/library/archive/documentation/MacOSX/Conceptual/BPSystemStartup/Chapters/CreatingLaunchdJobs.html)
