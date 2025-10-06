import { describe, it, expect, vi, beforeEach } from 'vitest';
import { readEpicsTool } from '../read-epics';
import * as dbModule from '../../../db';

// Mock the database
vi.mock('../../../db', () => ({
  db: {
    select: vi.fn(),
  },
  epics: {
    id: 'id',
    status: 'status',
  },
}));

describe('readEpicsTool', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should have correct metadata', () => {
    expect(readEpicsTool.name).toBe('read_epics');
    expect(readEpicsTool.description).toBeTruthy();
    expect(readEpicsTool.schema).toBeDefined();
  });

  it('should fetch all epics when no parameters provided', async () => {
    const mockEpics = [
      {
        id: '123e4567-e89b-12d3-a456-426614174000',
        title: 'Epic 1',
        status: 'active',
        priority: 'high',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];

    const mockQuery = {
      from: vi.fn().mockReturnThis(),
      where: vi.fn().mockResolvedValue(mockEpics),
    };

    (dbModule.db.select as any).mockReturnValue(mockQuery);
    mockQuery.from.mockResolvedValue(mockEpics);

    const result = await readEpicsTool.handler({});

    expect(dbModule.db.select).toHaveBeenCalled();
    expect(result.content[0].type).toBe('text');
    expect(result.content[0].text).toContain('Epic 1');
  });

  it('should fetch epic by ID', async () => {
    const epicId = '123e4567-e89b-12d3-a456-426614174000';
    const mockEpic = {
      id: epicId,
      title: 'Specific Epic',
      status: 'active',
      priority: 'high',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const mockQuery = {
      from: vi.fn().mockReturnThis(),
      where: vi.fn().mockResolvedValue([mockEpic]),
    };

    (dbModule.db.select as any).mockReturnValue(mockQuery);

    const result = await readEpicsTool.handler({ id: epicId });

    expect(result.content[0].type).toBe('text');
    expect(result.content[0].text).toContain('Specific Epic');
  });

  it('should return error message when epic not found', async () => {
    const epicId = '123e4567-e89b-12d3-a456-426614174000';

    const mockQuery = {
      from: vi.fn().mockReturnThis(),
      where: vi.fn().mockResolvedValue([]),
    };

    (dbModule.db.select as any).mockReturnValue(mockQuery);

    const result = await readEpicsTool.handler({ id: epicId });

    expect(result.content[0].type).toBe('text');
    expect(result.content[0].text).toContain('No epic found');
  });

  it('should filter by status', async () => {
    const mockEpics = [
      {
        id: '123e4567-e89b-12d3-a456-426614174000',
        title: 'Active Epic',
        status: 'active',
        priority: 'high',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];

    const mockQuery = {
      from: vi.fn().mockReturnThis(),
      where: vi.fn().mockResolvedValue(mockEpics),
    };

    (dbModule.db.select as any).mockReturnValue(mockQuery);

    const result = await readEpicsTool.handler({ status: 'active' });

    expect(mockQuery.where).toHaveBeenCalled();
    expect(result.content[0].text).toContain('Active Epic');
  });

  it('should handle errors gracefully', async () => {
    (dbModule.db.select as any).mockImplementation(() => {
      throw new Error('Database connection failed');
    });

    const result = await readEpicsTool.handler({});

    expect(result.content[0].type).toBe('text');
    expect(result.content[0].text).toContain('Error reading epics');
    expect(result.content[0].text).toContain('Database connection failed');
  });
});
