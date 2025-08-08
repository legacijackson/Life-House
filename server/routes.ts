import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import multer from "multer";
import { storage } from "./storage";
import { csvProcessor } from "./csv-processor";
import { z } from "zod";
import { 
  insertUserSchema, 
  insertReferralSchema, 
  insertAttendanceSchema, 
  insertServiceEventSchema, 
  insertCaseNoteSchema, 
  insertTicketSchema, 
  insertApplicationSchema, 
  insertDonationSchema,
  insertInquirySchema,
  insertPartnerSchema,
  users,
  residentProfiles,
  employeeProfiles,
  faqs,
  faqRoles,
  faqPages,
  faqFeedback
} from "@shared/schema";
import { db } from "./db";
import { eq, and, like, desc, sql, inArray } from "drizzle-orm";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import Stripe from "stripe";

interface AuthenticatedRequest extends Request {
  user: {
    id: string;
    role: string;
    name: string;
    email: string;
    isAdmin?: boolean;
  };
}

// Type-safe handler for authenticated routes
type AuthenticatedHandler = (req: AuthenticatedRequest, res: Response, next?: NextFunction) => void | Promise<void> | Promise<Response<any, Record<string, any>> | undefined>;

// Helper to properly type authenticated routes
function authRoute(handler: AuthenticatedHandler) {
  return handler as any;
}

// Helper for role-based routes
function roleRoute(roles: string[], handler: AuthenticatedHandler) {
  return (async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(403).json({ message: "Insufficient permissions" });
    }
    
    // Check if user has required role OR if they have admin access when Admin role is required
    const hasRequiredRole = roles.includes(req.user.role);
    const hasAdminAccess = roles.includes('Admin') && req.user.isAdmin === true;
    
    if (!hasRequiredRole && !hasAdminAccess) {
      return res.status(403).json({ message: "Insufficient permissions" });
    }
    
    try {
      const result = await handler(req, res, next);
      return result;
    } catch (error) {
      console.error('Route handler error:', error);
      return res.status(500).json({ message: "Internal server error" });
    }
  }) as any;
}

// Production-ready auth middleware with JWT validation
const requireAuth = async (req: Request, res: Response, next: NextFunction) => {
  const token = req.headers.authorization?.replace('Bearer ', '');

  if (!token) {
    return res.status(401).json({ message: 'No token provided' });
  }

  // For development, accept mock tokens (only when NODE_ENV !== 'production')
  if (process.env.NODE_ENV !== 'production' && token.startsWith('mock-token-')) {
    const userId = token.replace('mock-token-', '');

    try {
      // Look up the actual user from the database
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(401).json({ message: 'Invalid token - user not found' });
      }

      (req as AuthenticatedRequest).user = {
        id: user.id,
        role: user.role,
        name: user.name || 'Unknown User',
        email: user.email || '',
        isAdmin: user.isAdmin || false
      };
      return next();
    } catch (error) {
      console.error('Auth middleware error:', error);
      return res.status(401).json({ message: 'Authentication failed' });
    }
  }

  // Production JWT validation
  try {
    // In production, validate JWT token
    const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret-key-change-in-production';
    
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    
    // Look up the user from the database using the correct field name
    const userId = decoded.userId || decoded.id;
    const user = await storage.getUser(userId);
    
    if (!user) {
      console.error('User not found in database:', userId);
      return res.status(401).json({ message: 'Invalid token - user not found' });
    }

    (req as AuthenticatedRequest).user = {
      id: user.id,
      role: user.role,
      name: user.name || 'Unknown User',
      email: user.email || '',
      isAdmin: user.isAdmin || false
    };
    return next();
  } catch (error) {
    console.error('JWT validation error:', error);
    return res.status(401).json({ message: 'Invalid or expired token' });
  }
};

// Configure multer for CSV file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'text/csv' || file.originalname.endsWith('.csv')) {
      cb(null, true);
    } else {
      cb(new Error('Only CSV files are allowed'));
    }
  }
});

// Configure multer for document uploads
const documentStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/documents')
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + '-' + file.originalname);
  }
});

const uploadDocument = multer({
  storage: documentStorage,
  limits: {
    fileSize: 25 * 1024 * 1024, // 25MB limit
  },
  fileFilter: (req, file, cb) => {
    // Allowed file types
    const allowedMimes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'image/jpeg',
      'image/png',
      'image/gif',
      'text/plain',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    ];
    
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('File type not allowed'));
    }
  }
});

export async function registerRoutes(app: Express): Promise<Server> {
  // Test endpoint to debug JSON response
  app.get('/api/test-json', (req: Request, res: Response) => {
    res.json({ message: 'JSON response working', timestamp: new Date().toISOString() });
  });

  // Public routes (no auth required)

  // Highlight resources endpoint for program showcase - public access
  app.get('/api/resources/highlight', async (req: Request, res: Response) => {
    try {
      const highlightResources = await storage.getHighlightResources();
      res.json(highlightResources);
    } catch (error) {
      console.error('Error fetching highlight resources:', error);
      res.status(500).json({ message: 'Failed to fetch highlight resources' });
    }
  });

  // Housing application submission
  app.post('/api/public/apply', async (req: Request, res: Response) => {
    try {
      const { generateTicketNumber, generateConfirmationMessage } = await import('../shared/ticket-generator');
      const confirmationNumber = generateTicketNumber('APP');

      // Transform date strings to Date objects for validation
      const transformedData = {
        ...req.body,
        confirmationNumber,
        dateOfBirth: new Date(req.body.dateOfBirth),
        releaseDate: new Date(req.body.releaseDate)
      };
      const validatedData = insertApplicationSchema.parse(transformedData);
      const application = await storage.createApplication(validatedData);

      const confirmationMessage = generateConfirmationMessage(
        confirmationNumber,
        'housing application',
        'What happens next:\n• We\'ll review your application within 24-48 hours\n• Our intake coordinator will contact you for a brief interview\n• If approved, we\'ll schedule your move-in date'
      );

      console.log('New housing application:', application.id, confirmationNumber);

      res.status(201).json({ 
        success: true, 
        message: confirmationMessage,
        applicationId: application.id,
        confirmationNumber
      });
    } catch (error) {
      console.error('Application submission error:', error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: 'Invalid form data', errors: error.errors });
      }
      res.status(500).json({ message: 'Failed to submit application' });
    }
  });

  // Referral submission
  app.post('/api/public/refer', async (req: Request, res: Response) => {
    try {
      const { generateTicketNumber, generateConfirmationMessage } = await import('../shared/ticket-generator');
      const confirmationNumber = generateTicketNumber('REF');

      const validatedData = insertReferralSchema.parse({
        confirmationNumber,
        source: 'CBO',
        referrerOrg: req.body.organization,
        referrerName: req.body.referrerName,
        referrerEmail: req.body.referrerEmail,
        referrerPhone: req.body.referrerPhone,
        basicResidentInfo: {
          name: req.body.clientName,
          email: req.body.clientEmail,
          phone: req.body.clientPhone,
          dateOfBirth: req.body.clientDOB,
          releaseDate: req.body.releaseDate,
          justiceStatus: req.body.justiceStatus,
          urgency: req.body.urgency
        },
        notes: `Current Situation: ${req.body.currentSituation}\n\nWhy Referred: ${req.body.whyReferred}\n\nSpecial Needs: ${req.body.specialNeeds || 'None specified'}`
      });

      const referral = await storage.createReferral(validatedData);

      const confirmationMessage = generateConfirmationMessage(
        confirmationNumber,
        'referral',
        'What happens next:\n• We\'ll contact you and the client within 24 hours\n• Our intake team will schedule a preliminary assessment\n• You\'ll receive updates on the referral status'
      );

      console.log('New referral:', referral.id, confirmationNumber);

      res.status(201).json({ 
        success: true, 
        message: confirmationMessage,
        referralId: referral.id,
        confirmationNumber
      });
    } catch (error) {
      console.error('Referral submission error:', error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: 'Invalid form data', errors: error.errors });
      }
      res.status(500).json({ message: 'Failed to submit referral' });
    }
  });

  // Donation submission
  app.post('/api/public/donate', async (req: Request, res: Response) => {
    try {
      const { generateTicketNumber, generateConfirmationMessage } = await import('../shared/ticket-generator');
      const confirmationNumber = generateTicketNumber('DON');

      const validatedData = insertDonationSchema.parse({
        ...req.body,
        confirmationNumber
      });
      const donation = await storage.createDonation(validatedData);

      const confirmationMessage = generateConfirmationMessage(
        confirmationNumber,
        'donation',
        `Donation amount: $${donation.amount}\n\nWhat happens next:\n• You\'ll receive a tax-deductible receipt via email\n• Your donation will be processed within 1-2 business days\n• Thank you for supporting our community!`
      );

      console.log('New donation:', donation.id, donation.amount, confirmationNumber);

      res.status(201).json({ 
        success: true, 
        message: confirmationMessage,
        donationId: donation.id,
        confirmationNumber
      });
    } catch (error) {
      console.error('Donation submission error:', error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: 'Invalid form data', errors: error.errors });
      }
      res.status(500).json({ message: 'Failed to process donation' });
    }
  });

  // User signup/registration
  app.post('/api/signup', async (req: Request, res: Response) => {
    try {
      const { firstName, lastName, email, password } = req.body;

      // Check if user already exists
      const existingUser = await storage.getUserByEmail(email);
      if (existingUser) {
        return res.status(400).json({ message: 'Email already registered' });
      }

      // Hash password
      const passwordHash = await bcrypt.hash(password, 10);

      // Create user
      const user = await storage.createUser({
        name: `${firstName} ${lastName}`,
        email,
        passwordHash,
        role: 'Resident', // Default role for self-registrations
      });

      // Generate proper JWT token
      const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret-key-change-in-production';
      
      const token = jwt.sign(
        { 
          userId: user.id, 
          role: user.role,
          email: user.email,
          isAdmin: user.isAdmin || false
        },
        JWT_SECRET,
        { expiresIn: '7d' }
      );

      res.status(201).json({
        success: true,
        message: 'Account created successfully',
        token,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          isAdmin: user.isAdmin || false
        },
      });
    } catch (error) {
      console.error('Signup error:', error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: 'Invalid form data', errors: error.errors });
      }
      res.status(500).json({ message: 'Failed to create account' });
    }
  });

  // Auth check endpoint
  app.get('/api/auth/user', requireAuth, authRoute(async (req: AuthenticatedRequest, res: Response) => {
    res.json({
      success: true,
      user: {
        id: req.user.id,
        name: req.user.name,
        email: req.user.email,
        role: req.user.role,
        isAdmin: req.user.isAdmin || false
      }
    });
  }));

  // User login - simplified for development
  app.post('/api/login', async (req: Request, res: Response) => {
    try {
      const { email, password } = req.body;

      // Validate input
      if (!email || !password) {
        return res.status(400).json({ message: 'Email and password are required' });
      }

      // For development - accept any email/password combo and create/find user
      let user = await storage.getUserByEmail(email);
      
      // If user doesn't exist, create a basic admin user for development
      if (!user) {
        const hashedPassword = await bcrypt.hash(password, 10);
        user = await storage.createUser({
          name: email.split('@')[0],
          email: email,
          passwordHash: hashedPassword,
          role: email === 'admin@lifehouse.org' ? 'CaseManager' : 'Resident',
          isAdmin: email === 'admin@lifehouse.org' ? true : false
        });
      }

      // Generate proper JWT token
      const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret-key-change-in-production';
      
      const token = jwt.sign(
        { 
          userId: user.id, 
          role: user.role,
          email: user.email,
          isAdmin: user.isAdmin || false
        },
        JWT_SECRET,
        { expiresIn: '7d' }
      );

      res.json({
        success: true,
        message: 'Login successful',
        token,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          isAdmin: user.isAdmin || false
        },
      });
    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({ message: 'Failed to login' });
    }
  });

  // Create Stripe subscription for monthly donations
  app.post('/api/create-subscription', async (req: Request, res: Response) => {
    try {
      const { firstName, lastName, email, amount, frequency } = req.body;

      if (!process.env.STRIPE_SECRET_KEY) {
        return res.status(500).json({ message: 'Stripe not configured' });
      }

      const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
        apiVersion: '2025-06-30.basil',
      });

      // Create Stripe Checkout session for subscription
      const session = await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        mode: 'subscription',
        customer_email: email,
        line_items: [
          {
            price_data: {
              currency: 'usd',
              product_data: {
                name: 'Life House Reentry Monthly Donation',
                description: 'Supporting housing stability and life transformation',
              },
              unit_amount: Math.round(parseFloat(amount) * 100), // Convert to cents
              recurring: {
                interval: 'month',
              },
            },
            quantity: 1,
          },
        ],
        success_url: `${req.headers.origin || 'http://localhost:5000'}/donate?success=true`,
        cancel_url: `${req.headers.origin || 'http://localhost:5000'}/donate?canceled=true`,
        metadata: {
          donor_name: `${firstName} ${lastName}`,
          frequency: frequency,
        },
      });

      res.json({ url: session.url });
    } catch (error) {
      console.error('Stripe subscription error:', error);
      res.status(500).json({ message: 'Failed to create subscription' });
    }
  });

  // Program inquiry submission
  app.post('/api/inquiry', async (req: Request, res: Response) => {
    try {
      const { generateTicketNumber, generateConfirmationMessage } = await import('../shared/ticket-generator');
      const confirmationNumber = generateTicketNumber('INQ');

      const validatedData = insertInquirySchema.parse({
        ...req.body,
        confirmationNumber
      });
      const inquiry = await storage.createInquiry(validatedData);

      const confirmationMessage = generateConfirmationMessage(
        confirmationNumber,
        'program inquiry',
        'What happens next:\n• We\'ll review your inquiry within 24 hours\n• A program coordinator will contact you directly\n• We\'ll answer all your questions about our programs'
      );

      console.log('New program inquiry:', inquiry.id, confirmationNumber);

      res.status(201).json({
        success: true,
        message: confirmationMessage,
        inquiryId: inquiry.id,
        confirmationNumber
      });
    } catch (error) {
      console.error('Inquiry submission error:', error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: 'Invalid form data', errors: error.errors });
      }
      res.status(500).json({ message: 'Failed to submit inquiry' });
    }
  });

  // Partner signup
  app.post('/api/partners', async (req: Request, res: Response) => {
    try {
      const { generateTicketNumber, generateConfirmationMessage } = await import('../shared/ticket-generator');
      const confirmationNumber = generateTicketNumber('PAR');

      const validatedData = insertPartnerSchema.parse({
        ...req.body,
        confirmationNumber
      });
      const partner = await storage.createPartner(validatedData);

      const confirmationMessage = generateConfirmationMessage(
        confirmationNumber,
        'partnership application',
        'What happens next:\n• We\'ll review your application within 24 hours\n• Our partnership coordinator will contact you\n• We\'ll discuss how we can work together to serve our community'
      );

      console.log('New partner signup:', partner.id, confirmationNumber);

      res.status(201).json({
        success: true,
        message: confirmationMessage,
        partnerId: partner.id,
        confirmationNumber
      });
    } catch (error) {
      console.error('Partner signup error:', error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: 'Invalid form data', errors: error.errors });
      }
      res.status(500).json({ message: 'Failed to submit partner request' });
    }
  });

  // Check-in sessions endpoint (CR-43)
  app.get('/api/check-in/sessions', async (req: Request, res: Response) => {
    try {
      const token = req.headers.authorization?.replace('Bearer ', '');
      if (!token) {
        return res.status(401).json({ message: 'Authentication required' });
      }

      // Mock check-in sessions for development
      const today = new Date();
      const sessions = [
        {
          id: '1',
          name: 'Morning Check-In',
          type: 'daily',
          startTime: '08:00 AM',
          endTime: '09:00 AM',
          location: {
            name: 'Life House Main',
            address: '123 Recovery St, Oakland, CA',
            coordinates: { lat: 37.8044, lng: -122.2711 },
            radius: 91
          },
          status: today.getHours() >= 8 && today.getHours() < 9 ? 'active' : 
                  today.getHours() < 8 ? 'upcoming' : 'completed',
          checkedIn: false
        },
        {
          id: '2',
          name: 'Job Readiness Group',
          type: 'group',
          startTime: '02:00 PM',
          endTime: '03:30 PM',
          location: {
            name: 'Community Room',
            address: '123 Recovery St, Oakland, CA',
            coordinates: { lat: 37.8044, lng: -122.2711 },
            radius: 91
          },
          status: today.getHours() >= 14 && today.getHours() < 15.5 ? 'active' : 
                  today.getHours() < 14 ? 'upcoming' : 'completed',
          checkedIn: false
        }
      ];

      res.json(sessions);
    } catch (error) {
      console.error('Check-in sessions error:', error);
      res.status(500).json({ message: 'Failed to fetch check-in sessions' });
    }
  });

  // Geofence check-in endpoint (CR-43)
  app.post('/api/check-in', async (req: Request, res: Response) => {
    try {
      const { sessionId, location } = req.body;
      const token = req.headers.authorization?.replace('Bearer ', '');

      if (!token) {
        return res.status(401).json({ message: 'Authentication required' });
      }

      // For development, extract user ID from mock token
      const userId = token.replace('mock-token-', '');

      // In production:
      // 1. Validate session exists and is active
      // 2. Calculate distance from session location
      // 3. Validate within geofence radius
      // 4. Record check-in to database
      // 5. Send notifications

      const checkIn = {
        id: `checkin_${Date.now()}`,
        userId,
        sessionId,
        location,
        timestamp: new Date().toISOString(),
      };

      console.log('Session check-in:', checkIn);

      res.status(201).json({
        success: true,
        checkIn,
        message: 'Check-in successful'
      });
    } catch (error) {
      console.error('Check-in error:', error);
      res.status(500).json({ message: 'Check-in failed' });
    }
  });

  // Simple CSV processor test
  app.post('/api/test-csv-processor', requireAuth, roleRoute(['CaseManager', 'Admin'], async (req: AuthenticatedRequest, res: Response) => {
    try {
      console.log('[Test CSV] Processing test data...');

      // Test with a simple CSV string
      const testCSV = `Name,Description,Type,City,State
Sacramento Food Bank,Emergency food assistance,food,Sacramento,CA
Legal Aid Society,Free legal services,legal,Sacramento,CA`;

      const processedCount = await csvProcessor.processAndSaveCSV(testCSV, 'test.csv');

      res.json({
        success: true,
        message: `Test CSV processed successfully. ${processedCount} resources added.`,
        processedCount
      });
    } catch (error) {
      console.error('[Test CSV] Error:', error);
      res.status(500).json({ 
        message: 'Failed to process test CSV',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }));

  // Apply auth middleware to remaining API routes
  app.use('/api', requireAuth);

  // Dashboard stats
  app.get('/api/dashboard/stats', authRoute(async (req: AuthenticatedRequest, res: Response) => {
    try {
      const stats = await storage.getDashboardStats(req.user.id, req.user.role);
      res.json(stats);
    } catch (error) {
      console.error('Dashboard stats error:', error);
      res.status(500).json({ message: 'Failed to fetch dashboard stats' });
    }
  }));

  // Current user
  app.get('/api/auth/user', authRoute(async (req: AuthenticatedRequest, res: Response) => {
    res.json(req.user);
  }));

  // Reports Management Routes
  app.get('/api/reports/templates', roleRoute(['CaseManager', 'Admin'], async (req: AuthenticatedRequest, res: Response) => {
    try {
      const templates = await storage.getReportTemplates();
      res.json(templates);
    } catch (error) {
      console.error('Error fetching report templates:', error);
      res.status(500).json({ message: 'Failed to fetch report templates' });
    }
  }));

  app.get('/api/reports', roleRoute(['CaseManager', 'Admin'], async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { type, status } = req.query;
      const filters: any = {};
      if (type && type !== 'all') filters.type = type as string;
      if (status && status !== 'all') filters.status = status as string;

      const reports = await storage.getReports(filters);
      res.json(reports);
    } catch (error) {
      console.error('Error fetching reports:', error);
      res.status(500).json({ message: 'Failed to fetch reports' });
    }
  }));

  app.post('/api/reports/generate', roleRoute(['CaseManager', 'Admin'], async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { reportType, parameters, name } = req.body;

      if (!reportType) {
        return res.status(400).json({ message: 'Report type is required' });
      }

      // Create report record
      const report = await storage.createReport({
        type: reportType,
        name: name || `${reportType} Report - ${new Date().toLocaleDateString()}`,
        description: `Generated report for ${reportType}`,
        parameters,
        generatedBy: req.user.id
      });

      // Generate report data in background
      try {
        const reportData = await storage.generateReportData(reportType, parameters);

        // Update report with success status
        await storage.updateReport(report.id, {
          status: 'completed',
          filePath: `/reports/${report.id}.pdf`,
          fileSize: 1024 * 100, // Mock file size
          generatedAt: new Date()
        });

        res.json({
          success: true,
          report: {
            ...report,
            status: 'completed',
            filePath: `/reports/${report.id}.pdf`
          },
          data: reportData
        });
      } catch (error) {
        // Update report with error status
        await storage.updateReport(report.id, {
          status: 'error'
        });
        throw error;
      }
    } catch (error) {
      console.error('Report generation error:', error);
      res.status(500).json({ message: 'Failed to generate report' });
    }
  }));

  app.get('/api/reports/:id/download', roleRoute(['CaseManager', 'Admin'], async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { id } = req.params;
      const reports = await storage.getReports({ id });
      const report = reports.find(r => r.id === id);

      if (!report || report.status !== 'completed') {
        return res.status(404).json({ message: 'Report not found or not ready' });
      }

      // In production, this would stream the actual file
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="${report.name}.pdf"`);
      res.send('Mock PDF content for: ' + report.name);
    } catch (error) {
      console.error('Report download error:', error);
      res.status(500).json({ message: 'Failed to download report' });
    }
  }));



  // Staff Dashboard Routes
  app.get('/api/staff/dashboard', roleRoute(['CaseManager', 'Admin'], async (req: AuthenticatedRequest, res: Response) => {
    try {
      const userRole = req.user.role;
      const isAdmin = userRole === 'Admin';
      const caseManagerId = req.user.id;

      // Get total residents for admin or assigned residents for case managers
      const totalResidents = isAdmin ? 45 : 12;
      const activeResidents = isAdmin ? 38 : 10;
      const pendingIntakes = isAdmin ? 7 : 3;
      const maintenanceTickets = isAdmin ? 15 : 5;

      const dashboardData = {
        totalResidents,
        activeResidents,
        pendingIntakes,
        overdueNotes: 3,
        maintenanceTickets,
        completionRate: 85,
        recentActivity: [
          {
            id: '1',
            type: 'case_note',
            description: 'Added case note for Marcus Johnson',
            timestamp: '2 hours ago',
            residentName: 'Marcus Johnson'
          },
          {
            id: '2',
            type: 'intake',
            description: 'New intake application received',
            timestamp: '4 hours ago'
          }
        ],
        overdueNotesList: [
          {
            id: '1',
            residentId: '1',
            residentName: 'Marcus Johnson',
            noteType: '1-on-1 Session',
            dueDate: '2024-01-28',
            daysOverdue: 2
          },
          {
            id: '2',
            residentId: '2',
            residentName: 'Sarah Williams',
            noteType: 'Life Design Session',
            dueDate: '2024-01-27',
            daysOverdue: 3
          },
          {
            id: '3',
            residentId: '3',
            residentName: 'David Rodriguez',
            noteType: 'Professional Development',
            dueDate: '2024-01-26',
            daysOverdue: 4
          }
        ],
        notifications: [
          {
            id: '1',
            type: 'overdue',
            message: 'You have 3 overdue case notes that need attention',
            timestamp: '30 minutes ago',
            read: false
          },
          {
            id: '2',
            type: 'reminder',
            message: 'Monthly report due tomorrow',
            timestamp: '2 hours ago',
            read: false
          },
          {
            id: '3',
            type: 'update',
            message: 'Marcus Johnson advanced to Stage 4',
            timestamp: '5 hours ago',
            read: true
          }
        ],
        messages: await (async () => {
          // Fetch real messages from database
          const inboxMessages = await storage.getMessages(caseManagerId, 'inbox');
          
          // Format messages for dashboard display
          const formattedMessages = await Promise.all(inboxMessages.slice(0, 5).map(async (msg) => {
            const fromUser = await storage.getUser(msg.fromUserId);
            const timeDiff = msg.createdAt ? Date.now() - new Date(msg.createdAt).getTime() : 0;
            const hours = Math.floor(timeDiff / (1000 * 60 * 60));
            const timestamp = hours < 1 ? 'Just now' : hours < 24 ? `${hours} hour${hours > 1 ? 's' : ''} ago` : new Date(msg.createdAt!).toLocaleDateString();
            
            return {
              id: msg.id,
              from: fromUser?.name || 'Unknown User',
              subject: msg.subject,
              preview: msg.body.length > 50 ? msg.body.substring(0, 50) + '...' : msg.body,
              timestamp,
              read: msg.isRead || false
            };
          }));
          
          // If no messages, create a welcome message
          if (formattedMessages.length === 0) {
            // Create a welcome message for new users
            const adminUser = await storage.getUserByEmail('admin@lifehouse.org');
            if (adminUser) {
              await storage.createMessage({
                fromUserId: adminUser.id,
                toUserId: caseManagerId,
                subject: 'Welcome to Life House',
                body: 'Welcome to the Life House management system! Click this message to view the full conversation and reply.',
              });
              
              // Refetch messages
              const newMessages = await storage.getMessages(caseManagerId, 'inbox');
              return newMessages.slice(0, 5).map(msg => ({
                id: msg.id,
                from: 'Admin Team',
                subject: msg.subject,
                preview: msg.body.length > 50 ? msg.body.substring(0, 50) + '...' : msg.body,
                timestamp: 'Just now',
                read: false
              }));
            }
          }
          
          return formattedMessages;
        })(),
        upcomingEvents: [
          {
            id: '1',
            type: '1-on-1',
            title: 'Weekly Check-in',
            residentName: 'Marcus Johnson',
            datetime: 'Today at 2:00 PM'
          },
          {
            id: '2',
            type: 'Group',
            title: 'Financial Literacy Workshop',
            residentName: 'All Residents',
            datetime: 'Tomorrow at 10:00 AM'
          },
          {
            id: '3',
            type: 'Assessment',
            title: 'Stage Review',
            residentName: 'David Rodriguez',
            datetime: 'Friday at 3:00 PM'
          }
        ]
      };
      res.json(dashboardData);
    } catch (error) {
      console.error('Staff dashboard error:', error);
      res.status(500).json({ message: 'Failed to fetch staff dashboard data' });
    }
  }));

  // Get staff users by role
  app.get('/api/staff/users', roleRoute(['CaseManager', 'Admin', 'Intake'], async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { role } = req.query;
      
      // If requesting case managers, return the 3 Life House case managers
      if (role === 'CaseManager') {
        // Check if case managers exist in database, if not create them
        const caseManagers = [];
        
        // Check/create Julius Jackson
        let julius = await storage.getUserByEmail('julius.jackson@lifehouse.org');
        if (!julius) {
          const bcrypt = await import('bcryptjs');
          julius = await storage.createUser({
            name: 'Julius Jackson',
            email: 'julius.jackson@lifehouse.org',
            passwordHash: await bcrypt.hash('LifeHouse2024!', 10),
            role: 'CaseManager'
          });
        }
        caseManagers.push(julius);
        
        // Check/create Kairia Shariff
        let kairia = await storage.getUserByEmail('kairia.shariff@lifehouse.org');
        if (!kairia) {
          const bcrypt = await import('bcryptjs');
          kairia = await storage.createUser({
            name: 'Kairia Shariff',
            email: 'kairia.shariff@lifehouse.org',
            passwordHash: await bcrypt.hash('LifeHouse2024!', 10),
            role: 'CaseManager'
          });
        }
        caseManagers.push(kairia);
        
        // Check/create Brittney Jackson
        let brittney = await storage.getUserByEmail('brittney.jackson@lifehouse.org');
        if (!brittney) {
          const bcrypt = await import('bcryptjs');
          brittney = await storage.createUser({
            name: 'Brittney Jackson',
            email: 'brittney.jackson@lifehouse.org',
            passwordHash: await bcrypt.hash('LifeHouse2024!', 10),
            role: 'CaseManager'
          });
        }
        caseManagers.push(brittney);
        
        return res.json(caseManagers.map(cm => ({
          id: cm.id,
          name: cm.name,
          email: cm.email,
          role: cm.role
        })));
      }
      
      // For other roles, fetch from database
      const users = await storage.getUsers({ role: role as string });
      res.json(users.map(user => ({
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role
      })));
    } catch (error) {
      console.error('Get staff users error:', error);
      res.status(500).json({ message: 'Failed to fetch staff users' });
    }
  }));

  app.get('/api/staff/residents', roleRoute(['CaseManager', 'Admin'], async (req: AuthenticatedRequest, res: Response) => {
    try {
      const residents = [
        {
          id: '1',
          name: 'Marcus Johnson',
          email: 'marcus.j@email.com',
          currentStage: 3,
          lastContact: '2 days ago',
          status: 'Active',
          caseManagerId: req.user.id,
          savings: 850,
          upcomingEvents: 2
        },
        {
          id: '2',
          name: 'David Rodriguez',
          email: 'david.r@email.com',
          currentStage: 5,
          lastContact: '1 week ago',
          status: 'Active',
          caseManagerId: req.user.id,
          savings: 1200,
          upcomingEvents: 1
        }
      ];
      res.json(residents);
    } catch (error) {
      console.error('Get residents error:', error);
      res.status(500).json({ message: 'Failed to fetch residents' });
    }
  }));

  app.get('/api/staff/stop-touchpoints', roleRoute(['CaseManager', 'Admin'], async (req: AuthenticatedRequest, res: Response) => {
    try {
      const touchpoints = [
        {
          id: '1',
          residentId: '1',
          residentName: 'Marcus Johnson',
          dueDate: '2025-08-01T10:00:00Z',
          type: 'check_in',
          priority: 'normal',
          status: 'pending'
        },
        {
          id: '2',
          residentId: '2',
          residentName: 'David Rodriguez',
          dueDate: '2025-07-31T14:00:00Z',
          type: 'assessment',
          priority: 'urgent',
          status: 'pending'
        }
      ];
      res.json(touchpoints);
    } catch (error) {
      console.error('STOP touchpoints error:', error);
      res.status(500).json({ message: 'Failed to fetch STOP touchpoints' });
    }
  }));

  app.post('/api/staff/generate-pdf', roleRoute(['CaseManager', 'Admin'], async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { residentId, type } = req.body;

      // In production, generate actual PDF here
      const fileName = `${type}_${residentId}_${Date.now()}.pdf`;
      const downloadUrl = `/downloads/${fileName}`;

      console.log(`Generated PDF: ${fileName} for resident ${residentId}`);

      res.json({ 
        downloadUrl,
        fileName 
      });
    } catch (error) {
      console.error('PDF generation error:', error);
      res.status(500).json({ message: 'Failed to generate PDF' });
    }
  }));

  app.post('/api/staff/monthly-report', roleRoute(['CaseManager', 'Admin'], async (req: AuthenticatedRequest, res: Response) => {
    try {
      // In production, generate actual monthly report here
      const fileName = `monthly_report_${new Date().toISOString().slice(0, 7)}.pdf`;
      const downloadUrl = `/downloads/${fileName}`;

      console.log(`Generated monthly report: ${fileName}`);

      res.json({ 
        downloadUrl,
        fileName 
      });
    } catch (error) {
      console.error('Monthly report generation error:', error);
      res.status(500).json({ message: 'Failed to generate monthly report' });
    }
  }));

  // Admin Panel Routes
  app.get('/api/admin/config', roleRoute(['Admin'], async (req: AuthenticatedRequest, res: Response) => {
    try {
      const config = {
        slackWebhookUrl: process.env.SLACK_WEBHOOK_URL || '',
        s3BucketName: process.env.S3_BUCKET_NAME || '',
        s3Region: process.env.S3_REGION || 'sfo3',
        s3EndpointUrl: process.env.S3_ENDPOINT_URL || 'https://sfo3.digitaloceanspaces.com',
        kitApiKey: process.env.KIT_API_KEY || '',
        kitApiSecret: process.env.KIT_API_SECRET || '',
        emailNotifications: true,
        nightlyCrawlerEnabled: true,
        stopArmsReminders: true,
        maintenanceMode: false
      };
      res.json(config);
    } catch (error) {
      console.error('Admin config error:', error);
      res.status(500).json({ message: 'Failed to fetch admin configuration' });
    }
  }));

  app.patch('/api/admin/config', roleRoute(['Admin'], async (req: AuthenticatedRequest, res: Response) => {
    try {
      let updates;
      
      // Handle potential double-encoded JSON
      if (typeof req.body === 'string') {
        try {
          updates = JSON.parse(req.body);
        } catch (parseError) {
          console.error('JSON parse error:', parseError);
          return res.status(400).json({ message: 'Invalid JSON format' });
        }
      } else {
        updates = req.body;
      }
      
      // Validate the request body
      if (!updates || typeof updates !== 'object') {
        return res.status(400).json({ message: 'Invalid configuration data' });
      }

      // In production, save config to database
      console.log('Updated admin config:', updates);
      
      // Update environment variables if needed
      if (updates.slackWebhookUrl) {
        process.env.SLACK_WEBHOOK_URL = updates.slackWebhookUrl;
      }
      if (updates.s3BucketName) {
        process.env.S3_BUCKET_NAME = updates.s3BucketName;
      }
      if (updates.s3Region) {
        process.env.S3_REGION = updates.s3Region;
      }

      res.json({ success: true });
    } catch (error) {
      console.error('Admin config update error:', error);
      res.status(500).json({ message: 'Failed to update admin configuration' });
    }
  }));

  app.get('/api/admin/status', roleRoute(['Admin'], async (req: AuthenticatedRequest, res: Response) => {
    try {
      const status = {
        database: 'healthy' as const,
        s3Connection: 'healthy' as const,
        slackIntegration: 'warning' as const,
        lastBackup: '2025-07-30 02:00 AM',
        uptime: '15 days, 8 hours',
        totalResidents: 45,
        totalStaff: 12,
        systemVersion: '2.1.0'
      };
      res.json(status);
    } catch (error) {
      console.error('Admin status error:', error);
      res.status(500).json({ message: 'Failed to fetch system status' });
    }
  }));

  app.post('/api/admin/test-connection/:type', roleRoute(['Admin'], async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { type } = req.params;

      if (type === 's3') {
        // Test S3/DigitalOcean Spaces connection
        const accessKeyId = process.env.AWS_ACCESS_KEY_ID;
        const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY;
        const bucketName = process.env.S3_BUCKET_NAME;
        const region = process.env.S3_REGION;
        const endpointUrl = process.env.S3_ENDPOINT_URL;

        if (!accessKeyId || !secretAccessKey || !bucketName) {
          return res.json({
            success: false,
            message: 'S3 credentials not configured. Please add AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, and S3_BUCKET_NAME to your secrets.'
          });
        }

        try {
          // Import AWS SDK (commented out since not installed)
          // const { S3Client, HeadBucketCommand } = await import('@aws-sdk/client-s3');
          
          // For now, return a mock response for testing
          res.json({
            success: false,
            message: 'S3 testing is not available - AWS SDK not installed. Install @aws-sdk/client-s3 to enable this feature.'
          });
          return;
        } catch (s3Error: any) {
          console.error('S3 connection test failed:', s3Error);
          res.json({
            success: false,
            message: `S3 connection failed: ${s3Error.message || 'Unknown error'}`
          });
        }
      } else if (type === 'slack') {
        // Test Slack webhook
        const webhookUrl = process.env.SLACK_WEBHOOK_URL;
        
        if (!webhookUrl) {
          return res.json({
            success: false,
            message: 'Slack webhook URL not configured. Please add SLACK_WEBHOOK_URL to your secrets.'
          });
        }

        try {
          const response = await fetch(webhookUrl, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              text: 'Life House Admin Panel - Connection test successful! 🎉',
              username: 'Life House Bot',
              icon_emoji: ':house:'
            }),
          });

          if (response.ok) {
            res.json({
              success: true,
              message: 'Slack connection successful. Test message sent to channel.'
            });
          } else {
            res.json({
              success: false,
              message: `Slack connection failed: ${response.status} ${response.statusText}`
            });
          }
        } catch (slackError: any) {
          console.error('Slack connection test failed:', slackError);
          res.json({
            success: false,
            message: `Slack connection failed: ${slackError.message || 'Unknown error'}`
          });
        }
      } else {
        res.json({
          success: false,
          message: `Unknown connection type: ${type}`
        });
      }
    } catch (error) {
      console.error('Connection test error:', error);
      res.status(500).json({ message: 'Failed to test connection' });
    }
  }));

  // Homepage Content Management
  app.get('/api/admin/homepage-content', roleRoute(['Admin'], async (req: AuthenticatedRequest, res: Response) => {
    try {
      const content = await storage.getHomepageContent();
      res.json(content);
    } catch (error) {
      console.error('Homepage content fetch error:', error);
      res.status(500).json({ message: 'Failed to fetch homepage content' });
    }
  }));

  app.put('/api/admin/homepage-content/:section', roleRoute(['Admin'], async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { section } = req.params;
      const contentData = req.body;

      const updatedContent = await storage.updateHomepageContent(section, {
        ...contentData,
        lastUpdatedBy: req.user.id,
        updatedAt: new Date(),
      });

      res.json(updatedContent);
    } catch (error) {
      console.error('Homepage content update error:', error);
      res.status(500).json({ message: 'Failed to update homepage content' });
    }
  }));

  // Resident Portal Routes
  app.get('/api/resident/dashboard', roleRoute(['Resident'], async (req: AuthenticatedRequest, res: Response) => {
    try {
      const dashboardData = {
        currentStage: 3,
        nextMilestone: 'Complete financial literacy course',
        daysInProgram: 85,
        savings: 850,
        savingsGoal: 2000,
        upcomingAppointments: [
          {
            id: '1',
            title: 'Case Manager Check-in',
            date: '2025-08-01',
            time: '10:00 AM'
          }
        ],
        recentActivity: [
          {
            id: '1',
            type: 'milestone',
            description: 'Completed Stage 2 requirements',
            date: '2025-07-28'
          }
        ]
      };
      res.json(dashboardData);
    } catch (error) {
      console.error('Resident dashboard error:', error);
      res.status(500).json({ message: 'Failed to fetch resident dashboard data' });
    }
  }));

  app.get('/api/resident/resources', roleRoute(['Resident'], async (req: AuthenticatedRequest, res: Response) => {
    try {
      const resources = [
        {
          id: '1',
          title: 'Job Training Programs',
          category: 'Employment',
          description: 'Local job training and placement programs',
          location: 'Downtown Training Center',
          contact: '(555) 123-4567',
          website: 'https://example.com/jobs'
        },
        {
          id: '2',
          title: 'Financial Literacy Course',
          category: 'Education',
          description: 'Free 8-week financial management course',
          location: 'Community College',
          contact: '(555) 987-6543',
          website: 'https://example.com/finance'
        }
      ];
      res.json(resources);
    } catch (error) {
      console.error('Resident resources error:', error);
      res.status(500).json({ message: 'Failed to fetch resources' });
    }
  }));

  app.post('/api/resident/maintenance-request', roleRoute(['Resident'], async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { title, description, priority } = req.body;

      // In production, create actual maintenance ticket
      const ticket = {
        id: Date.now().toString(),
        title,
        description,
        priority,
        status: 'submitted',
        submittedAt: new Date().toISOString(),
        submittedBy: req.user.id
      };

      console.log('New maintenance request:', ticket);

      res.status(201).json({
        success: true,
        ticket
      });
    } catch (error) {
      console.error('Maintenance request error:', error);
      res.status(500).json({ message: 'Failed to submit maintenance request' });
    }
  }));



  app.get('/api/staff/residents', roleRoute(['CaseManager', 'Admin'], async (req: AuthenticatedRequest, res: Response) => {
    try {
      const residents = [
        {
          id: '1',
          name: 'Marcus Johnson',
          stage: 3,
          caseManagerId: req.user.id,
          nextAppointment: '2025-08-01'
        },
        {
          id: '2',
          name: 'David Rodriguez',
          stage: 5,
          caseManagerId: req.user.id,
          nextAppointment: '2025-08-03'
        }
      ];
      res.json(residents);
    } catch (error) {
      console.error('Staff residents error:', error);
      res.status(500).json({ message: 'Failed to fetch residents' });
    }
  }));

  app.post('/api/staff/monthly-report', roleRoute(['CaseManager', 'Admin'], async (req: AuthenticatedRequest, res: Response) => {
    try {
      // Generate monthly report data
      const reportData = {
        month: new Date().toLocaleString('default', { month: 'long', year: 'numeric' }),
        totalResidents: 45,
        newIntakes: 12,
        graduations: 5,
        avgStageProgress: 3.2,
        touchPoints: 287,
        savingsTotal: 56250,
        programCompletionRate: 0.78,
        housingRetentionRate: 0.92
      };

      // In production, this would generate an actual PDF
      const fileName = `Life_House_Monthly_Report_${new Date().toISOString().slice(0, 7)}.pdf`;
      const downloadUrl = `/api/reports/download/${Date.now()}`;

      // Simulate PDF generation
      console.log('Generating monthly report:', fileName);

      res.json({
        success: true,
        downloadUrl,
        fileName,
        reportData
      });
    } catch (error) {
      console.error('Monthly report generation error:', error);
      res.status(500).json({ message: 'Failed to generate monthly report' });
    }
  }));

  app.post('/api/staff/generate-pdf', roleRoute(['CaseManager', 'Admin'], async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { residentId, type } = req.body;

      if (!residentId || !type) {
        return res.status(400).json({ message: 'Missing required parameters' });
      }

      // In production, generate actual PDF based on type
      const fileName = `${type}_${residentId}_${Date.now()}.pdf`;
      const downloadUrl = `/api/documents/download/${Date.now()}`;

      console.log('Generating PDF:', { residentId, type, fileName });

      res.json({
        success: true,
        downloadUrl,
        fileName
      });
    } catch (error) {
      console.error('PDF generation error:', error);
      res.status(500).json({ message: 'Failed to generate PDF' });
    }
  }));

  // Generic fallback routes
  app.get('/api/residents', roleRoute(['CaseManager', 'Admin', 'Intake'], async (req: AuthenticatedRequest, res: Response) => {
    try {
      // Return empty array for now - implement proper resident fetching
      res.json([]);
    } catch (error) {
      console.error('Get residents error:', error);
      res.status(500).json({ message: 'Failed to fetch residents' });
    }
  }));

  app.get('/api/residents/:id', roleRoute(['CaseManager', 'Admin', 'Intake', 'Resident'], async (req: AuthenticatedRequest, res: Response) => {
    try {
      const resident = await storage.getUser(req.params.id);
      if (!resident) {
        return res.status(404).json({ message: 'Resident not found' });
      }

      // For residents, only allow viewing their own profile
      if (req.user.role === 'Resident' && req.user.id !== resident.id) {
        return res.status(403).json({ message: 'Unauthorized' });
      }

      const profile = await storage.getResidentProfile(resident.id);
      const caseNotes = await storage.getCaseNotes(resident.id);
      const resources = await storage.getResidentResources(resident.id);
      
      // Get onboarding documents if they exist
      let onboardingDocuments = [];
      if (profile && profile.onboardingDocuments && Array.isArray(profile.onboardingDocuments)) {
        // Retrieve document details for each document ID
        for (const docId of profile.onboardingDocuments) {
          const doc = await storage.getDocument(docId);
          if (doc) {
            onboardingDocuments.push(doc);
          }
        }
      }

      res.json({
        ...resident,
        profile: {
          ...profile,
          onboardingDocuments
        },
        caseNotes,
        resources,
      });
    } catch (error) {
      console.error('Get resident error:', error);
      res.status(500).json({ message: 'Failed to fetch resident' });
    }
  }));

  // Properties Routes
  app.get('/api/properties', roleRoute(['CaseManager', 'Admin', 'Intake'], async (req: AuthenticatedRequest, res: Response) => {
    try {
      const properties = await storage.getProperties();
      res.json(properties);
    } catch (error) {
      console.error('Get properties error:', error);
      res.status(500).json({ message: 'Failed to fetch properties' });
    }
  }));

  app.post('/api/properties', roleRoute(['Admin'], async (req: AuthenticatedRequest, res: Response) => {
    try {
      const propertyData = req.body;

      // Validate required fields
      if (!propertyData.address || !propertyData.city || !propertyData.state || !propertyData.zipCode) {
        return res.status(400).json({ message: 'Missing required property information' });
      }

      // Create property object
      const newProperty = {
        ...propertyData,
        createdBy: req.user.id
      };

      // Save to database
      const created = await storage.createProperty(newProperty);

      res.status(201).json({
        success: true,
        property: created
      });
    } catch (error) {
      console.error('Create property error:', error);
      res.status(500).json({ message: 'Failed to create property' });
    }
  }));

  // Tickets Routes (CR-44: Role-based access control)
  app.get('/api/tickets', roleRoute(['CaseManager', 'Admin', 'Intake', 'Resident'], async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { status, priority } = req.query;
      const filters: any = {};
      if (status && status !== 'all') filters.status = status as string;
      if (priority && priority !== 'all') filters.priority = priority as string;

      let tickets = await storage.getTickets(filters);

      // Apply role-based filtering
      if (req.user.role === 'Resident') {
        // Residents see only their own tickets
        tickets = tickets.filter((ticket: any) => ticket.createdBy === req.user.id);
      } else if (req.user.role === 'CaseManager') {
        // Case managers see tickets for their assigned residents
        // In production, this would filter by assigned residents
      }
      // Admins see all tickets (no filtering needed)

      // Add property address to each ticket (in production, this would be a join)
      const properties = await storage.getProperties();
      const ticketsWithAddress = tickets.map((ticket: any) => {
        const property = properties.find((p: any) => p.id === ticket.propertyId);
        return {
          ...ticket,
          propertyAddress: property ? `${property.address}, ${property.city}` : 'Unknown Property',
          canEdit: req.user.role === 'Admin' || 
                   (req.user.role === 'Resident' && ticket.createdBy === req.user.id),
          canComment: req.user.role === 'Admin' || req.user.role === 'CaseManager'
        };
      });

      res.json(ticketsWithAddress);
    } catch (error) {
      console.error('Get tickets error:', error);
      res.status(500).json({ message: 'Failed to fetch tickets' });
    }
  }));

  app.post('/api/tickets', roleRoute(['CaseManager', 'Admin', 'Resident'], async (req: AuthenticatedRequest, res: Response) => {
    try {
      const ticketData = req.body;

      // Validate required fields
      if (!ticketData.propertyId || !ticketData.title || !ticketData.description) {
        return res.status(400).json({ message: 'Missing required ticket information' });
      }

      const newTicket = {
        ...ticketData,
        status: 'new',
        reportedBy: req.user.name,
        createdBy: req.user.id
      };

      const created = await storage.createTicket(newTicket);

      res.status(201).json({
        success: true,
        ticket: created
      });
    } catch (error) {
      console.error('Create ticket error:', error);
      res.status(500).json({ message: 'Failed to create ticket' });
    }
  }));

  app.patch('/api/tickets/:id', roleRoute(['CaseManager', 'Admin', 'Resident'], async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { id } = req.params;
      const { status, comment } = req.body;

      // Get the ticket to check permissions
      const tickets = await storage.getTickets({});
      const ticket = tickets.find((t: any) => t.id === id);

      if (!ticket) {
        return res.status(404).json({ message: 'Ticket not found' });
      }

      // Check permissions
      if (req.user.role === 'Resident' && ticket.createdBy !== req.user.id) {
        return res.status(403).json({ message: 'You can only update your own tickets' });
      }

      // Residents can only add comments, not change status
      if (req.user.role === 'Resident' && status) {
        return res.status(403).json({ message: 'You cannot change ticket status' });
      }

      // In production, update ticket in database
      const updatedTicket = {
        id,
        ...(status ? { status, updatedAt: new Date().toISOString() } : {}),
        ...(status === 'resolved' ? { resolvedAt: new Date().toISOString() } : {}),
        ...(comment ? { 
          comments: [
            ...((ticket.comments as any[]) || []),
            {
              id: Date.now().toString(),
              text: comment,
              author: req.user.name,
              authorId: req.user.id,
              createdAt: new Date().toISOString()
            }
          ]
        } : {})
      };

      console.log('Updating ticket:', updatedTicket);

      res.json({
        success: true,
        ticket: updatedTicket
      });
    } catch (error) {
      console.error('Update ticket error:', error);
      res.status(500).json({ message: 'Failed to update ticket' });
    }
  }));

  // Create check-in with geofence validation
  app.post('/api/check-in', async (req: Request, res: Response) => {
    try {
      const { userId, propertyId, latitude, longitude } = req.body;

      // Get property location
      const property = await storage.getProperty(propertyId);
      if (!property) {
        return res.status(404).json({ message: 'Property not found' });
      }

      // Calculate distance using Haversine formula
      const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
        const R = 6371e3; // Earth radius in meters
        const φ1 = lat1 * Math.PI/180;
        const φ2 = lat2 * Math.PI/180;
        const Δφ = (lat2-lat1) * Math.PI/180;
        const Δλ = (lon2-lon1) * Math.PI/180;

        const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
                  Math.cos(φ1) * Math.cos(φ2) *
                  Math.sin(Δλ/2) * Math.sin(Δλ/2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

        return R * c; // Distance in meters
      };

      const distance = calculateDistance(
        latitude, 
        longitude, 
        property.latitude as number, 
        property.longitude as number
      );

      // Check if within 91 meters (100 yards)
      if (distance > 91) {
        return res.status(400).json({ 
          message: 'Out of range',
          distance: Math.round(distance),
          maxDistance: 91
        });
      }

      // Create check-in record
      const checkIn = {
        id: Date.now().toString(),
        userId,
        propertyId,
        timestamp: new Date().toISOString(),
        latitude,
        longitude,
        distance: Math.round(distance)
      };

      // TODO: Save check-in to database
      console.log('Check-in successful:', checkIn);

      res.status(201).json({
        success: true,
        checkIn,
        message: 'Check-in successful'
      });
    } catch (error) {
      console.error('Check-in error:', error);
      res.status(500).json({ message: 'Check-in failed' });
    }
  });

  // Create resource
  app.post('/api/resources', roleRoute(['Admin', 'CaseManager'], async (req: AuthenticatedRequest, res: Response) => {
    try {
      const resourceData = req.body;

      // Validate required fields
      if (!resourceData.name || !resourceData.category) {
        return res.status(400).json({ message: 'Name and category are required' });
      }

      // Transform form data to database format
      const resource = {
        category: resourceData.category,
        name: resourceData.name,
        description: resourceData.description || '',
        eligibility: resourceData.eligibility || '',
        geo: {
          zip: resourceData.zip || '',
          city: resourceData.city || '',
          county: resourceData.county || '',
          state: resourceData.state || 'CA'
        },
        url: resourceData.url || resourceData.website || '',
        contact: {
          phone: resourceData.phone || '',
          email: resourceData.email || ''
        },
        address: resourceData.address || '',
        phone: resourceData.phone || '',
        website: resourceData.url || resourceData.website || '',
        hours: resourceData.hours ? (typeof resourceData.hours === 'string' ? { general: resourceData.hours } : resourceData.hours) : {},
        languages: resourceData.languages ? (Array.isArray(resourceData.languages) ? resourceData.languages : [resourceData.languages]) : ['en'],
        status: 'active' as const,
        tags: resourceData.tags ? (typeof resourceData.tags === 'string' ? resourceData.tags.split(',').map((t: string) => t.trim()) : resourceData.tags) : []
      };

      const created = await storage.createResource(resource);

      res.status(201).json({
        success: true,
        resource: created
      });
    } catch (error) {
      console.error('Error creating resource:', error);
      res.status(500).json({ message: 'Failed to create resource' });
    }
  }));

  // Donation checkout with Stripe
  app.post('/api/donate', async (req: Request, res: Response) => {
    try {
      const { amount, email, name, isRecurring } = req.body;

      if (!process.env.STRIPE_SECRET_KEY) {
        return res.status(500).json({ message: 'Stripe is not configured' });
      }

      const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
        apiVersion: '2024-11-20.acacia' as any
      });

      const session = await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        mode: isRecurring ? 'subscription' : 'payment',
        line_items: [{
          price_data: {
            currency: 'usd',
            product_data: {
              name: 'Donation to Life House',
              description: 'Your donation helps support formerly incarcerated individuals'
            },
            unit_amount: amount * 100, // Convert to cents
            ...(isRecurring && { recurring: { interval: 'month' } })
          },
          quantity: 1
        }],
        customer_email: email,
        metadata: {
          donor_name: name,
          donation_type: isRecurring ? 'recurring' : 'one-time'
        },
        success_url: `${req.headers.origin}/donate?success=true`,
        cancel_url: `${req.headers.origin}/donate?canceled=true`
      });

      res.json({ url: session.url });
    } catch (error) {
      console.error('Stripe checkout error:', error);
      res.status(500).json({ message: 'Failed to create checkout session' });
    }
  });

  // Stripe webhook to handle successful payments
  app.post('/api/webhooks/stripe', async (req: Request, res: Response) => {
    try {
      const sig = req.headers['stripe-signature'];
      const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

      if (!sig || !endpointSecret) {
        return res.status(400).json({ message: 'Missing stripe signature or webhook secret' });
      }

      const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
        apiVersion: '2024-11-20.acacia' as any
      });

      let event;

      try {
        event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
      } catch (err: any) {
        console.error('Webhook signature verification failed:', err.message);
        return res.status(400).json({ message: `Webhook Error: ${err.message}` });
      }

      // Handle the event
      switch (event.type) {
        case 'checkout.session.completed':
          const session = event.data.object;

          // Save donation to database
          const donation = {
            email: session.customer_email || 'anonymous@lifehouse.org',
            amount: String(session.amount_total ? session.amount_total / 100 : 0),
            firstName: session.metadata?.donor_name?.split(' ')[0] || 'Anonymous',
            lastName: session.metadata?.donor_name?.split(' ').slice(1).join(' ') || '',
            frequency: session.metadata?.donation_type === 'recurring' ? 'monthly' as const : 'one_time' as const,
            designation: 'general' as const,
            stripePaymentId: session.id
          };

          await storage.createDonation(donation);

          // TODO: Send thank you email
          console.log('Donation successful:', donation);
          break;

        default:
          console.log(`Unhandled event type ${event.type}`);
      }

      res.json({ received: true });
    } catch (error) {
      console.error('Webhook error:', error);
      res.status(500).json({ message: 'Webhook processing failed' });
    }
  });

  // AI Chat endpoint (public access for widget)
  app.post('/api/ai/chat', async (req: Request, res: Response) => {
    try {
      const { message, context } = req.body;

      if (!message) {
        return res.status(400).json({ message: 'Message is required' });
      }

      // Import the AI helper
      const { aiService } = await import('./ai');

      const context_type = context === 'public_assistant' ? 'public_assistant' : 'case_management';
      const aiResponse = await aiService.chatResponse(message, context_type);

      res.json({ response: aiResponse.response });
    } catch (error: any) {
      console.error('AI chat error:', error);
      res.status(500).json({ 
        message: 'Failed to generate response',
        error: error.message 
      });
    }
  });

  // Attendance routes
  app.post('/api/attendance', async (req: Request, res: Response) => {
    try {
      const validatedData = insertAttendanceSchema.parse(req.body);
      const attendance = await storage.createAttendance(validatedData);
      res.status(201).json({
        success: true,
        attendance
      });
    } catch (error) {
      console.error('Error creating attendance:', error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: 'Invalid form data', errors: error.errors });
      }
      res.status(500).json({ message: 'Failed to create attendance record' });
    }
  });

  app.get('/api/attendance', async (req: Request, res: Response) => {
    try {
      const { residentId, startDate, endDate } = req.query;
      const attendance = await storage.getAttendance({ residentId: residentId as string });
      res.json(attendance);
    } catch (error) {
      console.error('Error fetching attendance:', error);
      res.status(500).json({ error: 'Failed to fetch attendance' });
    }
  });

  // Create attendance record
  app.post('/api/attendance', async (req: Request, res: Response) => {
    try {
      const validatedData = insertAttendanceSchema.parse(req.body);
      const attendance = await storage.createAttendance(validatedData);
      res.status(201).json({
        success: true,
        attendance
      });
    } catch (error) {
      console.error('Error creating attendance:', error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: 'Invalid form data', errors: error.errors });
      }
      res.status(500).json({ message: 'Failed to create attendance record' });
    }
  });

  // Events/Calendar routes
  app.post('/api/events', async (req: Request, res: Response) => {
    try {
      const validatedData = insertServiceEventSchema.parse(req.body);
      const event = await storage.createServiceEvent(validatedData);
      res.status(201).json({
        success: true,
        event
      });
    } catch (error) {
      console.error('Error creating event:', error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: 'Invalid form data', errors: error.errors });
      }
      res.status(500).json({ message: 'Failed to create event' });
    }
  });

  app.get('/api/events', async (req: Request, res: Response) => {
    try {
      const { residentId } = req.query;
      const events = await storage.getServiceEvents({ residentId: residentId as string });
      res.json(events);
    } catch (error) {
      console.error('Error fetching events:', error);
      res.status(500).json({ error: 'Failed to fetch events' });
    }
  });

  // Programs route
  app.get('/api/programs', async (req: Request, res: Response) => {
    try {
      // Mock programs data since getPrograms method doesn't exist yet
      const programs = [
        { id: '1', name: 'Housing Stability Program', description: 'Core housing support services' },
        { id: '2', name: 'Job Readiness Program', description: 'Employment preparation and support' },
        { id: '3', name: 'Financial Literacy Program', description: 'Budgeting and financial skills training' }
      ];
      res.json(programs);
    } catch (error) {
      console.error('Error fetching programs:', error);
      res.status(500).json({ error: 'Failed to fetch programs' });
    }
  });

  // Staff route
  app.get('/api/staff', async (req: Request, res: Response) => {
    try {
      // Mock staff data since getStaff method doesn't exist yet
      const staff = [
        { id: '1', name: 'Sarah Martinez', role: 'CaseManager', email: 'sarah.martinez@example.com' },
        { id: '2', name: 'Michael Johnson', role: 'Admin', email: 'michael.johnson@example.com' },
        { id: '3', name: 'Lisa Chen', role: 'Intake', email: 'lisa.chen@example.com' }
      ];
      res.json(staff);
    } catch (error) {
      console.error('Error fetching staff:', error);
      res.status(500).json({ error: 'Failed to fetch staff' });
    }
  });

  // User profile update
  app.patch('/api/users/:id', async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const validatedData = insertUserSchema.partial().parse(req.body);
      const user = await storage.updateUser(id, validatedData);

      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      res.json({
        success: true,
        user
      });
    } catch (error) {
      console.error('Error updating user:', error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: 'Invalid form data', errors: error.errors });
      }
      res.status(500).json({ error: 'Failed to update user' });
    }
  });

  // Avatar upload
  app.post('/api/users/:id/avatar', async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      // Mock avatar upload - in production, use proper file upload
      const avatarUrl = `/api/avatars/${id}.jpg`;

      // TODO: Implement avatar upload to S3 bucket
      console.log('Uploading avatar:', avatarUrl);

      // Remove unsupported avatar field for now
      console.log('Avatar upload not implemented yet:', avatarUrl);

      res.json({ avatar: avatarUrl });
    } catch (error) {
      console.error('Error uploading avatar:', error);
      res.status(500).json({ error: 'Failed to upload avatar' });
    }
  });

  // Document upload
  app.post('/api/documents', requireAuth, uploadDocument.single('file'), authRoute(async (req: AuthenticatedRequest, res: Response) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded' });
      }

      const { ownerType, ownerId, title } = req.body;
      
      if (!ownerType || !ownerId || !title) {
        return res.status(400).json({ error: 'Missing required fields: ownerType, ownerId, title' });
      }

      // Create document record in database
      const document = await storage.createDocument({
        ownerType,
        ownerId,
        title,
        mime: req.file.mimetype,
        size: req.file.size,
        storagePath: req.file.path,
        checksum: null // TODO: Calculate file checksum
      });

      res.status(201).json({
        success: true,
        document
      });
    } catch (error) {
      console.error('Error uploading document:', error);
      res.status(500).json({ error: 'Failed to upload document' });
    }
  }));

  // List documents
  app.get('/api/documents', requireAuth, authRoute(async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { ownerType, ownerId } = req.query;
      
      const filters: any = {};
      if (ownerType) filters.ownerType = ownerType as string;
      if (ownerId) filters.ownerId = ownerId as string;

      const documents = await storage.getDocuments(filters);
      res.json(documents);
    } catch (error) {
      console.error('Error fetching documents:', error);
      res.status(500).json({ error: 'Failed to fetch documents' });
    }
  }));

  // Get document details
  app.get('/api/documents/:id', requireAuth, authRoute(async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { id } = req.params;
      const document = await storage.getDocument(id);
      
      if (!document) {
        return res.status(404).json({ error: 'Document not found' });
      }

      res.json(document);
    } catch (error) {
      console.error('Error fetching document:', error);
      res.status(500).json({ error: 'Failed to fetch document' });
    }
  }));

  // Download document
  app.get('/api/documents/:id/download', requireAuth, authRoute(async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { id } = req.params;
      const document = await storage.getDocument(id);
      
      if (!document) {
        return res.status(404).json({ error: 'Document not found' });
      }

      // Send file
      res.download(document.storagePath, document.title);
    } catch (error) {
      console.error('Error downloading document:', error);
      res.status(500).json({ error: 'Failed to download document' });
    }
  }));

  // Delete document
  app.delete('/api/documents/:id', requireAuth, authRoute(async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { id } = req.params;
      const document = await storage.getDocument(id);
      
      if (!document) {
        return res.status(404).json({ error: 'Document not found' });
      }

      // Delete file from disk
      const fs = await import('fs/promises');
      try {
        await fs.unlink(document.storagePath);
      } catch (error) {
        console.error('Error deleting file from disk:', error);
      }

      // Delete document record
      await storage.deleteDocument(id);

      res.json({ success: true, message: 'Document deleted' });
    } catch (error) {
      console.error('Error deleting document:', error);
      res.status(500).json({ error: 'Failed to delete document' });
    }
  }));

  // Soft delete notes
  app.delete('/api/notes/:id', async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      // Mock delete for now since deleteCaseNote method doesn't exist
      console.log('Delete note:', id);
      res.json({ success: true });
    } catch (error) {
      console.error('Error deleting note:', error);
      res.status(500).json({ error: 'Failed to delete note' });
    }
  });

  // STOP touchpoints
  app.get('/api/staff/stop-touchpoints', async (req: Request, res: Response) => {
    try {
      // Mock touchpoints data since getStopTouchpoints method doesn't exist yet
      const touchpoints = { count: 42, lastUpdated: new Date().toISOString() };
      res.json(touchpoints);
    } catch (error) {
      console.error('Error fetching STOP touchpoints:', error);
      res.status(500).json({ error: 'Failed to fetch touchpoints' });
    }
  });

  // Residents
  app.get('/api/residents', async (req: Request, res: Response) => {
    try {
      // Use correct method name
      const residents = await storage.getUser('all');
      res.json(residents);
    } catch (error) {
      console.error('Get residents error:', error);
      res.status(500).json({ message: 'Failed to fetch residents' });
    }
  });

  // Support/FAQ system routes
  app.get('/api/support', authRoute(async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { page } = req.query;
      const userRole = req.user.role;
      const currentPage = page as string || '';

      // Query FAQs based on user role and current page
      const result = await db
        .select({
          id: faqs.id,
          question: faqs.question,
          answer: faqs.answer,
          weight: faqs.weight
        })
        .from(faqs)
        .innerJoin(faqRoles, eq(faqs.id, faqRoles.faqId))
        .leftJoin(faqPages, eq(faqs.id, faqPages.faqId))
        .where(
          and(
            eq(faqRoles.role, userRole as any),
            currentPage ? like(faqPages.pathPattern, `${currentPage}*`) : sql`true`
          )
        )
        .orderBy(desc(faqs.weight))
        .groupBy(faqs.id, faqs.question, faqs.answer, faqs.weight);

      res.json(result);
    } catch (error) {
      console.error('Support FAQ error:', error);
      res.status(500).json({ message: 'Failed to fetch FAQs' });
    }
  }));

  app.post('/api/support/feedback', authRoute(async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { faqId, helpful } = req.body;
      const userId = req.user.id;

      // Insert feedback into database
      await db.insert(faqFeedback).values({
        faqId,
        userId,
        helpful
      });

      res.json({ success: true });
    } catch (error) {
      console.error('FAQ feedback error:', error);
      res.status(500).json({ message: 'Failed to save feedback' });
    }
  }));

  // Health check endpoint
  app.get('/health', (req: Request, res: Response) => {
    res.status(200).json({ 
      status: 'ok', 
      timestamp: new Date().toISOString(),
      service: 'Life House Reentry Services'
    });
  });

  // Force 500 endpoint for testing health monitoring
  app.get('/api/force500', (req: Request, res: Response) => {
    res.status(500).json({ 
      error: 'Simulated server error for health monitoring test',
      timestamp: new Date().toISOString()
    });
  });

  // Highlight resources endpoint for flagship programs
  app.get('/api/resources/highlight', async (req: Request, res: Response) => {
    try {
      const highlightResources = await storage.getHighlightResources();
      res.json(highlightResources);
    } catch (error) {
      console.error('Error fetching highlight resources:', error);
      res.status(500).json({ message: 'Failed to fetch highlight resources' });
    }
  });

  // Unified resources endpoint (CR-42: Role-based data scoping)
  app.get('/api/resources', async (req: Request, res: Response) => {
    try {
      const token = req.headers.authorization?.replace('Bearer ', '');
      let user: AuthenticatedRequest['user'] | null = null;

      // Check if user is authenticated
      if (token && token.startsWith('mock-token-')) {
        const userId = token.replace('mock-token-', '');
        user = {
          id: userId,
          role: "CaseManager", // In production, get actual role from token
          name: "Sarah Martinez",
          email: "sarah.martinez@example.com"
        };
      }

      const searchQuery = req.query.q as string;
      const categoryFilter = req.query.category as string;

      let filters: any = {};
      if (categoryFilter && categoryFilter !== 'all') {
        filters.category = categoryFilter;
      }

      const allResources = await storage.getResources(filters);

      let filteredResources = allResources.filter(r => r.status === 'active');

      // Apply role-based filtering
      if (!user) {
        // Guest users see limited resources
        filteredResources = filteredResources.slice(0, 100);
      } else {
        // Authenticated users see all resources
        // Additional filtering based on role can be added here
        switch (user.role) {
          case 'Resident':
            // Residents see resources relevant to their stage/needs
            break;
          case 'CaseManager':
          case 'Admin':
            // Staff see all resources
            break;
          case 'Partner':
            // Partners see resources they contribute to
            break;
        }
      }

      if (searchQuery && searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim();
        filteredResources = filteredResources.filter(resource =>
          resource.name.toLowerCase().includes(query) ||
          (resource.description && resource.description.toLowerCase().includes(query)) ||
          resource.category.toLowerCase().includes(query) ||
          (resource.tags && Array.isArray(resource.tags) && 
           resource.tags.some((tag: string) => tag.toLowerCase().includes(query)))
        );
      }

      // Transform resources based on authentication status
      const transformedResources = filteredResources.map(resource => {
        // Parse geo field if it's a JSON object
        let geoData = { zip: '', city: '', county: '', state: 'CA' };
        if (resource.geo) {
          try {
            geoData = typeof resource.geo === 'string' ? JSON.parse(resource.geo) : resource.geo;
          } catch (e) {
            // Keep default if parsing fails
          }
        }

        // Parse contact field if it's a JSON object
        let contactData = { phone: '', email: '' };
        if (resource.contact) {
          try {
            contactData = typeof resource.contact === 'string' ? JSON.parse(resource.contact) : resource.contact;
          } catch (e) {
            // Keep default if parsing fails
          }
        }

        const baseResource = {
          id: resource.id,
          name: resource.name,
          description: resource.description,
          category: resource.category,
          eligibility: resource.eligibility,
          benefitAmount: resource.benefitAmount,
          geo: geoData,
          url: resource.url,
          contact: contactData,
          address: resource.address,
          phone: resource.phone,
          website: resource.website,
          hours: resource.hours,
          languages: resource.languages,
          status: resource.status,
          tags: resource.tags,
          createdAt: resource.createdAt,
          updatedAt: resource.updatedAt
        };

        if (!user) {
          // Public view - remove sensitive data
          return {
            ...baseResource,
            contact: {
              phone: contactData.phone,
              // Hide email for public users
            }
          };
        } else {
          // Authenticated view - include all data
          return baseResource;
        }
      });

      res.json(transformedResources);
    } catch (error) {
      console.error('Error fetching resources:', error);
      res.status(500).json({ message: 'Failed to fetch resources' });
    }
  });

  // Keep the public endpoint for backward compatibility
  app.get('/api/resources/public', async (req: Request, res: Response) => {
    // Redirect to unified endpoint
    return app._router.handle(Object.assign(req, { url: '/api/resources' }), res, () => {});
  });



  // Admin Panel API Routes
  app.get('/api/admin/users', roleRoute(['Admin'], async (req: AuthenticatedRequest, res: Response) => {
    try {
      const users = await storage.getUsers();
      res.json(users);
    } catch (error) {
      console.error('Error fetching users:', error);
      res.status(500).json({ message: 'Failed to fetch users' });
    }
  }));

  // Get all users with their profiles (comprehensive user management)
  app.get('/api/admin/users/full', roleRoute(['Admin'], async (req: AuthenticatedRequest, res: Response) => {
    try {
      const allUsers = await db.select().from(users).orderBy(desc(users.createdAt));
      
      // Get resident profiles if there are residents
      const residentUserIds = allUsers.filter(u => u.role === 'Resident').map(u => u.id);
      const residentProfileData = residentUserIds.length > 0 
        ? await db.select().from(residentProfiles).where(inArray(residentProfiles.userId, residentUserIds))
        : [];
      
      // Get employee profiles if there are staff
      const staffUserIds = allUsers.filter(u => u.role !== 'Resident').map(u => u.id);
      const employeeProfileData = staffUserIds.length > 0
        ? await db.select().from(employeeProfiles).where(inArray(employeeProfiles.userId, staffUserIds))
        : [];

      const usersWithProfiles = allUsers.map(user => {
        let profile = null;
        if (user.role === 'Resident') {
          profile = residentProfileData.find(p => p.userId === user.id);
        } else {
          profile = employeeProfileData.find(p => p.userId === user.id);
        }
        return {
          ...user,
          profile,
          hasOnboarding: !!profile?.onboardingData
        };
      });

      res.json(usersWithProfiles);
    } catch (error) {
      console.error('Error fetching users with profiles:', error);
      res.status(500).json({ message: 'Failed to fetch users with profiles' });
    }
  }));

  // Create new user (admin only)
  app.post('/api/admin/users', roleRoute(['Admin'], async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { name, email, password, role, phone, isAdmin } = req.body;
      
      // Check if user already exists
      const existing = await db.select().from(users).where(eq(users.email, email));
      if (existing.length > 0) {
        return res.status(400).json({ message: 'User with this email already exists' });
      }

      // Hash password
      const passwordHash = await bcrypt.hash(password, 10);

      // Create user
      const [newUser] = await db.insert(users).values({
        name,
        email,
        phone,
        role: role as any,
        isAdmin: isAdmin || false,
        passwordHash,
        createdAt: new Date(),
        updatedAt: new Date()
      }).returning();

      // Create profile based on role
      if (role === 'Resident') {
        await db.insert(residentProfiles).values({
          userId: newUser.id,
          createdAt: new Date(),
          updatedAt: new Date()
        });
      } else {
        // Create employee profile for all non-resident roles
        await db.insert(employeeProfiles).values({
          userId: newUser.id,
          role,
          createdAt: new Date(),
          updatedAt: new Date()
        });
      }

      res.json({ success: true, user: newUser });
    } catch (error) {
      console.error('Error creating user:', error);
      res.status(500).json({ message: 'Failed to create user' });
    }
  }));

  // Update user including role changes (admin only)
  app.put('/api/admin/users/:id', roleRoute(['Admin'], async (req: AuthenticatedRequest, res: Response) => {
    try {
      const userId = req.params.id;
      const updates = req.body;
      
      // Get current user
      const [currentUser] = await db.select().from(users).where(eq(users.id, userId));
      if (!currentUser) {
        return res.status(404).json({ message: 'User not found' });
      }

      // Handle role change
      if (updates.role && updates.role !== currentUser.role) {
        // Delete old profile
        if (currentUser.role === 'Resident') {
          await db.delete(residentProfiles).where(eq(residentProfiles.userId, userId));
        } else {
          await db.delete(employeeProfiles).where(eq(employeeProfiles.userId, userId));
        }

        // Create new profile
        if (updates.role === 'Resident') {
          await db.insert(residentProfiles).values({
            userId: userId,
            createdAt: new Date(),
            updatedAt: new Date()
          });
        } else {
          await db.insert(employeeProfiles).values({
            userId: userId,
            role: updates.role,
            createdAt: new Date(),
            updatedAt: new Date()
          });
        }
      }

      // Handle password update if provided
      if (updates.password) {
        updates.passwordHash = await bcrypt.hash(updates.password, 10);
        delete updates.password;
      }

      // Update user
      const [updatedUser] = await db.update(users)
        .set({
          ...updates,
          updatedAt: new Date()
        })
        .where(eq(users.id, userId))
        .returning();

      res.json({ success: true, user: updatedUser });
    } catch (error) {
      console.error('Error updating user:', error);
      res.status(500).json({ message: 'Failed to update user' });
    }
  }));

  // Delete user (admin only)
  app.delete('/api/admin/users/:id', roleRoute(['Admin'], async (req: AuthenticatedRequest, res: Response) => {
    try {
      const userId = req.params.id;
      
      // Don't allow deleting yourself
      if (userId === req.user.id) {
        return res.status(400).json({ message: 'Cannot delete your own account' });
      }

      // Get user to check role
      const [userToDelete] = await db.select().from(users).where(eq(users.id, userId));
      if (!userToDelete) {
        return res.status(404).json({ message: 'User not found' });
      }

      // Delete profile first
      if (userToDelete.role === 'Resident') {
        await db.delete(residentProfiles).where(eq(residentProfiles.userId, userId));
      } else if (userToDelete.role === 'CaseManager' || userToDelete.role === 'Admin') {
        await db.delete(employeeProfiles).where(eq(employeeProfiles.userId, userId));
      }

      // Delete user
      await db.delete(users).where(eq(users.id, userId));

      res.json({ success: true, message: 'User deleted successfully' });
    } catch (error) {
      console.error('Error deleting user:', error);
      res.status(500).json({ message: 'Failed to delete user' });
    }
  }));

  // Get user's onboarding profile (admin only)
  app.get('/api/admin/users/:id/profile', roleRoute(['Admin'], async (req: AuthenticatedRequest, res: Response) => {
    try {
      const userId = req.params.id;
      
      // Get user
      const [user] = await db.select().from(users).where(eq(users.id, userId));
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }

      // Get profile based on role
      let profile = null;
      if (user.role === 'Resident') {
        [profile] = await db.select().from(residentProfiles).where(eq(residentProfiles.userId, userId));
      } else if (user.role === 'CaseManager' || user.role === 'Admin') {
        [profile] = await db.select().from(employeeProfiles).where(eq(employeeProfiles.userId, userId));
      }

      res.json({ user, profile });
    } catch (error) {
      console.error('Error fetching user profile:', error);
      res.status(500).json({ message: 'Failed to fetch user profile' });
    }
  }));

  // Update user's onboarding profile (admin only)
  app.put('/api/admin/users/:id/profile', roleRoute(['Admin'], async (req: AuthenticatedRequest, res: Response) => {
    try {
      const userId = req.params.id;
      const profileData = req.body;
      
      // Get user
      const [user] = await db.select().from(users).where(eq(users.id, userId));
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }

      // Update profile based on role
      let updatedProfile = null;
      if (user.role === 'Resident') {
        [updatedProfile] = await db.update(residentProfiles)
          .set({
            ...profileData,
            updatedAt: new Date()
          })
          .where(eq(residentProfiles.userId, userId))
          .returning();
      } else if (user.role === 'CaseManager' || user.role === 'Admin') {
        [updatedProfile] = await db.update(employeeProfiles)
          .set({
            ...profileData,
            updatedAt: new Date()
          })
          .where(eq(employeeProfiles.userId, userId))
          .returning();
      }

      res.json({ success: true, profile: updatedProfile });
    } catch (error) {
      console.error('Error updating user profile:', error);
      res.status(500).json({ message: 'Failed to update user profile' });
    }
  }));

  app.get('/api/admin/properties', roleRoute(['Admin'], async (req: AuthenticatedRequest, res: Response) => {
    try {
      const properties = await storage.getProperties();
      res.json(properties);
    } catch (error) {
      console.error('Error fetching properties:', error);
      res.status(500).json({ message: 'Failed to fetch properties' });
    }
  }));

  // Homepage Photos Management
  app.get('/api/admin/homepage-photos', roleRoute(['Admin'], async (req: AuthenticatedRequest, res: Response) => {
    try {
      // Mock homepage photos data for now
      const photos = [
        {
          id: '1',
          url: '/assets/3.png',
          alt: 'Life House Community',
          caption: 'Building stronger communities',
          section: 'hero',
          order: 1,
          isActive: true,
          uploadedAt: new Date().toISOString()
        },
        {
          id: '2', 
          url: '/assets/5.png',
          alt: 'Success Stories',
          caption: 'Celebrating resident achievements',
          section: 'testimonials',
          order: 1,
          isActive: true,
          uploadedAt: new Date().toISOString()
        }
      ];
      res.json(photos);
    } catch (error) {
      console.error('Error fetching homepage photos:', error);
      res.status(500).json({ message: 'Failed to fetch homepage photos' });
    }
  }));

  app.post('/api/admin/homepage-photos', roleRoute(['Admin'], async (req: AuthenticatedRequest, res: Response) => {
    try {
      // In production, handle file upload to S3/cloud storage
      const newPhoto = {
        id: Date.now().toString(),
        url: '/assets/uploaded-photo.jpg',
        alt: req.body.alt || 'Uploaded photo',
        section: req.body.section || 'gallery',
        order: 1,
        isActive: true,
        uploadedAt: new Date().toISOString()
      };

      // TODO: Save to database
      res.json(newPhoto);
    } catch (error) {
      console.error('Error uploading photo:', error);
      res.status(500).json({ message: 'Failed to upload photo' });
    }
  }));

  app.patch('/api/admin/homepage-photos/:id', roleRoute(['Admin'], async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { id } = req.params;
      const updates = req.body;

      // TODO: Update photo in database
      res.json({ id, ...updates });
    } catch (error) {
      console.error('Error updating photo:', error);
      res.status(500).json({ message: 'Failed to update photo' });
    }
  }));

  app.delete('/api/admin/homepage-photos/:id', roleRoute(['Admin'], async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { id } = req.params;

      // TODO: Delete photo from database and storage
      res.json({ success: true });
    } catch (error) {
      console.error('Error deleting photo:', error);
      res.status(500).json({ message: 'Failed to delete photo' });
    }
  }));

  // System Settings Management
  app.get('/api/admin/settings', roleRoute(['Admin'], async (req: AuthenticatedRequest, res: Response) => {
    try {
      const settings = [
        {
          id: '1',
          key: 'SLACK_WEBHOOK_URL',
          value: process.env.SLACK_WEBHOOK_URL || '',
          description: 'Slack webhook for notifications',
          category: 'integrations',
          updatedAt: new Date().toISOString()
        },
        {
          id: '2',
          key: 'S3_BUCKET_NAME',
          value: process.env.S3_BUCKET_NAME || '',
          description: 'AWS S3 bucket for file storage',
          category: 'integrations',
          updatedAt: new Date().toISOString()
        },
        {
          id: '3',
          key: 'MAX_RESIDENTS_PER_PROPERTY',
          value: '50',
          description: 'Maximum residents allowed per property',
          category: 'general',
          updatedAt: new Date().toISOString()
        }
      ];
      res.json(settings);
    } catch (error) {
      console.error('Error fetching settings:', error);
      res.status(500).json({ message: 'Failed to fetch settings' });
    }
  }));

  app.patch('/api/admin/settings/:id', roleRoute(['Admin'], async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { id } = req.params;
      const { value } = req.body;

      // TODO: Update setting in database
      res.json({ id, value, updatedAt: new Date().toISOString() });
    } catch (error) {
      console.error('Error updating setting:', error);
      res.status(500).json({ message: 'Failed to update setting' });
    }
  }));

  // Audit Logs
  app.get('/api/admin/audit-logs', roleRoute(['Admin'], async (req: AuthenticatedRequest, res: Response) => {
    try {
      const logs = [
        {
          id: '1',
          action: 'create_user',
          entity: 'User',
          entityId: 'user-123',
          actorName: 'Admin User',
          timestamp: new Date().toISOString(),
          ip: req.ip
        },
        {
          id: '2',
          action: 'update_application',
          entity: 'Application',
          entityId: 'app-456',
          actorName: 'Case Manager',
          timestamp: new Date(Date.now() - 3600000).toISOString(),
          ip: req.ip
        }
      ];
      res.json(logs);
    } catch (error) {
      console.error('Error fetching audit logs:', error);
      res.status(500).json({ message: 'Failed to fetch audit logs' });
    }
  }));

  // Applications Management
  app.get('/api/admin/applications', roleRoute(['Admin', 'CaseManager'], async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { status } = req.query;
      const applications = await storage.getApplications(
        status && status !== 'all' ? { status: status as string } : {}
      );
      res.json(applications);
    } catch (error) {
      console.error('Error fetching applications:', error);
      res.status(500).json({ message: 'Failed to fetch applications' });
    }
  }));

  app.patch('/api/admin/applications/:id', roleRoute(['Admin'], async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { id } = req.params;
      const updates = req.body;

      const updatedApplication = await storage.updateApplication(id, updates);
      res.json(updatedApplication);
    } catch (error) {
      console.error('Error updating application:', error);
      res.status(500).json({ message: 'Failed to update application' });
    }
  }));

  // Referrals Management
  app.get('/api/admin/referrals', roleRoute(['Admin', 'CaseManager'], async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { status } = req.query;
      const referrals = await storage.getReferrals(
        status && status !== 'all' ? { status: status as string } : {}
      );
      res.json(referrals);
    } catch (error) {
      console.error('Error fetching referrals:', error);
      res.status(500).json({ message: 'Failed to fetch referrals' });
    }
  }));

  app.patch('/api/admin/referrals/:id', roleRoute(['Admin', 'CaseManager'], async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { id } = req.params;
      const updates = req.body;

      const updatedReferral = await storage.updateReferral(id, updates);
      res.json(updatedReferral);
    } catch (error) {
      console.error('Error updating referral:', error);
      res.status(500).json({ message: 'Failed to update referral' });
    }
  }));

  // Complete resident onboarding
  app.post('/api/admin/onboard-resident', 
    requireAuth,
    uploadDocument.fields([
      { name: 'id', maxCount: 1 },
      { name: 'dd214', maxCount: 1 },
      { name: 'benefitsLetters', maxCount: 1 },
      { name: 'medicalRecords', maxCount: 1 },
      { name: 'courtDocuments', maxCount: 1 },
      { name: 'other_0', maxCount: 1 },
      { name: 'other_1', maxCount: 1 },
      { name: 'other_2', maxCount: 1 },
      { name: 'other_3', maxCount: 1 },
      { name: 'other_4', maxCount: 1 }
    ]),
    roleRoute(['Admin', 'CaseManager'], async (req: AuthenticatedRequest, res: Response) => {
      try {
      const formData = JSON.parse(req.body.data);
      const files = req.files as { [fieldname: string]: Express.Multer.File[] };
      
      console.log('Onboarding data received:', formData);
      console.log('Files received:', Object.keys(files || {}));

      // Prepare document IDs array
      const documentIds: string[] = [];

      // Check if email already exists
      if (formData.personalInfo.email) {
        const existingUser = await storage.getUserByEmail(formData.personalInfo.email);
        if (existingUser) {
          return res.status(400).json({ message: 'A user with this email already exists' });
        }
      }

      // Create the resident in the database with full onboarding data
      const newResident = await storage.createResident({
        firstName: formData.personalInfo.firstName,
        lastName: formData.personalInfo.lastName,
        email: formData.personalInfo.email,
        phone: formData.personalInfo.phone,
        dateOfBirth: formData.personalInfo.dateOfBirth,
        ssn: formData.personalInfo.ssn, // Store encrypted in production
        emergencyContact: formData.personalInfo.emergencyContact,
        emergencyPhone: formData.personalInfo.emergencyPhone,
        // Demographics
        race: formData.demographics?.race,
        ethnicity: formData.demographics?.ethnicity,
        gender: formData.demographics?.gender,
        preferredPronouns: formData.demographics?.preferredPronouns,
        // Justice info
        releaseDate: formData.justiceInfo.releaseDate,
        justiceStatus: formData.justiceInfo.justiceStatus,
        paroleProbationOfficer: formData.justiceInfo.paroleProbationOfficer,
        paroleProbationPhone: formData.justiceInfo.paroleProbationPhone,
        courtDate: formData.justiceInfo.courtDate,
        // Needs assessment
        housingHistory: formData.needsAssessment.housingHistory,
        employmentStatus: formData.needsAssessment.employmentStatus,
        educationLevel: formData.needsAssessment.educationLevel,
        hasChildren: formData.needsAssessment.hasChildren,
        childrenDetails: formData.needsAssessment.childrenDetails,
        medicalNeeds: formData.needsAssessment.medicalNeeds,
        mentalHealthNeeds: formData.needsAssessment.mentalHealthNeeds,
        substanceUseHistory: formData.needsAssessment.substanceUseHistory,
        employmentGoals: formData.needsAssessment.employmentGoals,
        educationGoals: formData.needsAssessment.educationGoals,
        literacyLevel: formData.needsAssessment.literacyLevel,
        // Pre-screen data
        isVeteran: formData.isVeteran,
        hasDisability: formData.hasDisability,
        eligibilityNotes: formData.eligibilityNotes,
        specialAccommodations: formData.hasDisability ? formData.eligibilityNotes : null,
        // Property assignment
        moveInDate: formData.propertyAssignment?.moveInDate,
        propertyAssignment: formData.propertyAssignment?.propertyId,
        roomAssignment: formData.propertyAssignment?.roomNumber,
        // Meta data
        onboardingData: formData, // Store complete form data for reference
        onboardingDocuments: documentIds, // Will be populated below
        onboardingCompletedAt: new Date(),
        onboardingCompletedBy: req.user.id,
        caseManagerId: formData.personalInfo.caseManagerId || req.user.id,
        status: 'active',
        currentStage: 1,
        savings: 0
      });

      // Create an initial case note documenting the onboarding
      await storage.createCaseNote({
        text: `Initial Onboarding Completed - Resident successfully onboarded through comprehensive 10-step process:
        
**Pre-Screen:** ${formData.isEligible ? 'Eligible' : 'Needs review'}
**Veteran Status:** ${formData.isVeteran ? 'Yes' : 'No'}
**Disability Accommodations:** ${formData.hasDisability ? 'Required' : 'None'}
**Property Assignment:** ${formData.propertyAssignment.propertyId}
**Move-in Date:** ${formData.propertyAssignment.moveInDate}

All onboarding steps completed:
✓ Pre-screen assessment
✓ Full intake and needs assessment
✓ Document collection
✓ Property assignment
✓ House rules acknowledgment
✓ Safety walkthrough
✓ Resource orientation
✓ Policies and procedures review
✓ Transition planning overview
✓ Resident portal setup

Resident is ready to begin programming and case management services.`,
        residentId: newResident.id,
        createdBy: req.user.id,
        noteType: 'Other'
      });

      // Handle file uploads and create document records
      if (files) {
        for (const [fieldName, fileArray] of Object.entries(files)) {
          if (fileArray && fileArray.length > 0) {
            const file = fileArray[0];
            // In a real implementation, you would upload to cloud storage
            // For now, we'll just record the document metadata
            const document = await storage.createDocument({
              title: `${fieldName}: ${file.originalname}`,
              mime: file.mimetype,
              size: file.size,
              ownerType: 'resident',
              ownerId: newResident.id,
              storagePath: file.path || `/uploads/${newResident.id}/${file.originalname}`,
              checksum: null
            });
            documentIds.push(document.id);
          }
        }
        
        // Update resident profile with document IDs
        if (documentIds.length > 0 && newResident.profile) {
          await storage.updateResidentProfile(newResident.profile.id, {
            onboardingDocuments: documentIds
          });
        }
      }

      res.json({
        success: true,
        resident: newResident,
        documentsUploaded: documentIds.length,
        message: 'Resident successfully onboarded'
      });
      } catch (error) {
        console.error('Error onboarding resident:', error);
        res.status(500).json({ message: 'Failed to onboard resident' });
      }
    }));

  // Profile completion endpoint
  app.post('/api/auth/complete-profile', async (req: Request, res: Response) => {
    try {
      // In production, validate JWT and update user profile
      const updates = req.body;

      // TODO: Handle file upload for avatar
      // TODO: Update user in database

      res.json({ success: true, message: 'Profile completed successfully' });
    } catch (error) {
      console.error('Error completing profile:', error);
      res.status(500).json({ message: 'Failed to complete profile' });
    }
  });

  // Update user profile
app.patch("/api/users/:id", requireAuth, async (req, res) => {
  try {
    const userId = req.params.id;
    const updates = req.body;

    const [user] = await db
      .update(users)
      .set({
        ...updates,
        updatedAt: new Date()
      })
      .where(eq(users.id, userId))
      .returning();

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json(user);
  } catch (error) {
    console.error("Error updating user:", error);
    res.status(500).json({ error: "Failed to update user" });
  }
});

// Upload user avatar
app.post("/api/users/:id/avatar", requireAuth, upload.single('avatar'), async (req, res) => {
  try {
    const userId = req.params.id;
    const file = req.file;

    if (!file) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    // Store the uploaded file path as profile image
    const profileImageUrl = `/uploads/${file.filename}`;

    const [user] = await db
      .update(users)
      .set({
        profileImage: profileImageUrl,
        updatedAt: new Date()
      })
      .where(eq(users.id, userId))
      .returning();

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json({ 
      message: "Avatar uploaded successfully", 
      profileImage: profileImageUrl,
      user 
    });
  } catch (error) {
    console.error("Error uploading avatar:", error);
    res.status(500).json({ error: "Failed to upload avatar" });
  }
});

// Set user avatar preset
app.post("/api/users/:id/avatar-preset", requireAuth, async (req, res) => {
  try {
    const userId = req.params.id;
    const { avatarUrl } = req.body;

    if (!avatarUrl) {
      return res.status(400).json({ error: "Avatar URL is required" });
    }

    const [user] = await db
      .update(users)
      .set({
        profileImage: avatarUrl,
        updatedAt: new Date()
      })
      .where(eq(users.id, userId))
      .returning();

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json({ 
      message: "Avatar updated successfully", 
      profileImage: avatarUrl,
      user 
    });
  } catch (error) {
    console.error("Error setting avatar preset:", error);
    res.status(500).json({ error: "Failed to set avatar preset" });
  }
});

  // Donor Management Routes
  app.get('/api/donors', roleRoute(['Admin', 'CaseManager'], async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { donorType, email } = req.query;
      const filters: any = {};
      if (donorType) filters.donorType = donorType as string;
      if (email) filters.email = email as string;

      const donors = await storage.getDonors(filters);
      res.json(donors);
    } catch (error) {
      console.error('Error fetching donors:', error);
      res.status(500).json({ message: 'Failed to fetch donors' });
    }
  }));

  app.get('/api/donors/:id', roleRoute(['Admin', 'CaseManager'], async (req: AuthenticatedRequest, res: Response) => {
    try {
      const donor = await storage.getDonor(req.params.id);
      if (!donor) {
        return res.status(404).json({ message: 'Donor not found' });
      }
      res.json(donor);
    } catch (error) {
      console.error('Error fetching donor:', error);
      res.status(500).json({ message: 'Failed to fetch donor' });
    }
  }));

  app.post('/api/donors', roleRoute(['Admin'], async (req: AuthenticatedRequest, res: Response) => {
    try {
      const donor = await storage.createDonor(req.body);
      res.status(201).json(donor);
    } catch (error) {
      console.error('Error creating donor:', error);
      res.status(500).json({ message: 'Failed to create donor' });
    }
  }));

  app.put('/api/donors/:id', roleRoute(['Admin'], async (req: AuthenticatedRequest, res: Response) => {
    try {
      const donor = await storage.updateDonor(req.params.id, req.body);
      res.json(donor);
    } catch (error) {
      console.error('Error updating donor:', error);
      res.status(500).json({ message: 'Failed to update donor' });
    }
  }));

  app.delete('/api/donors/:id', roleRoute(['Admin'], async (req: AuthenticatedRequest, res: Response) => {
    try {
      await storage.deleteDonor(req.params.id);
      res.json({ message: 'Donor deleted successfully' });
    } catch (error) {
      console.error('Error deleting donor:', error);
      res.status(500).json({ message: 'Failed to delete donor' });
    }
  }));

  // Donor Donations Routes
  app.get('/api/donor-donations', roleRoute(['Admin', 'CaseManager'], async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { donorId, campaignId, status } = req.query;
      const filters: any = {};
      if (donorId) filters.donorId = donorId as string;
      if (campaignId) filters.campaignId = campaignId as string;
      if (status) filters.status = status as string;

      const donations = await storage.getDonorDonations(filters);
      res.json(donations);
    } catch (error) {
      console.error('Error fetching donations:', error);
      res.status(500).json({ message: 'Failed to fetch donations' });
    }
  }));

  app.post('/api/donor-donations', roleRoute(['Admin'], async (req: AuthenticatedRequest, res: Response) => {
    try {
      const donation = await storage.createDonorDonation(req.body);
      res.status(201).json(donation);
    } catch (error) {
      console.error('Error creating donation:', error);
      res.status(500).json({ message: 'Failed to create donation' });
    }
  }));

  app.put('/api/donor-donations/:id', roleRoute(['Admin'], async (req: AuthenticatedRequest, res: Response) => {
    try {
      const donation = await storage.updateDonorDonation(req.params.id, req.body);
      res.json(donation);
    } catch (error) {
      console.error('Error updating donation:', error);
      res.status(500).json({ message: 'Failed to update donation' });
    }
  }));

  // Donation Goals Routes
  app.get('/api/donation-goals', roleRoute(['Admin'], async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { isActive, category } = req.query;
      const filters: any = {};
      if (isActive !== undefined) filters.isActive = isActive === 'true';
      if (category) filters.category = category as string;

      const goals = await storage.getDonationGoals(filters);
      res.json(goals);
    } catch (error) {
      console.error('Error fetching donation goals:', error);
      res.status(500).json({ message: 'Failed to fetch donation goals' });
    }
  }));

  app.get('/api/donation-goals/:id', roleRoute(['Admin'], async (req: AuthenticatedRequest, res: Response) => {
    try {
      const goal = await storage.getDonationGoal(req.params.id);
      if (!goal) {
        return res.status(404).json({ message: 'Donation goal not found' });
      }
      res.json(goal);
    } catch (error) {
      console.error('Error fetching donation goal:', error);
      res.status(500).json({ message: 'Failed to fetch donation goal' });
    }
  }));

  app.post('/api/donation-goals', roleRoute(['Admin'], async (req: AuthenticatedRequest, res: Response) => {
    try {
      const goal = await storage.createDonationGoal({
        ...req.body,
        createdBy: req.user.id
      });
      res.status(201).json(goal);
    } catch (error) {
      console.error('Error creating donation goal:', error);
      res.status(500).json({ message: 'Failed to create donation goal' });
    }
  }));

  app.put('/api/donation-goals/:id', roleRoute(['Admin'], async (req: AuthenticatedRequest, res: Response) => {
    try {
      const goal = await storage.updateDonationGoal(req.params.id, req.body);
      res.json(goal);
    } catch (error) {
      console.error('Error updating donation goal:', error);
      res.status(500).json({ message: 'Failed to update donation goal' });
    }
  }));

  app.delete('/api/donation-goals/:id', roleRoute(['Admin'], async (req: AuthenticatedRequest, res: Response) => {
    try {
      await storage.deleteDonationGoal(req.params.id);
      res.json({ message: 'Donation goal deleted successfully' });
    } catch (error) {
      console.error('Error deleting donation goal:', error);
      res.status(500).json({ message: 'Failed to delete donation goal' });
    }
  }));

  // Donor Subscriptions Routes
  app.get('/api/donor-subscriptions', roleRoute(['Admin', 'CaseManager'], async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { donorId, status } = req.query;
      const filters: any = {};
      if (donorId) filters.donorId = donorId as string;
      if (status) filters.status = status as string;

      const subscriptions = await storage.getDonorSubscriptions(filters);
      res.json(subscriptions);
    } catch (error) {
      console.error('Error fetching subscriptions:', error);
      res.status(500).json({ message: 'Failed to fetch subscriptions' });
    }
  }));

  app.post('/api/donor-subscriptions', roleRoute(['Admin'], async (req: AuthenticatedRequest, res: Response) => {
    try {
      const subscription = await storage.createDonorSubscription(req.body);
      res.status(201).json(subscription);
    } catch (error) {
      console.error('Error creating subscription:', error);
      res.status(500).json({ message: 'Failed to create subscription' });
    }
  }));

  app.put('/api/donor-subscriptions/:id', roleRoute(['Admin'], async (req: AuthenticatedRequest, res: Response) => {
    try {
      const subscription = await storage.updateDonorSubscription(req.params.id, req.body);
      res.json(subscription);
    } catch (error) {
      console.error('Error updating subscription:', error);
      res.status(500).json({ message: 'Failed to update subscription' });
    }
  }));

  app.post('/api/donor-subscriptions/:id/cancel', roleRoute(['Admin'], async (req: AuthenticatedRequest, res: Response) => {
    try {
      await storage.cancelDonorSubscription(req.params.id);
      res.json({ message: 'Subscription cancelled successfully' });
    } catch (error) {
      console.error('Error cancelling subscription:', error);
      res.status(500).json({ message: 'Failed to cancel subscription' });
    }
  }));

  // Prospective Residents Routes
  app.get('/api/prospective-residents', roleRoute(['Admin', 'CaseManager', 'Intake'], async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { status, assignedTo, priority } = req.query;
      const filters: any = {};
      if (status) filters.status = status as string;
      if (assignedTo) filters.assignedTo = assignedTo as string;
      if (priority) filters.priority = priority as string;

      const residents = await storage.getProspectiveResidents(filters);
      res.json(residents);
    } catch (error) {
      console.error('Error fetching prospective residents:', error);
      res.status(500).json({ message: 'Failed to fetch prospective residents' });
    }
  }));

  app.get('/api/prospective-residents/:id', roleRoute(['Admin', 'CaseManager', 'Intake'], async (req: AuthenticatedRequest, res: Response) => {
    try {
      const resident = await storage.getProspectiveResident(req.params.id);
      if (!resident) {
        return res.status(404).json({ message: 'Prospective resident not found' });
      }
      res.json(resident);
    } catch (error) {
      console.error('Error fetching prospective resident:', error);
      res.status(500).json({ message: 'Failed to fetch prospective resident' });
    }
  }));

  app.post('/api/prospective-residents', roleRoute(['Admin', 'CaseManager', 'Intake'], async (req: AuthenticatedRequest, res: Response) => {
    try {
      const resident = await storage.createProspectiveResident(req.body);
      res.status(201).json(resident);
    } catch (error) {
      console.error('Error creating prospective resident:', error);
      res.status(500).json({ message: 'Failed to create prospective resident' });
    }
  }));

  app.put('/api/prospective-residents/:id', roleRoute(['Admin', 'CaseManager', 'Intake'], async (req: AuthenticatedRequest, res: Response) => {
    try {
      const resident = await storage.updateProspectiveResident(req.params.id, req.body);
      res.json(resident);
    } catch (error) {
      console.error('Error updating prospective resident:', error);
      res.status(500).json({ message: 'Failed to update prospective resident' });
    }
  }));

  app.delete('/api/prospective-residents/:id', roleRoute(['Admin'], async (req: AuthenticatedRequest, res: Response) => {
    try {
      await storage.deleteProspectiveResident(req.params.id);
      res.json({ message: 'Prospective resident deleted successfully' });
    } catch (error) {
      console.error('Error deleting prospective resident:', error);
      res.status(500).json({ message: 'Failed to delete prospective resident' });
    }
  }));

  // CRM Activities Routes
  app.get('/api/crm-activities', roleRoute(['Admin', 'CaseManager', 'Intake'], async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { entityType, entityId, performedBy } = req.query;
      const filters: any = {};
      if (entityType) filters.entityType = entityType as string;
      if (entityId) filters.entityId = entityId as string;
      if (performedBy) filters.performedBy = performedBy as string;

      const activities = await storage.getCrmActivities(filters);
      res.json(activities);
    } catch (error) {
      console.error('Error fetching CRM activities:', error);
      res.status(500).json({ message: 'Failed to fetch CRM activities' });
    }
  }));

  app.post('/api/crm-activities', roleRoute(['Admin', 'CaseManager', 'Intake'], async (req: AuthenticatedRequest, res: Response) => {
    try {
      const activity = await storage.createCrmActivity({
        ...req.body,
        performedBy: req.user.id
      });
      res.status(201).json(activity);
    } catch (error) {
      console.error('Error creating CRM activity:', error);
      res.status(500).json({ message: 'Failed to create CRM activity' });
    }
  }));

  app.put('/api/crm-activities/:id', roleRoute(['Admin', 'CaseManager', 'Intake'], async (req: AuthenticatedRequest, res: Response) => {
    try {
      const activity = await storage.updateCrmActivity(req.params.id, req.body);
      res.json(activity);
    } catch (error) {
      console.error('Error updating CRM activity:', error);
      res.status(500).json({ message: 'Failed to update CRM activity' });
    }
  }));

  app.delete('/api/crm-activities/:id', roleRoute(['Admin'], async (req: AuthenticatedRequest, res: Response) => {
    try {
      await storage.deleteCrmActivity(req.params.id);
      res.json({ message: 'CRM activity deleted successfully' });
    } catch (error) {
      console.error('Error deleting CRM activity:', error);
      res.status(500).json({ message: 'Failed to delete CRM activity' });
    }
  }));

  // Kit (ConvertKit) Integration Routes
  app.get('/api/kit/status', roleRoute(['Admin'], async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { kitService } = await import('./kit-integration');
      
      // Test Kit API connection
      try {
        const tags = await kitService.getTags();
        res.json({
          connected: true,
          message: 'Kit API connection successful',
          tagCount: tags.length
        });
      } catch (error: any) {
        res.json({
          connected: false,
          message: `Kit API connection failed: ${error.message}`
        });
      }
    } catch (error) {
      console.error('Kit status check error:', error);
      res.status(500).json({ message: 'Failed to check Kit status' });
    }
  }));

  app.get('/api/kit/subscribers', roleRoute(['Admin', 'CaseManager'], async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { kitService } = await import('./kit-integration');
      const { page = 1 } = req.query;
      
      const subscribers = await kitService.getSubscribers(Number(page));
      res.json(subscribers);
    } catch (error: any) {
      console.error('Kit subscribers fetch error:', error);
      res.status(500).json({ message: `Failed to fetch subscribers: ${error.message}` });
    }
  }));

  // Users API Routes
  app.get('/api/users', requireAuth, authRoute(async (req: AuthenticatedRequest, res: Response) => {
    try {
      const users = await storage.getUsers();
      const residents = await storage.getResidents();
      
      // Combine users and residents
      const allUsers = [
        ...users.map(user => ({
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
        })),
        ...residents.map((resident: User) => ({
          id: resident.id,
          name: resident.name,
          email: resident.email,
          role: 'Resident' as const,
        }))
      ];
      
      res.json(allUsers);
    } catch (error) {
      console.error('Users fetch error:', error);
      res.status(500).json({ message: 'Failed to fetch users' });
    }
  }));

  // Case Manager Onboarding API
  app.post('/api/case-managers/onboard', roleRoute(['Admin'], async (req: AuthenticatedRequest, res: Response) => {
    try {
      const {
        firstName,
        lastName,
        email,
        phone,
        department,
        title,
        startDate,
        licenseNumber,
        specializations,
        caseloadCapacity,
        supervisorId,
        officeLocation,
        emergencyContact,
        certifications,
        trainings,
        availabilitySchedule,
        languages,
        backgroundCheckComplete,
        fingerprintingComplete,
        documentationComplete
      } = req.body;

      // Check if user already exists
      const existingUser = await storage.getUserByEmail(email);
      if (existingUser) {
        return res.status(400).json({ message: 'Email already registered' });
      }

      // Generate temporary password
      const tempPassword = `LifeHouse${Math.random().toString(36).slice(-8)}!`;
      const passwordHash = await bcrypt.hash(tempPassword, 10);

      // Create user with CaseManager role
      const user = await storage.createUser({
        name: `${firstName} ${lastName}`,
        email,
        passwordHash,
        role: 'CaseManager'
      });

      // Create employee profile
      const profile = {
        userId: user.id,
        role: 'CaseManager',
        title: title || 'Case Manager',
        startDate: startDate || new Date().toISOString(),
        licenseNumber: licenseNumber || '',
        department: department || 'Case Management',
        supervisorId: supervisorId || null,
        officeLocation: officeLocation || 'Main Office',
        phone: phone || '',
        emergencyContact: emergencyContact || {},
        specializations: specializations || [],
        caseloadCapacity: caseloadCapacity || 20,
        currentCaseload: 0,
        certifications: certifications || [],
        trainings: trainings || [],
        performanceReviews: [],
        availabilitySchedule: availabilitySchedule || {},
        languages: languages || ['English'],
        notes: '',
        backgroundCheckComplete: backgroundCheckComplete || false,
        fingerprintingComplete: fingerprintingComplete || false,
        documentationComplete: documentationComplete || false,
        isActive: true
      };

      await storage.createEmployeeProfile(profile);

      // Log audit entry
      await storage.logAudit({
        userId: req.user.id,
        action: 'CREATE_CASE_MANAGER',
        targetId: user.id,
        targetType: 'user',
        details: {
          name: user.name,
          email: user.email,
          title: profile.title,
          department: profile.department
        }
      });

      res.status(201).json({
        success: true,
        message: 'Case manager successfully onboarded',
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          tempPassword // In production, this would be sent via secure email
        },
        profile
      });
    } catch (error) {
      console.error('Case manager onboarding error:', error);
      res.status(500).json({ message: 'Failed to onboard case manager' });
    }
  }));

  // Message API Routes
  app.get('/api/messages/thread/:id', requireAuth, authRoute(async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { id } = req.params;
      const userId = req.user!.id;

      // Get message thread from database
      const threadMessages = await storage.getMessageThread(id);
      
      // Format messages for frontend
      const formattedMessages = await Promise.all(threadMessages.map(async (msg) => {
        const fromUser = await storage.getUser(msg.fromUserId);
        return {
          id: msg.id,
          from: fromUser?.name || 'Unknown User',
          subject: msg.subject,
          content: msg.body,
          timestamp: msg.createdAt ? new Date(msg.createdAt).toLocaleString() : 'Unknown',
          read: msg.isRead || false,
          threadId: msg.parentId || msg.id,
          sender: msg.fromUserId === userId ? 'user' : 'other' as const,
        };
      }));

      res.json({ messages: formattedMessages });
    } catch (error) {
      console.error('Thread fetch error:', error);
      res.status(500).json({ message: 'Failed to fetch message thread' });
    }
  }));

  app.patch('/api/messages/:id/read', requireAuth, authRoute(async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { id } = req.params;
      const userId = req.user!.id;

      // Mark message as read in database
      await storage.markMessageAsRead(id);
      res.json({ success: true, messageId: id });
    } catch (error) {
      console.error('Mark as read error:', error);
      res.status(500).json({ message: 'Failed to mark message as read' });
    }
  }));

  app.post('/api/messages/send', requireAuth, authRoute(async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { toUserId, toUserName, subject, body } = req.body;
      const fromUserId = req.user!.id;

      // Find recipient user
      let recipientId = toUserId;
      if (!recipientId && toUserName) {
        const users = await storage.getUsers();
        const toUser = users.find(u => u.name === toUserName);
        if (!toUser) {
          return res.status(400).json({ message: 'Recipient not found' });
        }
        recipientId = toUser.id;
      }

      // Create the message in database
      const newMessage = await storage.createMessage({
        fromUserId,
        toUserId: recipientId,
        subject: subject || 'New Message',
        body,
      });

      res.json({ success: true, message: newMessage });
    } catch (error) {
      console.error('Send message error:', error);
      res.status(500).json({ message: 'Failed to send message' });
    }
  }));

  app.post('/api/messages/reply', requireAuth, authRoute(async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { threadId, content, to } = req.body;
      const userId = req.user!.id;
      const userName = req.user!.name || 'User';

      // Find the recipient user by name
      const users = await storage.getUsers();
      const toUser = users.find(u => u.name === to);
      
      if (!toUser) {
        return res.status(400).json({ message: 'Recipient not found' });
      }

      // Create the message in database
      const newMessage = await storage.createMessage({
        fromUserId: userId,
        toUserId: toUser.id,
        subject: 'Re: Message',
        body: content,
        parentId: threadId,
      });

      // Format the reply for frontend
      const reply = {
        id: newMessage.id,
        from: userName,
        to: to,
        content: content,
        timestamp: 'Just now',
        threadId: threadId,
        sender: 'user' as const,
        read: false,
      };

      res.json({ success: true, message: reply });
    } catch (error) {
      console.error('Send reply error:', error);
      res.status(500).json({ message: 'Failed to send reply' });
    }
  }));

  app.get('/api/kit/forms', roleRoute(['Admin', 'CaseManager'], async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { kitService } = await import('./kit-integration');
      
      const forms = await kitService.getForms();
      res.json(forms);
    } catch (error: any) {
      console.error('Kit forms fetch error:', error);
      res.status(500).json({ message: `Failed to fetch forms: ${error.message}` });
    }
  }));

  app.get('/api/kit/forms/:id/page', roleRoute(['Admin', 'CaseManager'], async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { kitService } = await import('./kit-integration');
      const { id } = req.params;
      
      const form = await kitService.getForm(id);
      if (!form) {
        return res.status(404).json({ message: 'Form not found' });
      }

      // Generate HTML page for the form
      const formPageHtml = `
        <!DOCTYPE html>
        <html lang="en">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>${form.name} - Life House</title>
          <style>
            body { font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; }
            .form-container { background: #f9f9f9; padding: 30px; border-radius: 8px; }
            h1 { color: #333; margin-bottom: 20px; }
            .description { color: #666; margin-bottom: 30px; line-height: 1.5; }
          </style>
        </head>
        <body>
          <div class="form-container">
            <h1>${form.name}</h1>
            ${form.description ? `<p class="description">${form.description}</p>` : ''}
            <script async data-uid="${form.id}" src="https://kit.com/ck.js"></script>
          </div>
        </body>
        </html>
      `;

      res.setHeader('Content-Type', 'text/html');
      res.send(formPageHtml);
    } catch (error: any) {
      console.error('Kit form page error:', error);
      res.status(500).json({ message: `Failed to generate form page: ${error.message}` });
    }
  }));

  app.get('/api/kit/forms/:id/download', roleRoute(['Admin', 'CaseManager'], async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { kitService } = await import('./kit-integration');
      const { id } = req.params;
      
      const form = await kitService.getForm(id);
      if (!form) {
        return res.status(404).json({ message: 'Form not found' });
      }

      const subscribers = await kitService.getFormSubscribers(id);
      
      // Generate CSV data
      const csvHeaders = ['Email', 'First Name', 'Last Name', 'Created At', 'State'];
      const csvRows = subscribers.map(sub => [
        sub.email_address,
        sub.first_name || '',
        sub.last_name || '',
        sub.created_at,
        sub.state
      ]);

      const csvContent = [csvHeaders, ...csvRows]
        .map(row => row.map(field => `"${field}"`).join(','))
        .join('\n');

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="${form.name}_subscribers.csv"`);
      res.send(csvContent);
    } catch (error: any) {
      console.error('Kit form download error:', error);
      res.status(500).json({ message: `Failed to download form data: ${error.message}` });
    }
  }));

  app.get('/api/kit/tags', roleRoute(['Admin', 'CaseManager'], async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { kitService } = await import('./kit-integration');
      
      const tags = await kitService.getTags();
      res.json(tags);
    } catch (error: any) {
      console.error('Kit tags fetch error:', error);
      res.status(500).json({ message: `Failed to fetch tags: ${error.message}` });
    }
  }));

  app.post('/api/kit/sync/crm-to-kit', roleRoute(['Admin'], async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { kitService } = await import('./kit-integration');
      
      const result = await kitService.bulkSyncCRMToKit();
      res.json({
        success: true,
        message: `Synced ${result.synced} contacts to Kit`,
        ...result
      });
    } catch (error: any) {
      console.error('CRM to Kit sync error:', error);
      res.status(500).json({ message: `Sync failed: ${error.message}` });
    }
  }));

  app.post('/api/kit/sync/kit-to-crm', roleRoute(['Admin'], async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { kitService } = await import('./kit-integration');
      
      const result = await kitService.bulkSyncKitToCRM();
      res.json({
        success: true,
        message: `Synced ${result.synced} contacts from Kit`,
        ...result
      });
    } catch (error: any) {
      console.error('Kit to CRM sync error:', error);
      res.status(500).json({ message: `Sync failed: ${error.message}` });
    }
  }));

  app.post('/api/kit/sync/contact', roleRoute(['Admin', 'CaseManager'], async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { kitService } = await import('./kit-integration');
      const contactData = req.body;
      
      const subscriber = await kitService.syncContactToKit(contactData);
      res.json({
        success: true,
        message: 'Contact synced to Kit successfully',
        subscriber
      });
    } catch (error: any) {
      console.error('Contact sync error:', error);
      res.status(500).json({ message: `Contact sync failed: ${error.message}` });
    }
  }));

  app.post('/api/kit/webhooks/subscriber', async (req: Request, res: Response) => {
    try {
      const { kitService } = await import('./kit-integration');
      const webhookData = req.body;
      
      // Handle Kit webhook for subscriber events
      if (webhookData.subscriber) {
        await kitService.syncKitContactToCRM(webhookData.subscriber);
        console.log('Webhook processed: subscriber synced from Kit');
      }
      
      res.status(200).json({ received: true });
    } catch (error) {
      console.error('Kit webhook error:', error);
      res.status(200).json({ received: true }); // Always return 200 to Kit
    }
  });

  // Create HTTP server
  const httpServer = createServer(app);

  return httpServer;
}