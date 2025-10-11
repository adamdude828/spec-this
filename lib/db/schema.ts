import { pgTable, text, timestamp, integer, uuid, pgEnum } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// Enums
export const epicStatusEnum = pgEnum('epic_status', ['draft', 'active', 'completed', 'archived']);
export const priorityEnum = pgEnum('priority', ['low', 'medium', 'high', 'critical']);
export const storyStatusEnum = pgEnum('story_status', ['draft', 'ready', 'in_progress', 'review', 'completed']);
export const taskStatusEnum = pgEnum('task_status', ['todo', 'in_progress', 'blocked', 'completed']);
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

// Tasks Table
export const tasks = pgTable('tasks', {
  id: uuid('id').primaryKey().defaultRandom(),
  storyId: uuid('story_id').notNull().references(() => stories.id, { onDelete: 'cascade' }),
  title: text('title').notNull(),
  description: text('description'),
  status: taskStatusEnum('status').notNull().default('todo'),
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
  tasks: many(tasks),
}));

export const tasksRelations = relations(tasks, ({ one }) => ({
  story: one(stories, {
    fields: [tasks.storyId],
    references: [stories.id],
  }),
}));
