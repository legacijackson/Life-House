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
  faqs,
  faqRoles,
  faqPages,
  faqFeedback
} from "@shared/schema";
import { db } from "./db";
import { eq, and, like, desc, sql } from "drizzle-orm";
import bcrypt from "bcryptjs";
import Stripe from "stripe";

interface AuthenticatedRequest extends Request {
  user: {
    id: string;
    role: string;
    name: string;
    email: string;
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
    if (!roles.includes(req.user?.role)) {
      return res.status(403).json({ message: "Insufficient permissions" });
    }
    return handler(req, res, next);
  }) as any;
}

// Simple auth middleware (in production, implement proper JWT validation)
const requireAuth = async (req: Request, res: Response, next: NextFunction) => {
  const token = req.headers.authorization?.replace('Bearer ', '');

  if (!token) {
    return res.status(401).json({ message: 'No token provided' });
  }

  // For development, accept mock tokens
  if (token.startsWith('mock-token-')) {
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
        email: user.email
      };
      return next();
    } catch (error) {
      console.error('Auth middleware error:', error);
      return res.status(401).json({ message: 'Authentication failed' });
    }
  }

  // In production, validate JWT here
  try {
    // TODO: Replace with actual JWT validation
    return res.status(401).json({ message: 'Invalid token' });
  } catch (error) {
    return res.status(401).json({ message: 'Invalid token' });
  }
};

// Configure multer for file uploads
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

export async function registerRoutes(app: Express): Promise<Server> {
  // Test endpoint to debug JSON response
  app.get('/api/test-json', (req: Request, res: Response) => {
    res.json({ message: 'JSON response working', timestamp: new Date().toISOString() });
  });

  // Public routes (no auth required)

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

      // In production, generate proper JWT token
      const token = `mock-token-${user.id}`;

      res.status(201).json({
        success: true,
        message: 'Account created successfully',
        token,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
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

  // User login
  app.post('/api/login', async (req: Request, res: Response) => {
    try {
      const { email, password } = req.body;

      // Validate input
      if (!email || !password) {
        return res.status(400).json({ message: 'Email and password are required' });
      }

      // Find user by email
      const user = await storage.getUserByEmail(email);
      if (!user) {
        return res.status(401).json({ message: 'Invalid email or password' });
      }

      // Verify password
      if (!user.passwordHash) {
        return res.status(401).json({ message: 'Invalid email or password' });
      }
      const passwordValid = await bcrypt.compare(password, user.passwordHash);
      if (!passwordValid) {
        return res.status(401).json({ message: 'Invalid email or password' });
      }

      // In production, generate proper JWT token
      const token = `mock-token-${user.id}`;

      res.json({
        success: true,
        message: 'Login successful',
        token,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
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
      const dashboardData = {
        totalResidents: 45,
        activeResidents: 38,
        pendingIntakes: 7,
        overdueNotes: 3,
        avgSavings: 1250,
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
        ]
      };
      res.json(dashboardData);
    } catch (error) {
      console.error('Staff dashboard error:', error);
      res.status(500).json({ message: 'Failed to fetch staff dashboard data' });
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
        s3Region: process.env.S3_REGION || 'us-west-2',
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
      // In production, save config to database
      console.log('Updated admin config:', req.body);
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

      // In production, test actual connections
      const success = Math.random() > 0.3; // Simulate 70% success rate

      res.json({
        success,
        message: success 
          ? `${type} connection test successful` 
          : `${type} connection test failed - check configuration`
      });
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

  // Staff Dashboard Routes
  app.get('/api/staff/dashboard', roleRoute(['CaseManager', 'Admin'], async (req: AuthenticatedRequest, res: Response) => {
    try {
      const dashboardData = {
        totalResidents: 45,
        activeResidents: 38,
        pendingIntakes: 7,
        overdueNotes: 3,
        avgSavings: 1250,
        touchPoints: 1,
        reportStatus: 'ready'
      };
      res.json(dashboardData);
    } catch (error) {
      console.error('Staff dashboard error:', error);
      res.status(500).json({ message: 'Failed to fetch dashboard data' });
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

  app.get('/api/residents/:id', roleRoute(['CaseManager', 'Admin', 'Intake'], async (req: AuthenticatedRequest, res: Response) => {
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

  // Create HTTP server
  const httpServer = createServer(app);

  return httpServer;
}