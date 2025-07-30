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
  insertPartnerSchema
} from "@shared/schema";
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
type AuthenticatedHandler = (req: AuthenticatedRequest, res: Response, next?: NextFunction) => void | Promise<void>;

// Helper to properly type authenticated routes
function authRoute(handler: AuthenticatedHandler) {
  return handler as any;
}

// Helper for role-based routes
function roleRoute(roles: string[], handler: AuthenticatedHandler) {
  return async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!roles.includes(req.user?.role)) {
      return res.status(403).json({ message: "Insufficient permissions" });
    }
    return handler(req, res, next);
  };
}

// Simple auth middleware (in production, implement proper JWT validation)
const requireAuth = (req: Request, res: Response, next: NextFunction) => {
  // Mock user for development - in production, validate JWT token
  (req as AuthenticatedRequest).user = {
    id: "550e8400-e29b-41d4-a716-446655440000", // Valid UUID format
    role: "CaseManager",
    name: "Sarah Martinez",
    email: "sarah.martinez@example.com"
  };
  next();
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
        apiVersion: '2023-10-16',
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
        reportedBy: `${req.user.firstName} ${req.user.lastName}`,
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

  // AI Chat endpoint (public access for widget)
  app.post('/api/ai/chat', async (req: Request, res: Response) => {
    try {
      const { message, context } = req.body;
      
      if (!message) {
        return res.status(400).json({ message: 'Message is required' });
      }

      // Import the AI helper
      const { generateAIResponse } = await import('./ai');
      
      const systemPrompt = context === 'public_assistant' 
        ? `You are a helpful assistant for Life House Reentry, a transitional housing program for formerly incarcerated individuals. 
           Provide accurate information about:
           - Housing application process and requirements
           - Eligibility criteria (must be on parole/probation, release date within 30 days)
           - Required documents (ID, release papers, etc.)
           - Program benefits (90-day initial stay, case management, job support)
           - Contact information: (855) 4-LIFEUP or (855) 454-3387
           - Location: 8399 Folsom Blvd, Ste 1, Sacramento, CA 95826
           
           Be empathetic, supportive, and professional. Keep responses concise and helpful.`
        : 'You are a helpful assistant.';

      const response = await generateAIResponse(message, systemPrompt);
      
      res.json({ response });
    } catch (error: any) {
      console.error('AI chat error:', error);
      res.status(500).json({ 
        message: 'Failed to generate response',
        error: error.message 
      });
    }
  });

  // Create HTTP server
  const httpServer = createServer(app);
  
  return httpServer;
}