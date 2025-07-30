import { describe, it, expect } from 'vitest';
import { insertUserSchema, insertCaseNoteSchema, insertResourceSchema } from '../schema';

describe('Schema Validation', () => {
  describe('User Schema', () => {
    it('should validate valid user data', () => {
      const validData = {
        firstName: 'John',
        lastName: 'Doe',
        email: 'john.doe@example.com',
        role: 'Resident'
      };

      const result = insertUserSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should reject invalid email format', () => {
      const invalidData = {
        firstName: 'John',
        lastName: 'Doe',
        email: 'invalid-email',
        role: 'Resident'
      };

      const result = insertUserSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should reject missing required fields', () => {
      const invalidData = {
        firstName: 'John'
        // Missing required fields
      };

      const result = insertUserSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });
  });

  describe('Case Note Schema', () => {
    it('should validate valid case note data', () => {
      const validData = {
        residentId: 'resident-1',
        authorId: 'author-1',
        title: 'Test Note',
        content: 'This is a test case note',
        category: 'General'
      };

      const result = insertCaseNoteSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should reject empty title', () => {
      const invalidData = {
        residentId: 'resident-1',
        authorId: 'author-1',
        title: '',
        content: 'This is a test case note',
        category: 'General'
      };

      const result = insertCaseNoteSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should validate category enum', () => {
      const invalidData = {
        residentId: 'resident-1',
        authorId: 'author-1',
        title: 'Test Note',
        content: 'This is a test case note',
        category: 'Invalid Category'
      };

      const result = insertCaseNoteSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });
  });

  describe('Resource Schema', () => {
    it('should validate valid resource data', () => {
      const validData = {
        name: 'Test Resource',
        category: 'Employment',
        description: 'Test description',
        location: 'Test location',
        contactInfo: {
          phone: '555-1234',
          email: 'test@example.com'
        }
      };

      const result = insertResourceSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should validate contact info structure', () => {
      const invalidData = {
        name: 'Test Resource',
        category: 'Employment',
        description: 'Test description',
        location: 'Test location',
        contactInfo: 'invalid contact info' // Should be object
      };

      const result = insertResourceSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should validate required fields', () => {
      const invalidData = {
        name: 'Test Resource'
        // Missing required fields
      };

      const result = insertResourceSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });
  });
});