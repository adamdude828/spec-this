import { describe, it, expect, vi, beforeEach } from 'vitest';
import { readStoriesTool } from '../read-stories';
import * as dbModule from '../../../db';

// Mock the database
vi.mock('../../../db', () => ({
  db: {
    select: vi.fn(),
  },
  stories: {
    id: 'id',
    epicId: 'epicId',
    status: 'status',
  },
}));

describe('readStoriesTool', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should have correct metadata', () => {
    expect(readStoriesTool.name).toBe('read_stories');
    expect(readStoriesTool.description).toBeTruthy();
    expect(readStoriesTool.schema).toBeDefined();
  });

  it('should fetch all stories when no parameters provided', async () => {
    const mockStories = [
      {
        id: '123e4567-e89b-12d3-a456-426614174000',
        epicId: 'epic-123',
        title: 'Story 1',
        status: 'ready',
        priority: 'high',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];

    const mockQuery = {
      from: vi.fn().mockResolvedValue(mockStories),
    };

    (dbModule.db.select as any).mockReturnValue(mockQuery);

    const result = await readStoriesTool.handler({});

    expect(dbModule.db.select).toHaveBeenCalled();
    expect(result.content[0].type).toBe('text');
    expect(result.content[0].text).toContain('Story 1');
  });

  it('should fetch story by ID', async () => {
    const storyId = '123e4567-e89b-12d3-a456-426614174000';
    const mockStory = {
      id: storyId,
      epicId: 'epic-123',
      title: 'Specific Story',
      status: 'in_progress',
      priority: 'high',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const mockQuery = {
      from: vi.fn().mockReturnThis(),
      where: vi.fn().mockResolvedValue([mockStory]),
    };

    (dbModule.db.select as any).mockReturnValue(mockQuery);

    const result = await readStoriesTool.handler({ id: storyId });

    expect(result.content[0].type).toBe('text');
    expect(result.content[0].text).toContain('Specific Story');
  });

  it('should return error message when story not found', async () => {
    const storyId = '123e4567-e89b-12d3-a456-426614174000';

    const mockQuery = {
      from: vi.fn().mockReturnThis(),
      where: vi.fn().mockResolvedValue([]),
    };

    (dbModule.db.select as any).mockReturnValue(mockQuery);

    const result = await readStoriesTool.handler({ id: storyId });

    expect(result.content[0].type).toBe('text');
    expect(result.content[0].text).toContain('No story found');
  });

  it('should filter by epicId', async () => {
    const epicId = 'epic-123';
    const mockStories = [
      {
        id: '123e4567-e89b-12d3-a456-426614174000',
        epicId: epicId,
        title: 'Epic Story',
        status: 'ready',
        priority: 'high',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];

    const mockQuery = {
      from: vi.fn().mockReturnThis(),
      where: vi.fn().mockResolvedValue(mockStories),
    };

    (dbModule.db.select as any).mockReturnValue(mockQuery);

    const result = await readStoriesTool.handler({ epicId });

    expect(mockQuery.where).toHaveBeenCalled();
    expect(result.content[0].text).toContain('Epic Story');
  });

  it('should filter by status', async () => {
    const mockStories = [
      {
        id: '123e4567-e89b-12d3-a456-426614174000',
        epicId: 'epic-123',
        title: 'Ready Story',
        status: 'ready',
        priority: 'high',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];

    const mockQuery = {
      from: vi.fn().mockReturnThis(),
      where: vi.fn().mockResolvedValue(mockStories),
    };

    (dbModule.db.select as any).mockReturnValue(mockQuery);

    const result = await readStoriesTool.handler({ status: 'ready' });

    expect(mockQuery.where).toHaveBeenCalled();
    expect(result.content[0].text).toContain('Ready Story');
  });

  it('should handle errors gracefully', async () => {
    (dbModule.db.select as any).mockImplementation(() => {
      throw new Error('Database connection failed');
    });

    const result = await readStoriesTool.handler({});

    expect(result.content[0].type).toBe('text');
    expect(result.content[0].text).toContain('Error reading stories');
    expect(result.content[0].text).toContain('Database connection failed');
  });
});
