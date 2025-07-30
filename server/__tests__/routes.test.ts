import { describe, it, expect, vi, beforeEach } from 'vitest';
import express from 'express';
import request from 'supertest';

// Mock storage
const mockStorage = {
  getResidents: vi.fn().mockResolvedValue([]),
  createResident: vi.fn().mockResolvedValue({ id: '1' }),
  getResidentById: vi.fn().mockResolvedValue(null),
  updateResident: vi.fn().mockResolvedValue({ id: '1' }),
  getCaseNotes: vi.fn().mockResolvedValue([]),
  createCaseNote: vi.fn().mockResolvedValue({ id: '1' }),
  getResources: vi.fn().mockResolvedValue([]),
  createResource: vi.fn().mockResolvedValue({ id: '1' }),
  getMaintenanceTickets: vi.fn().mockResolvedValue([]),
  createMaintenanceTicket: vi.fn().mockResolvedValue({ id: '1' })
};

// Mock registerRoutes function with basic routes
const setupTestApp = () => {
  const app = express();
  app.use(express.json());
  
  // Mock current user middleware
  app.use((req, res, next) => {
    req.user = { id: '1', role: 'CaseManager' };
    next();
  });

  // Basic routes for testing
  app.get('/api/residents', async (req, res) => {
    const residents = await mockStorage.getResidents();
    res.json(residents);
  });

  app.post('/api/residents', async (req, res) => {
    const resident = await mockStorage.createResident(req.body);
    res.status(201).json(resident);
  });

  app.get('/api/case-notes', async (req, res) => {
    const notes = await mockStorage.getCaseNotes();
    res.json(notes);
  });

  app.post('/api/case-notes', async (req, res) => {
    const note = await mockStorage.createCaseNote(req.body);
    res.status(201).json(note);
  });

  app.get('/api/resources', async (req, res) => {
    const resources = await mockStorage.getResources();
    res.json(resources);
  });

  app.post('/api/resources', async (req, res) => {
    const resource = await mockStorage.createResource(req.body);
    res.status(201).json(resource);
  });

  return app;
};

describe('API Routes', () => {
  let app: express.Application;

  beforeEach(() => {
    app = setupTestApp();
    vi.clearAllMocks();
  });

  describe('Residents API', () => {
    it('should get residents', async () => {
      const response = await request(app)
        .get('/api/residents')
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(mockStorage.getResidents).toHaveBeenCalled();
    });

    it('should create resident', async () => {
      const residentData = {
        firstName: 'John',
        lastName: 'Doe',
        email: 'john.doe@example.com',
        phone: '555-0123',
        dateOfBirth: '1985-05-15',
        justiceStatus: 'Formerly Incarcerated'
      };

      const response = await request(app)
        .post('/api/residents')
        .send(residentData)
        .expect(201);

      expect(response.body.id).toBe('1');
      expect(mockStorage.createResident).toHaveBeenCalledWith(residentData);
    });

    it('should validate required resident fields', async () => {
      const invalidData = {
        firstName: 'John'
        // Missing required fields
      };

      await request(app)
        .post('/api/residents')
        .send(invalidData)
        .expect(400); // Should return validation error
    });
  });

  describe('Case Notes API', () => {
    it('should get case notes', async () => {
      const response = await request(app)
        .get('/api/case-notes')
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(mockStorage.getCaseNotes).toHaveBeenCalled();
    });

    it('should create case note', async () => {
      const noteData = {
        residentId: '1',
        title: 'Test Note',
        content: 'Test content',
        category: 'General'
      };

      const response = await request(app)
        .post('/api/case-notes')
        .send(noteData)
        .expect(201);

      expect(response.body.id).toBe('1');
      expect(mockStorage.createCaseNote).toHaveBeenCalledWith({
        ...noteData,
        authorId: '1' // Should add author from request user
      });
    });
  });

  describe('Resources API', () => {
    it('should get resources', async () => {
      const response = await request(app)
        .get('/api/resources')
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(mockStorage.getResources).toHaveBeenCalled();
    });

    it('should create resource', async () => {
      const resourceData = {
        name: 'Test Resource',
        category: 'Employment',
        description: 'Test description',
        location: 'Test location',
        contactInfo: {
          phone: '555-1234',
          email: 'test@example.com'
        }
      };

      const response = await request(app)
        .post('/api/resources')
        .send(resourceData)
        .expect(201);

      expect(response.body.id).toBe('1');
      expect(mockStorage.createResource).toHaveBeenCalledWith(resourceData);
    });
  });
});