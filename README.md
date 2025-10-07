# Spec-This

A specification-driven development tool that combines a Next.js web application with an MCP (Model Context Protocol) server. Manage software development through a hierarchical structure of Epics → Stories → Tasks.

## Prerequisites

- Node.js 18+
- PostgreSQL database
- npm or yarn

## Getting Started

### 1. Install Dependencies

```bash
npm install
```

### 2. Set Up Environment Variables

Create a `.env.local` file in the root directory:

```bash
DATABASE_URL=postgresql://user:password@host:port/database
```

### 3. Set Up the Database

Generate and apply the database schema:

```bash
# Generate migration files
npm run db:generate

# Apply migrations to database
npm run db:migrate

# Or use push for development (faster, skips migration files)
npm run db:push
```

### 4. Run the Application

**Next.js Web App:**

```bash
npm run dev          # Development server (http://localhost:3000)
npm run build        # Production build
npm run start        # Start production server
```

**MCP Server:**

```bash
npm run dev:mcp      # Development with auto-reload
npm run build:mcp    # Compile to dist/mcp-server.js
npm run start:mcp    # Run compiled server
```

## Database Management

### Common Commands

```bash
npm run db:generate  # Generate new migration files from schema changes
npm run db:migrate   # Apply pending migrations
npm run db:push      # Push schema changes directly (dev mode)
npm run db:studio    # Open Drizzle Studio UI for database inspection
```

### Making Schema Changes

1. Edit `lib/db/schema.ts`
2. Run `npm run db:generate` to create migration files
3. Review the generated migration in `drizzle/` directory
4. Run `npm run db:migrate` to apply changes

> **Tip:** Use `npm run db:push` during development for faster iteration without generating migration files.

## Project Structure

```
spec-this/
├── app/                    # Next.js app directory (UI)
│   ├── components/        # React components
│   ├── epics/[id]/        # Epic detail pages
│   ├── stories/[id]/      # Story detail pages
│   └── api/               # API routes
├── lib/
│   ├── db/
│   │   ├── schema.ts      # Drizzle database schema
│   │   └── index.ts       # Database connection
│   └── mcp/
│       └── tools/         # MCP tool implementations
├── mcp-server.ts          # MCP server entry point
├── drizzle/               # Database migrations
└── drizzle.config.ts      # Drizzle ORM configuration
```

## MCP Tools

The MCP server exposes tools for managing specifications:

- `read_repos` - Fetch repositories
- `read_epics` - Fetch epics with filtering
- `upsert_epic` - Create/update epics
- `read_stories` - Fetch stories with filtering
- `upsert_story` - Create/update stories
- `read_tasks` - Fetch tasks with filtering
- `upsert_task` - Create/update tasks

## Documentation

For detailed architecture, best practices, and development guidelines, see [CLAUDE.md](./CLAUDE.md).

## Tech Stack

- **Framework:** Next.js 15.5.4 with Turbopack
- **Language:** TypeScript 5
- **Database:** PostgreSQL via Drizzle ORM
- **MCP SDK:** @modelcontextprotocol/sdk v1.19.1
- **Styling:** Tailwind CSS v4

## License

MIT
