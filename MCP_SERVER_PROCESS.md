# MCP Server Process Documentation

## Overview

This document details how the Model Context Protocol (MCP) server is implemented and runs in the Spec-This project. Unlike traditional MCP implementations that require a separate standalone server, this project integrates MCP directly into Next.js using Vercel's `mcp-handler` package.

## Architecture Pattern

### Integrated Next.js Approach

**Key Innovation**: The MCP server runs as a Next.js API route, not as a separate process.

- **No separate server binary**: No standalone `mcp-server.js` to run independently
- **Single process**: MCP tools execute within the Next.js runtime
- **Unified deployment**: One application handles both web UI and MCP protocol
- **Shared resources**: Direct access to database connections, configurations, and modules

## Core Dependencies

### Required Packages

From `package.json`:

```json
{
  "dependencies": {
    "@modelcontextprotocol/sdk": "^1.19.1",
    "mcp-handler": "^1.0.2",
    "next": "15.5.4",
    "zod": "^3.25.76",
    "drizzle-orm": "^0.44.6",
    "postgres": "^3.4.7"
  }
}
```

#### Package Roles

- **@modelcontextprotocol/sdk**: Official MCP SDK types and interfaces
- **mcp-handler**: Vercel's Next.js integration layer for MCP
- **zod**: Schema validation for tool parameters
- **drizzle-orm**: Type-safe database access
- **next**: Framework providing the runtime environment

## Implementation Structure

### 1. API Route Handler

**Location**: `/app/api/[transport]/route.ts`

This dynamic route catches all MCP transport requests:

```typescript
import { createMcpHandler } from 'mcp-handler';
import { allTools } from '@/lib/mcp/tools';

// Force dynamic rendering - don't prerender during build/start
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const handler = createMcpHandler(
  (server) => {
    // Register all tools from our registry
    for (const tool of allTools) {
      server.tool(
        tool.name,
        tool.description,
        tool.schema.shape, // Pass the Zod schema shape
        async (args) => {
          return await tool.handler(args as never);
        }
      );
    }
  },
  undefined, // serverOptions - using defaults
  {
    basePath: '/api',
    redisUrl: process.env.REDIS_URL, // Optional: for SSE transport support
  }
);

export { handler as GET, handler as POST };
```

**Key Configuration Options**:

- `dynamic = 'force-dynamic'`: Prevents static optimization, ensures fresh responses
- `runtime = 'nodejs'`: Uses Node.js runtime (not Edge)
- `basePath: '/api'`: Matches the directory structure where `[transport]` is located
- `redisUrl`: Optional Redis for Server-Sent Events transport (SSE)

### 2. Tool Type System

**Location**: `/lib/mcp/types/tool.ts`

Defines the contract for all MCP tools:

```typescript
import { z } from "zod";

export interface ToolDefinition<T extends z.ZodRawShape = z.ZodRawShape> {
  name: string;
  description: string;
  schema: z.ZodObject<T>;
  handler: (params: z.infer<z.ZodObject<T>>) => Promise<ToolResponse>;
}

export interface ToolResponse {
  content: Array<{
    type: "text";
    text: string;
  }>;
  [key: string]: unknown;
}
```

**Type Safety Features**:

- Generic `ToolDefinition<T>` ensures handler params match schema
- Zod schema provides runtime validation
- TypeScript infers types from schema definitions

### 3. Tool Registry

**Location**: `/lib/mcp/tools/index.ts`

Central registry auto-exports all tools:

```typescript
import type { ToolDefinition } from "../types/tool.ts";
import { readReposTool } from "./read-repos.ts";
import { readEpicsTool } from "./read-epics.ts";
import { upsertEpicTool } from "./upsert-epic.ts";
import { readStoriesTool } from "./read-stories.ts";
import { upsertStoryTool } from "./upsert-story.ts";
import { readPlannedFileChangesTool } from "./read-planned-file-changes.ts";
import { upsertPlannedFileChangeTool } from "./upsert-planned-file-change.ts";
import { echoTool } from "./echo.ts";

export const allTools: ToolDefinition[] = [
  echoTool,
  readReposTool,
  readEpicsTool,
  upsertEpicTool,
  readStoriesTool,
  upsertStoryTool,
  readPlannedFileChangesTool,
  upsertPlannedFileChangeTool,
];

export * from "./echo.ts";
// ... other exports
```

**Auto-registration**: The API route iterates over `allTools` array to register each tool.

### 4. Tool Implementation Pattern

**Example**: `/lib/mcp/tools/read-epics.ts`

Every tool follows the same structure:

```typescript
import { z } from "zod";
import { eq } from "drizzle-orm";
import { db, epics } from "../../db/index.ts";
import type { ToolDefinition } from "../types/tool.ts";

// 1. Define Zod schema with descriptions
const readEpicsSchema = z.object({
  id: z.string().uuid().optional().describe("Optional epic ID to fetch a specific epic"),
  status: z.enum(['draft', 'active', 'completed', 'archived']).optional().describe("Optional status filter"),
});

// 2. Export tool definition
export const readEpicsTool: ToolDefinition = {
  name: "read_epics",
  description: "Read epics from the database. Can fetch all epics, filter by status, or get a specific epic by ID.",
  schema: readEpicsSchema,
  handler: async (params) => {
    try {
      // 3. Business logic with type-safe params
      if (params.id) {
        const results = await db.select().from(epics).where(eq(epics.id, params.id));
        return {
          content: [{
            type: "text",
            text: JSON.stringify(results[0], null, 2),
          }],
        };
      }

      // ... more logic

    } catch (error) {
      // 4. Consistent error handling
      return {
        content: [{
          type: "text",
          text: `Error reading epics: ${error instanceof Error ? error.message : String(error)}`,
        }],
      };
    }
  },
};
```

**Standard Pattern**:

1. Define Zod schema with `.describe()` for documentation
2. Export `ToolDefinition` with name, description, schema, handler
3. Handler receives validated, type-safe parameters
4. Return `ToolResponse` with text content array
5. Wrap in try-catch for error handling

## Running the MCP Server

### Development Mode

```bash
npm run dev          # Starts Next.js on port 3080
```

The MCP server starts automatically with Next.js. No separate process needed.

**Access URLs**:

- Web UI: `http://localhost:3080`
- MCP endpoint: `http://localhost:3080/api/[transport]`

### Production Mode

```bash
npm run build        # Build Next.js application
npm run start        # Start production server on port 3080
```

Again, MCP is bundled into the same process.

### Client Configuration

**Example**: `.mcp.json.production`

```json
{
  "mcpServers": {
    "spec-this": {
      "command": "node /path/to/spec-this/dist/mcp-server.js",
      "env": {
        "DATABASE_URL": "postgresql://postgres:postgres@localhost:5433/spec_this"
      }
    }
  }
}
```

**Note**: This configuration references a standalone server file that appears to be legacy documentation. The actual implementation uses the Next.js API route instead.

## Transport Mechanisms

The `[transport]` dynamic route segment supports multiple MCP transports:

1. **Streamable HTTP**: Default, uses request/response pattern
2. **SSE (Server-Sent Events)**: Requires Redis configuration

The `mcp-handler` package abstracts transport details.

## Database Integration

### Direct Access Pattern

Tools directly import the database instance:

```typescript
import { db, epics } from "../../db/index.ts";
```

**Benefits**:

- No connection pooling concerns (shared across tools)
- Type-safe queries via Drizzle ORM
- Automatic transaction support
- Hot reload in development preserves connections

### Database Configuration

**Location**: `/lib/db/index.ts`

```typescript
// Connection managed by Drizzle
export const db = drizzle(/* postgres connection */);

// Schema exports
export { epics, stories, repositories, plannedFileChanges } from './schema';
```

**Environment**:

- `DATABASE_URL` in `.env.local`
- Configured in `drizzle.config.ts`

## Tool Development Workflow

### Adding a New Tool

1. **Create tool file**: `/lib/mcp/tools/my-new-tool.ts`

   ```typescript
   import { z } from "zod";
   import type { ToolDefinition } from "../types/tool.ts";

   const myToolSchema = z.object({
     param: z.string().describe("Parameter description"),
   });

   export const myNewTool: ToolDefinition = {
     name: "my_new_tool",
     description: "What this tool does",
     schema: myToolSchema,
     handler: async (params) => {
       // Implementation
       return {
         content: [{
           type: "text",
           text: "Result",
         }],
       };
     },
   };
   ```

2. **Register in index**: `/lib/mcp/tools/index.ts`

   ```typescript
   import { myNewTool } from "./my-new-tool.ts";

   export const allTools: ToolDefinition[] = [
     // ... existing tools
     myNewTool,
   ];

   export * from "./my-new-tool.ts";
   ```

3. **Auto-registration**: The API route automatically picks up the new tool.

### Testing Tools

**Test Pattern**: `/lib/mcp/tools/__tests__/echo.test.ts`

```typescript
import { describe, it, expect } from 'vitest';
import { echoTool } from '../echo';

describe('echoTool', () => {
  it('should echo back the provided message', async () => {
    const message = 'Hello, World!';
    const result = await echoTool.handler({ message });

    expect(result.content[0].type).toBe('text');
    expect(result.content[0].text).toBe(`Echo: ${message}`);
  });
});
```

**Run tests**:

```bash
npm run test           # Watch mode
npm run test:ci        # Single run
npm run test:ui        # Visual UI
npm run test:coverage  # Coverage report
```

**Test directly**: Import and call `handler()` - no server needed!

## Available Tools

1. **echo** - Test connectivity
2. **read_repos** - Fetch repositories
3. **read_epics** - Fetch epics (with status filter)
4. **upsert_epic** - Create/update epics
5. **read_stories** - Fetch stories
6. **upsert_story** - Create/update stories
7. **read_planned_file_changes** - Fetch planned file changes
8. **upsert_planned_file_change** - Create/update file changes

All tools support:

- Optional `id` parameter for fetching specific items
- Status filtering where applicable
- Upsert pattern (create if no `id`, update if `id` provided)

## Configuration Files

### TypeScript Configuration

**File**: `tsconfig.json`

```json
{
  "compilerOptions": {
    "target": "ES2017",
    "module": "esnext",
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "strict": true,
    "paths": {
      "@/*": ["./*"]
    }
  }
}
```

**Key settings**:

- `allowImportingTsExtensions`: Import `.ts` files directly
- `moduleResolution: "bundler"`: Modern resolution for Next.js
- `paths`: `@/` alias maps to project root

### Next.js Configuration

**File**: `next.config.ts`

```typescript
const nextConfig: NextConfig = {
  serverExternalPackages: ["tree-sitter", "tree-sitter-typescript"],
  webpack: (config, { isServer }) => {
    if (isServer) {
      config.externals.push("tree-sitter", "tree-sitter-typescript");
    }
    return config;
  },
};
```

**Relevance to MCP**:

- `serverExternalPackages`: Keeps certain packages external to bundling
- Server-side rendering compatible with MCP tools
- No special MCP configuration needed

## Error Handling

### Tool-Level Errors

Every tool wraps logic in try-catch:

```typescript
handler: async (params) => {
  try {
    // Logic
  } catch (error) {
    return {
      content: [{
        type: "text",
        text: `Error: ${error instanceof Error ? error.message : String(error)}`,
      }],
    };
  }
}
```

### Handler-Level Errors

The `mcp-handler` package catches unhandled errors and returns proper MCP error responses.

### Database Errors

Drizzle ORM throws typed errors that are caught and serialized to text responses.

## Performance Considerations

### Advantages of Integrated Approach

1. **Single Process**: No inter-process communication overhead
2. **Shared Connection Pool**: Database connections reused across web and MCP
3. **Hot Reload**: Development changes instantly apply to tools
4. **Unified Logging**: All logs in one place
5. **Simple Deployment**: One Docker container, one Vercel deployment

### Potential Bottlenecks

1. **Blocking Operations**: Long-running tool handlers block Next.js event loop
2. **Memory Sharing**: Heavy tool usage impacts web UI performance
3. **Cold Starts**: Serverless deployments have same cold start for both

**Mitigation**: Consider dedicated server if tools become CPU/memory intensive.

## Deployment Strategies

### Local Development

```bash
docker-compose up    # Starts PostgreSQL
npm run dev          # Starts Next.js + MCP
```

### Production Deployment

**Docker**:

```dockerfile
FROM node:20-alpine
WORKDIR /app
COPY . .
RUN npm ci --only=production
RUN npm run build
CMD ["npm", "start"]
```

**Vercel**: Deploy as standard Next.js app. MCP routes work automatically.

### Environment Variables

Required:

- `DATABASE_URL`: PostgreSQL connection string
- `REDIS_URL`: (Optional) For SSE transport

## Debugging

### MCP-Specific Debugging

1. **Test individual tools**:

   ```typescript
   import { echoTool } from './lib/mcp/tools/echo';
   const result = await echoTool.handler({ message: 'test' });
   console.log(result);
   ```

2. **Validate schemas**:

   ```typescript
   import { readEpicsSchema } from './lib/mcp/tools/read-epics';
   readEpicsSchema.parse({ status: 'active' }); // Throws if invalid
   ```

3. **Check tool registration**:

   ```typescript
   import { allTools } from './lib/mcp/tools';
   console.log(allTools.map(t => t.name));
   ```

### Next.js Debugging

```bash
NODE_OPTIONS='--inspect' npm run dev
```

Attach debugger to `localhost:9229`.

### Database Debugging

```bash
npm run db:studio    # Opens Drizzle Studio on localhost:4983
```

## Best Practices

### Tool Design

1. **Single Responsibility**: One tool, one clear purpose
2. **Descriptive Schemas**: Use `.describe()` on every parameter
3. **Idempotent Operations**: Upsert pattern for safety
4. **Consistent Responses**: Always return `{ content: [{ type: "text", text: string }] }`
5. **Error Messages**: Include context (IDs, what was attempted)

### Schema Design

```typescript
z.object({
  id: z.string().uuid().optional().describe("ID for update, omit for create"),
  title: z.string().min(1).max(200).describe("Title (1-200 chars)"),
  status: z.enum(['draft', 'active']).optional().describe("Status (default: draft)"),
})
```

- Use `.describe()` for AI-readable documentation
- Include validation constraints (min, max, regex)
- Mark optional fields with `.optional()`
- Use enums for fixed values

### Database Operations

```typescript
// ✅ Good: Use Drizzle for type safety
const result = await db.select().from(epics).where(eq(epics.id, id));

// ❌ Bad: Raw SQL loses type safety
const result = await db.execute(sql`SELECT * FROM epics WHERE id = ${id}`);
```

### Response Formatting

```typescript
// ✅ Good: Pretty-print JSON
return {
  content: [{
    type: "text",
    text: JSON.stringify(result, null, 2),
  }],
};

// ❌ Bad: Hard to read
return {
  content: [{
    type: "text",
    text: JSON.stringify(result),
  }],
};
```

## Comparison: Integrated vs Standalone

### Traditional MCP (Standalone Server)

```
┌─────────────┐       ┌──────────────┐
│   Next.js   │       │  MCP Server  │
│   Web App   │       │  (separate)  │
│             │       │              │
│  Port 3000  │       │  stdio/SSE   │
└─────────────┘       └──────────────┘
       │                      │
       └──────────┬───────────┘
                  │
            ┌──────────┐
            │ Database │
            └──────────┘
```

**Characteristics**:

- Two processes
- Separate configurations
- Complex deployment
- Clear separation of concerns

### This Project (Integrated)

```
┌────────────────────────────────┐
│         Next.js App            │
│                                │
│  ┌────────┐    ┌────────────┐ │
│  │Web UI  │    │ MCP Routes │ │
│  │(React) │    │ (API)      │ │
│  └────────┘    └────────────┘ │
│         ↓             ↓        │
│    ┌────────────────────┐     │
│    │   Shared Database  │     │
│    └────────────────────┘     │
└────────────────────────────────┘
          │
     Port 3080
```

**Characteristics**:

- Single process
- Unified configuration
- Simple deployment
- Shared resources

## Future Enhancements

### Potential Additions

1. **Resource Support**: Currently only tools implemented
2. **Prompt Templates**: MCP supports prompt registration
3. **Streaming Responses**: For long-running operations
4. **Authentication**: Token-based tool access
5. **Rate Limiting**: Per-tool or per-client quotas
6. **Metrics**: Tool usage analytics
7. **Standalone Server Option**: Build `dist/mcp-server.js` for non-Next.js environments

### Migration to Standalone

If needed, create `/mcp-server.ts`:

```typescript
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { allTools } from "./lib/mcp/tools/index.js";

const server = new Server({
  name: "spec-this",
  version: "1.0.0",
}, {
  capabilities: {
    tools: {},
  },
});

// Register tools
for (const tool of allTools) {
  server.setRequestHandler(ListToolsRequestSchema, async () => ({
    tools: allTools.map(t => ({
      name: t.name,
      description: t.description,
      inputSchema: zodToJsonSchema(t.schema),
    })),
  }));

  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const tool = allTools.find(t => t.name === request.params.name);
    if (!tool) throw new Error(`Unknown tool: ${request.params.name}`);

    const validated = tool.schema.parse(request.params.arguments);
    return await tool.handler(validated);
  });
}

// Start server
const transport = new StdioServerTransport();
await server.connect(transport);
```

Then add to `package.json`:

```json
{
  "scripts": {
    "build:mcp": "tsc mcp-server.ts --outDir dist",
    "start:mcp": "node dist/mcp-server.js"
  }
}
```

## Summary

This project innovatively integrates MCP into Next.js using the `mcp-handler` package, eliminating the need for a separate server process. The architecture leverages:

- **Next.js API routes** for MCP transport handling
- **Zod schemas** for type-safe parameter validation
- **Drizzle ORM** for database access
- **Auto-registration** via tool registry pattern

The result is a unified application that serves both a web UI and MCP tools from a single deployment, simplifying development, testing, and production operations.
