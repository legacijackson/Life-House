import { describe, it, expect, beforeEach } from 'vitest';
import { storage } from '../storage';

// Mock database connection
const mockDb = {
  select: () => ({ from: () => ({ where: () => Promise.resolve([]) }) }),
  insert: () => ({ values: () => ({ returning: () => Promise.resolve([{ id: '1' }]) }) }),
  update: () => ({ set: () => ({ where: () => ({ returning: () => Promise.resolve([{ id: '1' }]) }) }) }),
  delete: () => ({ where: () => Promise.resolve() })
};

describe('Storage', () => {
  beforeEach(() => {
    // Test with actual storage implementation
  });

  describe('Residents', () => {
    it('should create resident', async () => {
      const residentData = {
        firstName: 'John',
        lastName: 'Doe',
        email: 'john.doe@example.com',
        phone: '555-0123',
        dateOfBirth: '1985-05-15',
        justiceStatus: 'Formerly Incarcerated' as const
      };

      const result = await storage.createResident(residentData);
      expect(result).toBeDefined();
    });

    it('should get residents', async () => {
      const residents = await storage.getResidents();
      expect(Array.isArray(residents)).toBe(true);
    });

    it('should get resident by id', async () => {
      const resident = await storage.getResidentById('1');
      expect(resident).toBeDefined();
    });

    it('should update resident', async () => {
      const updateData = { firstName: 'Jane' };
      const result = await storage.updateResident('1', updateData);
      expect(result).toBeDefined();
    });
  });

  describe('Case Notes', () => {
    it('should create case note', async () => {
      const noteData = {
        residentId: '1',
        authorId: '1',
        title: 'Test Note',
        content: 'Test content',
        category: 'General' as const
      };

      const result = await storage.createCaseNote(noteData);
      expect(result).toBeDefined();
    });

    it('should get case notes', async () => {
      const notes = await storage.getCaseNotes();
      expect(Array.isArray(notes)).toBe(true);
    });

    it('should get case notes by resident', async () => {
      const notes = await storage.getCaseNotesByResident('1');
      expect(Array.isArray(notes)).toBe(true);
    });
  });

  describe('Resources', () => {
    it('should create resource', async () => {
      const resourceData = {
        name: 'Test Resource',
        category: 'Employment' as const,
        description: 'Test description',
        location: 'Test location',
        contactInfo: {
          phone: '555-1234',
          email: 'test@example.com'
        }
      };

      const result = await storage.createResource(resourceData);
      expect(result).toBeDefined();
    });

    it('should get resources', async () => {
      const resources = await storage.getResources();
      expect(Array.isArray(resources)).toBe(true);
    });

    it('should update resource availability', async () => {
      const result = await storage.updateResource('1', { isAvailable: false });
      expect(result).toBeDefined();
    });
  });

  describe('Maintenance Tickets', () => {
    it('should create maintenance ticket', async () => {
      const ticketData = {
        title: 'Test Ticket',
        description: 'Test description',
        priority: 'Medium' as const,
        category: 'General' as const,
        location: 'Room 101',
        reportedById: '1'
      };

      const result = await storage.createMaintenanceTicket(ticketData);
      expect(result).toBeDefined();
    });

    it('should get maintenance tickets', async () => {
      const tickets = await storage.getMaintenanceTickets();
      expect(Array.isArray(tickets)).toBe(true);
    });

    it('should update ticket status', async () => {
      const result = await storage.updateMaintenanceTicket('1', { status: 'In Progress' });
      expect(result).toBeDefined();
    });
  });
});