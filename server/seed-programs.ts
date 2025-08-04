import { db } from "./db";
import { programs, type InsertProgram } from "@shared/schema";
import { eq } from "drizzle-orm";

// Life House 7 Flagship Programs based on v11/v13 specification
const flagshipPrograms: InsertProgram[] = [
  {
    name: "STOP TouchPoint Program",
    description: "Daily check-ins providing accountability, peer support, and connection. Residents earn points and build community through consistent participation.",
    type: "mandatory",
    frequency: "daily",
    durationMinutes: 30,
    maxParticipants: 20,
    isActive: true,
    requirements: "All residents must attend daily unless excused by case manager",
    objectives: JSON.stringify([
      "Build daily accountability and routine",
      "Foster peer support and connection",
      "Monitor resident progress and well-being",
      "Celebrate achievements and milestones",
      "Address challenges proactively"
    ]),
    curriculum: JSON.stringify({
      format: "Group circle",
      topics: ["Daily check-in", "Goal setting", "Gratitude practice", "Community building"],
      materials: ["Sign-in sheet", "TouchPoint counter", "Milestone cards"]
    })
  },
  {
    name: "STOP ARMS Curriculum",
    description: "12-week evidence-based relapse prevention and life skills program using the ARMS (Attitude, Readiness, Motivation, Suitability) framework.",
    type: "mandatory",
    frequency: "weekly",
    durationMinutes: 90,
    maxParticipants: 15,
    isActive: true,
    requirements: "Required for all residents in first 90 days",
    objectives: JSON.stringify([
      "Develop relapse prevention strategies",
      "Build emotional regulation skills",
      "Identify triggers and warning signs",
      "Create personal recovery plan",
      "Strengthen decision-making abilities"
    ]),
    curriculum: JSON.stringify({
      weeks: 12,
      modules: [
        "Understanding Addiction",
        "Identifying Triggers",
        "Coping Strategies",
        "Emotional Intelligence",
        "Healthy Relationships",
        "Relapse Prevention Planning"
      ],
      certification: "Certificate of completion after 12 weeks"
    })
  },
  {
    name: "Building Your Dream Legacy",
    description: "Comprehensive career readiness and personal development program focused on employment, education, and life purpose.",
    type: "optional",
    frequency: "twice_weekly",
    durationMinutes: 120,
    maxParticipants: 12,
    isActive: true,
    requirements: "Open to all residents, priority for those seeking employment",
    objectives: JSON.stringify([
      "Develop professional skills and resume",
      "Practice interview techniques",
      "Explore career pathways",
      "Set educational goals",
      "Build professional network"
    ]),
    curriculum: JSON.stringify({
      components: [
        "Resume building workshop",
        "Mock interviews",
        "LinkedIn profile creation",
        "Job search strategies",
        "Financial literacy basics",
        "Professional communication"
      ],
      partnerships: ["Local employers", "Community colleges", "Trade schools"],
      outcomes: "Job placement support and ongoing career coaching"
    })
  },
  {
    name: "Fatherhood Focus",
    description: "Specialized program supporting fathers in rebuilding relationships with their children and developing positive parenting skills.",
    type: "optional",
    frequency: "weekly",
    durationMinutes: 90,
    maxParticipants: 10,
    isActive: true,
    requirements: "Open to all fathers and expecting fathers",
    objectives: JSON.stringify([
      "Strengthen father-child bonds",
      "Develop healthy parenting strategies",
      "Navigate co-parenting relationships",
      "Address childhood trauma impacts",
      "Build emotional availability"
    ]),
    curriculum: JSON.stringify({
      topics: [
        "Understanding child development",
        "Communication with children",
        "Discipline vs punishment",
        "Healing father wounds",
        "Legal rights and responsibilities",
        "Creating quality time"
      ],
      support: "Individual coaching and supervised visitation support"
    })
  },
  {
    name: "Men's Circle",
    description: "Peer-led support group fostering brotherhood, vulnerability, and authentic connection among residents.",
    type: "optional",
    frequency: "weekly",
    durationMinutes: 90,
    maxParticipants: 16,
    isActive: true,
    requirements: "Open to all residents, confidentiality agreement required",
    objectives: JSON.stringify([
      "Create safe space for emotional expression",
      "Build trust and brotherhood",
      "Practice vulnerability and authenticity",
      "Address masculinity and identity",
      "Develop peer support network"
    ]),
    curriculum: JSON.stringify({
      format: "Circle format with rotating facilitators",
      themes: [
        "Brotherhood and trust",
        "Healthy masculinity",
        "Emotional intelligence",
        "Conflict resolution",
        "Accountability partners"
      ],
      guidelines: "What's shared in circle stays in circle"
    })
  },
  {
    name: "Re-entry Navigation",
    description: "Comprehensive case management program helping residents navigate systems, access resources, and achieve stability.",
    type: "mandatory",
    frequency: "as_needed",
    durationMinutes: 60,
    maxParticipants: 1,
    isActive: true,
    requirements: "All residents receive individualized re-entry planning",
    objectives: JSON.stringify([
      "Develop individualized service plan",
      "Connect to community resources",
      "Navigate legal obligations",
      "Secure vital documents",
      "Build long-term stability"
    ]),
    curriculum: JSON.stringify({
      services: [
        "Benefits enrollment (CalFresh, Medi-Cal)",
        "ID and document recovery",
        "Legal advocacy and court support",
        "Housing navigation",
        "Healthcare coordination",
        "Transportation assistance"
      ],
      approach: "Trauma-informed, client-centered case management"
    })
  },
  {
    name: "Financial Literacy Program",
    description: "Practical money management program teaching budgeting, banking, credit building, and financial planning skills.",
    type: "optional",
    frequency: "weekly",
    durationMinutes: 90,
    maxParticipants: 15,
    isActive: true,
    requirements: "Open to all residents, especially those with employment",
    objectives: JSON.stringify([
      "Establish banking relationships",
      "Create and maintain budgets",
      "Understand and build credit",
      "Develop savings habits",
      "Plan for financial independence"
    ]),
    curriculum: JSON.stringify({
      modules: [
        "Banking basics and account setup",
        "Budgeting and expense tracking",
        "Understanding credit reports",
        "Debt management strategies",
        "Saving and emergency funds",
        "Tax preparation basics"
      ],
      tools: "Personal finance app, budget worksheets, credit monitoring",
      partnerships: ["Local credit unions", "Financial counseling services"]
    })
  }
];

async function seedPrograms() {
  console.log("Seeding flagship programs...");
  
  try {
    // Check if programs already exist
    const existingPrograms = await db.select().from(programs);
    
    if (existingPrograms.length > 0) {
      console.log(`Found ${existingPrograms.length} existing programs. Skipping seed.`);
      return;
    }
    
    // Insert all flagship programs
    const insertedPrograms = await db
      .insert(programs)
      .values(flagshipPrograms)
      .returning();
    
    console.log(`Successfully seeded ${insertedPrograms.length} flagship programs:`);
    insertedPrograms.forEach(program => {
      console.log(`  - ${program.name} (${program.type}, ${program.frequency})`);
    });
    
  } catch (error) {
    console.error("Error seeding programs:", error);
    throw error;
  }
}

// Run the seed function
seedPrograms()
  .then(() => {
    console.log("Program seeding completed successfully");
    process.exit(0);
  })
  .catch((error) => {
    console.error("Program seeding failed:", error);
    process.exit(1);
  });

export { seedPrograms };