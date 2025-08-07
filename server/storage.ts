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
  type Document as DBDocument,
  reportTemplates,
  reports,
  donors,
  donorDonations,
  donationGoals,
  donorSubscriptions,
  prospectiveResidents,
  crmActivities,
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
  type Donor,
  type InsertDonor,
  type DonorDonation,
  type InsertDonorDonation,
  type DonationGoal,
  type InsertDonationGoal,
  type DonorSubscription,
  type InsertDonorSubscription,
  type ProspectiveResident,
  type InsertProspectiveResident,
  type CrmActivity,
  type InsertCrmActivity,
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
  createOrUpdateResource(resource: InsertResource): Promise<Resource>;
  findResourceByName(name: string): Promise<Resource | undefined>;
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

  // Donor operations
  getDonors(filters?: { donorType?: string; email?: string }): Promise<Donor[]>;
  getDonor(id: string): Promise<Donor | undefined>;
  createDonor(donor: InsertDonor): Promise<Donor>;
  updateDonor(id: string, updates: Partial<Donor>): Promise<Donor>;
  deleteDonor(id: string): Promise<void>;
  findDonorByEmail(email: string): Promise<Donor | undefined>;

  // Donor donation operations
  getDonorDonations(filters?: { donorId?: string; campaignId?: string; status?: string }): Promise<DonorDonation[]>;
  createDonorDonation(donation: InsertDonorDonation): Promise<DonorDonation>;
  updateDonorDonation(id: string, updates: Partial<DonorDonation>): Promise<DonorDonation>;
  getDonorTotalDonations(donorId: string): Promise<number>;

  // Donation goal operations
  getDonationGoals(filters?: { isActive?: boolean; category?: string }): Promise<DonationGoal[]>;
  getDonationGoal(id: string): Promise<DonationGoal | undefined>;
  createDonationGoal(goal: InsertDonationGoal): Promise<DonationGoal>;
  updateDonationGoal(id: string, updates: Partial<DonationGoal>): Promise<DonationGoal>;
  deleteDonationGoal(id: string): Promise<void>;

  // Donor subscription operations
  getDonorSubscriptions(filters?: { donorId?: string; status?: string }): Promise<DonorSubscription[]>;
  createDonorSubscription(subscription: InsertDonorSubscription): Promise<DonorSubscription>;
  updateDonorSubscription(id: string, updates: Partial<DonorSubscription>): Promise<DonorSubscription>;
  cancelDonorSubscription(id: string): Promise<void>;

  // Prospective resident operations
  getProspectiveResidents(filters?: { status?: string; assignedTo?: string; priority?: string }): Promise<ProspectiveResident[]>;
  getProspectiveResident(id: string): Promise<ProspectiveResident | undefined>;
  createProspectiveResident(resident: InsertProspectiveResident): Promise<ProspectiveResident>;
  updateProspectiveResident(id: string, updates: Partial<ProspectiveResident>): Promise<ProspectiveResident>;
  deleteProspectiveResident(id: string): Promise<void>;

  // CRM activity operations
  getCrmActivities(filters?: { entityType?: string; entityId?: string; performedBy?: string }): Promise<CrmActivity[]>;
  createCrmActivity(activity: InsertCrmActivity): Promise<CrmActivity>;
  updateCrmActivity(id: string, updates: Partial<CrmActivity>): Promise<CrmActivity>;
  deleteCrmActivity(id: string): Promise<void>;

  // Document operations
  getDocuments(filters?: { ownerType?: string; ownerId?: string }): Promise<DBDocument[]>;
  getDocument(id: string): Promise<DBDocument | undefined>;
  createDocument(document: Omit<DBDocument, 'id' | 'uploadedAt'>): Promise<DBDocument>;
  updateDocument(id: string, updates: Partial<DBDocument>): Promise<DBDocument>;
  deleteDocument(id: string): Promise<void>;
  getDocumentsByOwner(ownerType: string, ownerId: string): Promise<DBDocument[]>;
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

  // Create new resident (for onboarding wizard)
  async createResident(residentData: any): Promise<any> {
    const bcrypt = await import('bcryptjs');
    
    // First create the user account
    const [newUser] = await db.insert(users).values({
      name: `${residentData.firstName} ${residentData.lastName}`,
      role: 'Resident' as any,
      email: residentData.email || null,
      phone: residentData.phone,
      passwordHash: await bcrypt.hash(residentData.phone || 'temp1234', 10)
    }).returning();

    // Then create the resident profile with all details
    const [newProfile] = await db.insert(residentProfiles).values({
      userId: newUser.id,
      dateOfBirth: residentData.dateOfBirth ? new Date(residentData.dateOfBirth) : null,
      justiceStatus: residentData.justiceStatus,
      agentName: residentData.paroleProbationOfficer,
      agentEmail: null,
      agentPhone: residentData.paroleProbationPhone,
      releaseDate: residentData.releaseDate ? new Date(residentData.releaseDate) : null,
      educationLevel: residentData.educationLevel,
      emergencyContact: {
        name: residentData.emergencyContact,
        phone: residentData.emergencyPhone,
        relation: 'Emergency Contact'
      },
      // Store complete onboarding data
      onboardingData: residentData.onboardingData || null,
      onboardingDocuments: residentData.onboardingDocuments || [],
      moveInDate: residentData.moveInDate ? new Date(residentData.moveInDate) : null,
      propertyAssignment: residentData.propertyAssignment || null,
      roomAssignment: residentData.roomAssignment || null,
      isVeteran: residentData.isVeteran || false,
      hasDisability: residentData.hasDisability || false,
      specialAccommodations: residentData.specialAccommodations || null,
      housingHistory: residentData.housingHistory || null,
      employmentStatus: residentData.employmentStatus || null,
      medicalNeeds: residentData.medicalNeeds || null,
      mentalHealthNeeds: residentData.mentalHealthNeeds || null,
      substanceUseHistory: residentData.substanceUseHistory || null,
      employmentGoals: residentData.employmentGoals || null,
      educationGoals: residentData.educationGoals || null,
      literacyLevel: residentData.literacyLevel || null,
      race: residentData.race || null,
      ethnicity: residentData.ethnicity || null,
      gender: residentData.gender || null,
      preferredPronouns: residentData.preferredPronouns || null,
      ssn: residentData.ssn || null, // Should be encrypted in production
      hasChildren: residentData.hasChildren || false,
      childrenDetails: residentData.childrenDetails || null,
      paroleProbationOfficer: residentData.paroleProbationOfficer || null,
      paroleProbationPhone: residentData.paroleProbationPhone || null,
      courtDate: residentData.courtDate ? new Date(residentData.courtDate) : null,
      onboardingCompletedAt: residentData.onboardingCompletedAt || new Date(),
      onboardingCompletedBy: residentData.onboardingCompletedBy || null,
      goalsSummary: `Employment: ${residentData.employmentGoals || 'Not specified'}
Education: ${residentData.educationGoals || 'Not specified'}
Medical: ${residentData.medicalNeeds || 'None'}
Mental Health: ${residentData.mentalHealthNeeds || 'None'}
Children: ${residentData.hasChildren ? residentData.childrenDetails || 'Has children' : 'No children'}
Veteran: ${residentData.isVeteran ? 'Yes' : 'No'}
Disability: ${residentData.hasDisability ? 'Yes' : 'No'}
Notes: ${residentData.eligibilityNotes || 'None'}`
    }).returning();

    return {
      ...newUser,
      profile: newProfile
    };
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

  async findResourceByName(name: string): Promise<Resource | undefined> {
    const [resource] = await db
      .select()
      .from(resources)
      .where(eq(resources.name, name))
      .limit(1);
    return resource;
  }

  async createOrUpdateResource(resource: InsertResource): Promise<Resource> {
    // Check if resource already exists by name
    const existing = await this.findResourceByName(resource.name);

    if (existing) {
      console.log(`[Storage] Resource "${resource.name}" already exists, updating instead`);

      // Update existing resource with new data, preserving certain fields
      const [updated] = await db
        .update(resources)
        .set({
          description: resource.description || existing.description,
          category: resource.category || existing.category,
          eligibility: resource.eligibility || existing.eligibility,
          benefitAmount: resource.benefitAmount || existing.benefitAmount,
          geo: resource.geo || existing.geo,
          url: resource.url || existing.url,
          contact: resource.contact || existing.contact,
          languages: resource.languages || existing.languages,
          tags: resource.tags || existing.tags,
          status: resource.status || existing.status,
          updatedAt: new Date()
        })
        .where(eq(resources.id, existing.id))
        .returning();

      return updated;
    } else {
      // Create new resource
      console.log(`[Storage] Creating new resource: ${resource.name}`);
      return this.createResource(resource);
    }
  }

  async getHighlightResources(): Promise<Resource[]> {
    const highlightedResources = await db
      .select()
      .from(resources)
      .where(and(
        eq(resources.isLifehouse, true),
        eq(resources.status, 'active')
      ))
      .orderBy(resources.name);
    return highlightedResources;
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
      let whereConditions = [];

      if (filters.type) {
        whereConditions.push(eq(reports.type, filters.type));
      }

      if (filters.generatedBy) {
        whereConditions.push(eq(reports.generatedBy, filters.generatedBy));
      }

      const query = db.select().from(reports);
      const finalQuery = whereConditions.length > 0 
        ? query.where(and(...whereConditions))
        : query;

      const reportsList = await finalQuery.orderBy(desc(reports.generatedAt));
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

  // Donor operations
  async getDonors(filters?: { donorType?: string; email?: string }): Promise<Donor[]> {
    const conditions = [];
    if (filters?.donorType) {
      conditions.push(eq(donors.donorType, filters.donorType));
    }
    if (filters?.email) {
      conditions.push(eq(donors.email, filters.email));
    }

    const query = db.select().from(donors);
    const finalQuery = conditions.length > 0 
      ? query.where(and(...conditions))
      : query;

    return await finalQuery.orderBy(desc(donors.totalDonated));
  }

  async getDonor(id: string): Promise<Donor | undefined> {
    const [donor] = await db.select().from(donors).where(eq(donors.id, id));
    return donor;
  }

  async createDonor(donor: InsertDonor): Promise<Donor> {
    const [newDonor] = await db.insert(donors).values(donor).returning();
    return newDonor;
  }

  async updateDonor(id: string, updates: Partial<Donor>): Promise<Donor> {
    const [updated] = await db
      .update(donors)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(donors.id, id))
      .returning();
    return updated;
  }

  async deleteDonor(id: string): Promise<void> {
    await db.delete(donors).where(eq(donors.id, id));
  }

  async findDonorByEmail(email: string): Promise<Donor | undefined> {
    const [donor] = await db.select().from(donors).where(eq(donors.email, email));
    return donor;
  }

  // Donor donation operations
  async getDonorDonations(filters?: { donorId?: string; campaignId?: string; status?: string }): Promise<DonorDonation[]> {
    const conditions = [];
    if (filters?.donorId) {
      conditions.push(eq(donorDonations.donorId, filters.donorId));
    }
    if (filters?.campaignId) {
      conditions.push(eq(donorDonations.campaignId, filters.campaignId));
    }
    if (filters?.status) {
      conditions.push(eq(donorDonations.status, filters.status));
    }

    const query = db.select().from(donorDonations);
    const finalQuery = conditions.length > 0 
      ? query.where(and(...conditions))
      : query;

    return await finalQuery.orderBy(desc(donorDonations.createdAt));
  }

  async createDonorDonation(donation: InsertDonorDonation): Promise<DonorDonation> {
    const [newDonation] = await db.insert(donorDonations).values(donation).returning();

    // Update donor's total donated and last donation date
    const donor = await this.getDonor(newDonation.donorId);
    if (donor) {
      const total = await this.getDonorTotalDonations(newDonation.donorId);
      await this.updateDonor(newDonation.donorId, {
        totalDonated: total.toString(),
        lastDonationDate: new Date()
      });
    }

    // Update campaign current amount if applicable
    if (newDonation.campaignId) {
      const goal = await this.getDonationGoal(newDonation.campaignId);
      if (goal) {
        const currentAmount = parseFloat(goal.currentAmount || '0') + parseFloat(newDonation.amount);
        await this.updateDonationGoal(newDonation.campaignId, {
          currentAmount: currentAmount.toString()
        });
      }
    }

    return newDonation;
  }

  async updateDonorDonation(id: string, updates: Partial<DonorDonation>): Promise<DonorDonation> {
    const [updated] = await db
      .update(donorDonations)
      .set(updates)
      .where(eq(donorDonations.id, id))
      .returning();
    return updated;
  }

  async getDonorTotalDonations(donorId: string): Promise<number> {
    const donations = await this.getDonorDonations({ donorId });
    return donations.reduce((sum, d) => sum + parseFloat(d.amount), 0);
  }

  // Donation goal operations
  async getDonationGoals(filters?: { isActive?: boolean; category?: string }): Promise<DonationGoal[]> {
    const conditions = [];
    if (filters?.isActive !== undefined) {
      conditions.push(eq(donationGoals.isActive, filters.isActive));
    }
    if (filters?.category) {
      conditions.push(eq(donationGoals.category, filters.category));
    }

    const query = db.select().from(donationGoals);
    const finalQuery = conditions.length > 0 
      ? query.where(and(...conditions))
      : query;

    return await finalQuery.orderBy(desc(donationGoals.createdAt));
  }

  async getDonationGoal(id: string): Promise<DonationGoal | undefined> {
    const [goal] = await db.select().from(donationGoals).where(eq(donationGoals.id, id));
    return goal;
  }

  async createDonationGoal(goal: InsertDonationGoal): Promise<DonationGoal> {
    const [newGoal] = await db.insert(donationGoals).values(goal).returning();
    return newGoal;
  }

  async updateDonationGoal(id: string, updates: Partial<DonationGoal>): Promise<DonationGoal> {
    const [updated] = await db
      .update(donationGoals)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(donationGoals.id, id))
      .returning();
    return updated;
  }

  async deleteDonationGoal(id: string): Promise<void> {
    await db.delete(donationGoals).where(eq(donationGoals.id, id));
  }

  // Donor subscription operations
  async getDonorSubscriptions(filters?: { donorId?: string; status?: string }): Promise<DonorSubscription[]> {
    const conditions = [];
    if (filters?.donorId) {
      conditions.push(eq(donorSubscriptions.donorId, filters.donorId));
    }
    if (filters?.status) {
      conditions.push(eq(donorSubscriptions.status, filters.status));
    }

    const query = db.select().from(donorSubscriptions);
    const finalQuery = conditions.length > 0 
      ? query.where(and(...conditions))
      : query;

    return await finalQuery.orderBy(desc(donorSubscriptions.createdAt));
  }

  async createDonorSubscription(subscription: InsertDonorSubscription): Promise<DonorSubscription> {
    const [newSubscription] = await db.insert(donorSubscriptions).values(subscription).returning();
    return newSubscription;
  }

  async updateDonorSubscription(id: string, updates: Partial<DonorSubscription>): Promise<DonorSubscription> {
    const [updated] = await db
      .update(donorSubscriptions)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(donorSubscriptions.id, id))
      .returning();
    return updated;
  }

  async cancelDonorSubscription(id: string): Promise<void> {
    await this.updateDonorSubscription(id, {
      status: 'cancelled',
      cancelledAt: new Date()
    });
  }

  // Prospective resident operations
  async getProspectiveResidents(filters?: { status?: string; assignedTo?: string; priority?: string }): Promise<ProspectiveResident[]> {
    const conditions = [];
    if (filters?.status) {
      conditions.push(eq(prospectiveResidents.status, filters.status));
    }
    if (filters?.assignedTo) {
      conditions.push(eq(prospectiveResidents.assignedTo, filters.assignedTo));
    }
    if (filters?.priority) {
      conditions.push(eq(prospectiveResidents.priority, filters.priority));
    }

    const query = db.select().from(prospectiveResidents);
    const finalQuery = conditions.length > 0 
      ? query.where(and(...conditions))
      : query;

    return await finalQuery.orderBy(desc(prospectiveResidents.createdAt));
  }

  async getProspectiveResident(id: string): Promise<ProspectiveResident | undefined> {
    const [resident] = await db.select().from(prospectiveResidents).where(eq(prospectiveResidents.id, id));
    return resident;
  }

  async createProspectiveResident(resident: InsertProspectiveResident): Promise<ProspectiveResident> {
    const [newResident] = await db.insert(prospectiveResidents).values(resident).returning();
    return newResident;
  }

  async updateProspectiveResident(id: string, updates: Partial<ProspectiveResident>): Promise<ProspectiveResident> {
    const [updated] = await db
      .update(prospectiveResidents)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(prospectiveResidents.id, id))
      .returning();
    return updated;
  }

  async deleteProspectiveResident(id: string): Promise<void> {
    await db.delete(prospectiveResidents).where(eq(prospectiveResidents.id, id));
  }

  // CRM activity operations
  async getCrmActivities(filters?: { entityType?: string; entityId?: string; performedBy?: string }): Promise<CrmActivity[]> {
    const conditions = [];
    if (filters?.entityType) {
      conditions.push(eq(crmActivities.entityType, filters.entityType));
    }
    if (filters?.entityId) {
      conditions.push(eq(crmActivities.entityId, filters.entityId));
    }
    if (filters?.performedBy) {
      conditions.push(eq(crmActivities.performedBy, filters.performedBy));
    }

    const query = db.select().from(crmActivities);
    const finalQuery = conditions.length > 0 
      ? query.where(and(...conditions))
      : query;

    return await finalQuery.orderBy(desc(crmActivities.createdAt));
  }

  async createCrmActivity(activity: InsertCrmActivity): Promise<CrmActivity> {
    const [newActivity] = await db.insert(crmActivities).values(activity).returning();
    return newActivity;
  }

  async updateCrmActivity(id: string, updates: Partial<CrmActivity>): Promise<CrmActivity> {
    const [updated] = await db
      .update(crmActivities)
      .set(updates)
      .where(eq(crmActivities.id, id))
      .returning();
    return updated;
  }

  async deleteCrmActivity(id: string): Promise<void> {
    await db.delete(crmActivities).where(eq(crmActivities.id, id));
  }

  // Document operations
  async getDocuments(filters?: { ownerType?: string; ownerId?: string }): Promise<DBDocument[]> {
    const conditions = [];
    if (filters?.ownerType) {
      conditions.push(eq(documents.ownerType, filters.ownerType));
    }
    if (filters?.ownerId) {
      conditions.push(eq(documents.ownerId, filters.ownerId));
    }

    const query = db.select().from(documents);
    const finalQuery = conditions.length > 0 
      ? query.where(and(...conditions))
      : query;

    return await finalQuery.orderBy(desc(documents.uploadedAt));
  }

  async getDocument(id: string): Promise<DBDocument | undefined> {
    const [document] = await db.select().from(documents).where(eq(documents.id, id));
    return document;
  }

  async createDocument(document: Omit<DBDocument, 'id' | 'uploadedAt'>): Promise<DBDocument> {
    const [newDocument] = await db.insert(documents).values(document).returning();
    return newDocument;
  }

  async updateDocument(id: string, updates: Partial<DBDocument>): Promise<DBDocument> {
    const [updated] = await db
      .update(documents)
      .set(updates)
      .where(eq(documents.id, id))
      .returning();
    return updated;
  }

  async deleteDocument(id: string): Promise<void> {
    await db.delete(documents).where(eq(documents.id, id));
  }

  async getDocumentsByOwner(ownerType: string, ownerId: string): Promise<DBDocument[]> {
    return await db
      .select()
      .from(documents)
      .where(and(
        eq(documents.ownerType, ownerType),
        eq(documents.ownerId, ownerId)
      ))
      .orderBy(desc(documents.uploadedAt));
  }
}

export const storage = new DatabaseStorage();