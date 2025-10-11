import { describe, it, expect, vi, beforeEach } from 'vitest';
import { upsertStoryTool } from '../upsert-story';
import * as dbModule from '../../../db';

// Mock the database
vi.mock('../../../db', () => ({
  db: {
    insert: vi.fn(),
    update: vi.fn(),
    select: vi.fn(),
  },
  stories: {
    id: 'id',
  },
}));

describe('upsertStoryTool', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should have correct metadata', () => {
    expect(upsertStoryTool.name).toBe('upsert_story');
    expect(upsertStoryTool.description).toBeTruthy();
    expect(upsertStoryTool.schema).toBeDefined();
  });

  it('should create new story when no ID provided', async () => {
    const newStory = {
      epicId: 'epic-123',
      title: 'New Story',
      description: 'Test description',
      acceptanceCriteria: 'Test criteria',
      status: 'draft' as const,
      priority: 'high' as const,
      orderIndex: 1,
    };

    const mockInsert = {
      values: vi.fn().mockReturnThis(),
      returning: vi.fn().mockResolvedValue([{ id: 'story-123', ...newStory }]),
    };

    (dbModule.db.insert as any).mockReturnValue(mockInsert);

    const result = await upsertStoryTool.handler(newStory);

    expect(dbModule.db.insert).toHaveBeenCalled();
    expect(result.content[0].type).toBe('text');
    expect(result.content[0].text).toContain('Story created successfully');
    expect(result.content[0].text).toContain('New Story');
  });

  it('should update existing story when ID provided', async () => {
    const storyId = '123e4567-e89b-12d3-a456-426614174000';
    const updateData = {
      id: storyId,
      epicId: 'epic-123',
      title: 'Updated Story',
      status: 'in_progress' as const,
    };

    const mockUpdate = {
      set: vi.fn().mockReturnThis(),
      where: vi.fn().mockReturnThis(),
      returning: vi.fn().mockResolvedValue([{ ...updateData }]),
    };

    (dbModule.db.update as any).mockReturnValue(mockUpdate);

    const result = await upsertStoryTool.handler(updateData);

    expect(dbModule.db.update).toHaveBeenCalled();
    expect(result.content[0].type).toBe('text');
    expect(result.content[0].text).toContain('Story updated successfully');
    expect(result.content[0].text).toContain('Updated Story');
  });

  it('should return error when updating non-existent story', async () => {
    const storyId = '123e4567-e89b-12d3-a456-426614174000';
    const updateData = {
      id: storyId,
      epicId: 'epic-123',
      title: 'Updated Story',
    };

    const mockUpdate = {
      set: vi.fn().mockReturnThis(),
      where: vi.fn().mockReturnThis(),
      returning: vi.fn().mockResolvedValue([]),
    };

    (dbModule.db.update as any).mockReturnValue(mockUpdate);

    const result = await upsertStoryTool.handler(updateData);

    expect(result.content[0].type).toBe('text');
    expect(result.content[0].text).toContain('No story found with ID');
  });

  it('should handle errors gracefully', async () => {
    (dbModule.db.insert as any).mockImplementation(() => {
      throw new Error('Database error');
    });

    const result = await upsertStoryTool.handler({
      epicId: 'epic-123',
      title: 'Test'
    });

    expect(result.content[0].type).toBe('text');
    expect(result.content[0].text).toContain('Error upserting story');
  });

  it('should create story with minimal required fields', async () => {
    const newStory = {
      epicId: 'epic-123',
      title: 'Minimal Story',
    };

    const mockInsert = {
      values: vi.fn().mockReturnThis(),
      returning: vi.fn().mockResolvedValue([{ id: 'story-123', ...newStory }]),
    };

    (dbModule.db.insert as any).mockReturnValue(mockInsert);

    const result = await upsertStoryTool.handler(newStory);

    expect(dbModule.db.insert).toHaveBeenCalled();
    expect(result.content[0].type).toBe('text');
    expect(result.content[0].text).toContain('Story created successfully');
  });
});
