# CLAUDE.md - Spec-This Project Documentation

## Project Overview

**Spec-This** is a specification-driven development tool that combines a Next.js web application with an MCP (Model Context Protocol) server. It helps manage software development through a hierarchical structure of Epics → Stories → Tasks.

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
Feature descriptions belonging to epics:
- `id` (UUID, primary key)
- `epicId` (UUID, foreign key → epics)
- `title` (text, required)
- `description` (text)
- `acceptanceCriteria` (text)
- `status` (enum: draft, ready, in_progress, review, completed)
- `priority` (enum: low, medium, high, critical)
- `storyPoints` (integer)
- `orderIndex` (integer)
- Timestamps: `createdAt`, `updatedAt`

### Tasks
Granular work items belonging to stories:
- `id` (UUID, primary key)
- `storyId` (UUID, foreign key → stories)
- `title` (text, required)
- `description` (text)
- `status` (enum: todo, in_progress, blocked, completed)
- `estimatedHours` (decimal)
- `actualHours` (decimal)
- `orderIndex` (integer)
- Timestamps: `createdAt`, `updatedAt`, `completedAt`

## MCP Server

The MCP server (`mcp-server.ts`) exposes 7 tools for managing the spec hierarchy:

### Available Tools
1. **read_repos** - Fetch all repositories or get specific repository by ID (read-only, create repos via UI)
2. **read_epics** - Fetch all epics, filter by status, or get specific epic by ID
3. **upsert_epic** - Create new epic or update existing (requires repoId, provide ID to update)
4. **read_stories** - Fetch stories with optional filters (epicId, status, or specific ID)
5. **upsert_story** - Create/update stories
6. **read_tasks** - Fetch tasks with optional filters (storyId, status, or specific ID)
7. **upsert_task** - Create/update tasks

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
- Deleting a Repository cascades to all child Epics (and their Stories/Tasks)
- Deleting an Epic cascades to all child Stories (and their Tasks)
- Deleting a Story cascades to all child Tasks

### Ordering
- Stories and Tasks use `orderIndex` for custom ordering within their parent

### Timestamps
- All entities auto-track `createdAt` and `updatedAt`
- Tasks also track `completedAt` when marked complete

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

### When Working with Repositories/Epics/Stories/Tasks
1. Always create Repositories first (via UI only)
2. Always create Epics before Stories (must specify repoId)
3. Always create Stories before Tasks
3. Use appropriate status transitions (e.g., draft → ready → in_progress → review → completed)
4. Set realistic story points and time estimates
5. Use descriptive titles and acceptance criteria

### Database Operations
- Use the MCP tools rather than raw SQL when possible
- Remember cascade deletes when removing parent entities
- Check for existing entities before creating duplicates
- Use filtering parameters (status, epicId, storyId) to reduce data transfer

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
