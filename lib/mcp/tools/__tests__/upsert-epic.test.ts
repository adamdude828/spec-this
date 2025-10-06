import { describe, it, expect, vi, beforeEach } from 'vitest';
import { upsertEpicTool } from '../upsert-epic';
import * as dbModule from '../../../db';

// Mock the database
vi.mock('../../../db', () => ({
  db: {
    insert: vi.fn(),
    update: vi.fn(),
    select: vi.fn(),
  },
  epics: {
    id: 'id',
  },
}));

describe('upsertEpicTool', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should have correct metadata', () => {
    expect(upsertEpicTool.name).toBe('upsert_epic');
    expect(upsertEpicTool.description).toBeTruthy();
    expect(upsertEpicTool.schema).toBeDefined();
  });

  it('should create new epic when no ID provided', async () => {
    const newEpic = {
      title: 'New Epic',
      description: 'Test description',
      status: 'draft' as const,
      priority: 'high' as const,
    };

    const mockInsert = {
      values: vi.fn().mockReturnThis(),
      returning: vi.fn().mockResolvedValue([{ id: '123', ...newEpic }]),
    };

    (dbModule.db.insert as any).mockReturnValue(mockInsert);

    const result = await upsertEpicTool.handler(newEpic);

    expect(dbModule.db.insert).toHaveBeenCalled();
    expect(result.content[0].type).toBe('text');
    expect(result.content[0].text).toContain('New Epic');
  });

  it('should update existing epic when ID provided', async () => {
    const epicId = '123e4567-e89b-12d3-a456-426614174000';
    const updateData = {
      id: epicId,
      title: 'Updated Epic',
      status: 'active' as const,
    };

    const mockUpdate = {
      set: vi.fn().mockReturnThis(),
      where: vi.fn().mockReturnThis(),
      returning: vi.fn().mockResolvedValue([{ ...updateData }]),
    };

    (dbModule.db.update as any).mockReturnValue(mockUpdate);

    const result = await upsertEpicTool.handler(updateData);

    expect(dbModule.db.update).toHaveBeenCalled();
    expect(result.content[0].type).toBe('text');
    expect(result.content[0].text).toContain('Updated Epic');
  });

  it('should handle errors gracefully', async () => {
    (dbModule.db.insert as any).mockImplementation(() => {
      throw new Error('Database error');
    });

    const result = await upsertEpicTool.handler({ title: 'Test' });

    expect(result.content[0].type).toBe('text');
    expect(result.content[0].text).toContain('Error upserting epic');
  });
});
