import { describe, it, expect, vi, beforeEach } from 'vitest';
import { upsertTaskTool } from '../upsert-task';
import * as dbModule from '../../../db';

// Mock the database
vi.mock('../../../db', () => ({
  db: {
    insert: vi.fn(),
    update: vi.fn(),
    select: vi.fn(),
  },
  tasks: {
    id: 'id',
  },
}));

describe('upsertTaskTool', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should have correct metadata', () => {
    expect(upsertTaskTool.name).toBe('upsert_task');
    expect(upsertTaskTool.description).toBeTruthy();
    expect(upsertTaskTool.schema).toBeDefined();
  });

  it('should create new task when no ID provided', async () => {
    const newTask = {
      storyId: 'story-123',
      title: 'New Task',
      description: 'Test description',
      status: 'todo' as const,
      orderIndex: 1,
    };

    const mockInsert = {
      values: vi.fn().mockReturnThis(),
      returning: vi.fn().mockResolvedValue([{ id: 'task-123', ...newTask }]),
    };

    (dbModule.db.insert as any).mockReturnValue(mockInsert);

    const result = await upsertTaskTool.handler(newTask);

    expect(dbModule.db.insert).toHaveBeenCalled();
    expect(result.content[0].type).toBe('text');
    expect(result.content[0].text).toContain('Task created successfully');
    expect(result.content[0].text).toContain('New Task');
  });

  it('should update existing task when ID provided', async () => {
    const taskId = '123e4567-e89b-12d3-a456-426614174000';
    const updateData = {
      id: taskId,
      storyId: 'story-123',
      title: 'Updated Task',
      status: 'completed' as const,
    };

    const mockUpdate = {
      set: vi.fn().mockReturnThis(),
      where: vi.fn().mockReturnThis(),
      returning: vi.fn().mockResolvedValue([{ ...updateData }]),
    };

    (dbModule.db.update as any).mockReturnValue(mockUpdate);

    const result = await upsertTaskTool.handler(updateData);

    expect(dbModule.db.update).toHaveBeenCalled();
    expect(result.content[0].type).toBe('text');
    expect(result.content[0].text).toContain('Task updated successfully');
    expect(result.content[0].text).toContain('Updated Task');
  });

  it('should return error when updating non-existent task', async () => {
    const taskId = '123e4567-e89b-12d3-a456-426614174000';
    const updateData = {
      id: taskId,
      storyId: 'story-123',
      title: 'Updated Task',
    };

    const mockUpdate = {
      set: vi.fn().mockReturnThis(),
      where: vi.fn().mockReturnThis(),
      returning: vi.fn().mockResolvedValue([]),
    };

    (dbModule.db.update as any).mockReturnValue(mockUpdate);

    const result = await upsertTaskTool.handler(updateData);

    expect(result.content[0].type).toBe('text');
    expect(result.content[0].text).toContain('No task found with ID');
  });

  it('should handle errors gracefully', async () => {
    (dbModule.db.insert as any).mockImplementation(() => {
      throw new Error('Database error');
    });

    const result = await upsertTaskTool.handler({
      storyId: 'story-123',
      title: 'Test'
    });

    expect(result.content[0].type).toBe('text');
    expect(result.content[0].text).toContain('Error upserting task');
  });

  it('should create task with minimal required fields', async () => {
    const newTask = {
      storyId: 'story-123',
      title: 'Minimal Task',
    };

    const mockInsert = {
      values: vi.fn().mockReturnThis(),
      returning: vi.fn().mockResolvedValue([{ id: 'task-123', ...newTask }]),
    };

    (dbModule.db.insert as any).mockReturnValue(mockInsert);

    const result = await upsertTaskTool.handler(newTask);

    expect(dbModule.db.insert).toHaveBeenCalled();
    expect(result.content[0].type).toBe('text');
    expect(result.content[0].text).toContain('Task created successfully');
  });

  it('should handle completedAt timestamp', async () => {
    const newTask = {
      storyId: 'story-123',
      title: 'Task with completedAt',
      completedAt: '2024-01-01T00:00:00Z',
    };

    const mockInsert = {
      values: vi.fn().mockReturnThis(),
      returning: vi.fn().mockResolvedValue([{ id: 'task-123', ...newTask }]),
    };

    (dbModule.db.insert as any).mockReturnValue(mockInsert);

    const result = await upsertTaskTool.handler(newTask);

    expect(dbModule.db.insert).toHaveBeenCalled();
    expect(result.content[0].type).toBe('text');
    expect(result.content[0].text).toContain('Task created successfully');
  });
});
