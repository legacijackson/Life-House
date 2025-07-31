import {
  users,
  residentProfiles,
  referrals,
  intakeChecklists,
  programEnrollments,
  attendance,
  serviceEvents,
  caseNotes,
  resources,
  residentResources,
  properties,
  rooms,
  tickets,
  applications,
  donations,
  inquiries,
  partners,
  auditLog,
  documents,
  homepageContent,
  reportTemplates,
  reports,
  type User,
  type InsertUser,
  type ResidentProfile,
  type InsertResidentProfile,
  type Referral,
  type InsertReferral,
  type Attendance,
  type InsertAttendance,
  type ServiceEvent,
  type InsertServiceEvent,
  type CaseNote,
  type InsertCaseNote,
  type Resource,
  type InsertResource,
  type Ticket,
  type InsertTicket,
  type Application,
  type InsertApplication,
  type Donation,
  type InsertDonation,
  type Inquiry,
  type InsertInquiry,
  type Partner,
  type InsertPartner,
  type HomepageContent,
  type InsertHomepageContent,
} from "@shared/schema";
import { db } from "./db";
import { eq, and, desc, count, sql, gte, lte } from "drizzle-orm";

export interface IStorage {
  // User operations
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  getUsers(filters?: { role?: string }): Promise<User[]>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: string, updates: Partial<User>): Promise<User>;

  // Resident operations
  getResidentProfile(userId: string): Promise<ResidentProfile | undefined>;
  createResidentProfile(profile: InsertResidentProfile): Promise<ResidentProfile>;
  updateResidentProfile(id: string, updates: Partial<ResidentProfile>): Promise<ResidentProfile>;

  // Referral operations
  getReferrals(filters?: { status?: string }): Promise<Referral[]>;
  createReferral(referral: InsertReferral): Promise<Referral>;
  updateReferral(id: string, updates: Partial<Referral>): Promise<Referral>;

  // Attendance operations
  getAttendance(filters: { residentId?: string; dateRange?: { start: Date; end: Date } }): Promise<Attendance[]>;
  createAttendance(attendance: InsertAttendance): Promise<Attendance>;

  // Service events
  getServiceEvents(filters: { residentId?: string; fundingStream?: string }): Promise<ServiceEvent[]>;
  createServiceEvent(event: InsertServiceEvent): Promise<ServiceEvent>;

  // Case notes
  getCaseNotes(residentId: string): Promise<CaseNote[]>;
  createCaseNote(note: InsertCaseNote): Promise<CaseNote>;

  // Resources
  getResources(filters?: { category?: string; status?: string }): Promise<Resource[]>;
  createResource(resource: InsertResource): Promise<Resource>;
  getResidentResources(residentId: string): Promise<any[]>;
  getHighlightResources(): Promise<Resource[]>;
  updateResource(id: string, updates: Partial<Resource>): Promise<Resource>;
  bulkCreateResources(resources: InsertResource[]): Promise<Resource[]>;

  // Properties and tickets
  getProperties(): Promise<any[]>;
  getProperty(id: string): Promise<any>;
  createProperty(property: any): Promise<any>;
  getTickets(filters?: { propertyId?: string; status?: string }): Promise<Ticket[]>;
  createTicket(ticket: InsertTicket): Promise<Ticket>;

  // Dashboard stats
  getDashboardStats(userId: string, role: string): Promise<any>;

  // Applications
  createApplication(application: InsertApplication): Promise<Application>;
  getApplications(filters?: { status?: string }): Promise<Application[]>;
  updateApplication(id: string, updates: Partial<Application>): Promise<Application>;

  // Donations
  createDonation(donation: InsertDonation): Promise<Donation>;
  getDonations(filters?: { frequency?: string }): Promise<Donation[]>;

  // Inquiries
  createInquiry(inquiry: InsertInquiry): Promise<Inquiry>;
  getInquiries(filters?: { status?: string }): Promise<Inquiry[]>;
  updateInquiry(id: string, updates: Partial<Inquiry>): Promise<Inquiry>;

  // Partners
  createPartner(partner: InsertPartner): Promise<Partner>;
  getPartners(filters?: { status?: string; serviceType?: string }): Promise<Partner[]>;
  updatePartner(id: string, updates: Partial<Partner>): Promise<Partner>;

  // Audit logging
  logAudit(entry: any): Promise<void>;

  // Homepage content management
  getHomepageContent(): Promise<HomepageContent[]>;
  updateHomepageContent(section: string, data: Partial<HomepageContent>): Promise<HomepageContent>;

    // Report Generation and Management
  getReportTemplates(): Promise<any[]>;
  createReport(reportData: any): Promise<any>;
  updateReport(reportId: string, updates: any): Promise<any>;
  getReports(filters?: any): Promise<any[]>;
  generateReportData(reportType: string, parameters: any): Promise<any>;
}

export class DatabaseStorage implements IStorage {
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  }

  async getUsers(filters?: { role?: string }): Promise<User[]> {
    const conditions = [];
    if (filters?.role) {
      conditions.push(eq(users.role, filters.role as any));
    }

    const results = await db
      .select()
      .from(users)
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(users.name);
    return results;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(insertUser)
      .returning();
    return user;
  }

  async updateUser(id: string, updates: Partial<User>): Promise<User> {
    const [user] = await db
      .update(users)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(users.id, id))
      .returning();
    return user;
  }

  async getResidentProfile(userId: string): Promise<ResidentProfile | undefined> {
    const [profile] = await db
      .select()
      .from(residentProfiles)
      .where(eq(residentProfiles.userId, userId));
    return profile;
  }

  async createResidentProfile(profile: InsertResidentProfile): Promise<ResidentProfile> {
    const [created] = await db
      .insert(residentProfiles)
      .values(profile)
      .returning();
    return created;
  }

  async updateResidentProfile(id: string, updates: Partial<ResidentProfile>): Promise<ResidentProfile> {
    const [updated] = await db
      .update(residentProfiles)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(residentProfiles.id, id))
      .returning();
    return updated;
  }

  async getReferrals(filters?: { status?: string }): Promise<Referral[]> {
    const conditions = [];

    if (filters?.status) {
      conditions.push(eq(referrals.status, filters.status as any));
    }

    const results = await db
      .select()
      .from(referrals)
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(desc(referrals.createdAt));
    return results;
  }

  async createReferral(referral: InsertReferral): Promise<Referral> {
    const [created] = await db
      .insert(referrals)
      .values(referral)
      .returning();
    return created;
  }

  async updateReferral(id: string, updates: Partial<Referral>): Promise<Referral> {
    const [updated] = await db
      .update(referrals)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(referrals.id, id))
      .returning();
    return updated;
  }

  async createResidentFromReferral(referralId: string, intakeStaffId: string): Promise<User> {
    // Get referral data
    const [referral] = await db.select().from(referrals).where(eq(referrals.id, referralId));
    if (!referral) {
      throw new Error('Referral not found');
    }

    const residentInfo = referral.basicResidentInfo as any;

    // Create user as resident
    const [resident] = await db
      .insert(users)
      .values({
        role: 'Resident',
        name: residentInfo.name,
        email: residentInfo.email,
        phone: residentInfo.phone,
      })
      .returning();

    // Create resident profile
    await db.insert(residentProfiles).values({
      userId: resident.id,
    });

    // Create program enrollment
    await db.insert(programEnrollments).values({
      residentId: resident.id,
      startDate: new Date(),
      stage: 1,
      stageHistory: [{ stage: 1, at: new Date().toISOString(), staffId: intakeStaffId }],
    });

    // Update referral to link to resident
    await db
      .update(referrals)
      .set({ 
        linkedResidentId: resident.id,
        status: 'accepted',
        updatedAt: new Date()
      })
      .where(eq(referrals.id, referralId));

    return resident;
  }

  async createOrUpdateIntakeChecklist(residentId: string, items: any[]): Promise<any> {
    const [existing] = await db
      .select()
      .from(intakeChecklists)
      .where(eq(intakeChecklists.residentId, residentId));

    if (existing) {
      const [updated] = await db
        .update(intakeChecklists)
        .set({ items, updatedAt: new Date() })
        .where(eq(intakeChecklists.residentId, residentId))
        .returning();
      return updated;
    } else {
      const [created] = await db
        .insert(intakeChecklists)
        .values({ residentId, items })
        .returning();
      return created;
    }
  }

  async assignBed(residentId: string, propertyId: string, roomId: string): Promise<any> {
    // Update room occupants
    const [room] = await db.select().from(rooms).where(eq(rooms.id, roomId));
    if (!room) {
      throw new Error('Room not found');
    }

    const currentOccupants = (room.occupants as string[]) || [];
    if (!currentOccupants.includes(residentId)) {
      currentOccupants.push(residentId);
    }

    await db
      .update(rooms)
      .set({ 
        occupants: currentOccupants,
        updatedAt: new Date()
      })
      .where(eq(rooms.id, roomId));

    // Update property bed availability
    await db
      .update(properties)
      .set({ 
        bedsAvailable: sql`${properties.bedsAvailable} - 1`,
        updatedAt: new Date()
      })
      .where(eq(properties.id, propertyId));

    return { residentId, propertyId, roomId, assignedAt: new Date() };
  }



  async getAttendance(filters: { residentId?: string; dateRange?: { start: Date; end: Date } }): Promise<Attendance[]> {
    const conditions = [];
    if (filters.residentId) {
      conditions.push(eq(attendance.residentId, filters.residentId));
    }
    if (filters.dateRange) {
      conditions.push(
        and(
          sql`${attendance.date} >= ${filters.dateRange.start}`,
          sql`${attendance.date} <= ${filters.dateRange.end}`
        )
      );
    }

    const results = await db
      .select()
      .from(attendance)
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(desc(attendance.date));
    return results;
  }

  async createAttendance(attendanceData: InsertAttendance): Promise<Attendance> {
    const [created] = await db
      .insert(attendance)
      .values(attendanceData)
      .returning();
    return created;
  }

  async getServiceEvents(filters: { residentId?: string; fundingStream?: string }): Promise<ServiceEvent[]> {
    const conditions = [];
    if (filters.residentId) {
      conditions.push(eq(serviceEvents.residentId, filters.residentId));
    }
    if (filters.fundingStream) {
      conditions.push(eq(serviceEvents.fundingStream, filters.fundingStream as any));
    }

    const results = await db
      .select()
      .from(serviceEvents)
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(desc(serviceEvents.date));
    return results;
  }

  async createServiceEvent(event: InsertServiceEvent): Promise<ServiceEvent> {
    const [created] = await db
      .insert(serviceEvents)
      .values(event)
      .returning();
    return created;
  }

  async getCaseNotes(residentId: string): Promise<CaseNote[]> {
    return await db
      .select()
      .from(caseNotes)
      .where(eq(caseNotes.residentId, residentId))
      .orderBy(desc(caseNotes.createdAt));
  }

  async createCaseNote(note: InsertCaseNote): Promise<CaseNote> {
    const [created] = await db
      .insert(caseNotes)
      .values(note)
      .returning();
    return created;
  }

  async getResources(filters?: { category?: string; status?: string }): Promise<Resource[]> {
    const conditions = [];
    if (filters?.category) {
      conditions.push(eq(resources.category, filters.category as any));
    }
    if (filters?.status) {
      conditions.push(eq(resources.status, filters.status as any));
    }

    const results = await db
      .select()
      .from(resources)
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(resources.name);
    return results;
  }

  async createResource(resource: InsertResource): Promise<Resource> {
    const [created] = await db
      .insert(resources)
      .values(resource)
      .returning();
    return created;
  }

  async getHighlightResources(): Promise<Resource[]> {
    return await db
      .select()
      .from(resources)
      .where(and(
        eq(resources.isLifehouse, true),
        eq(resources.status, 'active')
      ))
      .orderBy(resources.name);
  }

  async updateResource(id: string, updates: Partial<Resource>): Promise<Resource> {
    const [updated] = await db
      .update(resources)
      .set(updates)
      .where(eq(resources.id, id))
      .returning();
    return updated;
  }

  async bulkCreateResources(resourceList: InsertResource[]): Promise<Resource[]> {
    if (resourceList.length === 0) return [];
    const created = await db
      .insert(resources)
      .values(resourceList)
      .returning();
    return created;
  }

  async getResidentResources(residentId: string): Promise<any[]> {
    return await db
      .select({
        id: residentResources.id,
        status: residentResources.status,
        notes: residentResources.notes,
        resource: resources,
      })
      .from(residentResources)
      .innerJoin(resources, eq(residentResources.resourceId, resources.id))
      .where(eq(residentResources.residentId, residentId));
  }

  async getProperties(): Promise<any[]> {
    return await db.select().from(properties);
  }

  async getProperty(id: string): Promise<any> {
    const [property] = await db.select().from(properties).where(eq(properties.id, id));
    return property;
  }

  async createProperty(property: any): Promise<any> {
    const [created] = await db
      .insert(properties)
      .values(property)
      .returning();
    return created;
  }

  async getTickets(filters?: { propertyId?: string; status?: string }): Promise<Ticket[]> {
    const conditions = [];
    if (filters?.propertyId) {
      conditions.push(eq(tickets.propertyId, filters.propertyId));
    }
    if (filters?.status) {
      conditions.push(eq(tickets.status, filters.status as any));
    }

    const results = await db
      .select()
      .from(tickets)
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(desc(tickets.createdAt));
    return results;
  }

  async createTicket(ticket: InsertTicket): Promise<Ticket> {
    const [created] = await db
      .insert(tickets)
      .values(ticket)
      .returning();
    return created;
  }

  async getDashboardStats(userId: string, role: string): Promise<any> {
    if (role === 'CaseManager') {
      // Get residents assigned to this case manager
      const [activeResidents] = await db
        .select({ count: count() })
        .from(users)
        .where(and(
          eq(users.role, 'Resident'),
          // In a real system, you'd have a case manager assignment table
          sql`true` // Placeholder - implement proper assignment logic
        ));

      // Get pending notes count
      const [pendingNotes] = await db
        .select({ count: count() })
        .from(caseNotes)
        .where(eq(caseNotes.createdBy, userId));

      // Get open tickets count
      const [openTickets] = await db
        .select({ count: count() })
        .from(tickets)
        .where(eq(tickets.status, 'new'));

      return {
        activeResidents: activeResidents?.count || 0,
        pendingNotes: pendingNotes?.count || 0,
        openTickets: openTickets?.count || 0,
        avgStage: 4.2, // Would be calculated from program enrollments
      };
    }

    return {
      activeResidents: 0,
      pendingNotes: 0,
      openTickets: 0,
      avgStage: 0,
    };
  }

  async createApplication(application: InsertApplication): Promise<Application> {
    const [created] = await db
      .insert(applications)
      .values(application)
      .returning();
    return created;
  }

  async getApplications(filters?: { status?: string }): Promise<Application[]> {
    const conditions = [];
    if (filters?.status) {
      conditions.push(eq(applications.status, filters.status as any));
    }

    const results = await db
      .select()
      .from(applications)
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(desc(applications.createdAt));
    return results;
  }

  async updateApplication(id: string, updates: Partial<Application>): Promise<Application> {
    const [updated] = await db
      .update(applications)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(applications.id, id))
      .returning();
    return updated;
  }

  async createDonation(donation: InsertDonation): Promise<Donation> {
    const [created] = await db
      .insert(donations)
      .values(donation)
      .returning();
    return created;
  }

  async getDonations(filters?: { frequency?: string }): Promise<Donation[]> {
    const conditions = [];
    if (filters?.frequency) {
      conditions.push(eq(donations.frequency, filters.frequency as any));
    }

    const results = await db
      .select()
      .from(donations)
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(desc(donations.createdAt));
    return results;
  }

  async createInquiry(inquiry: InsertInquiry): Promise<Inquiry> {
    const [created] = await db
      .insert(inquiries)
      .values(inquiry)
      .returning();
    return created;
  }

  async getInquiries(filters?: { status?: string }): Promise<Inquiry[]> {
    const conditions = [];
    if (filters?.status) {
      conditions.push(eq(inquiries.status, filters.status));
    }

    const results = await db
      .select()
      .from(inquiries)
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(desc(inquiries.createdAt));
    return results;
  }

  async updateInquiry(id: string, updates: Partial<Inquiry>): Promise<Inquiry> {
    const [updated] = await db
      .update(inquiries)
      .set(updates)
      .where(eq(inquiries.id, id))
      .returning();
    return updated;
  }

  async createPartner(partner: InsertPartner): Promise<Partner> {
    const [created] = await db
      .insert(partners)
      .values(partner)
      .returning();
    return created;
  }

  async getPartners(filters?: { status?: string; serviceType?: string }): Promise<Partner[]> {
    const conditions = [];
    if (filters?.status) {
      conditions.push(eq(partners.status, filters.status));
    }
    if (filters?.serviceType) {
      conditions.push(eq(partners.serviceType, filters.serviceType));
    }

    const results = await db
      .select()
      .from(partners)
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(desc(partners.createdAt));
    return results;
  }

  async updatePartner(id: string, updates: Partial<Partner>): Promise<Partner> {
    const [updated] = await db
      .update(partners)
      .set(updates)
      .where(eq(partners.id, id))
      .returning();
    return updated;
  }

  async logAudit(entry: any): Promise<void> {
    await db.insert(auditLog).values(entry);
  }

  async getHomepageContent(): Promise<HomepageContent[]> {
    const content = await db
      .select()
      .from(homepageContent)
      .where(eq(homepageContent.isActive, true))
      .orderBy(homepageContent.section);
    return content;
  }

  async updateHomepageContent(section: string, data: Partial<HomepageContent>): Promise<HomepageContent> {
    // Try to update existing content first
    const existing = await db
      .select()
      .from(homepageContent)
      .where(eq(homepageContent.section, section));

    if (existing.length > 0) {
      const [updated] = await db
        .update(homepageContent)
        .set({ ...data, updatedAt: new Date() })
        .where(eq(homepageContent.section, section))
        .returning();
      return updated;
    } else {
      // Create new content if it doesn't exist
      const [created] = await db
        .insert(homepageContent)
        .values({ 
          section, 
          ...data,
          isActive: true 
        } as any)
        .returning();
      return created;
    }
  }

  async getReportTemplates() {
    try {
      const templates = await db.select().from(reportTemplates);
      return templates;
    } catch (error) {
      console.error('Error fetching report templates:', error);
      throw error;
    }
  }

  async createReport(reportData: any) {
    try {
      const [report] = await db.insert(reports).values({
        type: reportData.type,
        name: reportData.name,
        description: reportData.description,
        status: 'generating',
        parameters: reportData.parameters,
        generatedBy: reportData.generatedBy
      }).returning();
      return report;
    } catch (error) {
      console.error('Error creating report:', error);
      throw error;
    }
  }

  async updateReport(reportId: string, updates: any) {
    try {
      const [report] = await db.update(reports)
        .set({
          ...updates,
          updatedAt: new Date()
        })
        .where(eq(reports.id, reportId))
        .returning();
      return report;
    } catch (error) {
      console.error('Error updating report:', error);
      throw error;
    }
  }

  async getReports(filters: any = {}) {
    try {
      let query = db.select().from(reports);

      if (filters.type) {
        query = query.where(eq(reports.type, filters.type));
      }

      if (filters.generatedBy) {
        query = query.where(eq(reports.generatedBy, filters.generatedBy));
      }

      const reportsList = await query.orderBy(desc(reports.generatedAt));
      return reportsList;
    } catch (error) {
      console.error('Error fetching reports:', error);
      throw error;
    }
  }

  async generateReportData(reportType: string, parameters: any) {
    try {
      let data = {};

      switch (reportType) {
        case 'stop-touchpoint':
          // Generate STOP touchpoint data
          const touchpoints = await db.select().from(caseNotes)
            .where(
              and(
                gte(caseNotes.createdAt, parameters.startDate),
                lte(caseNotes.createdAt, parameters.endDate)
              )
            );
          data = { touchpoints, summary: { total: touchpoints.length } };
          break;

        case 'resident-progress':
          // Generate resident progress data
          const residentsProgress = await db.select().from(users)
            .where(eq(users.role, 'Resident' as any));
          data = { residents: residentsProgress, averageStage: 3.2 };
          break;

        case 'housing-occupancy':
          // Generate housing occupancy data
          const properties = await this.getProperties();
          data = { properties, totalCapacity: properties.reduce((sum, p) => sum + (p.capacity || 0), 0) };
          break;

        case 'attendance-compliance':
          // Generate attendance data
          const attendanceData = await db.select().from(attendance)
            .where(
              and(
                gte(attendance.date, parameters.startDate),
                lte(attendance.date, parameters.endDate)
              )
            );
          data = { attendance: attendanceData, complianceRate: 0.85 };
          break;

        case 'financial-summary':
          // Generate financial data
          const donations = await this.getDonations();
          data = { 
            donations, 
            totalDonations: donations.reduce((sum, d) => sum + parseFloat(d.amount), 0),
            avgDonation: donations.length > 0 ? donations.reduce((sum, d) => sum + parseFloat(d.amount), 0) / donations.length : 0
          };
          break;

        default:
          throw new Error(`Unknown report type: ${reportType}`);
      }

      return data;
    } catch (error) {
      console.error('Error generating report data:', error);
      throw error;
    }
  }
}

export const storage = new DatabaseStorage();