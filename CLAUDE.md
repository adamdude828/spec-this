# CLAUDE.md - Spec-This Project Documentation

## Project Overview

**Spec-This** is an AI-first specification-driven development tool that combines a Next.js web application with an MCP (Model Context Protocol) server. It helps manage software development through a hierarchical structure of Repositories → Epics → Stories → Planned File Changes.

Stories are the atomic unit of work, with each Story containing one or more Planned File Changes that reference actual files in the codebase.

## Architecture

### Tech Stack
- **Framework**: Next.js 15.5.4 (with Turbopack)
- **Language**: TypeScript 5
- **Database**: PostgreSQL via Drizzle ORM
- **MCP SDK**: @modelcontextprotocol/sdk v1.19.1
- **Styling**: Tailwind CSS v4
- **Runtime**: Node.js

### Project Structure

```
spec-this/
├── app/                    # Next.js app directory
│   ├── page.tsx           # Main page component
│   └── layout.tsx         # Root layout
├── lib/
│   ├── db/
│   │   ├── schema.ts      # Drizzle database schema
│   │   └── index.ts       # Database connection
│   └── mcp/
│       ├── types/
│       │   └── tool.ts    # MCP tool type definitions
│       └── tools/         # MCP tool implementations
│           ├── index.ts   # Tool registry
│           ├── read-epics.ts
│           ├── upsert-epic.ts
│           ├── read-stories.ts
│           ├── upsert-story.ts
│           ├── read-tasks.ts
│           └── upsert-task.ts
├── app/api/[transport]/   # MCP server HTTP endpoint
├── drizzle.config.ts      # Drizzle ORM configuration
├── next.config.ts         # Next.js configuration
└── package.json
```

## Database Schema

### Repositories
Top-level organizational units for projects:
- `id` (UUID, primary key)
- `name` (text, required)
- `localPath` (text, required) - Local file system path to the repository
- `repoUrl` (text) - Optional repository URL (e.g., GitHub)
- Timestamps: `createdAt`, `updatedAt`

### Epics
Feature groups belonging to repositories:
- `id` (UUID, primary key)
- `repoId` (UUID, foreign key → repositories, required)
- `title` (text, required)
- `description` (text)
- `status` (enum: draft, active, completed, archived)
- `priority` (enum: low, medium, high, critical)
- `createdBy` (text)
- Timestamps: `createdAt`, `updatedAt`

### Stories
Feature descriptions belonging to epics (atomic unit of work):
- `id` (UUID, primary key)
- `epicId` (UUID, foreign key → epics)
- `title` (text, required)
- `description` (text)
- `acceptanceCriteria` (text)
- `status` (enum: draft, ready, in_progress, review, completed)
- `priority` (enum: low, medium, high, critical)
- `orderIndex` (integer)
- Timestamps: `createdAt`, `updatedAt`

### Planned File Changes
Specific file modifications planned as part of a Story:
- `id` (UUID, primary key)
- `storyId` (UUID, foreign key → stories)
- `filePath` (text, required) - Relative path from repo root
- `changeType` (enum: create, modify, delete)
- `description` (text) - What changes are being made and why
- `expectedChanges` (text) - Code snippets, detailed changes expected
- `status` (enum: planned, in_progress, completed, failed)
- `beforeSnapshot` (text) - Optional file content before change
- `afterSnapshot` (text) - Optional expected/actual content after change
- `orderIndex` (integer)
- Timestamps: `createdAt`, `updatedAt`, `completedAt`

**Note:** The filePath can be used to query Neo4j for file dependencies and impact analysis.

## MCP Server

The MCP server is integrated into Next.js via the `/api/[transport]/route.ts` endpoint and exposes 7 tools for managing the spec hierarchy:

### Available Tools
1. **read_repos** - Fetch all repositories or get specific repository by ID (read-only, create repos via UI)
2. **read_epics** - Fetch all epics, filter by status, or get specific epic by ID
3. **upsert_epic** - Create new epic or update existing (requires repoId, provide ID to update)
4. **read_stories** - Fetch stories with optional filters (epicId, status, or specific ID)
5. **upsert_story** - Create/update stories
6. **read_planned_file_changes** - Fetch planned file changes with optional filters (storyId, status, or specific ID)
7. **upsert_planned_file_change** - Create/update planned file changes (requires storyId, filePath, changeType)

### Accessing the MCP Server

The MCP server runs alongside the Next.js app and is accessible at:
- **HTTP/SSE**: `http://localhost:3080/api/sse`
- **Streamable HTTP**: `http://localhost:3080/api/messages`

Configure your MCP client (like Claude Desktop) to connect:
```json
{
  "mcpServers": {
    "spec-this": {
      "url": "http://localhost:3080/api/sse"
    }
  }
}
```

### Running as Background Service (macOS)

For production use, Next.js (with integrated MCP server) can run as a persistent background service that auto-starts on login and auto-restarts on crashes. See `launchd/README.md` for complete documentation.

**Quick Start:**
```bash
# 1. Configure your project path in launchd/projects.json
# 2. Build and install
npm run build
npm run service:install

# Common commands
npm run service:status          # Check if running
npm run service:logs            # View logs
npm run service:logs:follow     # Follow logs in real-time
npm run service:restart         # Restart after code changes
npm run service:stop            # Stop service
npm run service:start           # Start service
npm run service:uninstall       # Remove service
```

**Managing Multiple Projects:**
The service system supports running multiple Next.js/MCP projects simultaneously. Edit `launchd/projects.json` to add additional projects, then run `npm run service:install` to install all enabled services.

Logs are stored at: `~/Library/Logs/mcp-servers/{project-name}/`

**Note:** The background service runs the entire Next.js application, providing both the web UI (http://localhost:3080) and MCP server (/api/sse) simultaneously.

## Development Workflow

### Setup
1. Clone repository
2. Install dependencies: `npm install`
3. Create `.env.local` with `DATABASE_URL` pointing to PostgreSQL
4. Generate database schema: `npm run db:generate`
5. Run migrations: `npm run db:migrate`

### Running the Application

**Next.js Web App (with integrated MCP server):**
```bash
npm run dev          # Development with Turbopack (includes MCP server)
npm run build        # Production build
npm run start        # Start production server (http://localhost:3080)
```

**Background Service (macOS only):**
```bash
npm run service:install      # Install and start as background service
npm run service:status       # Check service status
npm run service:restart      # Restart after code changes
npm run service:logs         # View logs
npm run service:uninstall    # Remove background service
```

### Database Management
```bash
npm run db:generate  # Generate migration files
npm run db:migrate   # Apply migrations
npm run db:push      # Push schema changes (dev)
npm run db:studio    # Open Drizzle Studio UI
```

## Key Design Patterns

### Cascade Deletion
- Deleting a Repository cascades to all child Epics (and their Stories/Planned File Changes)
- Deleting an Epic cascades to all child Stories (and their Planned File Changes)
- Deleting a Story cascades to all child Planned File Changes

### Ordering
- Stories and Planned File Changes use `orderIndex` for custom ordering within their parent

### Timestamps
- All entities auto-track `createdAt` and `updatedAt`
- Planned File Changes also track `completedAt` when marked complete

### Type Safety
- Full TypeScript coverage
- Zod schemas for MCP tool validation
- Drizzle ORM for type-safe database queries

## Environment Variables

Required in `.env.local`:
```
DATABASE_URL=postgresql://user:password@host:port/database
```

## Best Practices for Claude

### When Working with Repositories/Epics/Stories/Planned File Changes
1. Always create Repositories first (via UI only)
2. Always create Epics before Stories (must specify repoId)
3. Always create Stories before Planned File Changes (must specify storyId)
4. Use appropriate status transitions (e.g., draft → ready → in_progress → review → completed)
5. Use descriptive titles and acceptance criteria
6. For Planned File Changes, always specify filePath relative to repo root
7. Use the Neo4j file graph (when available) to analyze dependencies before planning changes

### Database Operations
- Use the MCP tools rather than raw SQL when possible
- Remember cascade deletes when removing parent entities
- Check for existing entities before creating duplicates
- Use filtering parameters (status, epicId, storyId) to reduce data transfer

### AI-First Workflow
- Stories are the atomic unit of work - break features into Stories, not abstract tasks
- Each Story should have Planned File Changes that specify exact files to modify
- Use `beforeSnapshot` and `afterSnapshot` to track expected changes
- Leverage Neo4j file graph for impact analysis (understanding which files depend on changed files)
- The `changeType` field helps AI agents understand the scope (create new, modify existing, or delete)

### Code Modifications
- Run `npm run db:generate` after schema changes
- Test via `npm run dev` - includes both web UI and MCP server
- Use TypeScript strict mode features
- Follow existing code organization patterns

## Common Tasks

### Adding a New MCP Tool
1. Create tool file in `lib/mcp/tools/[tool-name].ts`
2. Define Zod schema for validation
3. Implement handler with database operations
4. Export from `lib/mcp/tools/index.ts`
5. Tool auto-registers via `allTools` array

### Modifying Database Schema
1. Edit `lib/db/schema.ts`
2. Run `npm run db:generate`
3. Review generated migration in `drizzle/` directory
4. Apply with `npm run db:migrate`
5. Update affected MCP tools if needed

### Testing Database Changes
- Use `npm run db:studio` for visual inspection
- Test via MCP tools or direct Drizzle queries
- Verify cascade behaviors with parent/child deletions
