import { sql, relations } from "drizzle-orm";
import {
  pgTable,
  uuid,
  varchar,
  text,
  timestamp,
  integer,
  boolean,
  decimal,
  jsonb,
  pgEnum,
  index,
  uniqueIndex,
  date,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Enums
export const roleEnum = pgEnum("role", [
  "Resident",
  "CaseManager",
  "Intake",
  "Referrer",
  "Auditor",
  "Partner",
  "Guest"
]);

export const languageEnum = pgEnum("language", ["en", "es"]);
export const readingLevelEnum = pgEnum("reading_level", ["resident_5th", "professional"]);
export const justiceStatusEnum = pgEnum("justice_status", ["parole", "probation", "formerly_incarcerated", "completed_sentence", "pre_trial", "other"]);
export const referralSourceEnum = pgEnum("referral_source", ["self", "parole", "probation", "CBO"]);
export const referralStatusEnum = pgEnum("referral_status", ["new", "in_review", "accepted", "waitlist", "declined"]);
export const eventTypeEnum = pgEnum("event_type", ["workshop", "one_on_one", "coaching", "check_in"]);
export const fundingStreamEnum = pgEnum("funding_stream", ["STOP", "ECM", "CommunitySupport", "Other"]);
export const programTypeEnum = pgEnum("program_type", ["mandatory", "optional"]);
export const programFrequencyEnum = pgEnum("program_frequency", ["daily", "weekly", "twice_weekly", "monthly", "as_needed"]);
export const noteTypeEnum = pgEnum("note_type", ["STOP_progress", "ECM_encounter", "Workshop", "Coaching", "Incident", "Other"]);
export const resourceCategoryEnum = pgEnum("resource_category", [
  "housing", "food", "id_docs", "healthcare", "sud_mh_referral", 
  "employment", "training", "legal", "transport", "family", "money", "emergency", "education"
]);
export const resourceStatusEnum = pgEnum("resource_status", ["active", "archived"]);
export const residentResourceStatusEnum = pgEnum("resident_resource_status", [
  "applied", "approved", "denied", "received", "bookmarked"
]);
export const ticketCategoryEnum = pgEnum("ticket_category", ["maintenance", "cleaning", "it", "safety", "other"]);
export const ticketPriorityEnum = pgEnum("ticket_priority", ["low", "normal", "high", "urgent"]);
export const ticketStatusEnum = pgEnum("ticket_status", ["new", "assigned", "in_progress", "on_hold", "resolved"]);
export const donationFrequencyEnum = pgEnum("donation_frequency", ["one_time", "monthly"]);
export const donationDesignationEnum = pgEnum("donation_designation", ["general", "sponsor_resident"]);
export const applicationStatusEnum = pgEnum("application_status", ["new", "under_review", "in_progress", "approved", "waitlisted", "denied", "onboard", "closed"]);
export const sessionStatusEnum = pgEnum("session_status", ["planned", "completed", "cancelled"]);
export const notificationStatusEnum = pgEnum("notification_status", ["unread", "read", "archived"]);
export const notificationPriorityEnum = pgEnum("notification_priority", ["low", "normal", "high", "urgent"]);

// Session storage table (required for auth)
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)]
);

// Users table (required for auth) 
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`), // Keep default for migration compatibility
  role: roleEnum("role").notNull().default("Resident"),
  name: text("name"),
  email: varchar("email").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  phone: varchar("phone"),
  isAdmin: boolean("is_admin").default(false), // Admin access can be granted to any role
  language: languageEnum("language").default("en"),
  readingLevel: readingLevelEnum("reading_level").default("professional"),
  passwordHash: varchar("password_hash"), // Keep for backward compatibility
  totpSecret: varchar("totp_secret"), // encrypted
  twoFAEnabled: boolean("two_fa_enabled").default(false),
  ssoProviders: jsonb("sso_providers"), // array of {provider, subjectId}
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("users_role_idx").on(table.role),
  index("users_email_idx").on(table.email),
]);

export const residentProfiles = pgTable("resident_profiles", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: uuid("user_id").references(() => users.id).notNull(),
  applicationId: uuid("application_id").references(() => applications.id), // Track original application
  dateOfBirth: timestamp("date_of_birth"),
  justiceStatus: justiceStatusEnum("justice_status"),
  agentName: varchar("agent_name"),
  agentEmail: varchar("agent_email"),
  agentPhone: varchar("agent_phone"),
  releaseDate: timestamp("release_date"),
  idOnFile: jsonb("id_on_file"), // {stateID: boolean, ssn: boolean, birthCert: boolean, benefitsCard: boolean}
  benefits: jsonb("benefits"), // {mediCal: boolean, calFresh: boolean, GA: boolean, SSI: boolean, otherText: string}
  incomeBand: varchar("income_band"), // none | <1k | 1-2k | 2-4k | 4k+
  jobInterests: jsonb("job_interests"), // array of strings
  educationLevel: varchar("education_level"),
  driverLicenseStatus: varchar("driver_license_status"), // none | expired | valid | inProgress
  emergencyContact: jsonb("emergency_contact"), // {name, phone, relation}
  consents: jsonb("consents"), // array of {type, signedAt, ip, docId}
  goalsSummary: text("goals_summary"),
  // Onboarding data fields
  onboardingData: jsonb("onboarding_data"), // Complete onboarding form data
  onboardingDocuments: jsonb("onboarding_documents"), // Array of document IDs
  moveInDate: timestamp("move_in_date"),
  propertyAssignment: varchar("property_assignment"),
  roomAssignment: varchar("room_assignment"),
  isVeteran: boolean("is_veteran").default(false),
  hasDisability: boolean("has_disability").default(false),
  specialAccommodations: text("special_accommodations"),
  housingHistory: text("housing_history"),
  employmentStatus: varchar("employment_status"),
  medicalNeeds: text("medical_needs"),
  mentalHealthNeeds: text("mental_health_needs"),
  substanceUseHistory: text("substance_use_history"),
  employmentGoals: text("employment_goals"),
  educationGoals: text("education_goals"),
  literacyLevel: varchar("literacy_level"),
  race: varchar("race"),
  ethnicity: varchar("ethnicity"),
  gender: varchar("gender"),
  preferredPronouns: varchar("preferred_pronouns"),
  ssn: varchar("ssn"), // encrypted
  hasChildren: boolean("has_children").default(false),
  childrenDetails: text("children_details"),
  paroleProbationOfficer: varchar("parole_probation_officer"),
  paroleProbationPhone: varchar("parole_probation_phone"),
  courtDate: timestamp("court_date"),
  onboardingCompletedAt: timestamp("onboarding_completed_at"),
  onboardingCompletedBy: uuid("onboarding_completed_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("resident_profiles_user_id_idx").on(table.userId),
]);

// Employee profiles for staff onboarding data
export const employeeProfiles = pgTable("employee_profiles", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: uuid("user_id").references(() => users.id).notNull(),
  role: varchar("role"), // Current role/title
  title: varchar("title"), // Job title
  startDate: timestamp("start_date"),
  licenseNumber: varchar("license_number"),
  trainingLevel: varchar("training_level"),
  backgroundCheck: varchar("background_check"),
  tbTest: varchar("tb_test"),
  references: varchar("references"),
  signedPolicies: varchar("signed_policies"),
  emergencyContact: jsonb("emergency_contact"), // {name, phone, relationship}
  driversLicense: varchar("drivers_license"),
  driversLicenseExpiry: timestamp("drivers_license_expiry"),
  autoInsurance: varchar("auto_insurance"),
  autoInsuranceExpiry: timestamp("auto_insurance_expiry"),
  onboardingData: jsonb("onboarding_data"), // Complete case manager onboarding form data
  onboardingDocuments: jsonb("onboarding_documents"), // Array of document IDs
  certifications: jsonb("certifications"), // Array of {name, issuer, date, expiry}
  specializations: jsonb("specializations"), // Array of specialization areas
  supervisorId: uuid("supervisor_id").references(() => users.id),
  department: varchar("department"),
  officeLocation: varchar("office_location"),
  workPhone: varchar("work_phone"),
  workEmail: varchar("work_email"),
  onboardingCompletedAt: timestamp("onboarding_completed_at"),
  onboardingCompletedBy: uuid("onboarding_completed_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("employee_profiles_user_id_idx").on(table.userId),
]);

export const referrals = pgTable("referrals", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  confirmationNumber: varchar("confirmation_number").unique(),
  source: referralSourceEnum("source").notNull(),
  referrerOrg: varchar("referrer_org"),
  referrerName: varchar("referrer_name"),
  referrerEmail: varchar("referrer_email"),
  referrerPhone: varchar("referrer_phone"),
  basicResidentInfo: jsonb("basic_resident_info"), // {name, email, phone, zip, earliestReadyDate}
  notes: text("notes"),
  status: referralStatusEnum("status").default("new"),
  linkedResidentId: uuid("linked_resident_id").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("referrals_status_idx").on(table.status),
  index("referrals_created_at_idx").on(table.createdAt),
  index("referrals_confirmation_idx").on(table.confirmationNumber),
]);

export const intakeChecklists = pgTable("intake_checklists", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  residentId: uuid("resident_id").references(() => users.id).notNull(),
  items: jsonb("items"), // array of {key, label, status: pending|done|na, completedAt, staffId}
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const programEnrollments = pgTable("program_enrollments", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  residentId: uuid("resident_id").references(() => users.id).notNull(),
  startDate: timestamp("start_date").notNull(),
  initialTermDays: integer("initial_term_days").default(90),
  targetLOS: integer("target_los"), // target length of stay in days
  stage: integer("stage").default(1), // 1-7
  stageHistory: jsonb("stage_history"), // array of {stage, at, staffId}
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("program_enrollments_resident_id_idx").on(table.residentId),
  index("program_enrollments_stage_idx").on(table.stage),
]);

// Programs table for Life House offerings
export const programs = pgTable("programs", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  name: varchar("name").notNull(),
  description: text("description"),
  type: programTypeEnum("type").notNull(), // mandatory, optional
  frequency: programFrequencyEnum("frequency").notNull(), // daily, weekly, twice_weekly, monthly, as_needed
  durationMinutes: integer("duration_minutes").notNull(),
  maxParticipants: integer("max_participants"),
  isActive: boolean("is_active").default(true),
  requirements: text("requirements"),
  objectives: jsonb("objectives"), // array of program objectives
  curriculum: jsonb("curriculum"), // structured curriculum data
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("programs_type_idx").on(table.type),
  index("programs_active_idx").on(table.isActive),
]);

// Program sessions table
export const programSessions = pgTable("program_sessions", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  programId: uuid("program_id").references(() => programs.id).notNull(),
  title: varchar("title", { length: 140 }).notNull(),
  icon: varchar("icon"),
  dateStart: timestamp("date_start").notNull(),
  dateEnd: timestamp("date_end").notNull(),
  location: varchar("location"),
  facilitatorId: uuid("facilitator_id").references(() => users.id),
  status: sessionStatusEnum("status").default("planned"),
  tags: jsonb("tags"), // array of strings
  maxParticipants: integer("max_participants"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("program_sessions_program_id_idx").on(table.programId),
  index("program_sessions_date_start_idx").on(table.dateStart),
  index("program_sessions_status_idx").on(table.status),
]);

// Session attendance records
export const sessionAttendance = pgTable("session_attendance", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  sessionId: uuid("session_id").references(() => programSessions.id).notNull(),
  residentId: uuid("resident_id").references(() => users.id).notNull(),
  checkedInAt: timestamp("checked_in_at"),
  checkedOutAt: timestamp("checked_out_at"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  uniqueIndex("session_attendance_unique_idx").on(table.sessionId, table.residentId),
  index("session_attendance_session_id_idx").on(table.sessionId),
  index("session_attendance_resident_id_idx").on(table.residentId),
]);

export const attendance = pgTable("attendance", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  residentId: uuid("resident_id").references(() => users.id).notNull(),
  staffId: uuid("staff_id").references(() => users.id).notNull(),
  date: timestamp("date").notNull(),
  eventType: eventTypeEnum("event_type").notNull(),
  durationMinutes: integer("duration_minutes"),
  notes: text("notes"),
  fundingTag: fundingStreamEnum("funding_tag"),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("attendance_resident_date_idx").on(table.residentId, table.date),
]);

export const serviceEvents = pgTable("service_events", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  residentId: uuid("resident_id").references(() => users.id).notNull(),
  staffId: uuid("staff_id").references(() => users.id).notNull(),
  fundingStream: fundingStreamEnum("funding_stream").notNull(),
  serviceType: varchar("service_type").notNull(),
  description: text("description"),
  units: integer("units"), // minutes or session count
  billable: boolean("billable").default(false),
  attachments: jsonb("attachments"), // array of document IDs
  date: timestamp("date").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("service_events_resident_date_idx").on(table.residentId, table.date),
  index("service_events_funding_stream_idx").on(table.fundingStream),
]);

export const caseNotes = pgTable("case_notes", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  residentId: uuid("resident_id").references(() => users.id).notNull(),
  createdBy: uuid("created_by").references(() => users.id).notNull(),
  noteType: noteTypeEnum("note_type").notNull(),
  text: text("text").notNull(),
  tags: jsonb("tags"), // array of strings
  private: boolean("private").default(true),
  aiReason: text("ai_reason"), // AI rationale for note generation
  programId: uuid("program_id").references(() => programs.id), // Link to program
  priority: ticketPriorityEnum("priority").default("normal"),
  confidential: boolean("confidential").default(false),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("case_notes_resident_created_at_idx").on(table.residentId, table.createdAt),
  index("case_notes_program_id_idx").on(table.programId),
]);

export const resources = pgTable("resources", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  category: resourceCategoryEnum("category").notNull(),
  name: varchar("name").notNull(),
  description: text("description"),
  eligibility: text("eligibility"),
  benefitAmount: decimal("benefit_amount"),
  geo: jsonb("geo"), // {zip, city, county, state}
  url: varchar("url"),
  contact: jsonb("contact"), // {name, phone, email}
  address: text("address"), // Full address for location
  phone: varchar("phone"), // Primary phone number  
  website: varchar("website"), // Website URL
  hours: jsonb("hours"), // {mon: "9-5", tue: "9-5", ...}
  languages: jsonb("languages"), // array of language codes
  status: resourceStatusEnum("status").default("active"),
  tags: jsonb("tags"), // array of strings
  isLifehouse: boolean("is_lifehouse").default(false), // Life House owned programs
  image: varchar("image"), // Image URL for flagship programs
  summary: text("summary"), // Short pitch for flagship programs
  categories: jsonb("categories"), // Array of categories for flagship programs
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("resources_category_idx").on(table.category),
  index("resources_status_idx").on(table.status),
  index("resources_is_lifehouse_idx").on(table.isLifehouse),
]);

export const residentResources = pgTable("resident_resources", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  residentId: uuid("resident_id").references(() => users.id).notNull(),
  resourceId: uuid("resource_id").references(() => resources.id).notNull(),
  status: residentResourceStatusEnum("status").notNull(),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  uniqueIndex("resident_resources_unique_idx").on(table.residentId, table.resourceId),
]);

export const properties = pgTable("properties", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  address: varchar("address").notNull(),
  city: varchar("city").notNull(),
  state: varchar("state").notNull(),
  zip: varchar("zip").notNull(),
  bedrooms: integer("bedrooms"),
  bedsTotal: integer("beds_total"),
  bedsAvailable: integer("beds_available"),
  occupancyLimit: integer("occupancy_limit"),
  amenities: jsonb("amenities"), // array of strings
  latitude: decimal("latitude", { precision: 10, scale: 8 }),
  longitude: decimal("longitude", { precision: 11, scale: 8 }),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const rooms = pgTable("rooms", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  propertyId: uuid("property_id").references(() => properties.id).notNull(),
  roomNumber: varchar("room_number").notNull(),
  beds: integer("beds"),
  occupants: jsonb("occupants"), // array of resident IDs
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("rooms_property_id_idx").on(table.propertyId),
]);

export const tickets = pgTable("tickets", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  propertyId: uuid("property_id").references(() => properties.id).notNull(),
  roomId: uuid("room_id").references(() => rooms.id),
  residentId: uuid("resident_id").references(() => users.id),
  createdBy: uuid("created_by").references(() => users.id).notNull(),
  category: ticketCategoryEnum("category").notNull(),
  priority: ticketPriorityEnum("priority").default("normal"),
  description: text("description").notNull(),
  photos: jsonb("photos"), // array of document IDs
  status: ticketStatusEnum("status").default("new"),
  assignedTo: uuid("assigned_to").references(() => users.id),
  comments: jsonb("comments").default([]), // array of comment objects
  slaDueAt: timestamp("sla_due_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
  assignedAt: timestamp("assigned_at"),
  resolvedAt: timestamp("resolved_at"),
}, (table) => [
  index("tickets_property_id_idx").on(table.propertyId),
  index("tickets_status_idx").on(table.status),
  index("tickets_priority_idx").on(table.priority),
  index("tickets_created_by_idx").on(table.createdBy),
]);

// Housing applications table
export const applications = pgTable("applications", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  confirmationNumber: varchar("confirmation_number").unique(),
  name: varchar("name").notNull(),
  email: varchar("email").notNull(),
  phone: varchar("phone").notNull(),
  dateOfBirth: timestamp("date_of_birth").notNull(),
  releaseDate: timestamp("release_date").notNull(),
  justiceStatus: justiceStatusEnum("justice_status").notNull(),
  emergencyContact: varchar("emergency_contact").notNull(),
  emergencyPhone: varchar("emergency_phone").notNull(),
  medicalNeeds: text("medical_needs"),
  employmentGoals: text("employment_goals"),
  hasChildren: boolean("has_children").default(false),
  status: applicationStatusEnum("status").default("new"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("applications_status_idx").on(table.status),
  index("applications_created_at_idx").on(table.createdAt),
  index("applications_confirmation_idx").on(table.confirmationNumber),
]);

export const donations = pgTable("donations", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  confirmationNumber: varchar("confirmation_number").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  email: varchar("email").notNull(),
  phone: varchar("phone"),
  amount: decimal("amount").notNull(),
  frequency: donationFrequencyEnum("frequency").default("one_time"),
  designation: donationDesignationEnum("designation").default("general"),
  dedication: text("dedication"),
  isAnonymous: boolean("is_anonymous").default(false),
  mailingList: boolean("mailing_list").default(true),
  stripePaymentId: varchar("stripe_payment_id"),
  receiptId: varchar("receipt_id"),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("donations_created_at_idx").on(table.createdAt),
  index("donations_frequency_idx").on(table.frequency),
  index("donations_confirmation_idx").on(table.confirmationNumber),
]);

export const auditLog = pgTable("audit_log", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  actorId: uuid("actor_id").references(() => users.id),
  action: varchar("action").notNull(),
  entity: varchar("entity").notNull(),
  entityId: varchar("entity_id").notNull(),
  ts: timestamp("ts").defaultNow(),
  ip: varchar("ip"),
  userAgent: text("user_agent"),
  beforeHash: varchar("before_hash"),
  afterHash: varchar("after_hash"),
}, (table) => [
  index("audit_log_entity_idx").on(table.entity, table.entityId),
  index("audit_log_ts_idx").on(table.ts),
]);

// Check-in tracking table (missing from v10 requirements)
export const checkins = pgTable("checkins", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  residentId: uuid("resident_id").references(() => users.id).notNull(),
  propertyId: uuid("property_id").references(() => properties.id).notNull(),
  latitude: decimal("latitude", { precision: 10, scale: 8 }).notNull(),
  longitude: decimal("longitude", { precision: 11, scale: 8 }).notNull(),
  reason: text("reason"), // home, life_design, work, etc.
  status: varchar("status").default("in"), // in|out
  distance: integer("distance"), // distance from property in meters
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("checkins_resident_idx").on(table.residentId),
  index("checkins_property_idx").on(table.propertyId),
  index("checkins_created_at_idx").on(table.createdAt),
]);

// Maintenance history tracking table (missing from v10 requirements)
export const maintenanceHistory = pgTable("maintenance_history", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  ticketId: uuid("ticket_id").references(() => tickets.id).notNull(),
  editorId: uuid("editor_id").references(() => users.id).notNull(),
  diff: jsonb("diff").notNull(), // JSON diff of changes
  editedAt: timestamp("edited_at").defaultNow(),
}, (table) => [
  index("maintenance_history_ticket_idx").on(table.ticketId),
  index("maintenance_history_edited_at_idx").on(table.editedAt),
]);

// FAQ Support System Tables
export const faqs = pgTable("faqs", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  question: text("question").notNull(),
  answer: text("answer").notNull(),
  weight: integer("weight").default(100),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("faqs_weight_idx").on(table.weight),
]);

export const faqPages = pgTable("faq_pages", {
  faqId: uuid("faq_id").references(() => faqs.id, { onDelete: "cascade" }).notNull(),
  pathPattern: text("path_pattern").notNull(), // e.g. '/portal*' or '/admin/*'
}, (table) => [
  index("faq_pages_faq_id_idx").on(table.faqId),
  index("faq_pages_path_pattern_idx").on(table.pathPattern),
]);

export const faqRoles = pgTable("faq_roles", {
  faqId: uuid("faq_id").references(() => faqs.id, { onDelete: "cascade" }).notNull(),
  role: roleEnum("role").notNull(),
}, (table) => [
  index("faq_roles_faq_id_idx").on(table.faqId),
  index("faq_roles_role_idx").on(table.role),
]);

export const faqFeedback = pgTable("faq_feedback", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  faqId: uuid("faq_id").references(() => faqs.id).notNull(),
  userId: uuid("user_id").references(() => users.id).notNull(),
  helpful: boolean("helpful").notNull(),
  createdAt: timestamp("created_at").defaultNow()
});

export const reports = pgTable("reports", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  type: varchar("type", { length: 100 }).notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  status: varchar("status", { length: 50 }).default("pending"),
  parameters: jsonb("parameters"),
  filePath: varchar("file_path", { length: 500 }),
  fileSize: integer("file_size"),
  generatedBy: uuid("generated_by").references(() => users.id),
  generatedAt: timestamp("generated_at").defaultNow(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
});

export const reportTemplates = pgTable("report_templates", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  type: varchar("type", { length: 100 }).unique().notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  category: varchar("category", { length: 100 }).notNull(),
  frequency: varchar("frequency", { length: 50 }),
  templateConfig: jsonb("template_config"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
});

// Inquiries table for program information requests
export const inquiries = pgTable("inquiries", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  confirmationNumber: varchar("confirmation_number").unique(),
  name: varchar("name").notNull(),
  email: varchar("email").notNull(),
  phone: varchar("phone").notNull(),
  question: text("question").notNull(),
  status: varchar("status").default("new"), // new | contacted | resolved
  createdAt: timestamp("created_at").defaultNow(),
  contactedAt: timestamp("contacted_at"),
  resolvedAt: timestamp("resolved_at"),
}, (table) => [
  index("inquiries_status_idx").on(table.status),
  index("inquiries_created_at_idx").on(table.createdAt),
  index("inquiries_confirmation_idx").on(table.confirmationNumber),
]);

// Partners table for community organizations
export const partners = pgTable("partners", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  confirmationNumber: varchar("confirmation_number").unique(),
  organizationName: varchar("organization_name").notNull(),
  contactName: varchar("contact_name").notNull(),
  email: varchar("email").notNull(),
  serviceType: varchar("service_type").notNull(), // parole, probation, stop, ecm, cbo
  status: varchar("status").default("pending"), // pending | approved | inactive
  createdAt: timestamp("created_at").defaultNow(),
  approvedAt: timestamp("approved_at"),
}, (table) => [
  index("partners_status_idx").on(table.status),
  index("partners_service_type_idx").on(table.serviceType),
  index("partners_confirmation_idx").on(table.confirmationNumber),
]);

export const documents = pgTable("documents", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  ownerType: varchar("owner_type").notNull(), // resident | org
  ownerId: uuid("owner_id").notNull(),
  title: varchar("title").notNull(),
  mime: varchar("mime").notNull(),
  size: integer("size"),
  storagePath: varchar("storage_path").notNull(),
  uploadedAt: timestamp("uploaded_at").defaultNow(),
  checksum: varchar("checksum"),
});

// Homepage Content table for editable copy
export const homepageContent = pgTable("homepage_content", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  section: varchar("section", { length: 50 }).notNull().unique(), // "hero", "about", "programs", "impact", "cta"
  title: text("title"),
  subtitle: text("subtitle"),
  content: text("content"),
  buttonText: text("button_text"),
  buttonUrl: text("button_url"),
  isActive: boolean("is_active").default(true),
  lastUpdatedBy: uuid("last_updated_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("homepage_content_section_idx").on(table.section),
]);

// Donors table
export const donors = pgTable("donors", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: uuid("user_id").references(() => users.id).unique(), // optional link to user account
  firstName: varchar("first_name").notNull(),
  lastName: varchar("last_name").notNull(),
  email: varchar("email").notNull(),
  phone: varchar("phone"),
  company: varchar("company"),
  address: text("address"),
  city: varchar("city"),
  state: varchar("state"),
  zipCode: varchar("zip_code"),
  isAnonymous: boolean("is_anonymous").default(false),
  notes: text("notes"),
  tags: text("tags").array(), // ["major_donor", "monthly", "corporate"]
  totalDonated: decimal("total_donated", { precision: 10, scale: 2 }).default("0"),
  lastDonationDate: timestamp("last_donation_date"),
  donorType: varchar("donor_type"), // individual, corporate, foundation
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("donors_email_idx").on(table.email),
  index("donors_type_idx").on(table.donorType),
  index("donors_total_donated_idx").on(table.totalDonated),
]);

// Donor Donations table (renamed to avoid conflict with existing donations table)
export const donorDonations = pgTable("donor_donations", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  donorId: uuid("donor_id").references(() => donors.id).notNull(),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  frequency: donationFrequencyEnum("frequency").default("one_time"),
  designation: donationDesignationEnum("designation").default("general"),
  dedicatedTo: text("dedicated_to"), // in memory/honor of
  campaignId: uuid("campaign_id").references(() => donationGoals.id),
  paymentMethod: varchar("payment_method"), // stripe, check, cash, etc.
  stripePaymentId: varchar("stripe_payment_id"),
  stripeSubscriptionId: varchar("stripe_subscription_id"), // for recurring donations
  status: varchar("status").default("completed"), // completed, pending, failed, refunded
  receiptSent: boolean("receipt_sent").default(false),
  taxDeductible: boolean("tax_deductible").default(true),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
  processedAt: timestamp("processed_at"),
}, (table) => [
  index("donor_donations_donor_idx").on(table.donorId),
  index("donor_donations_campaign_idx").on(table.campaignId),
  index("donor_donations_created_at_idx").on(table.createdAt),
  index("donor_donations_status_idx").on(table.status),
]);

// Donation Goals/Campaigns table
export const donationGoals = pgTable("donation_goals", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  name: varchar("name").notNull(),
  description: text("description"),
  targetAmount: decimal("target_amount", { precision: 10, scale: 2 }).notNull(),
  currentAmount: decimal("current_amount", { precision: 10, scale: 2 }).default("0"),
  startDate: timestamp("start_date").notNull(),
  endDate: timestamp("end_date").notNull(),
  isActive: boolean("is_active").default(true),
  imageUrl: varchar("image_url"),
  category: varchar("category"), // annual, emergency, project, etc.
  createdBy: uuid("created_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("donation_goals_active_idx").on(table.isActive),
  index("donation_goals_dates_idx").on(table.startDate, table.endDate),
]);

// Donor Subscriptions table (for recurring donations)
export const donorSubscriptions = pgTable("donor_subscriptions", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  donorId: uuid("donor_id").references(() => donors.id).notNull(),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  frequency: donationFrequencyEnum("frequency").default("monthly"),
  stripeSubscriptionId: varchar("stripe_subscription_id").unique(),
  status: varchar("status").default("active"), // active, paused, cancelled
  nextPaymentDate: timestamp("next_payment_date"),
  startDate: timestamp("start_date").defaultNow(),
  endDate: timestamp("end_date"),
  pausedAt: timestamp("paused_at"),
  cancelledAt: timestamp("cancelled_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("donor_subscriptions_donor_idx").on(table.donorId),
  index("donor_subscriptions_status_idx").on(table.status),
]);

// Prospective Residents table (for CRM tracking)
export const prospectiveResidents = pgTable("prospective_residents", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  applicationId: uuid("application_id").references(() => applications.id).unique(),
  firstName: varchar("first_name").notNull(),
  lastName: varchar("last_name").notNull(),
  email: varchar("email"),
  phone: varchar("phone").notNull(),
  dateOfBirth: timestamp("date_of_birth"),
  referralSource: referralSourceEnum("referral_source"),
  status: varchar("status").notNull().default("new"), // new, pending, approved, denied, on_hold, waitlisted
  priority: varchar("priority").default("normal"), // low, normal, high, urgent
  assignedTo: uuid("assigned_to").references(() => users.id),
  intakeDate: timestamp("intake_date"),
  lastContactDate: timestamp("last_contact_date"),
  nextFollowUpDate: timestamp("next_follow_up_date"),
  notes: text("notes"),
  tags: text("tags").array(), // ["veteran", "medical_needs", "family"]
  denialReason: text("denial_reason"),
  holdReason: text("hold_reason"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("prospective_residents_status_idx").on(table.status),
  index("prospective_residents_assigned_idx").on(table.assignedTo),
  index("prospective_residents_priority_idx").on(table.priority),
]);

// CRM Activities table (for tracking all interactions)
export const crmActivities = pgTable("crm_activities", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  entityType: varchar("entity_type").notNull(), // donor, resident, prospective_resident, partner
  entityId: uuid("entity_id").notNull(),
  activityType: varchar("activity_type").notNull(), // call, email, meeting, donation, note
  subject: varchar("subject").notNull(),
  description: text("description"),
  outcome: varchar("outcome"), // successful, no_answer, left_message, etc.
  nextAction: text("next_action"),
  performedBy: uuid("performed_by").references(() => users.id).notNull(),
  scheduledFor: timestamp("scheduled_for"),
  completedAt: timestamp("completed_at"),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("crm_activities_entity_idx").on(table.entityType, table.entityId),
  index("crm_activities_type_idx").on(table.activityType),
  index("crm_activities_performed_by_idx").on(table.performedBy),
  index("crm_activities_scheduled_idx").on(table.scheduledFor),
]);

// Messages table for internal communication
export const messages = pgTable("messages", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  fromUserId: uuid("from_user_id").references(() => users.id).notNull(),
  toUserId: uuid("to_user_id").references(() => users.id).notNull(),
  subject: varchar("subject").notNull(),
  body: text("body").notNull(),
  isRead: boolean("is_read").default(false),
  isArchived: boolean("is_archived").default(false),
  parentId: uuid("parent_id"), // For threading - will add reference in relations
  attachments: jsonb("attachments"), // array of document IDs
  createdAt: timestamp("created_at").defaultNow(),
  readAt: timestamp("read_at"),
}, (table) => [
  index("messages_from_user_idx").on(table.fromUserId),
  index("messages_to_user_idx").on(table.toUserId),
  index("messages_is_read_idx").on(table.isRead),
  index("messages_created_at_idx").on(table.createdAt),
]);

// Notifications table
export const notifications = pgTable("notifications", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: uuid("user_id").references(() => users.id).notNull(),
  type: varchar("type").notNull(), // case_note, message, ticket, event_reminder, etc.
  title: varchar("title").notNull(),
  body: text("body"),
  status: notificationStatusEnum("status").default("unread"),
  priority: notificationPriorityEnum("priority").default("normal"),
  linkType: varchar("link_type"), // case_note, ticket, message, etc.
  linkId: uuid("link_id"), // ID of related entity
  expiresAt: timestamp("expires_at"),
  createdAt: timestamp("created_at").defaultNow(),
  readAt: timestamp("read_at"),
  archivedAt: timestamp("archived_at"),
}, (table) => [
  index("notifications_user_id_idx").on(table.userId),
  index("notifications_status_idx").on(table.status),
  index("notifications_type_idx").on(table.type),
  index("notifications_priority_idx").on(table.priority),
  index("notifications_created_at_idx").on(table.createdAt),
]);



// Relations
export const usersRelations = relations(users, ({ one, many }) => ({
  residentProfile: one(residentProfiles, {
    fields: [users.id],
    references: [residentProfiles.userId],
  }),
  programEnrollment: one(programEnrollments, {
    fields: [users.id],
    references: [programEnrollments.residentId],
  }),
  attendanceRecords: many(attendance),
  serviceEvents: many(serviceEvents),
  caseNotes: many(caseNotes),
  createdNotes: many(caseNotes, { relationName: "noteCreator" }),
  residentResources: many(residentResources),
  assignedTickets: many(tickets, { relationName: "ticketAssignee" }),
  createdTickets: many(tickets, { relationName: "ticketCreator" }),
}));

export const residentProfilesRelations = relations(residentProfiles, ({ one }) => ({
  user: one(users, {
    fields: [residentProfiles.userId],
    references: [users.id],
  }),
}));

export const referralsRelations = relations(referrals, ({ one }) => ({
  linkedResident: one(users, {
    fields: [referrals.linkedResidentId],
    references: [users.id],
  }),
}));

export const programEnrollmentsRelations = relations(programEnrollments, ({ one }) => ({
  resident: one(users, {
    fields: [programEnrollments.residentId],
    references: [users.id],
  }),
}));

export const attendanceRelations = relations(attendance, ({ one }) => ({
  resident: one(users, {
    fields: [attendance.residentId],
    references: [users.id],
  }),
  staff: one(users, {
    fields: [attendance.staffId],
    references: [users.id],
  }),
}));

export const serviceEventsRelations = relations(serviceEvents, ({ one }) => ({
  resident: one(users, {
    fields: [serviceEvents.residentId],
    references: [users.id],
  }),
  staff: one(users, {
    fields: [serviceEvents.staffId],
    references: [users.id],
  }),
}));

export const caseNotesRelations = relations(caseNotes, ({ one }) => ({
  resident: one(users, {
    fields: [caseNotes.residentId],
    references: [users.id],
  }),
  creator: one(users, {
    fields: [caseNotes.createdBy],
    references: [users.id],
  }),
  program: one(programs, {
    fields: [caseNotes.programId],
    references: [programs.id],
  }),
}));

export const residentResourcesRelations = relations(residentResources, ({ one }) => ({
  resident: one(users, {
    fields: [residentResources.residentId],
    references: [users.id],
  }),
  resource: one(resources, {
    fields: [residentResources.resourceId],
    references: [resources.id],
  }),
}));

export const roomsRelations = relations(rooms, ({ one, many }) => ({
  property: one(properties, {
    fields: [rooms.propertyId],
    references: [properties.id],
  }),
  tickets: many(tickets),
}));

export const propertiesRelations = relations(properties, ({ many }) => ({
  rooms: many(rooms),
  tickets: many(tickets),
}));

export const ticketsRelations = relations(tickets, ({ one }) => ({
  property: one(properties, {
    fields: [tickets.propertyId],
    references: [properties.id],
  }),
  room: one(rooms, {
    fields: [tickets.roomId],
    references: [rooms.id],
  }),
  resident: one(users, {
    fields: [tickets.residentId],
    references: [users.id],
  }),
  assignedTo: one(users, {
    fields: [tickets.assignedTo],
    references: [users.id],
  }),
}));

export const faqsRelations = relations(faqs, ({ many }) => ({
  pages: many(faqPages),
  roles: many(faqRoles),
  feedback: many(faqFeedback),
}));

export const faqPagesRelations = relations(faqPages, ({ one }) => ({
  faq: one(faqs, {
    fields: [faqPages.faqId],
    references: [faqs.id],
  }),
}));

export const faqRolesRelations = relations(faqRoles, ({ one }) => ({
  faq: one(faqs, {
    fields: [faqRoles.faqId],
    references: [faqs.id],
  }),
}));

export const faqFeedbackRelations = relations(faqFeedback, ({ one }) => ({
  faq: one(faqs, {
    fields: [faqFeedback.faqId],
    references: [faqs.id],
  }),
  user: one(users, {
    fields: [faqFeedback.userId],
    references: [users.id],
  }),
}));

// Program relations
export const programsRelations = relations(programs, ({ many }) => ({
  sessions: many(programSessions),
  caseNotes: many(caseNotes),
}));

export const programSessionsRelations = relations(programSessions, ({ one, many }) => ({
  program: one(programs, {
    fields: [programSessions.programId],
    references: [programs.id],
  }),
  facilitator: one(users, {
    fields: [programSessions.facilitatorId],
    references: [users.id],
  }),
  attendance: many(sessionAttendance),
}));

export const sessionAttendanceRelations = relations(sessionAttendance, ({ one }) => ({
  session: one(programSessions, {
    fields: [sessionAttendance.sessionId],
    references: [programSessions.id],
  }),
  resident: one(users, {
    fields: [sessionAttendance.residentId],
    references: [users.id],
  }),
}));

// Message relations
export const messagesRelations = relations(messages, ({ one, many }) => ({
  fromUser: one(users, {
    fields: [messages.fromUserId],
    references: [users.id],
    relationName: "sentMessages",
  }),
  toUser: one(users, {
    fields: [messages.toUserId],
    references: [users.id],
    relationName: "receivedMessages",
  }),
  parent: one(messages, {
    fields: [messages.parentId],
    references: [messages.id],
    relationName: "parentMessage",
  }),
  replies: many(messages, {
    relationName: "parentMessage",
  }),
}));

// Notification relations
export const notificationsRelations = relations(notifications, ({ one }) => ({
  user: one(users, {
    fields: [notifications.userId],
    references: [users.id],
  }),
}));

// Insert schemas
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertResidentProfileSchema = createInsertSchema(residentProfiles).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertEmployeeProfileSchema = createInsertSchema(employeeProfiles).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertReferralSchema = createInsertSchema(referrals).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertAttendanceSchema = createInsertSchema(attendance).omit({
  id: true,
  createdAt: true,
});

export const insertServiceEventSchema = createInsertSchema(serviceEvents).omit({
  id: true,
  createdAt: true,
});

export const insertCaseNoteSchema = createInsertSchema(caseNotes).omit({
  id: true,
  createdAt: true,
});

export const insertResourceSchema = createInsertSchema(resources).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertTicketSchema = createInsertSchema(tickets).omit({
  id: true,
  createdAt: true,
  assignedAt: true,
  resolvedAt: true,
});

export const insertApplicationSchema = createInsertSchema(applications).omit({
  id: true,
  status: true,
  createdAt: true,
  updatedAt: true,
});

export const insertDonationSchema = createInsertSchema(donations).omit({
  id: true,
  stripePaymentId: true,
  receiptId: true,
  createdAt: true,
});

export const insertInquirySchema = createInsertSchema(inquiries).omit({
  id: true,
  status: true,
  createdAt: true,
  contactedAt: true,
  resolvedAt: true,
});

export const insertPartnerSchema = createInsertSchema(partners).omit({
  id: true,
  status: true,
  createdAt: true,
  approvedAt: true,
});

export const insertFaqSchema = createInsertSchema(faqs).omit({
  id: true,
  createdAt: true,
});

export const insertFaqFeedbackSchema = createInsertSchema(faqFeedback).omit({
  id: true,
  createdAt: true,
});

export const insertHomepageContentSchema = createInsertSchema(homepageContent).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertDonorSchema = createInsertSchema(donors).omit({
  id: true,
  totalDonated: true,
  lastDonationDate: true,
  createdAt: true,
  updatedAt: true,
});

export const insertDonorDonationSchema = createInsertSchema(donorDonations).omit({
  id: true,
  stripePaymentId: true,
  stripeSubscriptionId: true,
  receiptSent: true,
  createdAt: true,
  processedAt: true,
});

export const insertDonationGoalSchema = createInsertSchema(donationGoals).omit({
  id: true,
  currentAmount: true,
  createdAt: true,
  updatedAt: true,
});

export const insertDonorSubscriptionSchema = createInsertSchema(donorSubscriptions).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertProspectiveResidentSchema = createInsertSchema(prospectiveResidents).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertCrmActivitySchema = createInsertSchema(crmActivities).omit({
  id: true,
  createdAt: true,
});

export const insertProgramSchema = createInsertSchema(programs).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertProgramSessionSchema = createInsertSchema(programSessions).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertSessionAttendanceSchema = createInsertSchema(sessionAttendance).omit({
  id: true,
  createdAt: true,
});

export const insertMessageSchema = createInsertSchema(messages).omit({
  id: true,
  createdAt: true,
});

export const insertNotificationSchema = createInsertSchema(notifications).omit({
  id: true,
  createdAt: true,
});

// Types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type UpsertUser = typeof users.$inferInsert;
export type ResidentProfile = typeof residentProfiles.$inferSelect;
export type InsertResidentProfile = z.infer<typeof insertResidentProfileSchema>;
export type EmployeeProfile = typeof employeeProfiles.$inferSelect;
export type InsertEmployeeProfile = z.infer<typeof insertEmployeeProfileSchema>;
export type Referral = typeof referrals.$inferSelect;
export type InsertReferral = z.infer<typeof insertReferralSchema>;
export type ProgramEnrollment = typeof programEnrollments.$inferSelect;
export type Attendance = typeof attendance.$inferSelect;
export type InsertAttendance = z.infer<typeof insertAttendanceSchema>;
export type ServiceEvent = typeof serviceEvents.$inferSelect;
export type InsertServiceEvent = z.infer<typeof insertServiceEventSchema>;
export type CaseNote = typeof caseNotes.$inferSelect;
export type InsertCaseNote = z.infer<typeof insertCaseNoteSchema>;
export type Resource = typeof resources.$inferSelect;
export type InsertResource = z.infer<typeof insertResourceSchema>;
export type ResidentResource = typeof residentResources.$inferSelect;
export type Property = typeof properties.$inferSelect;
export type Room = typeof rooms.$inferSelect;
export type Ticket = typeof tickets.$inferSelect;
export type InsertTicket = z.infer<typeof insertTicketSchema>;
export type Application = typeof applications.$inferSelect;
export type InsertApplication = z.infer<typeof insertApplicationSchema>;
export type Donation = typeof donations.$inferSelect;
export type InsertDonation = z.infer<typeof insertDonationSchema>;
export type AuditLog = typeof auditLog.$inferSelect;
export type Document = typeof documents.$inferSelect;
export type Inquiry = typeof inquiries.$inferSelect;
export type InsertInquiry = z.infer<typeof insertInquirySchema>;
export type Partner = typeof partners.$inferSelect;
export type InsertPartner = z.infer<typeof insertPartnerSchema>;
export type FAQ = typeof faqs.$inferSelect;
export type InsertFAQ = z.infer<typeof insertFaqSchema>;
export type FAQPage = typeof faqPages.$inferSelect;
export type FAQRole = typeof faqRoles.$inferSelect;
export type FAQFeedback = typeof faqFeedback.$inferSelect;
export type InsertFAQFeedback = z.infer<typeof insertFaqFeedbackSchema>;
export type HomepageContent = typeof homepageContent.$inferSelect;
export type InsertHomepageContent = z.infer<typeof insertHomepageContentSchema>;
export type Donor = typeof donors.$inferSelect;
export type InsertDonor = z.infer<typeof insertDonorSchema>;
export type DonorDonation = typeof donorDonations.$inferSelect;
export type InsertDonorDonation = z.infer<typeof insertDonorDonationSchema>;
export type DonationGoal = typeof donationGoals.$inferSelect;
export type InsertDonationGoal = z.infer<typeof insertDonationGoalSchema>;
export type DonorSubscription = typeof donorSubscriptions.$inferSelect;
export type InsertDonorSubscription = z.infer<typeof insertDonorSubscriptionSchema>;
export type ProspectiveResident = typeof prospectiveResidents.$inferSelect;
export type InsertProspectiveResident = z.infer<typeof insertProspectiveResidentSchema>;
export type CrmActivity = typeof crmActivities.$inferSelect;
export type InsertCrmActivity = z.infer<typeof insertCrmActivitySchema>;
export type Program = typeof programs.$inferSelect;
export type InsertProgram = z.infer<typeof insertProgramSchema>;
export type ProgramSession = typeof programSessions.$inferSelect;
export type InsertProgramSession = z.infer<typeof insertProgramSessionSchema>;
export type SessionAttendance = typeof sessionAttendance.$inferSelect;
export type InsertSessionAttendance = z.infer<typeof insertSessionAttendanceSchema>;
export type Message = typeof messages.$inferSelect;
export type InsertMessage = z.infer<typeof insertMessageSchema>;
export type Notification = typeof notifications.$inferSelect;
export type InsertNotification = z.infer<typeof insertNotificationSchema>;

// ─────────────────────────────────────────────────────────────────────────────
// MASTER BUILD v3 — NEW TABLES
// ─────────────────────────────────────────────────────────────────────────────

// ── ONBOARDING ────────────────────────────────────────────────────────────────
export const onboardingPhases = pgTable('onboarding_phases', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  clientId: varchar('client_id').references(() => users.id),
  phaseKey: text('phase_key').notNull(),
  phaseLabel: text('phase_label').notNull(),
  status: text('status').default('not_started'),
  startedAt: timestamp('started_at'),
  completedAt: timestamp('completed_at'),
  durationSeconds: integer('duration_seconds'),
  completedBy: varchar('completed_by').references(() => users.id),
  blockReason: text('block_reason'),
  data: jsonb('data'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
}, (table) => [
  index('onboarding_phases_client_idx').on(table.clientId),
  index('onboarding_phases_status_idx').on(table.status),
]);

export const fieldSaves = pgTable('field_saves', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  clientId: varchar('client_id').references(() => users.id),
  phaseKey: text('phase_key').notNull(),
  fieldName: text('field_name').notNull(),
  fieldValue: text('field_value'),
  savedBy: varchar('saved_by').references(() => users.id),
  savedAt: timestamp('saved_at').defaultNow(),
}, (table) => [
  index('field_saves_client_phase_idx').on(table.clientId, table.phaseKey),
]);

// ── CLIENT EXTENDED PROFILE COLUMNS ──────────────────────────────────────────
// Stored as extended profile data — new columns appended to residentProfiles via
// a separate table to avoid ALTER TABLE conflicts on the running database.
export const clientProfiles = pgTable('client_profiles', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar('user_id').references(() => users.id).notNull().unique(),
  clientType: text('client_type').default('resident'),  // resident | non-resident | onboarding
  onboardingStatus: text('onboarding_status').default('contact'),
  onboardingPhase: text('onboarding_phase'),
  patientAccount: text('patient_account'),
  cin: text('cin'),
  preferredName: text('preferred_name'),
  dob: date('dob'),
  phonePrimary: text('phone_primary'),
  phoneSecondary: text('phone_secondary'),
  county: text('county').default('Sacramento'),
  bedAssignment: text('bed_assignment'),
  assignedCaseManagerId: varchar('assigned_case_manager_id').references(() => users.id),
  assignedChwId: varchar('assigned_chw_id').references(() => users.id),
  enrollmentDate: date('enrollment_date'),
  releaseDate: date('release_date'),
  recertificationDate: date('recertification_date'),
  programProgress: integer('program_progress').default(0),
  payType: text('pay_type'),
  rentAmount: decimal('rent_amount'),
  googleFolderId: text('google_folder_id'),
  googleFolderUrl: text('google_folder_url'),
  trackerRow: integer('tracker_row'),
  appUserId: text('app_user_id'),
  lastGeoLat: decimal('last_geo_lat'),
  lastGeoLng: decimal('last_geo_lng'),
  lastGeoTimestamp: timestamp('last_geo_timestamp'),
  emergencyFlag: boolean('emergency_flag').default(false),
  idDocumentUrl: text('id_document_url'),
  mcpProvider: text('mcp_provider'),
  authorizationCode: text('authorization_code'),
  icd10Codes: jsonb('icd10_codes'),
  prescriptions: text('prescriptions'),
  otherDiagnoses: text('other_diagnoses'),
  releaseConditions: jsonb('release_conditions'),
  dietaryRestrictions: text('dietary_restrictions'),
  bicCardStatus: text('bic_card_status'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
}, (table) => [
  index('client_profiles_user_idx').on(table.userId),
  index('client_profiles_type_idx').on(table.clientType),
  index('client_profiles_cm_idx').on(table.assignedCaseManagerId),
]);

// ── EVENTS ────────────────────────────────────────────────────────────────────
export const lhEvents = pgTable('lh_events', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  title: text('title').notNull(),
  eventType: text('event_type').notNull(), // one-on-one | group | org-wide | external | training | meeting | touchpoint
  description: text('description'),
  agenda: text('agenda'),
  location: text('location'),
  teleLink: text('tele_link'),
  startTime: timestamp('start_time').notNull(),
  endTime: timestamp('end_time'),
  createdBy: varchar('created_by').references(() => users.id),
  isOrgWide: boolean('is_org_wide').default(false),
  mandatoryForClients: boolean('mandatory_for_clients').default(false),
  mandatoryForStaff: boolean('mandatory_for_staff').default(false),
  geoRequired: boolean('geo_required').default(false),
  authorizationRequired: boolean('authorization_required').default(false),
  authorizationFormType: text('authorization_form_type'),
  isExternal: boolean('is_external').default(false),
  attachments: jsonb('attachments'),
  status: text('status').default('scheduled'),
  googleCalendarEventId: text('google_calendar_event_id'),
  createdAt: timestamp('created_at').defaultNow(),
}, (table) => [
  index('lh_events_start_time_idx').on(table.startTime),
  index('lh_events_type_idx').on(table.eventType),
  index('lh_events_created_by_idx').on(table.createdBy),
]);

export const eventInvitees = pgTable('event_invitees', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  eventId: uuid('event_id').references(() => lhEvents.id),
  userId: varchar('user_id').references(() => users.id),
  clientId: varchar('client_id').references(() => users.id),
  inviteeType: text('invitee_type').notNull(), // staff | client | external
  externalEmail: text('external_email'),
  externalName: text('external_name'),
  status: text('status').default('invited'),
}, (table) => [
  index('event_invitees_event_idx').on(table.eventId),
]);

export const eventAttendance = pgTable('event_attendance', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  eventId: uuid('event_id').references(() => lhEvents.id),
  clientId: varchar('client_id').references(() => users.id),
  staffId: varchar('staff_id').references(() => users.id),
  status: text('status').default('pending'), // present | absent | excused | pending | requested
  loggedBy: varchar('logged_by').references(() => users.id),
  loggedAt: timestamp('logged_at'),
  geoLat: decimal('geo_lat'),
  geoLng: decimal('geo_lng'),
  geoVerified: boolean('geo_verified').default(false),
  loggedAddress: text('logged_address'),
  notes: text('notes'),
  caseNoteRequired: boolean('case_note_required').default(true),
  caseNoteDueAt: timestamp('case_note_due_at'),
  caseNoteId: uuid('case_note_id'),
}, (table) => [
  index('event_attendance_event_idx').on(table.eventId),
  index('event_attendance_client_idx').on(table.clientId),
  index('event_attendance_status_idx').on(table.status),
]);

// ── STAFF CASE NOTES (rich version) ──────────────────────────────────────────
export const staffCaseNotes = pgTable('staff_case_notes', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  clientId: varchar('client_id').references(() => users.id).notNull(),
  staffId: varchar('staff_id').references(() => users.id).notNull(),
  caseManagerId: varchar('case_manager_id').references(() => users.id),
  noteType: text('note_type').notNull(),
  // general | training | check-in | approval | warning | milestone | incident | goal-update | referral | special-consideration | khrisace
  priority: integer('priority').notNull().default(4), // 1=immediate 2=same-day 3=within-week 4=general
  cptCode: text('cpt_code').default('98960'),
  icd10Code: text('icd10_code'),
  title: text('title').notNull(),
  summary: text('summary').notNull(),
  details: text('details'),
  outcome: text('outcome'),
  outcomeType: text('outcome_type'), // past | expected
  expectedOutcomeDate: date('expected_outcome_date'),
  location: text('location'),
  startTime: timestamp('start_time'),
  endTime: timestamp('end_time'),
  durationMinutes: integer('duration_minutes'),
  eventId: uuid('event_id').references(() => lhEvents.id),
  followUpDate: date('follow_up_date'),
  confidential: boolean('confidential').default(false),
  status: text('status').default('draft'), // draft | submitted | overdue | extremely-late | archived
  submittedAt: timestamp('submitted_at'),
  dueAt: timestamp('due_at'),
  googleDriveUrl: text('google_drive_url'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
}, (table) => [
  index('staff_case_notes_client_idx').on(table.clientId),
  index('staff_case_notes_staff_idx').on(table.staffId),
  index('staff_case_notes_status_idx').on(table.status),
  index('staff_case_notes_due_at_idx').on(table.dueAt),
]);

export const caseNoteActionItems = pgTable('case_note_action_items', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  caseNoteId: uuid('case_note_id').references(() => staffCaseNotes.id),
  description: text('description').notNull(),
  assignedTo: varchar('assigned_to').references(() => users.id),
  dueDate: date('due_date'),
  completedAt: timestamp('completed_at'),
  status: text('status').default('pending'),
});

// ── CALL LOG ──────────────────────────────────────────────────────────────────
export const callLog = pgTable('call_log', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  takenBy: varchar('taken_by').references(() => users.id),
  contactType: text('contact_type').notNull(), // Lead | Client | Resource | Staff | Other
  status: text('status').default('in-progress'),
  callbackDate: timestamp('callback_date'),
  callbackAssignedTo: varchar('callback_assigned_to').references(() => users.id),
  firstName: text('first_name'),
  lastName: text('last_name'),
  phone: text('phone'),
  email: text('email'),
  orgName: text('org_name'),
  referralSource: text('referral_source'),
  housingStatus: text('housing_status'),
  supervisionType: text('supervision_type'),
  jiDesignated: text('ji_designated'),
  county: text('county'),
  releaseDate: text('release_date'),
  cinNumber: text('cin_number'),
  mcp: text('mcp'),
  clientCIN: text('client_cin'),
  reasonForCall: text('reason_for_call'),
  followUpNeeded: text('follow_up_needed'),
  callNotes: text('call_notes'),
  internalNotes: text('internal_notes'),
  freedomVoiceCallId: text('freedomvoice_call_id'),
  freedomVoiceRecordingUrl: text('freedomvoice_recording_url'),
  linkedClientId: varchar('linked_client_id').references(() => users.id),
  intakeStarted: boolean('intake_started').default(false),
  callDate: date('call_date'),
  callTime: text('call_time'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
}, (table) => [
  index('call_log_status_idx').on(table.status),
  index('call_log_taken_by_idx').on(table.takenBy),
  index('call_log_created_at_idx').on(table.createdAt),
]);

// ── INTAKE APPLICATIONS ───────────────────────────────────────────────────────
export const intakeApplications = pgTable('intake_applications', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  type: text('type').notNull(), // lead | applicant | referral
  status: text('status').default('in-progress'),
  denialReason: text('denial_reason'),
  firstName: text('first_name').notNull(),
  lastName: text('last_name').notNull(),
  phone: text('phone'),
  email: text('email'),
  referralSource: text('referral_source'),
  housingStatus: text('housing_status'),
  supervisionType: text('supervision_type'),
  jiDesignated: text('ji_designated'),
  county: text('county'),
  cin: text('cin'),
  mcp: text('mcp'),
  releaseDate: text('release_date'),
  notes: text('notes'),
  assignedTo: varchar('assigned_to').references(() => users.id),
  callLogId: uuid('call_log_id').references(() => callLog.id),
  convertedToClientId: varchar('converted_to_client_id').references(() => users.id),
  onboardingStartedAt: timestamp('onboarding_started_at'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
}, (table) => [
  index('intake_applications_type_idx').on(table.type),
  index('intake_applications_status_idx').on(table.status),
]);

// ── MAINTENANCE TICKETS (extended) ────────────────────────────────────────────
export const maintenanceTickets = pgTable('maintenance_tickets', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  clientId: varchar('client_id').references(() => users.id),
  submittedBy: varchar('submitted_by').references(() => users.id),
  title: text('title').notNull(),
  category: text('category').notNull(),
  needsCategory: text('needs_category'),
  description: text('description').notNull(),
  priority: text('priority').default('normal'),
  status: text('status').default('open'),
  imageUrls: jsonb('image_urls'),
  videoUrls: jsonb('video_urls'),
  resolvedAt: timestamp('resolved_at'),
  resolvedBy: varchar('resolved_by').references(() => users.id),
  resolutionNotes: text('resolution_notes'),
  cost: decimal('cost'),
  receiptUrl: text('receipt_url'),
  googleDriveReceiptUrl: text('google_drive_receipt_url'),
  isHazardous: boolean('is_hazardous').default(false),
  financePushStatus: text('finance_push_status'), // pending | pushed | failed
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
}, (table) => [
  index('maintenance_tickets_status_idx').on(table.status),
  index('maintenance_tickets_priority_idx').on(table.priority),
  index('maintenance_tickets_client_idx').on(table.clientId),
]);

// ── CLIENT EXTENDED RELATIONS ─────────────────────────────────────────────────
export const clientEmergencyContacts = pgTable('client_emergency_contacts', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  clientId: varchar('client_id').references(() => users.id),
  name: text('name').notNull(),
  relationship: text('relationship').notNull(),
  phone: text('phone').notNull(),
  email: text('email'),
  address: text('address'),
  isNextOfKin: boolean('is_next_of_kin').default(false),
  sortOrder: integer('sort_order').default(0),
});

export const clientSupervisionOfficers = pgTable('client_supervision_officers', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  clientId: varchar('client_id').references(() => users.id),
  officerType: text('officer_type').notNull(), // parole | probation | pretrial
  name: text('name').notNull(),
  phone: text('phone'),
  email: text('email'),
  agency: text('agency'),
  nextCheckIn: date('next_check_in'),
});

export const clientHealthProviders = pgTable('client_health_providers', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  clientId: varchar('client_id').references(() => users.id),
  providerType: text('provider_type').notNull(), // pcp | therapist | dentist | psychiatrist | other
  name: text('name').notNull(),
  organization: text('organization'),
  phone: text('phone'),
  email: text('email'),
  npi: text('npi'),
});

export const clientBenefits = pgTable('client_benefits', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  clientId: varchar('client_id').references(() => users.id),
  benefitType: text('benefit_type').notNull(),
  status: text('status').notNull(), // active | applied | needed | pending | denied
  providerName: text('provider_name'),
  accountNumber: text('account_number'),
  startDate: date('start_date'),
  renewalDate: date('renewal_date'),
  notes: text('notes'),
});

export const clientWarnings = pgTable('client_warnings', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  clientId: varchar('client_id').references(() => users.id),
  issuedBy: varchar('issued_by').references(() => users.id),
  warningType: text('warning_type').notNull(), // verbal | written | severe | casual
  reason: text('reason').notNull(),
  description: text('description'),
  issuedAt: timestamp('issued_at').defaultNow(),
  acknowledgedAt: timestamp('acknowledged_at'),
  googleDriveUrl: text('google_drive_url'),
}, (table) => [
  index('client_warnings_client_idx').on(table.clientId),
]);

export const clientGoals = pgTable('client_goals', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  clientId: varchar('client_id').references(() => users.id),
  caseManagerId: varchar('case_manager_id').references(() => users.id),
  title: text('title').notNull(),
  description: text('description'),
  category: text('category'),
  targetDate: date('target_date'),
  completedAt: timestamp('completed_at'),
  status: text('status').default('active'),
  carePlanId: uuid('care_plan_id'),
}, (table) => [
  index('client_goals_client_idx').on(table.clientId),
]);

export const carePlans = pgTable('care_plans', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  clientId: varchar('client_id').references(() => users.id),
  caseManagerId: varchar('case_manager_id').references(() => users.id),
  title: text('title').notNull(),
  content: jsonb('content'),
  status: text('status').default('draft'),
  esignSubmissionId: text('esign_submission_id'),
  signedAt: timestamp('signed_at'),
  googleDriveUrl: text('google_drive_url'),
  version: integer('version').default(1),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
  dueAt: timestamp('due_at'),
}, (table) => [
  index('care_plans_client_idx').on(table.clientId),
]);

export const clientSnapshots = pgTable('client_snapshots', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  clientId: varchar('client_id').references(() => users.id),
  snapshotData: jsonb('snapshot_data').notNull(),
  googleDriveUrl: text('google_drive_url'),
  takenAt: timestamp('taken_at').defaultNow(),
  weekOf: date('week_of'),
}, (table) => [
  index('client_snapshots_client_idx').on(table.clientId),
  index('client_snapshots_week_idx').on(table.weekOf),
]);

// ── AUTHORIZATION FORMS ───────────────────────────────────────────────────────
export const authorizationRequests = pgTable('authorization_requests', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  clientId: varchar('client_id').references(() => users.id),
  assignedBy: varchar('assigned_by').references(() => users.id),
  formType: text('form_type').notNull(), // overnight | car-rental | guest | food | clothing
  status: text('status').default('pending'),
  googleFormResponseId: text('google_form_response_id'),
  googleDriveUrl: text('google_drive_url'),
  eventId: uuid('event_id').references(() => lhEvents.id),
  submittedAt: timestamp('submitted_at'),
  reviewedBy: varchar('reviewed_by').references(() => users.id),
  reviewedAt: timestamp('reviewed_at'),
  denialReason: text('denial_reason'),
  createdAt: timestamp('created_at').defaultNow(),
}, (table) => [
  index('auth_requests_client_idx').on(table.clientId),
  index('auth_requests_status_idx').on(table.status),
]);

// ── FAXES ─────────────────────────────────────────────────────────────────────
export const faxes = pgTable('faxes', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  clientId: varchar('client_id').references(() => users.id),
  direction: text('direction').notNull(), // inbound | outbound
  status: text('status').default('queued'),
  telnyxFaxId: text('telnyx_fax_id'),
  toNumber: text('to_number'),
  fromNumber: text('from_number'),
  docId: uuid('doc_id').references(() => documents.id),
  coverPageIncluded: boolean('cover_page_included').default(true),
  pages: integer('pages'),
  sentAt: timestamp('sent_at'),
  receivedAt: timestamp('received_at'),
  filedTo: text('filed_to'),
  error: text('error'),
  createdAt: timestamp('created_at').defaultNow(),
});

// ── TOUCHPOINTS ────────────────────────────────────────────────────────────────
export const touchpoints = pgTable('touchpoints', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  clientId: varchar('client_id').references(() => users.id),
  caseManagerId: varchar('case_manager_id').references(() => users.id),
  scheduledAt: timestamp('scheduled_at').notNull(),
  completedAt: timestamp('completed_at'),
  type: text('type').default('check-in'),
  notes: text('notes'),
  caseNoteId: uuid('case_note_id').references(() => staffCaseNotes.id),
  status: text('status').default('scheduled'),
}, (table) => [
  index('touchpoints_client_idx').on(table.clientId),
  index('touchpoints_cm_idx').on(table.caseManagerId),
  index('touchpoints_scheduled_idx').on(table.scheduledAt),
]);

// ── MANAGED FORMS ─────────────────────────────────────────────────────────────
export const managedForms = pgTable('managed_forms', {
  key: text('key').primaryKey(),
  label: text('label').notNull(),
  googleFileId: text('google_file_id'),
  googleFileUrl: text('google_file_url'),
  version: text('version'),
  lastCheckedAt: timestamp('last_checked_at'),
  lastUpdatedAt: timestamp('last_updated_at'),
  updatedBy: varchar('updated_by').references(() => users.id),
});

// ── APP SETTINGS ──────────────────────────────────────────────────────────────
export const appSettings = pgTable('app_settings', {
  key: text('key').primaryKey(),
  value: text('value').notNull(),
  updatedAt: timestamp('updated_at').defaultNow(),
  updatedBy: varchar('updated_by').references(() => users.id),
});

// ── SAVED REPORTS ─────────────────────────────────────────────────────────────
export const savedReports = pgTable('saved_reports', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  templateId: uuid('template_id').references(() => reportTemplates.id),
  name: text('name').notNull(),
  generatedBy: varchar('generated_by').references(() => users.id),
  dateRange: jsonb('date_range'),
  data: jsonb('data'),
  googleDriveUrl: text('google_drive_url'),
  createdAt: timestamp('created_at').defaultNow(),
});

// ── EXTENDED RESOURCES ────────────────────────────────────────────────────────
// Additional fields for the full resource management system
export const resourceExtended = pgTable('resource_extended', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  resourceId: uuid('resource_id').references(() => resources.id).notNull().unique(),
  contactPerson: text('contact_person'),
  applicationLink: text('application_link'),
  logoUrl: text('logo_url'),
  serviceTime: text('service_time'),
  cost: text('cost'),
  services: text('services'),
  requirements: text('requirements'),
  addedFromCallId: uuid('added_from_call_id').references(() => callLog.id),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// ─────────────────────────────────────────────────────────────────────────────
// INSERT SCHEMAS — NEW TABLES
// ─────────────────────────────────────────────────────────────────────────────

export const insertOnboardingPhaseSchema = createInsertSchema(onboardingPhases).omit({ id: true, createdAt: true, updatedAt: true });
export const insertFieldSaveSchema = createInsertSchema(fieldSaves).omit({ id: true, savedAt: true });
export const insertClientProfileSchema = createInsertSchema(clientProfiles).omit({ id: true, createdAt: true, updatedAt: true });
export const insertLhEventSchema = createInsertSchema(lhEvents).omit({ id: true, createdAt: true });
export const insertEventInviteeSchema = createInsertSchema(eventInvitees).omit({ id: true });
export const insertEventAttendanceSchema = createInsertSchema(eventAttendance).omit({ id: true });
export const insertStaffCaseNoteSchema = createInsertSchema(staffCaseNotes).omit({ id: true, createdAt: true, updatedAt: true });
export const insertCaseNoteActionItemSchema = createInsertSchema(caseNoteActionItems).omit({ id: true });
export const insertCallLogSchema = createInsertSchema(callLog).omit({ id: true, createdAt: true, updatedAt: true });
export const insertIntakeApplicationSchema = createInsertSchema(intakeApplications).omit({ id: true, createdAt: true, updatedAt: true });
export const insertMaintenanceTicketSchema = createInsertSchema(maintenanceTickets).omit({ id: true, createdAt: true, updatedAt: true });
export const insertClientEmergencyContactSchema = createInsertSchema(clientEmergencyContacts).omit({ id: true });
export const insertClientSupervisionOfficerSchema = createInsertSchema(clientSupervisionOfficers).omit({ id: true });
export const insertClientHealthProviderSchema = createInsertSchema(clientHealthProviders).omit({ id: true });
export const insertClientBenefitSchema = createInsertSchema(clientBenefits).omit({ id: true });
export const insertClientWarningSchema = createInsertSchema(clientWarnings).omit({ id: true });
export const insertClientGoalSchema = createInsertSchema(clientGoals).omit({ id: true });
export const insertCarePlanSchema = createInsertSchema(carePlans).omit({ id: true, createdAt: true, updatedAt: true });
export const insertClientSnapshotSchema = createInsertSchema(clientSnapshots).omit({ id: true });
export const insertAuthorizationRequestSchema = createInsertSchema(authorizationRequests).omit({ id: true, createdAt: true });
export const insertFaxSchema = createInsertSchema(faxes).omit({ id: true, createdAt: true });
export const insertTouchpointSchema = createInsertSchema(touchpoints).omit({ id: true });
export const insertSavedReportSchema = createInsertSchema(savedReports).omit({ id: true, createdAt: true });

// ─────────────────────────────────────────────────────────────────────────────
// TYPES — NEW TABLES
// ─────────────────────────────────────────────────────────────────────────────

export type OnboardingPhase = typeof onboardingPhases.$inferSelect;
export type InsertOnboardingPhase = z.infer<typeof insertOnboardingPhaseSchema>;
export type FieldSave = typeof fieldSaves.$inferSelect;
export type InsertFieldSave = z.infer<typeof insertFieldSaveSchema>;
export type ClientProfile = typeof clientProfiles.$inferSelect;
export type InsertClientProfile = z.infer<typeof insertClientProfileSchema>;
export type LhEvent = typeof lhEvents.$inferSelect;
export type InsertLhEvent = z.infer<typeof insertLhEventSchema>;
export type EventInvitee = typeof eventInvitees.$inferSelect;
export type EventAttendance = typeof eventAttendance.$inferSelect;
export type InsertEventAttendance = z.infer<typeof insertEventAttendanceSchema>;
export type StaffCaseNote = typeof staffCaseNotes.$inferSelect;
export type InsertStaffCaseNote = z.infer<typeof insertStaffCaseNoteSchema>;
export type CaseNoteActionItem = typeof caseNoteActionItems.$inferSelect;
export type CallLog = typeof callLog.$inferSelect;
export type InsertCallLog = z.infer<typeof insertCallLogSchema>;
export type IntakeApplication = typeof intakeApplications.$inferSelect;
export type InsertIntakeApplication = z.infer<typeof insertIntakeApplicationSchema>;
export type MaintenanceTicket = typeof maintenanceTickets.$inferSelect;
export type InsertMaintenanceTicket = z.infer<typeof insertMaintenanceTicketSchema>;
export type ClientEmergencyContact = typeof clientEmergencyContacts.$inferSelect;
export type ClientSupervisionOfficer = typeof clientSupervisionOfficers.$inferSelect;
export type ClientHealthProvider = typeof clientHealthProviders.$inferSelect;
export type ClientBenefit = typeof clientBenefits.$inferSelect;
export type ClientWarning = typeof clientWarnings.$inferSelect;
export type ClientGoal = typeof clientGoals.$inferSelect;
export type CarePlan = typeof carePlans.$inferSelect;
export type ClientSnapshot = typeof clientSnapshots.$inferSelect;
export type AuthorizationRequest = typeof authorizationRequests.$inferSelect;
export type Fax = typeof faxes.$inferSelect;
export type Touchpoint = typeof touchpoints.$inferSelect;
export type InsertTouchpoint = z.infer<typeof insertTouchpointSchema>;
export type SavedReport = typeof savedReports.$inferSelect;

// ── LCP INVITES ───────────────────────────────────────────────────────────────
export const lcpInvites = pgTable('lcp_invites', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  token: text('token').notNull().unique(),
  clientId: varchar('client_id').references(() => users.id).notNull(),
  lcpEmail: text('lcp_email').notNull(),
  lcpName: text('lcp_name'),
  mcpPlan: text('mcp_plan'), // Kaiser, Anthem, HealthNet, Molina
  status: text('status').default('pending'), // pending | completed | expired
  invitedBy: varchar('invited_by').references(() => users.id),
  sentAt: timestamp('sent_at').defaultNow(),
  completedAt: timestamp('completed_at'),
  data: jsonb('data'), // LCP's submitted referral form data
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
}, (table) => [
  index('lcp_invites_token_idx').on(table.token),
  index('lcp_invites_client_idx').on(table.clientId),
]);

export const insertLcpInviteSchema = createInsertSchema(lcpInvites).omit({ id: true, createdAt: true, updatedAt: true });
export type LcpInvite = typeof lcpInvites.$inferSelect;
export type InsertLcpInvite = z.infer<typeof insertLcpInviteSchema>;

// ── YOUTUBE WATCH EVENTS ──────────────────────────────────────────────────────
export const youtubeWatchEvents = pgTable('youtube_watch_events', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  clientId: varchar('client_id').references(() => users.id).notNull(),
  videoId: text('video_id').notNull(),
  videoTitle: text('video_title'),
  percentWatched: integer('percent_watched').default(0),
  completedAt: timestamp('completed_at'),
  recordedBy: varchar('recorded_by').references(() => users.id),
  createdAt: timestamp('created_at').defaultNow(),
}, (table) => [
  index('youtube_watch_client_idx').on(table.clientId),
]);

export const insertYoutubeWatchEventSchema = createInsertSchema(youtubeWatchEvents).omit({ id: true, createdAt: true });
export type YoutubeWatchEvent = typeof youtubeWatchEvents.$inferSelect;