import { describe, it, expect, vi, beforeEach } from 'vitest';
import { readTasksTool } from '../read-tasks';
import * as dbModule from '../../../db';

// Mock the database
vi.mock('../../../db', () => ({
  db: {
    select: vi.fn(),
  },
  tasks: {
    id: 'id',
    storyId: 'storyId',
    status: 'status',
  },
}));

describe('readTasksTool', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should have correct metadata', () => {
    expect(readTasksTool.name).toBe('read_tasks');
    expect(readTasksTool.description).toBeTruthy();
    expect(readTasksTool.schema).toBeDefined();
  });

  it('should fetch all tasks when no parameters provided', async () => {
    const mockTasks = [
      {
        id: '123e4567-e89b-12d3-a456-426614174000',
        storyId: 'story-123',
        title: 'Task 1',
        status: 'todo',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];

    const mockQuery = {
      from: vi.fn().mockResolvedValue(mockTasks),
    };

    (dbModule.db.select as any).mockReturnValue(mockQuery);

    const result = await readTasksTool.handler({});

    expect(dbModule.db.select).toHaveBeenCalled();
    expect(result.content[0].type).toBe('text');
    expect(result.content[0].text).toContain('Task 1');
  });

  it('should fetch task by ID', async () => {
    const taskId = '123e4567-e89b-12d3-a456-426614174000';
    const mockTask = {
      id: taskId,
      storyId: 'story-123',
      title: 'Specific Task',
      status: 'in_progress',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const mockQuery = {
      from: vi.fn().mockReturnThis(),
      where: vi.fn().mockResolvedValue([mockTask]),
    };

    (dbModule.db.select as any).mockReturnValue(mockQuery);

    const result = await readTasksTool.handler({ id: taskId });

    expect(result.content[0].type).toBe('text');
    expect(result.content[0].text).toContain('Specific Task');
  });

  it('should return error message when task not found', async () => {
    const taskId = '123e4567-e89b-12d3-a456-426614174000';

    const mockQuery = {
      from: vi.fn().mockReturnThis(),
      where: vi.fn().mockResolvedValue([]),
    };

    (dbModule.db.select as any).mockReturnValue(mockQuery);

    const result = await readTasksTool.handler({ id: taskId });

    expect(result.content[0].type).toBe('text');
    expect(result.content[0].text).toContain('No task found');
  });

  it('should filter by storyId', async () => {
    const storyId = 'story-123';
    const mockTasks = [
      {
        id: '123e4567-e89b-12d3-a456-426614174000',
        storyId: storyId,
        title: 'Story Task',
        status: 'todo',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];

    const mockQuery = {
      from: vi.fn().mockReturnThis(),
      where: vi.fn().mockResolvedValue(mockTasks),
    };

    (dbModule.db.select as any).mockReturnValue(mockQuery);

    const result = await readTasksTool.handler({ storyId });

    expect(mockQuery.where).toHaveBeenCalled();
    expect(result.content[0].text).toContain('Story Task');
  });

  it('should filter by status', async () => {
    const mockTasks = [
      {
        id: '123e4567-e89b-12d3-a456-426614174000',
        storyId: 'story-123',
        title: 'Completed Task',
        status: 'completed',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];

    const mockQuery = {
      from: vi.fn().mockReturnThis(),
      where: vi.fn().mockResolvedValue(mockTasks),
    };

    (dbModule.db.select as any).mockReturnValue(mockQuery);

    const result = await readTasksTool.handler({ status: 'completed' });

    expect(mockQuery.where).toHaveBeenCalled();
    expect(result.content[0].text).toContain('Completed Task');
  });

  it('should handle errors gracefully', async () => {
    (dbModule.db.select as any).mockImplementation(() => {
      throw new Error('Database connection failed');
    });

    const result = await readTasksTool.handler({});

    expect(result.content[0].type).toBe('text');
    expect(result.content[0].text).toContain('Error reading tasks');
    expect(result.content[0].text).toContain('Database connection failed');
  });
});
