import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
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
const requireAuth = (req: Request, res: Response, next: NextFunction) => {
  const token = req.headers.authorization?.replace('Bearer ', '');

  if (!token) {
    return res.status(401).json({ message: 'No token provided' });
  }

  // For development, accept mock tokens
  if (token.startsWith('mock-token-')) {
    const userId = token.replace('mock-token-', '');
    // Mock user for development - in production, validate JWT token
    (req as AuthenticatedRequest).user = {
      id: userId,
      role: "CaseManager",
      name: "Sarah Martinez",
      email: "sarah.martinez@example.com"
    };
    return next();
  }

  // In production, validate JWT here
  try {
    // TODO: Replace with actual JWT validation
    return res.status(401).json({ message: 'Invalid token' });
  } catch (error) {
    return res.status(401).json({ message: 'Invalid token' });
  }
};

export async function registerRoutes(app: Express): Promise<Server> {
  // Public routes (no auth required)

  // Housing application submission
  app.post('/api/public/apply', async (req: Request, res: Response) => {
    try {
      // Transform date strings to Date objects for validation
      const transformedData = {
        ...req.body,
        dateOfBirth: new Date(req.body.dateOfBirth),
        releaseDate: new Date(req.body.releaseDate)
      };
      const validatedData = insertApplicationSchema.parse(transformedData);
      const application = await storage.createApplication(validatedData);

      // In production, you'd send confirmation emails here
      console.log('New housing application:', application.id);

      res.status(201).json({ 
        success: true, 
        message: 'Application submitted successfully',
        applicationId: application.id 
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
      const validatedData = insertReferralSchema.parse({
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

      // In production, you'd send notifications here
      console.log('New referral:', referral.id);

      res.status(201).json({ 
        success: true, 
        message: 'Referral submitted successfully',
        referralId: referral.id 
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
      const validatedData = insertDonationSchema.parse(req.body);
      const donation = await storage.createDonation(validatedData);

      // In production, you'd process payment with Stripe here
      console.log('New donation:', donation.id, donation.amount);

      res.status(201).json({ 
        success: true, 
        message: 'Donation submitted successfully',
        donationId: donation.id 
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
      const validatedData = insertInquirySchema.parse(req.body);
      const inquiry = await storage.createInquiry(validatedData);

      // In production, you'd send notification emails here
      console.log('New program inquiry:', inquiry.id);

      res.status(201).json({
        success: true,
        message: 'Thank you for your inquiry! We\'ll be in touch soon.',
        inquiryId: inquiry.id,
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
      const validatedData = insertPartnerSchema.parse(req.body);
      const partner = await storage.createPartner(validatedData);

      // In production, you'd send notification emails here
      console.log('New partner signup:', partner.id);

      res.status(201).json({
        success: true,
        message: 'Thank you for partnering with Life House! We\'ll be in touch within 24 hours.',
        partnerId: partner.id,
      });
    } catch (error) {
      console.error('Partner signup error:', error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: 'Invalid form data', errors: error.errors });
      }
      res.status(500).json({ message: 'Failed to submit partner request' });
    }
  });

  // Geofence check-in endpoint
  app.post('/api/check-in', async (req: Request, res: Response) => {
    try {
      const { propertyId, latitude, longitude, distance } = req.body;
      const token = req.headers.authorization?.replace('Bearer ', '');

      if (!token) {
        return res.status(401).json({ message: 'Authentication required' });
      }

      // For development, extract user ID from mock token
      const userId = token.replace('mock-token-', '');

      // Validate distance (should be ≤ 91 meters)
      if (distance > 91) {
        return res.status(400).json({ 
          message: 'Out of range',
          distance,
          maxDistance: 91
        });
      }

      // In production, save to database
      const checkIn = {
        id: `checkin_${Date.now()}`,
        userId,
        propertyId,
        latitude,
        longitude,
        distance,
        timestamp: new Date().toISOString(),
      };

      console.log('Geofence check-in:', checkIn);

      // TODO: Send Slack notification to case manager

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

  // Apply auth middleware to all API routes
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

  // Tickets Routes
  app.get('/api/tickets', roleRoute(['CaseManager', 'Admin', 'Intake', 'Resident'], async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { status, priority } = req.query;
      const filters: any = {};
      if (status && status !== 'all') filters.status = status as string;
      if (priority && priority !== 'all') filters.priority = priority as string;

      const tickets = await storage.getTickets(filters);

      // Add property address to each ticket (in production, this would be a join)
      const properties = await storage.getProperties();
      const ticketsWithAddress = tickets.map((ticket: any) => {
        const property = properties.find((p: any) => p.id === ticket.propertyId);
        return {
          ...ticket,
          propertyAddress: property ? `${property.address}, ${property.city}` : 'Unknown Property'
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

  app.patch('/api/tickets/:id', roleRoute(['CaseManager', 'Admin'], async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { id } = req.params;
      const { status } = req.body;

      if (!status) {
        return res.status(400).json({ message: 'Status is required' });
      }

      // In production, update ticket in database
      const updatedTicket = {
        id,
        status,
        updatedAt: new Date().toISOString(),
        ...(status === 'resolved' ? { resolvedAt: new Date().toISOString() } : {})
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
  app.post('/api/resource', async (req: Request, res: Response) => {
    try {
      const validatedData = req.body; // TODO: Add resource schema validation
      const resource = await storage.createResource(validatedData);
      res.status(201).json({
        success: true,
        resource
      });
    } catch (error) {
      console.error('Error creating resource:', error);
      res.status(500).json({ message: 'Failed to create resource' });
    }
  });

  // Donation checkout with Stripe
  app.post('/api/donate', async (req: Request, res: Response) => {
    try {
      const { amount, email, name, isRecurring } = req.body;
      
      if (!process.env.STRIPE_SECRET_KEY) {
        return res.status(500).json({ message: 'Stripe is not configured' });
      }
      
      const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
        apiVersion: '2024-11-20.acacia'
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
        apiVersion: '2024-11-20.acacia'
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
            stripeSessionId: session.id,
            amount: session.amount_total ? session.amount_total / 100 : 0,
            donorEmail: session.customer_email,
            donorName: session.metadata?.donor_name || 'Anonymous',
            type: session.metadata?.donation_type || 'one-time',
            paidAt: new Date().toISOString()
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

  // Create HTTP server
  const httpServer = createServer(app);

  return httpServer;
}