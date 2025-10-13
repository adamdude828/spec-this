import { describe, it, expect } from 'vitest';
import { epics, stories, plannedFileChanges, epicStatusEnum, storyStatusEnum, fileChangeTypeEnum, fileChangeStatusEnum, priorityEnum } from '../schema';

describe('Database Schema', () => {
  describe('Epics Table', () => {
    it('should have correct table name', () => {
      expect(epics).toBeDefined();
    });

    it('should have all required fields', () => {
      const epicFields = Object.keys(epics);
      expect(epicFields).toContain('id');
      expect(epicFields).toContain('title');
      expect(epicFields).toContain('description');
      expect(epicFields).toContain('status');
      expect(epicFields).toContain('priority');
      expect(epicFields).toContain('createdAt');
      expect(epicFields).toContain('updatedAt');
      expect(epicFields).toContain('createdBy');
    });
  });

  describe('Stories Table', () => {
    it('should have correct table name', () => {
      expect(stories).toBeDefined();
    });

    it('should have all required fields', () => {
      const storyFields = Object.keys(stories);
      expect(storyFields).toContain('id');
      expect(storyFields).toContain('epicId');
      expect(storyFields).toContain('title');
      expect(storyFields).toContain('description');
      expect(storyFields).toContain('acceptanceCriteria');
      expect(storyFields).toContain('status');
      expect(storyFields).toContain('priority');
      expect(storyFields).toContain('orderIndex');
    });
  });

  describe('Planned File Changes Table', () => {
    it('should have correct table name', () => {
      expect(plannedFileChanges).toBeDefined();
    });

    it('should have all required fields', () => {
      const changeFields = Object.keys(plannedFileChanges);
      expect(changeFields).toContain('id');
      expect(changeFields).toContain('storyId');
      expect(changeFields).toContain('filePath');
      expect(changeFields).toContain('changeType');
      expect(changeFields).toContain('description');
      expect(changeFields).toContain('status');
      expect(changeFields).toContain('orderIndex');
      expect(changeFields).toContain('completedAt');
    });
  });

  describe('Enums', () => {
    it('should define epic status enum', () => {
      expect(epicStatusEnum).toBeDefined();
    });

    it('should define story status enum', () => {
      expect(storyStatusEnum).toBeDefined();
    });

    it('should define file change type enum', () => {
      expect(fileChangeTypeEnum).toBeDefined();
    });

    it('should define file change status enum', () => {
      expect(fileChangeStatusEnum).toBeDefined();
    });

    it('should define priority enum', () => {
      expect(priorityEnum).toBeDefined();
    });
  });
});
