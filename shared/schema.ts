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
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Enums
export const roleEnum = pgEnum("role", [
  "Resident",
  "CaseManager", 
  "Intake",
  "Admin",
  "Referrer",
  "Auditor"
]);

export const languageEnum = pgEnum("language", ["en", "es"]);
export const readingLevelEnum = pgEnum("reading_level", ["resident_5th", "professional"]);
export const justiceStatusEnum = pgEnum("justice_status", ["parole", "probation", "formerly_incarcerated", "other"]);
export const referralSourceEnum = pgEnum("referral_source", ["self", "parole", "probation", "CBO"]);
export const referralStatusEnum = pgEnum("referral_status", ["new", "in_review", "accepted", "waitlist", "declined"]);
export const eventTypeEnum = pgEnum("event_type", ["workshop", "one_on_one", "coaching", "check_in"]);
export const fundingStreamEnum = pgEnum("funding_stream", ["STOP", "ECM", "CommunitySupport", "Other"]);
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
export const applicationStatusEnum = pgEnum("application_status", ["new", "under_review", "approved", "waitlisted", "denied"]);

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
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  role: roleEnum("role").notNull(),
  name: text("name").notNull(),
  email: varchar("email").unique(),
  phone: varchar("phone"),
  language: languageEnum("language").default("en"),
  readingLevel: readingLevelEnum("reading_level").default("professional"),
  passwordHash: varchar("password_hash"),
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
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("resident_profiles_user_id_idx").on(table.userId),
]);

export const referrals = pgTable("referrals", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
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
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("case_notes_resident_created_at_idx").on(table.residentId, table.createdAt),
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
  languages: jsonb("languages"), // array of language codes
  status: resourceStatusEnum("status").default("active"),
  tags: jsonb("tags"), // array of strings
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
}, (table) => [
  index("resources_category_idx").on(table.category),
  index("resources_status_idx").on(table.status),
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
  category: ticketCategoryEnum("category").notNull(),
  priority: ticketPriorityEnum("priority").default("normal"),
  description: text("description").notNull(),
  photos: jsonb("photos"), // array of document IDs
  status: ticketStatusEnum("status").default("new"),
  assignedTo: uuid("assigned_to").references(() => users.id),
  slaDueAt: timestamp("sla_due_at"),
  createdAt: timestamp("created_at").defaultNow(),
  assignedAt: timestamp("assigned_at"),
  resolvedAt: timestamp("resolved_at"),
}, (table) => [
  index("tickets_property_id_idx").on(table.propertyId),
  index("tickets_status_idx").on(table.status),
  index("tickets_priority_idx").on(table.priority),
]);

// Housing applications table
export const applications = pgTable("applications", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
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
]);

export const donations = pgTable("donations", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
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

// Types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type ResidentProfile = typeof residentProfiles.$inferSelect;
export type InsertResidentProfile = z.infer<typeof insertResidentProfileSchema>;
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
