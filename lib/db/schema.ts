import { pgTable, text, timestamp, integer, uuid, pgEnum } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// Enums
export const epicStatusEnum = pgEnum('epic_status', ['draft', 'active', 'completed', 'archived']);
export const priorityEnum = pgEnum('priority', ['low', 'medium', 'high', 'critical']);
export const storyStatusEnum = pgEnum('story_status', ['draft', 'ready', 'in_progress', 'review', 'completed']);
export const quickTaskStatusEnum = pgEnum('quick_task_status', ['planned', 'in_progress', 'completed', 'cancelled']);
export const fileChangeTypeEnum = pgEnum('file_change_type', ['create', 'modify', 'delete']);
export const fileChangeStatusEnum = pgEnum('file_change_status', ['planned', 'in_progress', 'completed', 'failed']);
export const providerCodeEnum = pgEnum('provider_code', ['github', 'azure_devops', 'gitlab', 'bitbucket']);

// Providers Table
export const providers = pgTable('providers', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  code: providerCodeEnum('code').notNull().unique(),
  baseUrlPattern: text('base_url_pattern').notNull(),
  fileUrlPattern: text('file_url_pattern').notNull(),
  lineUrlPattern: text('line_url_pattern').notNull(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

// Repositories Table
export const repositories = pgTable('repositories', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  localPath: text('local_path').notNull(),
  repoUrl: text('repo_url'),
  providerId: uuid('provider_id').references(() => providers.id),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

// Epics Table
export const epics = pgTable('epics', {
  id: uuid('id').primaryKey().defaultRandom(),
  repoId: uuid('repo_id').notNull().references(() => repositories.id, { onDelete: 'cascade' }),
  title: text('title').notNull(),
  description: text('description'),
  status: epicStatusEnum('status').notNull().default('draft'),
  priority: priorityEnum('priority').notNull().default('medium'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
  createdBy: text('created_by'),
});

// Stories Table
export const stories = pgTable('stories', {
  id: uuid('id').primaryKey().defaultRandom(),
  epicId: uuid('epic_id').notNull().references(() => epics.id, { onDelete: 'cascade' }),
  title: text('title').notNull(),
  description: text('description'),
  acceptanceCriteria: text('acceptance_criteria'),
  status: storyStatusEnum('status').notNull().default('draft'),
  priority: priorityEnum('priority').notNull().default('medium'),
  orderIndex: integer('order_index').notNull().default(0),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

// Quick Tasks Table
// Lightweight tasks that belong directly to a repository
// Designed for AI agents to quickly plan and execute small changes
export const quickTasks = pgTable('quick_tasks', {
  id: uuid('id').primaryKey().defaultRandom(),
  repoId: uuid('repo_id').notNull().references(() => repositories.id, { onDelete: 'cascade' }),
  title: text('title').notNull(),
  description: text('description'),
  status: quickTaskStatusEnum('status').notNull().default('planned'),
  priority: priorityEnum('priority').notNull().default('medium'),
  orderIndex: integer('order_index').notNull().default(0),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
  completedAt: timestamp('completed_at'),
});

// Planned File Changes Table
// Tracks specific file modifications planned as part of a Story or Quick Task
// Links to files in the codebase (can reference Neo4j file graph for dependencies)
// Note: Either storyId OR quickTaskId must be set (mutually exclusive)
export const plannedFileChanges = pgTable('planned_file_changes', {
  id: uuid('id').primaryKey().defaultRandom(),
  storyId: uuid('story_id').references(() => stories.id, { onDelete: 'cascade' }),
  quickTaskId: uuid('quick_task_id').references(() => quickTasks.id, { onDelete: 'cascade' }),

  // File information
  filePath: text('file_path').notNull(), // Relative path from repo root
  changeType: fileChangeTypeEnum('change_type').notNull(),

  // Change description and planning
  description: text('description'), // What changes are being made and why
  expectedChanges: text('expected_changes'), // Code snippets, detailed changes expected

  // Status tracking
  status: fileChangeStatusEnum('status').notNull().default('planned'),

  // Snapshots (optional, if not relying solely on Neo4j)
  beforeSnapshot: text('before_snapshot'), // File content before change
  afterSnapshot: text('after_snapshot'), // Expected/actual content after change

  // Ordering and timestamps
  orderIndex: integer('order_index').notNull().default(0),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
  completedAt: timestamp('completed_at'),
});

// Relations
export const providersRelations = relations(providers, ({ many }) => ({
  repositories: many(repositories),
}));

export const repositoriesRelations = relations(repositories, ({ one, many }) => ({
  provider: one(providers, {
    fields: [repositories.providerId],
    references: [providers.id],
  }),
  epics: many(epics),
  quickTasks: many(quickTasks),
}));

export const epicsRelations = relations(epics, ({ one, many }) => ({
  repository: one(repositories, {
    fields: [epics.repoId],
    references: [repositories.id],
  }),
  stories: many(stories),
}));

export const storiesRelations = relations(stories, ({ one, many }) => ({
  epic: one(epics, {
    fields: [stories.epicId],
    references: [epics.id],
  }),
  plannedFileChanges: many(plannedFileChanges),
}));

export const quickTasksRelations = relations(quickTasks, ({ one, many }) => ({
  repository: one(repositories, {
    fields: [quickTasks.repoId],
    references: [repositories.id],
  }),
  plannedFileChanges: many(plannedFileChanges),
}));

export const plannedFileChangesRelations = relations(plannedFileChanges, ({ one }) => ({
  story: one(stories, {
    fields: [plannedFileChanges.storyId],
    references: [stories.id],
  }),
  quickTask: one(quickTasks, {
    fields: [plannedFileChanges.quickTaskId],
    references: [quickTasks.id],
  }),
}));
