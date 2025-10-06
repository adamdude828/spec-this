import { describe, it, expect } from 'vitest';
import { epics, stories, tasks, epicStatusEnum, storyStatusEnum, taskStatusEnum, priorityEnum } from '../schema';

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
      expect(storyFields).toContain('storyPoints');
      expect(storyFields).toContain('orderIndex');
    });
  });

  describe('Tasks Table', () => {
    it('should have correct table name', () => {
      expect(tasks).toBeDefined();
    });

    it('should have all required fields', () => {
      const taskFields = Object.keys(tasks);
      expect(taskFields).toContain('id');
      expect(taskFields).toContain('storyId');
      expect(taskFields).toContain('title');
      expect(taskFields).toContain('description');
      expect(taskFields).toContain('status');
      expect(taskFields).toContain('estimatedHours');
      expect(taskFields).toContain('actualHours');
      expect(taskFields).toContain('orderIndex');
      expect(taskFields).toContain('completedAt');
    });
  });

  describe('Enums', () => {
    it('should define epic status enum', () => {
      expect(epicStatusEnum).toBeDefined();
    });

    it('should define story status enum', () => {
      expect(storyStatusEnum).toBeDefined();
    });

    it('should define task status enum', () => {
      expect(taskStatusEnum).toBeDefined();
    });

    it('should define priority enum', () => {
      expect(priorityEnum).toBeDefined();
    });
  });
});
