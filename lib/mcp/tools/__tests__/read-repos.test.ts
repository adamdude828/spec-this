import { describe, it, expect, vi, beforeEach } from 'vitest';
import { readReposTool } from '../read-repos';
import * as dbModule from '../../../db';

// Mock the database
vi.mock('../../../db', () => ({
  db: {
    select: vi.fn(),
  },
  repositories: {
    id: 'id',
    name: 'name',
    localPath: 'localPath',
    repoUrl: 'repoUrl',
    providerId: 'providerId',
    createdAt: 'createdAt',
    updatedAt: 'updatedAt',
  },
  providers: {
    id: 'id',
    name: 'name',
    code: 'code',
    baseUrlPattern: 'baseUrlPattern',
    fileUrlPattern: 'fileUrlPattern',
    lineUrlPattern: 'lineUrlPattern',
  },
}));

describe('readReposTool', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should have correct metadata', () => {
    expect(readReposTool.name).toBe('read_repos');
    expect(readReposTool.description).toBeTruthy();
    expect(readReposTool.schema).toBeDefined();
  });

  it('should fetch all repositories when no parameters provided', async () => {
    const mockRepos = [
      {
        id: '123e4567-e89b-12d3-a456-426614174000',
        name: 'repo1',
        localPath: '/path/to/repo1',
        repoUrl: 'https://github.com/user/repo1',
        providerId: 'provider-1',
        createdAt: new Date(),
        updatedAt: new Date(),
        provider: {
          id: 'provider-1',
          name: 'GitHub',
          code: 'github',
          baseUrlPattern: 'https://github.com',
          fileUrlPattern: '{baseUrl}/{org}/{repo}/blob/{branch}/{path}',
          lineUrlPattern: '#L{line}',
        },
      },
    ];

    const mockQuery = {
      from: vi.fn().mockReturnThis(),
      leftJoin: vi.fn().mockResolvedValue(mockRepos),
    };

    (dbModule.db.select as any).mockReturnValue(mockQuery);

    const result = await readReposTool.handler({});

    expect(dbModule.db.select).toHaveBeenCalled();
    expect(result.content[0].type).toBe('text');
    expect(result.content[0].text).toContain('repo1');
  });

  it('should fetch repository by ID', async () => {
    const repoId = '123e4567-e89b-12d3-a456-426614174000';
    const mockRepo = {
      id: repoId,
      name: 'specific-repo',
      localPath: '/path/to/specific-repo',
      repoUrl: 'https://github.com/user/specific-repo',
      providerId: 'provider-1',
      createdAt: new Date(),
      updatedAt: new Date(),
      provider: {
        id: 'provider-1',
        name: 'GitHub',
        code: 'github',
        baseUrlPattern: 'https://github.com',
        fileUrlPattern: '{baseUrl}/{org}/{repo}/blob/{branch}/{path}',
        lineUrlPattern: '#L{line}',
      },
    };

    const mockQuery = {
      from: vi.fn().mockReturnThis(),
      leftJoin: vi.fn().mockReturnThis(),
      where: vi.fn().mockResolvedValue([mockRepo]),
    };

    (dbModule.db.select as any).mockReturnValue(mockQuery);

    const result = await readReposTool.handler({ id: repoId });

    expect(result.content[0].type).toBe('text');
    expect(result.content[0].text).toContain('specific-repo');
  });

  it('should return error message when repository not found', async () => {
    const repoId = '123e4567-e89b-12d3-a456-426614174000';

    const mockQuery = {
      from: vi.fn().mockReturnThis(),
      leftJoin: vi.fn().mockReturnThis(),
      where: vi.fn().mockResolvedValue([]),
    };

    (dbModule.db.select as any).mockReturnValue(mockQuery);

    const result = await readReposTool.handler({ id: repoId });

    expect(result.content[0].type).toBe('text');
    expect(result.content[0].text).toContain('No repository found');
  });

  it('should handle errors gracefully', async () => {
    (dbModule.db.select as any).mockImplementation(() => {
      throw new Error('Database connection failed');
    });

    const result = await readReposTool.handler({});

    expect(result.content[0].type).toBe('text');
    expect(result.content[0].text).toContain('Error reading repositories');
    expect(result.content[0].text).toContain('Database connection failed');
  });
});
