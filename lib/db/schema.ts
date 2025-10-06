import { pgTable, text, timestamp, integer, decimal, uuid, pgEnum } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// Enums
export const epicStatusEnum = pgEnum('epic_status', ['draft', 'active', 'completed', 'archived']);
export const priorityEnum = pgEnum('priority', ['low', 'medium', 'high', 'critical']);
export const storyStatusEnum = pgEnum('story_status', ['draft', 'ready', 'in_progress', 'review', 'completed']);
export const taskStatusEnum = pgEnum('task_status', ['todo', 'in_progress', 'blocked', 'completed']);

// Epics Table
export const epics = pgTable('epics', {
  id: uuid('id').primaryKey().defaultRandom(),
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
  storyPoints: integer('story_points'),
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
  estimatedHours: decimal('estimated_hours', { precision: 10, scale: 2 }),
  actualHours: decimal('actual_hours', { precision: 10, scale: 2 }),
  orderIndex: integer('order_index').notNull().default(0),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
  completedAt: timestamp('completed_at'),
});

// Relations
export const epicsRelations = relations(epics, ({ many }) => ({
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
