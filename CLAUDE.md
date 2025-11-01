# CLAUDE.md - Spec-This Project Documentation

## Project Overview

**Spec-This** is an AI-first specification-driven development tool that combines a Next.js web application with an MCP (Model Context Protocol) server. It helps manage software development through a hierarchical structure:
- **Formal workflow**: Repositories → Epics → Stories → Planned File Changes
- **Quick workflow**: Repositories → Quick Tasks → Planned File Changes

Stories are the atomic unit of work for formal planning, with each Story containing one or more Planned File Changes. Quick Tasks provide a lightweight alternative for AI agents to plan and execute small changes without the overhead of epic management.

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
├── mcp-server.ts          # MCP server entry point
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
Feature descriptions belonging to epics (atomic unit of work for formal planning):
- `id` (UUID, primary key)
- `epicId` (UUID, foreign key → epics)
- `title` (text, required)
- `description` (text)
- `acceptanceCriteria` (text)
- `status` (enum: draft, ready, in_progress, review, completed)
- `priority` (enum: low, medium, high, critical)
- `orderIndex` (integer)
- Timestamps: `createdAt`, `updatedAt`

### Quick Tasks
Lightweight tasks for small changes (ideal for AI agent planning):
- `id` (UUID, primary key)
- `repoId` (UUID, foreign key → repositories, required)
- `title` (text, required)
- `description` (text)
- `status` (enum: planned, in_progress, completed, cancelled)
- `priority` (enum: low, medium, high, critical)
- `orderIndex` (integer)
- Timestamps: `createdAt`, `updatedAt`, `completedAt`

### Planned File Changes
Specific file modifications planned as part of a Story or Quick Task:
- `id` (UUID, primary key)
- `storyId` (UUID, foreign key → stories, nullable)
- `quickTaskId` (UUID, foreign key → quick_tasks, nullable)
- `filePath` (text, required) - Relative path from repo root
- `changeType` (enum: create, modify, delete)
- `description` (text) - What changes are being made and why
- `expectedChanges` (text) - Code snippets, detailed changes expected
- `status` (enum: planned, in_progress, completed, failed)
- `beforeSnapshot` (text) - Optional file content before change
- `afterSnapshot` (text) - Optional expected/actual content after change
- `orderIndex` (integer)
- Timestamps: `createdAt`, `updatedAt`, `completedAt`

**Note:** Either `storyId` OR `quickTaskId` must be set (mutually exclusive). The filePath can be used to query Neo4j for file dependencies and impact analysis.

## MCP Server

The MCP server (`mcp-server.ts`) exposes 10 tools for managing the spec hierarchy:

### Available Tools
1. **read_repos** - Fetch all repositories or get specific repository by ID (read-only, create repos via UI)
2. **read_epics** - Fetch all epics, filter by status, or get specific epic by ID
3. **upsert_epic** - Create new epic or update existing (requires repoId, provide ID to update)
4. **read_stories** - Fetch stories with optional filters (epicId, status, or specific ID)
5. **upsert_story** - Create/update stories
6. **delete_story** - Delete a story by ID (cascades to planned file changes)
7. **read_quick_tasks** - Fetch quick tasks with optional filters (repoId, status, or specific ID)
8. **upsert_quick_task** - Create/update quick tasks (requires repoId, title)
9. **delete_quick_task** - Delete a quick task by ID (cascades to planned file changes)
10. **read_planned_file_changes** - Fetch planned file changes with optional filters (storyId, quickTaskId, status, or specific ID)
11. **upsert_planned_file_change** - Create/update planned file changes (requires either storyId or quickTaskId, filePath, changeType)
12. **delete_planned_file_change** - Delete a planned file change by ID

### MCP Server Commands
```bash
# Development (with auto-reload)
npm run dev:mcp

# Build
npm run build:mcp

# Start (production)
npm run start:mcp
```

## Development Workflow

### Setup
1. Clone repository
2. Install dependencies: `npm install`
3. Create `.env.local` with `DATABASE_URL` pointing to PostgreSQL
4. Generate database schema: `npm run db:generate`
5. Run migrations: `npm run db:migrate`

### Running the Application

**Next.js Web App:**
```bash
npm run dev          # Development with Turbopack
npm run build        # Production build
npm run start        # Start production server
```

**MCP Server:**
```bash
npm run dev:mcp      # Development (uses tsx for hot reload)
npm run build:mcp    # Compile to dist/mcp-server.js
npm run start:mcp    # Run compiled server
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
- Deleting a Repository cascades to all child Epics and Quick Tasks (and their Stories/Planned File Changes)
- Deleting an Epic cascades to all child Stories (and their Planned File Changes)
- Deleting a Story cascades to all child Planned File Changes
- Deleting a Quick Task cascades to all child Planned File Changes

### Ordering
- Stories, Quick Tasks, and Planned File Changes use `orderIndex` for custom ordering within their parent

### Timestamps
- All entities auto-track `createdAt` and `updatedAt`
- Quick Tasks and Planned File Changes also track `completedAt` when marked complete

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

### When Working with Repositories/Epics/Stories/Quick Tasks/Planned File Changes
1. Always create Repositories first (via UI only)
2. **Formal workflow**: Always create Epics before Stories (must specify repoId), then create Stories before Planned File Changes (must specify storyId)
3. **Quick workflow**: Create Quick Tasks directly under a Repository (must specify repoId), then create Planned File Changes (must specify quickTaskId)
4. Use appropriate status transitions:
   - Stories: draft → ready → in_progress → review → completed
   - Quick Tasks: planned → in_progress → completed/cancelled
5. Use descriptive titles and acceptance criteria (Stories only)
6. For Planned File Changes, always specify filePath relative to repo root and either storyId OR quickTaskId (mutually exclusive)
7. Use the Neo4j file graph (when available) to analyze dependencies before planning changes
8. Choose Quick Tasks for small, isolated changes that don't require epic-level planning

### Database Operations
- Use the MCP tools rather than raw SQL when possible
- Remember cascade deletes when removing parent entities
- Check for existing entities before creating duplicates
- Use filtering parameters (status, epicId, storyId, repoId, quickTaskId) to reduce data transfer

### AI-First Workflow
- **Stories** are the atomic unit of work for formal planning - break features into Stories with acceptance criteria
- **Quick Tasks** are ideal for AI agents to plan small, isolated changes without epic overhead
- Each Story or Quick Task should have Planned File Changes that specify exact files to modify
- Use `beforeSnapshot` and `afterSnapshot` to track expected changes
- Leverage Neo4j file graph for impact analysis (understanding which files depend on changed files)
- The `changeType` field helps AI agents understand the scope (create new, modify existing, or delete)
- Quick Tasks are perfect for: bug fixes, small refactors, documentation updates, minor feature tweaks

### Code Modifications
- Run `npm run db:generate` after schema changes
- Test MCP server with `npm run dev:mcp` before building
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
