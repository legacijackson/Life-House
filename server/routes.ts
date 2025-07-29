import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { z } from "zod";
import { insertUserSchema, insertReferralSchema, insertAttendanceSchema, insertServiceEventSchema, insertCaseNoteSchema, insertTicketSchema } from "@shared/schema";

interface AuthenticatedRequest extends Request {
  user: {
    id: string;
    role: string;
    name: string;
    email: string;
  };
}

// Simple auth middleware (in production, implement proper JWT validation)
const requireAuth = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  // Mock user for development - in production, validate JWT token
  req.user = {
    id: "550e8400-e29b-41d4-a716-446655440000", // Valid UUID format
    role: "CaseManager",
    name: "Sarah Martinez",
    email: "sarah.martinez@example.com"
  };
  next();
};

const requireRole = (roles: string[]) => (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  if (!roles.includes(req.user?.role)) {
    return res.status(403).json({ message: "Insufficient permissions" });
  }
  next();
};

export async function registerRoutes(app: Express): Promise<Server> {
  // Apply auth middleware to all API routes
  app.use('/api', requireAuth);

  // Dashboard stats
  app.get('/api/dashboard/stats', async (req: AuthenticatedRequest, res: Response) => {
    try {
      const stats = await storage.getDashboardStats(req.user.id, req.user.role);
      res.json(stats);
    } catch (error) {
      console.error('Dashboard stats error:', error);
      res.status(500).json({ message: 'Failed to fetch dashboard stats' });
    }
  });

  // Current user
  app.get('/api/auth/user', async (req: AuthenticatedRequest, res) => {
    res.json(req.user);
  });

  // Residents
  app.get('/api/residents', requireRole(['CaseManager', 'Admin', 'Intake']), async (req: any, res) => {
    try {
      // For case managers, return their assigned residents
      // For now, return all residents with role=Resident
      const residents = await storage.getUser(""); // This would be implemented to get by role
      res.json([]); // Placeholder - implement proper resident fetching
    } catch (error) {
      console.error('Get residents error:', error);
      res.status(500).json({ message: 'Failed to fetch residents' });
    }
  });

  app.get('/api/residents/:id', requireRole(['CaseManager', 'Admin', 'Intake']), async (req, res) => {
    try {
      const resident = await storage.getUser(req.params.id);
      if (!resident) {
        return res.status(404).json({ message: 'Resident not found' });
      }

      const profile = await storage.getResidentProfile(resident.id);
      const caseNotes = await storage.getCaseNotes(resident.id);
      const resources = await storage.getResidentResources(resident.id);

      res.json({
        ...resident,
        profile,
        caseNotes,
        resources,
      });
    } catch (error) {
      console.error('Get resident error:', error);
      res.status(500).json({ message: 'Failed to fetch resident' });
    }
  });

  // Referrals
  app.get('/api/referrals', requireRole(['Intake', 'Admin']), async (req, res) => {
    try {
      const { status } = req.query;
      const referrals = await storage.getReferrals({ status: status as string });
      res.json(referrals);
    } catch (error) {
      console.error('Get referrals error:', error);
      res.status(500).json({ message: 'Failed to fetch referrals' });
    }
  });

  app.post('/api/referrals', async (req: AuthenticatedRequest, res) => {
    try {
      const referralData = insertReferralSchema.parse(req.body);
      const referral = await storage.createReferral(referralData);
      
      await storage.logAudit({
        actorId: req.user.id,
        action: 'CREATE_REFERRAL',
        entity: 'referral',
        entityId: referral.id,
        ip: req.ip,
      });

      res.json(referral);
    } catch (error) {
      console.error('Create referral error:', error);
      res.status(500).json({ message: 'Failed to create referral' });
    }
  });

  // Attendance
  app.get('/api/attendance', requireRole(['CaseManager', 'Admin']), async (req: AuthenticatedRequest, res) => {
    try {
      const { residentId, startDate, endDate } = req.query;
      const filters: any = {};
      
      if (residentId) filters.residentId = residentId as string;
      if (startDate && endDate) {
        filters.dateRange = {
          start: new Date(startDate as string),
          end: new Date(endDate as string),
        };
      }

      const attendance = await storage.getAttendance(filters);
      res.json(attendance);
    } catch (error) {
      console.error('Get attendance error:', error);
      res.status(500).json({ message: 'Failed to fetch attendance' });
    }
  });

  app.post('/api/attendance', requireRole(['CaseManager', 'Admin']), async (req: AuthenticatedRequest, res) => {
    try {
      const attendanceData = insertAttendanceSchema.parse({
        ...req.body,
        staffId: req.user.id,
      });
      
      const attendance = await storage.createAttendance(attendanceData);
      
      await storage.logAudit({
        actorId: req.user.id,
        action: 'CREATE_ATTENDANCE',
        entity: 'attendance',
        entityId: attendance.id,
        ip: req.ip,
      });

      res.json(attendance);
    } catch (error) {
      console.error('Create attendance error:', error);
      res.status(500).json({ message: 'Failed to create attendance record' });
    }
  });

  // Service Events
  app.get('/api/services', requireRole(['CaseManager', 'Admin']), async (req: AuthenticatedRequest, res) => {
    try {
      const { residentId, fundingStream } = req.query;
      const services = await storage.getServiceEvents({
        residentId: residentId as string,
        fundingStream: fundingStream as string,
      });
      res.json(services);
    } catch (error) {
      console.error('Get services error:', error);
      res.status(500).json({ message: 'Failed to fetch service events' });
    }
  });

  app.post('/api/services', requireRole(['CaseManager', 'Admin']), async (req: AuthenticatedRequest, res) => {
    try {
      const serviceData = insertServiceEventSchema.parse({
        ...req.body,
        staffId: req.user.id,
      });
      
      const service = await storage.createServiceEvent(serviceData);
      
      await storage.logAudit({
        actorId: req.user.id,
        action: 'CREATE_SERVICE',
        entity: 'service',
        entityId: service.id,
        ip: req.ip,
      });

      res.json(service);
    } catch (error) {
      console.error('Create service error:', error);
      res.status(500).json({ message: 'Failed to create service event' });
    }
  });

  // Case Notes
  app.get('/api/casenotes', requireRole(['CaseManager', 'Admin']), async (req: AuthenticatedRequest, res) => {
    try {
      const { residentId } = req.query;
      if (!residentId) {
        return res.status(400).json({ message: 'residentId is required' });
      }

      const notes = await storage.getCaseNotes(residentId as string);
      res.json(notes);
    } catch (error) {
      console.error('Get case notes error:', error);
      res.status(500).json({ message: 'Failed to fetch case notes' });
    }
  });

  app.post('/api/casenotes', requireRole(['CaseManager', 'Admin']), async (req: AuthenticatedRequest, res) => {
    try {
      const noteData = insertCaseNoteSchema.parse({
        ...req.body,
        createdBy: req.user.id,
      });
      
      const note = await storage.createCaseNote(noteData);
      
      await storage.logAudit({
        actorId: req.user.id,
        action: 'CREATE_CASE_NOTE',
        entity: 'case_note',
        entityId: note.id,
        ip: req.ip,
      });

      res.json(note);
    } catch (error) {
      console.error('Create case note error:', error);
      res.status(500).json({ message: 'Failed to create case note' });
    }
  });

  // Resources
  app.get('/api/resources', async (req: AuthenticatedRequest, res) => {
    try {
      const { category, status } = req.query;
      const resources = await storage.getResources({
        category: category as string,
        status: (status as string) || 'active',
      });
      res.json(resources);
    } catch (error) {
      console.error('Get resources error:', error);
      res.status(500).json({ message: 'Failed to fetch resources' });
    }
  });

  // Properties and Tickets
  app.get('/api/properties', requireRole(['Admin', 'CaseManager', 'Intake']), async (req: AuthenticatedRequest, res) => {
    try {
      const properties = await storage.getProperties();
      res.json(properties);
    } catch (error) {
      console.error('Get properties error:', error);
      res.status(500).json({ message: 'Failed to fetch properties' });
    }
  });

  app.get('/api/tickets', requireRole(['Admin', 'CaseManager']), async (req: AuthenticatedRequest, res) => {
    try {
      const { propertyId, status } = req.query;
      const tickets = await storage.getTickets({
        propertyId: propertyId as string,
        status: status as string,
      });
      res.json(tickets);
    } catch (error) {
      console.error('Get tickets error:', error);
      res.status(500).json({ message: 'Failed to fetch tickets' });
    }
  });

  app.post('/api/tickets', requireRole(['Admin', 'CaseManager', 'Resident']), async (req: AuthenticatedRequest, res) => {
    try {
      const ticketData = insertTicketSchema.parse(req.body);
      const ticket = await storage.createTicket(ticketData);
      
      await storage.logAudit({
        actorId: req.user.id,
        action: 'CREATE_TICKET',
        entity: 'ticket',
        entityId: ticket.id,
        ip: req.ip,
      });

      res.json(ticket);
    } catch (error) {
      console.error('Create ticket error:', error);
      res.status(500).json({ message: 'Failed to create ticket' });
    }
  });

  // AI Assistant endpoints - temporarily disabled until AI service is ready
  app.post('/api/ai/draft-note', requireRole(['CaseManager', 'Admin']), async (req: AuthenticatedRequest, res) => {
    res.status(503).json({ message: 'AI service temporarily unavailable' });
  });

  app.post('/api/ai/recommend-resources', requireRole(['CaseManager', 'Admin']), async (req: AuthenticatedRequest, res) => {
    res.status(503).json({ message: 'AI service temporarily unavailable' });
  });

  app.post('/api/ai/form-helper', requireRole(['CaseManager', 'Admin', 'Intake']), async (req: AuthenticatedRequest, res) => {
    res.status(503).json({ message: 'AI service temporarily unavailable' });
  });

  const httpServer = createServer(app);
  return httpServer;
}
